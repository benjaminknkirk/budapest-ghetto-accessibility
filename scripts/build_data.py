#!/usr/bin/env python3
"""Build prototype GIS layers and occupation-adapted accessibility scores.

Residence addresses are parsed from the Blinken OSA Archivum Yellow-Star
Houses public list (yellowstarhouses.org), then snapped to OpenStreetMap
street segments. This is a reconstruction for method demonstration. It is
not the Cole & Giordano Historical GIS of individual 1944 buildings.
Swap-in instructions live in data/source/ingest-spec.md.
"""

from __future__ import annotations

import copy
import csv
import hashlib
import json
import math
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from accessibility import (  # noqa: E402
    DISPLACED_SCORE,
    UNREACHABLE_MINUTES,
    haversine_m,
    point_in_ring,
    score_origin,
)

ROOT = Path(__file__).resolve().parents[1]
HAZAK_TXT = Path("/tmp/hazak.txt")
STREETS_JSON = Path("/tmp/bp-streets.json")
OUT = ROOT / "public" / "data"
SRC = ROOT / "data" / "source"

# ---------------------------------------------------------------------------
# Historical geometries (WGS84). Vertices reconstructed from the 29 Nov 1944
# decree street list, EHRI topography, and Nominatim-constrained intersections.
# Buildings facing boundary streets were excluded ("an island looking in on
# itself" — Cole, Holocaust City, 211); the polygon therefore sits inside
# Király / Kertész / Dohány / Madách–Károly rather than on the curb line.
# Wesselényi 44 and Bethlen tér 2 (central hospitals) are outside.
# ---------------------------------------------------------------------------
PEST_GHETTO = [
    [19.05715, 47.49685],
    [19.05655, 47.49795],
    [19.05690, 47.49915],
    [19.05920, 47.49925],
    [19.06255, 47.50135],
    [19.06540, 47.50185],
    [19.06720, 47.50110],
    [19.06735, 47.49980],
    [19.06725, 47.49770],
    [19.06690, 47.49615],
    [19.06420, 47.49570],
    [19.06180, 47.49585],
    [19.06070, 47.49615],
    [19.05890, 47.49640],
    [19.05715, 47.49685],
]

# Újlipótváros protected-house zone: Szent István park / Újpesti rakpart /
# Szent István körút / Hegedűs Gyula (Csáky) / Victor Hugo (Wahrmann).
INTERNATIONAL_GHETTO = [
    [19.04680, 47.51140],
    [19.04640, 47.51810],
    [19.05090, 47.51870],
    [19.05450, 47.51840],
    [19.05660, 47.51580],
    [19.05620, 47.51170],
    [19.05080, 47.51120],
    [19.04680, 47.51140],
]

