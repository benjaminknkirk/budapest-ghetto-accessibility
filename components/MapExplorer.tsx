"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Point } from "geojson";
import { displacedShare, dropLabel, periodStats, romanDistrict } from "@/lib/format";
import type { HouseProps, Period, Purpose, ScoreBlock, Summary } from "@/lib/types";
import { PURPOSE_LABEL } from "@/lib/types";
import { Sparkline } from "@/components/Sparkline";

const COLOR_RAMP = [
  0, "#241c18",
  2, "#5c2a24",
  6, "#a85b2b",
  12, "#d4a017",
  25, "#efe7d6",
];

type GridFile = { period: string; cells: { lon: number; lat: number; composite: number; food: number; medical: number; work: number }[] }[];

function scoreOf(props: HouseProps, period: string, purpose: Purpose): number | null {
  const block = props.scores[period as keyof HouseProps["scores"]] as ScoreBlock | undefined;
  if (!block) return null;
  return block[purpose];
}

function gridToGeoJSON(grid: GridFile, period: string, purpose: Purpose): FeatureCollection<Point> {
  const layer = grid.find((g) => g.period === period);
  const features: Feature<Point>[] = (layer?.cells ?? [])
    .filter((c) => c[purpose] > 0)
    .map((c) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lon, c.lat] },
      properties: { v: c[purpose] },
    }));
  return { type: "FeatureCollection", features };
}

