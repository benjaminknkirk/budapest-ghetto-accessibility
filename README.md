# Mapping Access Under Occupation

An accessibility-index analysis of the **Budapest ghetto, 1944–45**: how Nazi- and Arrow Cross-imposed spatial regimes changed Jewish residents’ practical access to food, medical care, and work.

This is a bounded case study with a working interactive atlas, a working paper, a CAGR briefing, and a teaching module. It is not a GIS of “the Holocaust.”

## What is new

Tim Cole and Alberto Giordano already built the historical GIS of Jewish-designated residences in Budapest and already measured walking-to-market under the 2–5 p.m. shopping window. This project does not recreate that file and does not redo that paper.

It adds a **LUPTAI-style composite index** (food, medical, work) with occupation modifiers the planning literature never needed — legal reach, the leave-home timetable, destination capacity, and falling walk speed — and tracks that index as destination sets change from municipal market halls in June to soup kitchens behind a wall in December.

The sealed-ghetto result the map is built to show: walking-time bands to food go **up** (everyone is close to a kitchen) while the occupation-adjusted score collapses, because 781 kcal is not access and Wesselényi 44 is on the other side of the fence.

## Run

```bash
npm install
python3 -m unittest tests.test_accessibility -v
python3 scripts/build_data.py   # regenerates public/data from the OSA list + OSM streets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Site

| Path | Output |
| --- | --- |
| `/` | Interactive atlas (the demo) |
| `/method` | Occupation-adapted LUPTAI |
| `/paper` | Working paper |
| `/briefing` | Twelve-minute CAGR talk |
| `/teach` | IWitness-facing module |
| `/data` | Provenance and HGIS ingest |

## Data honesty

`public/data/houses.geojson` is a **reconstruction**: public addresses from the Blinken OSA Archivum Yellow-Star Houses list, snapped to OpenStreetMap streets. It is not the Cole & Giordano HGIS. Swap-in instructions: `data/source/ingest-spec.md`.

Prototype statistics live in `public/data/summary.json` and will change when the HGIS is loaded. The method will not.

## Stack

Next.js 15, MapLibre GL, OpenFreeMap, Python for the index. No API keys.

## Cite the foundations

- Cole, Tim and Alberto Giordano. “Bringing the Ghetto to the Jew: The Shifting Geography of the Budapest Ghetto.” In *Geographies of the Holocaust*, ed. Knowles, Cole and Giordano. Indiana, 2014.
- Cole, Tim. *Holocaust City: The Making of a Jewish Ghetto*. Routledge, 2003.
- Pitot, Matthew, Tan Yigitcanlar, Neil Sipe and Paul Evans. “Land Use & Public Transport Accessibility Index (LUPTAI) Tool.” ATRF, 2006.
- Klacsmann, Borbála. “An Excruciating Month: A History and Topography of the Pest Ghetto.” EHRI Document Blog, 2024.
- Blinken OSA Archivum. Yellow-Star Houses. https://www.yellowstarhouses.org/