DISTRICT_BBOX = {
    1: (19.025, 47.488, 19.046, 47.508),
    2: (19.012, 47.505, 19.040, 47.535),
    3: (19.020, 47.530, 19.055, 47.575),
    5: (19.045, 47.492, 19.058, 47.512),
    6: (19.055, 47.500, 19.078, 47.515),
    7: (19.055, 47.493, 19.082, 47.506),
    8: (19.060, 47.480, 19.095, 47.498),
    9: (19.055, 47.468, 19.090, 47.490),
    10: (19.090, 47.475, 19.160, 47.510),
    11: (19.000, 47.450, 19.050, 47.490),
    12: (18.980, 47.485, 19.025, 47.520),
    13: (19.045, 47.510, 19.080, 47.535),
    14: (19.070, 47.505, 19.130, 47.535),
}


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def norm_street(name: str) -> str:
    s = strip_accents(name).lower()
    s = s.replace("ú", "u").replace("ű", "u")
    s = re.sub(r"\bkorut\b", " korut ", s)
    s = re.sub(r"\bkosut\b", " kosut ", s)
    s = re.sub(r"\butca\b", " u ", s)
    s = re.sub(r"\butja\b", " u ", s)
    s = re.sub(r"\but\b", " u ", s)
    s = re.sub(r"\bter\b", " ter ", s)
    s = re.sub(r"\bkrt\.?\b", " korut ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_house_number(raw: str) -> int:
    m = re.search(r"(\d+)", raw)
    return int(m.group(1)) if m else 0


def stable_jitter(key: str, scale: float) -> tuple[float, float]:
    h = hashlib.sha256(key.encode("utf-8")).digest()
    u = int.from_bytes(h[:4], "big") / 2**32
    v = int.from_bytes(h[4:8], "big") / 2**32
    return (u - 0.5) * scale, (v - 0.5) * scale


def parse_houses(text: str) -> list[dict]:
    current_district = None
    houses = []
    district_re = re.compile(r"^(I{1,3}|IV|VI{0,3}|IX|XI{0,3}|XIV)\.\s*kerület\s*$")
    roman = {
        "I": 1,
        "II": 2,
        "III": 3,
        "V": 5,
        "VI": 6,
        "VII": 7,
        "VIII": 8,
        "IX": 9,
        "X": 10,
        "XI": 11,
        "XII": 12,
        "XIII": 13,
        "XIV": 14,
    }
    addr_re = re.compile(
        r"^([A-ZÁÉÍÓÖŐÚÜŰ].+?)\s+(\d+[a-zA-Z0-9\/\-]*)\.\s*(?:\(([^)]*)\))?\s*$"
    )
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip()
        if not line:
            continue
        dm = district_re.match(line)
        if dm:
            current_district = roman[dm.group(1)]
            continue
        if current_district is None:
            continue
        m = addr_re.match(line)
        if not m:
            continue
        street, number, hist = m.group(1), m.group(2), m.group(3)
        if street.lower().startswith("house list"):
            continue
        houses.append(
            {
                "id": f"d{current_district}-{len(houses)+1}",
                "district": current_district,
                "street": street.strip(),
                "number": number.strip(),
                "address": f"{street.strip()} {number.strip()}.",
                "historic_note": (hist or "").strip(),
            }
        )
    return houses


def load_street_index(path: Path) -> dict[str, list[tuple[float, float]]]:
    data = json.loads(path.read_text())
    index: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for el in data.get("elements", []):
        tags = el.get("tags") or {}
        name = tags.get("name")
        center = el.get("center")
        if not name or not center:
            continue
        index[norm_street(name)].append((center["lon"], center["lat"]))
        if ":" in name:
            index[norm_street(name.split(":")[0])].append((center["lon"], center["lat"]))
    return index


def geocode_house(house: dict, streets: dict) -> tuple[float, float, str]:
    key = norm_street(house["street"])
    pts = streets.get(key)
    if not pts and key.endswith(" u"):
        pts = streets.get(key[:-2].strip())
    if pts:
        n = parse_house_number(house["number"])
        lon, lat = pts[(n * 7 + house["district"] * 13) % len(pts)]
        dx, dy = stable_jitter(house["address"], 0.00018)
        return lon + dx, lat + dy, "street-segment"
    bbox = DISTRICT_BBOX.get(house["district"])
    if not bbox:
        return 19.06, 47.50, "fallback-city"
    minx, miny, maxx, maxy = bbox
    dx, dy = stable_jitter(house["address"] + "|bbox", 1.0)
    lon = minx + (0.25 + 0.5 * (dx + 0.5)) * (maxx - minx)
    lat = miny + (0.25 + 0.5 * (dy + 0.5)) * (maxy - miny)
    jx, jy = stable_jitter(house["address"], 0.0004)
    return lon + jx, lat + jy, "district-bbox"


GHETTO_STREETS = {
    "dob u",
    "rumbach sebestyen u",
    "sip u",
    "kazinczy u",
    "kis diofa u",
    "nagy diofa u",
    "nyar u",
    "akacfa u",
    "klauzal ter",
    "klauzal u",
}


def in_jewish_quarter_bbox(lon: float, lat: float) -> bool:
    return 19.0555 <= lon <= 19.0698 and 47.4952 <= lat <= 47.5026


def house_in_pest_ghetto(h: dict) -> bool:
    """PIP plus interior-street membership, clipped to Erzsébetváros.

    The decree named ten interior streets plus Csányi 3–6. Wesselényi 44 is
    on an interior street but outside the wall, so Wesselényi is number-capped.
    """
    if point_in_ring(h["lon"], h["lat"], PEST_GHETTO):
        return True
    if not in_jewish_quarter_bbox(h["lon"], h["lat"]):
        return False
    key = norm_street(h["street"])
    n = parse_house_number(h["number"])
    if key in GHETTO_STREETS:
        return True
    if key == "csanyi u" and 3 <= n <= 6:
        return True
    if key == "wesselenyi u" and 0 < n < 40:
        return True
    return False


def resources() -> list[dict]:
    """Documented 1944 resource locations. Coordinates from Nominatim, 2026."""
    return [
        # Food — municipal market halls (Cole & Giordano walking-to-market analysis)
        {"id": "mkt-klauzal", "purpose": "food", "kind": "market-hall", "name": "Klauzál tér market hall", "address": "Klauzál tér, VII", "lon": 19.06382, "lat": 47.49962, "inPestGhetto": True, "inInternational": False, "notes": "Intake point for the sealed ghetto; later a burial ground."},
        {"id": "mkt-hold", "purpose": "food", "kind": "market-hall", "name": "Hold utca market hall", "address": "Hold utca 13, V", "lon": 19.05281, "lat": 47.50481, "inPestGhetto": False, "inInternational": False, "notes": "District V hall; Cole & Giordano flag high competition here."},
        {"id": "mkt-hunyadi", "purpose": "food", "kind": "market-hall", "name": "Hunyadi tér market hall", "address": "Hunyadi tér, VI", "lon": 19.06707, "lat": 47.50582, "inPestGhetto": False, "inInternational": False},
        {"id": "mkt-rakoczi", "purpose": "food", "kind": "market-hall", "name": "Rákóczi tér market hall", "address": "Rákóczi tér, VIII", "lon": 19.07196, "lat": 47.49273, "inPestGhetto": False, "inInternational": False},
        {"id": "mkt-central", "purpose": "food", "kind": "market-hall", "name": "Central Market Hall (Fővám tér)", "address": "Fővám tér 1–3, IX/V", "lon": 19.0587, "lat": 47.48686, "inPestGhetto": False, "inInternational": False},
        {"id": "mkt-batthyany", "purpose": "food", "kind": "market-hall", "name": "Batthyány tér market hall", "address": "Batthyány tér, I", "lon": 19.03778, "lat": 47.50687, "inPestGhetto": False, "inInternational": False, "notes": "Buda hall. After the June 22 list, fewer yellow-star houses remained on this side of the river."},
        {"id": "mkt-lehel", "purpose": "food", "kind": "market-hall", "name": "Lehel tér market", "address": "Lehel tér, XIII", "lon": 19.06144, "lat": 47.51847, "inPestGhetto": False, "inInternational": False},
        {"id": "mkt-teleki", "purpose": "food", "kind": "market-hall", "name": "Teleki tér market", "address": "Teleki László tér, VIII", "lon": 19.08430, "lat": 47.49393, "inPestGhetto": False, "inInternational": False},
        # Food — sealed-ghetto kitchens (individual cooking banned)
        {"id": "kit-stern", "purpose": "food", "kind": "soup-kitchen", "name": "Stern kitchen", "address": "Rumbach Sebestyén utca 10", "lon": 19.05834, "lat": 47.49698, "inPestGhetto": True, "inInternational": False, "notes": "Documented ghetto kitchen; last working well on site. 781 kcal/adult/day."},
        {"id": "kit-klauzal", "purpose": "food", "kind": "soup-kitchen", "name": "Klauzál district kitchen", "address": "Klauzál tér", "lon": 19.06444, "lat": 47.50004, "inPestGhetto": True, "inInternational": False},
        {"id": "kit-dob", "purpose": "food", "kind": "soup-kitchen", "name": "Dob utca kitchen", "address": "Dob utca (reconstructed district kitchen)", "lon": 19.0614, "lat": 47.4989, "inPestGhetto": True, "inInternational": False, "notes": "Location reconstructed: kitchens operated in former restaurants by ghetto district."},
        {"id": "kit-akacfa", "purpose": "food", "kind": "soup-kitchen", "name": "Akácfa district kitchen", "address": "Akácfa utca", "lon": 19.0664, "lat": 47.4984, "inPestGhetto": True, "inInternational": False, "notes": "Location reconstructed from the ten-district kitchen system."},
        {"id": "kit-kazinczy", "purpose": "food", "kind": "soup-kitchen", "name": "Kazinczy kitchen / mikveh well", "address": "Kazinczy utca 16", "lon": 19.06083, "lat": 47.49932, "inPestGhetto": True, "inInternational": False, "notes": "Ritual-bath well used when mains water failed."},
        {"id": "kit-pozsonyi", "purpose": "food", "kind": "soup-kitchen", "name": "Protected-house food drop, Pozsonyi út", "address": "Pozsonyi út, XIII", "lon": 19.0510, "lat": 47.5165, "inPestGhetto": False, "inInternational": True, "notes": "Red Cross / Zionist youth wagon deliveries to protected houses. Not a market."},
        # Medical
        {"id": "med-szabolcs", "purpose": "medical", "kind": "hospital", "name": "Jewish Hospital on Szabolcs utca", "address": "Szabolcs utca 33–35, XIII", "lon": 19.07161, "lat": 47.51953, "inPestGhetto": False, "inInternational": False, "notes": "Seized by Waffen-SS in March 1944. Original community hospital, 1802."},
        {"id": "med-wesselenyi", "purpose": "medical", "kind": "hospital", "name": "Emergency hospital, Wesselényi 44", "address": "Wesselényi utca 44", "lon": 19.06775, "lat": 47.50023, "inPestGhetto": False, "inInternational": False, "notes": "School converted after Szabolcs utca was seized. Outside the sealed ghetto."},
        {"id": "med-bethlen", "purpose": "medical", "kind": "hospital", "name": "Hospital, Bethlen tér 2", "address": "Bethlen Gábor tér 2", "lon": 19.07920, "lat": 47.50368, "inPestGhetto": False, "inInternational": False, "notes": "Second central hospital; also outside the wall."},
        {"id": "med-klauzal-clinic", "purpose": "medical", "kind": "clinic", "name": "Klauzál tér emergency clinic", "address": "Klauzál tér", "lon": 19.0639, "lat": 47.4994, "inPestGhetto": True, "inInternational": False, "notes": "Swedish, Jewish Council, and Red Cross facilities around the square."},
        {"id": "med-goldmark", "purpose": "medical", "kind": "clinic", "name": "Wesselényi / Goldmark aid post", "address": "Wesselényi utca 7", "lon": 19.06130, "lat": 47.49655, "inPestGhetto": True, "inInternational": False},
        {"id": "med-sip", "purpose": "medical", "kind": "clinic", "name": "Jewish Council medical office", "address": "Síp utca 12", "lon": 19.06196, "lat": 47.49659, "inPestGhetto": True, "inInternational": False, "notes": "Neolog congregation HQ; ghetto administration."},
        {"id": "med-ujlipot", "purpose": "medical", "kind": "clinic", "name": "Újlipótváros protected-house aid post", "address": "Pozsonyi út / Szent István park", "lon": 19.0509, "lat": 47.5178, "inPestGhetto": False, "inInternational": True, "notes": "Aid inside the international ghetto; Arrow Cross raids still reached these houses."},
        # Work / labour
        {"id": "work-council", "purpose": "work", "kind": "administration", "name": "Jewish Council, Síp utca 12", "address": "Síp utca 12", "lon": 19.06196, "lat": 47.49659, "inPestGhetto": True, "inInternational": False},
        {"id": "work-glasshouse", "purpose": "work", "kind": "protection-workshop", "name": "Glass House (Swiss protection)", "address": "Vadász utca 29", "lon": 19.05378, "lat": 47.50546, "inPestGhetto": False, "inInternational": False, "notes": "Swiss legation emigration department; not a workplace in the ordinary sense, but a critical destination."},
        {"id": "work-kazinczy-shops", "purpose": "work", "kind": "workshop", "name": "Kazinczy workshop cluster", "address": "Kazinczy utca", "lon": 19.0615, "lat": 47.4984, "inPestGhetto": True, "inInternational": False, "notes": "Pre-ghetto Jewish workshops; after sealing, only internal forced tasks remained."},
        {"id": "work-andrássy", "purpose": "work", "kind": "workshop", "name": "Terézváros workshop cluster", "address": "Andrássy út / District VI", "lon": 19.0623, "lat": 47.5062, "inPestGhetto": False, "inInternational": False},
        {"id": "work-csepel", "purpose": "work", "kind": "forced-labour", "name": "Csepel / Weiss Manfréd labour draw", "address": "Csepel (off-map labour destination)", "lon": 19.0520, "lat": 47.4200, "inPestGhetto": False, "inInternational": False, "notes": "Stand-in for out-of-city forced-labour destinations. Unreachable once the ghetto is sealed."},
        {"id": "work-nepliget", "purpose": "work", "kind": "forced-labour", "name": "Pest labour-battalion assembly", "address": "eastern Pest (reconstructed)", "lon": 19.0980, "lat": 47.4780, "inPestGhetto": False, "inInternational": False},
    ]


def gates() -> list[dict]:
    return [
        {"id": "gate-dohany", "name": "Dohány Street Synagogue gate", "lon": 19.06087, "lat": 47.49620, "closes": None, "notes": "Main western gate. Arrow Cross raids concentrated here."},
        {"id": "gate-kertesz", "name": "Wesselényi / Kertész (Nagyatádi) gate", "lon": 19.06740, "lat": 47.50010, "closes": None, "notes": "Main eastern gate, beside the Wesselényi 44 hospital just outside the wall."},
        {"id": "gate-kisdiofa", "name": "Kis Diófa gate", "lon": 19.06219, "lat": 47.50044, "closes": "1945-01-10", "notes": "Locked 10 January 1945 after Arrow Cross raids."},
        {"id": "gate-nagydiofa", "name": "Nagy Diófa gate", "lon": 19.06524, "lat": 47.49723, "closes": "1945-01-10", "notes": "Locked 10 January 1945 after Arrow Cross raids."},
    ]


PERIODS = [
    {
        "id": "occupation",
        "date": "1944-04-05",
        "end": "1944-06-15",
        "label": "Occupation, still at home",
        "short": "Apr–Jun 15",
        "walkKmh": 4.6,
        "windowHours": 10,
        "permitReach": 1.0,
        "sealed": False,
        "residences": "city",
        "foodMode": "markets",
        "medicalMode": "city-hospitals",
        "workMode": "restricted-employment",
        "narrative": "After 19 March the yellow star, shopping-hour limits, and bans on baths, hotels, and cinemas shrink the day without yet redrawing the map of home. Jews still live across the city. Access is already a temporal problem.",
    },
    {
        "id": "yellow-star",
        "date": "1944-06-24",
        "end": "1944-10-14",
        "label": "Yellow-star houses",
        "short": "24 Jun",
        "walkKmh": 4.4,
        "windowHours": 3,
        "permitReach": 1.0,
        "sealed": False,
        "residences": "yellow-star",
        "foodMode": "markets",
        "medicalMode": "city-hospitals",
        "workMode": "restricted-employment",
        "narrative": "1,944 designated buildings. Jews may leave home only 2–5 p.m. (later 11–5). Cole and Giordano showed that this three-hour window, not distance alone, restructured who could reach a market hall. The dispersed ghetto is a timetable as much as a map.",
    },
    {
        "id": "arrow-cross",
        "date": "1944-10-15",
        "end": "1944-11-17",
        "label": "Arrow Cross coup",
        "short": "15 Oct",
        "walkKmh": 4.0,
        "windowHours": 3,
        "permitReach": 0.55,
        "sealed": False,
        "residences": "yellow-star",
        "foodMode": "markets",
        "medicalMode": "city-hospitals",
        "workMode": "forced-labour",
        "narrative": "Szálasi’s coup turns streets themselves into a hazard. Working-age Jews are marched to labour. Reachability is no longer a shortest path: it is a shortest path that might get you shot.",
    },
    {
        "id": "dual-ghetto",
        "date": "1944-11-29",
        "end": "1944-12-09",
        "label": "Two ghettos, still unsealed",
        "short": "29 Nov",
        "walkKmh": 3.6,
        "windowHours": 2,
        "permitReach": 0.35,
        "sealed": False,
        "residences": "dual",
        "foodMode": "markets-and-kitchens",
        "medicalMode": "split",
        "workMode": "forced-labour",
        "narrative": "The 29 November decree concentrates unprotected Jews into 0.3 km² of Erzsébetváros and protected-paper holders into Újlipótváros houses. Until 10 December the Pest ghetto still has hours when people may leave (9–11 a.m. during the non-Jewish move-out). Two populations, two spatial regimes.",
    },
    {
        "id": "sealed",
        "date": "1944-12-10",
        "end": "1945-01-09",
        "label": "Pest ghetto sealed",
        "short": "10 Dec",
        "walkKmh": 3.0,
        "windowHours": 0.4,
        "permitReach": 0.08,
        "sealed": True,
        "residences": "dual",
        "foodMode": "kitchens",
        "medicalMode": "ghetto-clinics",
        "workMode": "none-internal",
        "narrative": "Four gates, a fence the Jewish Council had to pay for, no individual cooking. City markets and both central hospitals sit outside the wall. A kitchen 200 metres away scores 'high' on a naïve distance index and still delivers 781 kcal. That gap is the point of the method.",
    },
    {
        "id": "gates-cut",
        "date": "1945-01-10",
        "end": "1945-01-17",
        "label": "Two gates locked",
        "short": "10 Jan",
        "walkKmh": 2.6,
        "windowHours": 0.2,
        "permitReach": 0.03,
        "sealed": True,
        "residences": "dual",
        "foodMode": "kitchens",
        "medicalMode": "ghetto-clinics",
        "workMode": "none-internal",
        "narrative": "Kis Diófa and Nagy Diófa gates close after raids. Remaining exits are the Dohány and Kertész gates — the most dangerous ground in the ghetto. Outside hospitals become, for almost everyone, theoretical.",
    },
]


def food_destinations(period: dict, all_res: list[dict]) -> list[dict]:
    mode = period["foodMode"]
    if mode == "markets":
        return [r for r in all_res if r["kind"] == "market-hall"]
    if mode == "markets-and-kitchens":
        return [r for r in all_res if r["purpose"] == "food"]
    return [r for r in all_res if r["kind"] == "soup-kitchen"]


def medical_destinations(period: dict, all_res: list[dict]) -> list[dict]:
    mode = period["medicalMode"]
    if mode == "city-hospitals":
        return [r for r in all_res if r["purpose"] == "medical" and r["kind"] in ("hospital", "clinic")]
    if mode == "split":
        return [r for r in all_res if r["purpose"] == "medical"]
    # sealed: inside clinics are the realistic destinations; hospitals remain
    # in the set so gate-routing can still see them, at permitReach.
    return [r for r in all_res if r["purpose"] == "medical"]


def work_destinations(period: dict, all_res: list[dict]) -> list[dict]:
    mode = period["workMode"]
    if mode == "restricted-employment":
        return [r for r in all_res if r["purpose"] == "work" and r["kind"] != "forced-labour"]
    if mode == "forced-labour":
        return [r for r in all_res if r["purpose"] == "work"]
    return [r for r in all_res if r["purpose"] == "work" and r.get("inPestGhetto")]


def capacity_for(period: dict, n_residences: int) -> dict[str, float]:
    """Crude supply/demand. Documented calorie deficit drives sealed food capacity."""
    if period["foodMode"] == "kitchens":
        food = 781 / 2200  # documented adult ration vs. noted minimum
    elif period["foodMode"] == "markets-and-kitchens":
        food = 0.55
    elif period["id"] == "arrow-cross":
        food = 0.62
    else:
        # yellow-star: 3-hour shopping window already in `window`; markets
        # still function. Competition rises with concentration.
        food = 0.85 if n_residences < 1500 else 0.72
    if period["sealed"]:
        medical = 0.28  # overcrowded clinics, no utilities after late Dec
        work = 0.12
    elif period["id"] == "arrow-cross":
        medical = 0.55
        work = 0.35
    elif period["id"] == "dual-ghetto":
        medical = 0.40
        work = 0.22
    else:
        medical = 0.80 if period["id"] == "occupation" else 0.70
        work = 0.75 if period["id"] == "occupation" else 0.50
    return {"food": food, "medical": medical, "work": work}


def open_gates(period: dict, all_gates: list[dict]) -> list[dict]:
    if not period["sealed"]:
        return []
    out = []
    for g in all_gates:
        closed = g.get("closes")
        open_ = closed is None or closed > period["date"]
        out.append({**g, "open": open_})
    return out


def permitted_region_for(house: dict, period: dict):
    if not period["sealed"]:
        return None
    if house.get("inInternational"):
        return INTERNATIONAL_GHETTO
    if house.get("inPestGhetto"):
        return PEST_GHETTO
    return PEST_GHETTO  # leftover yellow-star residents treated as forced toward Pest


def active_houses(houses: list[dict], period: dict) -> list[dict]:
    mode = period["residences"]
    if mode == "city" or mode == "yellow-star":
        return houses
    dual = [h for h in houses if h["inPestGhetto"] or h["inInternational"]]
    return dual or houses


def make_grid(houses: list[dict]) -> list[tuple[float, float]]:
    lons = [h["lon"] for h in houses]
    lats = [h["lat"] for h in houses]
    minx, maxx = min(lons) - 0.01, max(lons) + 0.01
    miny, maxy = min(lats) - 0.008, max(lats) + 0.008
    # Keep the grid on the inhabited inner city, not the Csepel outlier.
    minx, maxx = max(minx, 19.01), min(maxx, 19.14)
    miny, maxy = max(miny, 47.46), min(maxy, 47.55)
    step = 0.0011  # ~80–90 m
    cells = []
    y = miny
    while y <= maxy:
        x = minx
        while x <= maxx:
            cells.append((round(x, 5), round(y, 5)))
            x += step
        y += step
    return cells


def fc(features: list[dict]) -> dict:
    return {"type": "FeatureCollection", "features": features}


def feature_point(lon, lat, props) -> dict:
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": props}


def feature_poly(ring, props) -> dict:
    return {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [ring]}, "properties": props}