export function MapExplorer() {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [periodId, setPeriodId] = useState(() => {
    if (typeof window === "undefined") return "yellow-star";
    return new URLSearchParams(window.location.search).get("period") || "yellow-star";
  });
  const [purpose, setPurpose] = useState<Purpose>("composite");
  const [layers, setLayers] = useState({ houses: true, heat: true, resources: true, gates: true });
  const [selected, setSelected] = useState<HouseProps | null>(null);
  const [story, setStory] = useState(false);
  const [compare, setCompare] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("compare") === "1";
  });
  const exportMode =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("export") === "1";
  const cameraMs = exportMode ? 0 : 900;
  const housesRef = useRef<FeatureCollection<Point, HouseProps> | null>(null);
  const gridRef = useRef<GridFile | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const period = periods.find((p) => p.id === periodId) ?? null;
  const stats = summary && period ? periodStats(summary, period.id) : null;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/data/periods.json").then((r) => r.json()),
      fetch("/data/summary.json").then((r) => r.json()),
      fetch("/data/houses.geojson").then((r) => r.json()),
      fetch("/data/resources.geojson").then((r) => r.json()),
      fetch("/data/boundaries.geojson").then((r) => r.json()),
      fetch("/data/gates.geojson").then((r) => r.json()),
      fetch("/data/grid.json").then((r) => r.json()),
    ]).then(([p, s, houses, resources, boundaries, gates, grid]) => {
      if (cancelled) return;
      setPeriods(p);
      setSummary(s);
      housesRef.current = houses;
      gridRef.current = grid;
      if (!container.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: container.current,
        style: "https://tiles.openfreemap.org/styles/dark",
        center: [19.06, 47.503],
        zoom: 12.4,
        maxPitch: 0,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      mapRef.current = map;

      map.on("load", () => {
        map.addSource("boundaries", { type: "geojson", data: boundaries });
        map.addSource("heat", { type: "geojson", data: gridToGeoJSON(grid, "yellow-star", "composite") });
        map.addSource("houses", { type: "geojson", data: houses });
        map.addSource("resources", { type: "geojson", data: resources });
        map.addSource("gates", { type: "geojson", data: gates });

        map.addLayer({
          id: "ghetto-fill",
          type: "fill",
          source: "boundaries",
          paint: { "fill-color": "#d4a017", "fill-opacity": 0.06 },
        });
        map.addLayer({
          id: "ghetto-line",
          type: "line",
          source: "boundaries",
          paint: { "line-color": "#d4a017", "line-width": 1.6, "line-dasharray": [2, 1] },
        });
        map.addLayer({
          id: "heat-circles",
          type: "circle",
          source: "heat",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 8, 14, 18],
            "circle-color": ["interpolate", ["linear"], ["get", "v"], ...COLOR_RAMP],
            "circle-opacity": 0.45,
            "circle-blur": 0.8,
          },
        });
        map.addLayer({
          id: "houses-hit",
          type: "circle",
          source: "houses",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 8, 14, 12],
            "circle-color": "#e8d48a",
            "circle-opacity": 0,
          },
        });
        map.addLayer({
          id: "houses-circle",
          type: "circle",
          source: "houses",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3.2, 14, 5.5],
            "circle-color": "#e8d48a",
            "circle-stroke-width": 0.6,
            "circle-stroke-color": "#1c1814",
            "circle-opacity": 0.92,
          },
        });
        map.addLayer({
          id: "resources-circle",
          type: "circle",
          source: "resources",
          paint: {
            "circle-radius": 8,
            "circle-color": [
              "match",
              ["get", "purpose"],
              "food",
              "#c4783a",
              "medical",
              "#4e8494",
              "#7a6588",
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#efe7d6",
          },
        });
        map.addLayer({
          id: "gates-circle",
          type: "circle",
          source: "gates",
          paint: {
            "circle-radius": 7,
            "circle-color": "#8f2f2a",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#efe7d6",
          },
        });

        const popup = new maplibregl.Popup({
          className: "atlas-popup",
          closeButton: true,
          maxWidth: "280px",
        });

        const near = (point: { x: number; y: number }, layer: string, pad = 12) =>
          map.queryRenderedFeatures(
            [
              [point.x - pad, point.y - pad],
              [point.x + pad, point.y + pad],
            ],
            { layers: [layer] },
          );

        const readHouse = (raw: Record<string, unknown> | null | undefined): HouseProps | null => {
          if (!raw) return null;
          const scores =
            typeof raw.scores === "string" ? JSON.parse(raw.scores) : raw.scores;
          return {
            id: String(raw.id),
            address: String(raw.address),
            district: Number(raw.district),
            geocode: String(raw.geocode ?? ""),
            inPestGhetto: raw.inPestGhetto === true || raw.inPestGhetto === "true",
            inInternational: raw.inInternational === true || raw.inInternational === "true",
            displacedInSealed: raw.displacedInSealed === true || raw.displacedInSealed === "true",
            deltaYellowStarToSealed:
              raw.deltaYellowStarToSealed == null ? undefined : Number(raw.deltaYellowStarToSealed),
            scores: (scores ?? {}) as HouseProps["scores"],
          };
        };

        map.on("click", (e) => {
          const houseHit = near(e.point, "houses-hit")[0] ?? near(e.point, "houses-circle")[0];
          if (houseHit) {
            const props = readHouse((houseHit.properties ?? undefined) as Record<string, unknown>);
            if (props) {
              setSelected(props);
              popup
                .setLngLat(e.lngLat)
                .setHTML(
                  `<strong>${props.address}</strong><span>District ${props.district} · scores in the left panel</span>`,
                )
                .addTo(map);
            }
            return;
          }
          const resHit = near(e.point, "resources-circle", 14)[0];
          if (resHit) {
            const p = resHit.properties ?? {};
            popup
              .setLngLat(e.lngLat)
              .setHTML(
                `<strong>${p.name ?? "Resource"}</strong><span>${p.kind ?? ""} · ${p.purpose ?? ""}</span><span>${p.address ?? ""}</span>`,
              )
              .addTo(map);
            return;
          }
          const gateHit = near(e.point, "gates-circle", 14)[0];
          if (gateHit) {
            const p = gateHit.properties ?? {};
            popup
              .setLngLat(e.lngLat)
              .setHTML(`<strong>${p.name ?? "Gate"}</strong><span>${p.notes ?? ""}</span>`)
              .addTo(map);
          }
        });
        map.on("mouseenter", "houses-hit", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "houses-hit", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", "resources-circle", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "resources-circle", () => {
          map.getCanvas().style.cursor = "";
        });
        setMapReady(true);
      });
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const grid = gridRef.current;
    if (!map?.getSource("heat") || !grid) return;
    (map.getSource("heat") as GeoJSONSource).setData(gridToGeoJSON(grid, periodId, purpose));
  }, [periodId, purpose, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("houses-circle")) return;
    map.setLayoutProperty("houses-circle", "visibility", layers.houses ? "visible" : "none");
    if (map.getLayer("houses-hit")) {
      map.setLayoutProperty("houses-hit", "visibility", layers.houses ? "visible" : "none");
    }
    map.setLayoutProperty("heat-circles", "visibility", layers.heat && !compare ? "visible" : "none");
    map.setLayoutProperty("resources-circle", "visibility", layers.resources ? "visible" : "none");
    map.setLayoutProperty("gates-circle", "visibility", layers.gates ? "visible" : "none");
  }, [layers, compare, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const houses = housesRef.current;
    if (!map?.getLayer("houses-circle") || !houses) return;
    const sealed = period?.sealed ?? false;
    const sealedFilter: maplibregl.FilterSpecification | null =
      sealed && !compare
        ? ["any", ["==", ["get", "inPestGhetto"], true], ["==", ["get", "inInternational"], true]]
        : null;
    map.setFilter("houses-circle", sealedFilter);
    if (map.getLayer("houses-hit")) map.setFilter("houses-hit", sealedFilter);
    map.setPaintProperty("ghetto-line", "line-color", sealed ? "#8f2f2a" : "#d4a017");
    map.setPaintProperty("ghetto-fill", "fill-color", sealed ? "#8f2f2a" : "#d4a017");
    map.setPaintProperty(
      "houses-circle",
      "circle-color",
      compare
        ? [
            "case",
            [
              "any",
              ["==", ["get", "displacedInSealed"], true],
              ["==", ["get", "displacedInSealed"], "true"],
            ],
            "#5a534c",
            "#e8d48a",
          ]
        : "#e8d48a",
    );
    map.setPaintProperty("houses-circle", "circle-opacity", compare ? 0.85 : 0.92);
    if (compare) map.easeTo({ center: [19.06, 47.503], zoom: 12.15, duration: cameraMs });
    else if (sealed) map.easeTo({ center: [19.062, 47.499], zoom: 14.2, duration: cameraMs });
    else if (periodId === "dual-ghetto") map.easeTo({ center: [19.058, 47.508], zoom: 13, duration: cameraMs });
    else map.easeTo({ center: [19.06, 47.503], zoom: 12.4, duration: cameraMs });
  }, [periodId, period, compare, cameraMs, mapReady]);

  useEffect(() => {
    if (!mapReady || !exportMode) return;
    const t = window.setTimeout(() => {
      document.querySelector(".map-shell")?.setAttribute("data-export-ready", "1");
    }, 1500);
    return () => window.clearTimeout(t);
  }, [mapReady, periodId, compare, exportMode]);

  useEffect(() => {
    if (!story || periods.length === 0) return;
    let i = 0;
    const ids = periods.map((p) => p.id);
    setPeriodId(ids[0]);
    const t = window.setInterval(() => {
      i = (i + 1) % ids.length;
      setPeriodId(ids[i]);
    }, 4200);
    return () => window.clearInterval(t);
  }, [story, periods]);

  const selectedScore = selected ? scoreOf(selected, periodId, "composite") : null;
  const selectedBlock = selected?.scores[periodId as keyof HouseProps["scores"]] as ScoreBlock | undefined;

  const paradox = useMemo(() => {
    if (!selectedBlock || !period?.sealed) return null;
    const foodBand = selectedBlock.detail.food.band;
    if (foodBand === "high" || foodBand === "medium") {
      return "Walking-time band to a kitchen is high. The occupation-adjusted food score is not. Distance is not calories.";
    }
    return null;
  }, [selectedBlock, period]);

  return (
    <div className="map-shell">
      <aside className="panel">
        <p className="kicker">Interactive case study</p>
        <h1>How spatial control changed daily survival</h1>
        <p className="lede">
          A LUPTAI-style accessibility index, adapted for occupation, over the Budapest Jewish
          population from the yellow-star houses of June 1944 to the sealed Pest ghetto of January
          1945. Click a gold house or a coloured resource on the map.
        </p>
        <div className="filmstrip">
          {periods.map((p) => (
            <button key={p.id} className={p.id === periodId ? "active" : ""} onClick={() => setPeriodId(p.id)}>
              <small>{p.short}</small>
              {p.label}
            </button>
          ))}
        </div>
        {period && <p className="narrative">{period.narrative}</p>}
        {stats && (
          <div className="stat-row">
            <div className="stat">
              <b>{stats.meanComposite.toFixed(1)}</b>
              <span>Mean composite</span>
            </div>
            <div className="stat">
              <b>{stats.n.toLocaleString()}</b>
              <span>Residences in model</span>
            </div>
            <div className="stat">
              <b>{period?.windowHours}h</b>
              <span>Leave-home window</span>
            </div>
            <div className="stat">
              <b>{summary ? dropLabel(summary) : "—"}</b>
              <span>Drop, June → sealed</span>
            </div>
            {!!stats.nDisplaced && (
              <div className="stat">
                <b>{stats.nDisplaced.toLocaleString()}</b>
                <span>Yellow-star houses emptied</span>
              </div>
            )}
            {summary && displacedShare(summary) && (
              <div className="stat">
                <b>{displacedShare(summary)}</b>
                <span>Share of June buildings displaced</span>
              </div>
            )}
          </div>
        )}
        {summary?.series && (
          <Sparkline
            values={summary.series.map((s) => s.mean)}
            labels={summary.series.map((s) => s.short.replace(/\s.*/, ""))}
            activeIndex={summary.series.findIndex((s) => s.id === periodId)}
            onSelect={(i) => {
              const next = summary.series?.[i];
              if (next) setPeriodId(next.id);
            }}
          />
        )}
        <div className="seg">
          <button className={story ? "active" : ""} onClick={() => setStory((v) => !v)}>
            {story ? "Stop walkthrough" : "Walk through 1944"}
          </button>
          <button
            className={compare ? "active" : ""}
            onClick={() => {
              setCompare((v) => !v);
              if (!compare) setPeriodId("sealed");
            }}
          >
            {compare ? "Exit June vs sealed" : "June vs sealed"}
          </button>
        </div>
        {compare && (
          <p className="narrative">
            Gold houses still count as Jewish residences after 10 December. Grey houses are
            yellow-star buildings emptied into the two ghettos — {summary ? displacedShare(summary) : ""} of
            the June file.
          </p>
        )}
        {selected && (
          <div className="house-card">
            <p className="kicker">Selected residence</p>
            <h2>
              {selected.address}{" "}
              <small style={{ fontWeight: 400, opacity: 0.7 }}>
                Dist. {romanDistrict(selected.district)}
              </small>
            </h2>
            {selectedScore == null || selectedBlock?.displaced ? (
              <p className="note">
                This yellow-star house is emptied in the selected regime. The people who lived
                here were moved into the Pest ghetto or a protected house. Access from this
                address falls to zero because the address is no longer legal.
              </p>
            ) : (
              <>
                <div className="bars">
                  {(["composite", "food", "medical", "work"] as const).map((k) => (
                    <div key={k}>
                      <div className="bar-lab">
                        <span>{PURPOSE_LABEL[k]}</span>
                        <span>
                          {k === "composite"
                            ? selectedBlock?.composite.toFixed(1)
                            : selectedBlock?.detail[k].score.toFixed(1)}{" "}
                          {k !== "composite" && (
                            <span className={`band band-${selectedBlock?.detail[k].band}`}>
                              {selectedBlock?.detail[k].band}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="bar">
                        <i
                          className={k}
                          style={{
                            width: `${Math.min(100, k === "composite" ? selectedBlock!.composite : selectedBlock!.detail[k].score)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {selectedBlock && (
                  <p className="note">
                    Food walk {selectedBlock.detail.food.minutes.toFixed(0)} min · reach{" "}
                    {selectedBlock.detail.food.reach} · capacity {selectedBlock.detail.food.capacity} ·
                    window {selectedBlock.detail.food.window.toFixed(2)}
                  </p>
                )}
                {paradox && <div className="paradox">{paradox}</div>}
                {periods.length > 0 && (
                  <Sparkline
                    values={periods.map((p) => selected.scores[p.id]?.composite ?? 0)}
                    activeIndex={periods.findIndex((p) => p.id === periodId)}
                    onSelect={(i) => setPeriodId(periods[i].id)}
                  />
                )}
              </>
            )}
          </div>
        )}
      </aside>
      <div className="map-canvas">
        <div ref={container} style={{ position: "absolute", inset: 0 }} />
      </div>
      <aside className="panel right">
        <p className="kicker">Index</p>
        <h2>What is being measured</h2>
        <p className="narrative">
          LUPTAI bands walking time to destinations, then blends purposes. Here the purposes are
          food, medical care, and work. Occupation adds four modifiers LUPTAI never needed: legal
          reach, the leave-home window, destination capacity, and falling walk speed.
        </p>
        <h2>Purpose</h2>
        <div className="seg">
          {(["composite", "food", "medical", "work"] as Purpose[]).map((p) => (
            <button key={p} className={purpose === p ? "active" : ""} onClick={() => setPurpose(p)}>
              {PURPOSE_LABEL[p]}
            </button>
          ))}
        </div>
        <div className="legend">
          <div className="swatch-row">
            <span style={{ background: "#241c18" }} />
            <span style={{ background: "#5c2a24" }} />
            <span style={{ background: "#a85b2b" }} />
            <span style={{ background: "#d4a017" }} />
            <span style={{ background: "#efe7d6" }} />
          </div>
          <div className="legend-captions">
            <span>None / sealed</span>
            <span>Higher access</span>
          </div>
        </div>
        {compare && (
          <p className="note">
            Compare colours: gold = still a legal Jewish residence on 10 December; grey = a June
            yellow-star house emptied into the Pest or international ghetto.
          </p>
        )}
        <h2>Layers</h2>
        <div className="seg">
          {(
            [
              ["houses", "Residences"],
              ["heat", "Index surface"],
              ["resources", "Resources"],
              ["gates", "Gates"],
            ] as const
          ).map(([k, lab]) => (
            <button
              key={k}
              className={`layer-toggle ${layers[k] ? "active" : ""}`}
              onClick={() => setLayers((L) => ({ ...L, [k]: !L[k] }))}
            >
              {lab}
            </button>
          ))}
        </div>
        <p className="note">
          Gold dots are yellow-star houses from the public OSA address list, snapped to OSM
          streets — a reconstruction, not the Cole &amp; Giordano HGIS. Orange = food, teal =
          medical, violet = work. The dashed outline is the Pest ghetto; the northern polygon is
          the international ghetto.
        </p>
        {summary && (
          <p className="note">
            {summary.houses.toLocaleString()} addresses · {(summary.matchRate * 100).toFixed(0)}%
            street-matched · {summary.inPestGhetto} fall inside the reconstructed Pest wall ·{" "}
            {summary.inInternational} inside the protected-house zone.
          </p>
        )}
      </aside>
    </div>
  );
}