def summarize(scored: list[dict], period_id: str) -> dict:
    active = [
        h
        for h in scored
        if period_id in h["scores"] and not h["scores"][period_id].get("displaced")
    ]
    displaced = [
        h
        for h in scored
        if period_id in h["scores"] and h["scores"][period_id].get("displaced")
    ]
    vals = [h["scores"][period_id]["composite"] for h in active]
    if not vals:
        return {"n": 0, "nDisplaced": len(displaced)}
    bands = defaultdict(int)
    food_none = 0
    med_none = 0
    for h in active:
        d = h["scores"][period_id]["detail"]
        bands[d["food"]["band"]] += 1
        if d["food"]["band"] == "none":
            food_none += 1
        if d["medical"]["band"] == "none":
            med_none += 1
    vals_sorted = sorted(vals)
    n = len(vals_sorted)
    mean = sum(vals_sorted) / n
    all_vals = vals + [0.0] * len(displaced)
    return {
        "n": n,
        "nDisplaced": len(displaced),
        "meanComposite": round(mean, 2),
        "meanIncludingDisplaced": round(sum(all_vals) / len(all_vals), 2) if all_vals else 0,
        "medianComposite": round(vals_sorted[n // 2], 2),
        "p10": round(vals_sorted[int(n * 0.1)], 2),
        "p90": round(vals_sorted[int(n * 0.9)], 2),
        "shareFoodNone": round(food_none / n, 3),
        "shareMedicalNone": round(med_none / n, 3),
        "foodBands": dict(bands),
    }


def district_table(houses: list[dict]) -> list[dict]:
    by = defaultdict(list)
    for h in houses:
        by[h["district"]].append(h)
    rows = []
    for d in sorted(by):
        subset = by[d]
        ys = [
            h["scores"]["yellow-star"]["composite"]
            for h in subset
            if "yellow-star" in h["scores"]
        ]
        se = [
            h["scores"]["sealed"]["composite"]
            for h in subset
            if "sealed" in h["scores"] and not h["scores"]["sealed"].get("displaced")
        ]
        rows.append(
            {
                "district": d,
                "nYellowStar": len(subset),
                "meanYellowStar": round(sum(ys) / len(ys), 2) if ys else None,
                "nSealed": len(se),
                "meanSealed": round(sum(se) / len(se), 2) if se else None,
                "nDisplaced": sum(
                    1
                    for h in subset
                    if h["scores"].get("sealed", {}).get("displaced")
                ),
            }
        )
    return rows


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    SRC.mkdir(parents=True, exist_ok=True)

    if not HAZAK_TXT.exists():
        raise SystemExit("Missing /tmp/hazak.txt — fetch yellowstarhouses.org/hazak first")
    if not STREETS_JSON.exists():
        raise SystemExit("Missing /tmp/bp-streets.json — fetch Overpass streets first")

    houses = parse_houses(HAZAK_TXT.read_text(encoding="utf-8"))
    streets = load_street_index(STREETS_JSON)
    matched = 0
    for h in houses:
        lon, lat, how = geocode_house(h, streets)
        h["lon"], h["lat"], h["geocode"] = round(lon, 6), round(lat, 6), how
        h["inPestGhetto"] = house_in_pest_ghetto(h)
        h["inInternational"] = point_in_ring(h["lon"], h["lat"], INTERNATIONAL_GHETTO)
        if how == "street-segment":
            matched += 1

    # District XIII houses inside the protected-house rectangle are tagged
    # international even if the June yellow-star list predates that regime.
    for h in houses:
        if h["district"] == 13 and point_in_ring(h["lon"], h["lat"], INTERNATIONAL_GHETTO):
            h["inInternational"] = True

    res = resources()
    all_gates = gates()

    # Score a spatially stratified sample of houses for the interactive
    # (all houses remain in the points layer; scoring 1,900 × 6 is fine).
    for h in houses:
        h["scores"] = {}
        for period in PERIODS:
            active = active_houses(houses, period)
            if period["residences"] == "dual" and not (h["inPestGhetto"] or h["inInternational"]):
                h["scores"][period["id"]] = copy.deepcopy(DISPLACED_SCORE)
                continue
            dests = {
                "food": food_destinations(period, res),
                "medical": medical_destinations(period, res),
                "work": work_destinations(period, res),
            }
            caps = capacity_for(period, len(active))
            region = permitted_region_for(h, period)
            gts = open_gates(period, all_gates) if h.get("inPestGhetto") else []
            result = score_origin(
                (h["lon"], h["lat"]),
                destinations_by_purpose=dests,
                walk_kmh=period["walkKmh"],
                window=min(1.0, period["windowHours"] / 12.0),
                capacity_by_purpose=caps,
                permitted_region=region,
                dest_region_key="inPestGhetto" if h.get("inPestGhetto") else "inInternational",
                gates=gts,
                permit_reach=period["permitReach"],
            )
            h["scores"][period["id"]] = {
                "composite": round(result["composite"], 2),
                "food": round(result["food"], 2),
                "medical": round(result["medical"], 2),
                "work": round(result["work"], 2),
                "detail": result["detail"],
            }

    # Accessibility surface for the heatmap: score grid centroids as if they
    # were residences of the dominant regime in that period.
    grid_cells = make_grid(houses)
    grid_out = []
    for period in PERIODS:
        dests = {
            "food": food_destinations(period, res),
            "medical": medical_destinations(period, res),
            "work": work_destinations(period, res),
        }
        # Capacity uses the residence count of the period.
        n_res = len(active_houses(houses, period))
        caps = capacity_for(period, n_res)
        gts = open_gates(period, all_gates)
        cells = []
        for lon, lat in grid_cells:
            in_pest = point_in_ring(lon, lat, PEST_GHETTO)
            in_int = point_in_ring(lon, lat, INTERNATIONAL_GHETTO)
            dummy = {"inPestGhetto": in_pest, "inInternational": in_int}
            if period["sealed"] and not (in_pest or in_int):
                # Outside both ghettos the Jewish population is not legally
                # present; surface is zero — the city as experienced from inside.
                cells.append({"lon": lon, "lat": lat, "composite": 0, "food": 0, "medical": 0, "work": 0})
                continue
            region = permitted_region_for(dummy, period)
            gts_cell = gts if in_pest else []
            result = score_origin(
                (lon, lat),
                destinations_by_purpose=dests,
                walk_kmh=period["walkKmh"],
                window=min(1.0, period["windowHours"] / 12.0),
                capacity_by_purpose=caps,
                permitted_region=region,
                dest_region_key="inPestGhetto" if in_pest else "inInternational",
                gates=gts_cell,
                permit_reach=period["permitReach"],
            )
            cells.append(
                {
                    "lon": lon,
                    "lat": lat,
                    "composite": round(result["composite"], 1),
                    "food": round(result["food"], 1),
                    "medical": round(result["medical"], 1),
                    "work": round(result["work"], 1),
                }
            )
        grid_out.append({"period": period["id"], "cells": cells})

    summaries = {p["id"]: summarize(houses, p["id"]) for p in PERIODS}

    # Headline change June → sealed, the finding the map has to make visible.
    y = summaries["yellow-star"]["meanComposite"]
    s = summaries["sealed"]["meanComposite"]
    summaries["deltaYellowStarToSealed"] = {
        "meanCompositeDrop": round(y - s, 2),
        "percentDrop": round(100 * (y - s) / y, 1) if y else None,
        "nDisplaced": summaries["sealed"]["nDisplaced"],
        "shareDisplaced": round(summaries["sealed"]["nDisplaced"] / len(houses), 3),
        "meanIncludingDisplaced": summaries["sealed"]["meanIncludingDisplaced"],
    }
    series = [
        {
            "id": p["id"],
            "short": p["short"],
            "label": p["label"],
            "mean": summaries[p["id"]]["meanComposite"],
            "n": summaries[p["id"]]["n"],
            "nDisplaced": summaries[p["id"]].get("nDisplaced", 0),
        }
        for p in PERIODS
    ]
    districts = district_table(houses)

    with (SRC / "yellow-star-houses.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(
            fh,
            fieldnames=[
                "id",
                "district",
                "street",
                "number",
                "address",
                "lon",
                "lat",
                "geocode",
                "inPestGhetto",
                "inInternational",
            ],
        )
        w.writeheader()
        for h in houses:
            w.writerow(
                {
                    "id": h["id"],
                    "district": h["district"],
                    "street": h["street"],
                    "number": h["number"],
                    "address": h["address"],
                    "lon": h["lon"],
                    "lat": h["lat"],
                    "geocode": h["geocode"],
                    "inPestGhetto": int(h["inPestGhetto"]),
                    "inInternational": int(h["inInternational"]),
                }
            )

    house_features = []
    for h in houses:
        props = {
            "id": h["id"],
            "address": h["address"],
            "district": h["district"],
            "geocode": h["geocode"],
            "inPestGhetto": h["inPestGhetto"],
            "inInternational": h["inInternational"],
            "displacedInSealed": bool(h["scores"].get("sealed", {}).get("displaced")),
            "deltaYellowStarToSealed": round(
                (0.0 if h["scores"].get("sealed", {}).get("displaced") else h["scores"].get("sealed", {}).get("composite", 0.0))
                - h["scores"].get("yellow-star", {}).get("composite", 0.0),
                2,
            ),
            "scores": h["scores"],
        }
        house_features.append(feature_point(h["lon"], h["lat"], props))

    (OUT / "houses.geojson").write_text(json.dumps(fc(house_features), separators=(",", ":")), encoding="utf-8")
    (OUT / "resources.geojson").write_text(
        json.dumps(
            fc([feature_point(r["lon"], r["lat"], {k: v for k, v in r.items() if k not in ("lon", "lat")}) for r in res]),
            indent=2,
        ),
        encoding="utf-8",
    )
    (OUT / "gates.geojson").write_text(
        json.dumps(
            fc([feature_point(g["lon"], g["lat"], {k: v for k, v in g.items() if k not in ("lon", "lat")}) for g in all_gates]),
            indent=2,
        ),
        encoding="utf-8",
    )
    (OUT / "boundaries.geojson").write_text(
        json.dumps(
            fc(
                [
                    feature_poly(PEST_GHETTO, {"id": "pest-ghetto", "name": "Pest ghetto (District VII)", "areaKm2": 0.3}),
                    feature_poly(
                        INTERNATIONAL_GHETTO,
                        {"id": "international-ghetto", "name": "International ghetto (Újlipótváros)", "houses": "~120 protected houses"},
                    ),
                ]
            ),
            indent=2,
        ),
        encoding="utf-8",
    )
    (OUT / "grid.json").write_text(json.dumps(grid_out, separators=(",", ":")), encoding="utf-8")
    (OUT / "periods.json").write_text(json.dumps(PERIODS, indent=2), encoding="utf-8")
    (OUT / "summary.json").write_text(
        json.dumps(
            {
                "houses": len(houses),
                "streetMatched": matched,
                "matchRate": round(matched / len(houses), 3),
                "inPestGhetto": sum(1 for h in houses if h["inPestGhetto"]),
                "inInternational": sum(1 for h in houses if h["inInternational"]),
                "series": series,
                "districts": districts,
                "periods": summaries,
                "provenance": {
                    "residences": "Blinken OSA Archivum Yellow-Star Houses address list (public), geocoded to OSM street segments. Not the Cole & Giordano HGIS.",
                    "boundaries": "29 November 1944 decree street list; EHRI microhistory; Cole, Holocaust City.",
                    "resources": "Published locations (EHRI, Braham, hospital histories). A few ghetto kitchens are reconstructed as district-level sites.",
                    "method": "Occupation-adapted accessibility index after LUPTAI walking bands + purpose composite, with reach/window/capacity/speed modifiers.",
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"houses {len(houses)} matched {matched} ({matched/len(houses):.1%})")
    print(f"inside pest ghetto {sum(1 for h in houses if h['inPestGhetto'])}")
    print(f"inside international {sum(1 for h in houses if h['inInternational'])}")
    print("period summaries:")
    for pid, s in summaries.items():
        print(f"  {pid}: {s}")


if __name__ == "__main__":
    main()
