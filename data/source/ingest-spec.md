# Occupation-adapted accessibility layers

Addresses in `yellow-star-houses.csv` come from the Blinken OSA Archivum
Yellow-Star Houses public list (yellowstarhouses.org), geocoded onto
OpenStreetMap street segments. They are a reconstruction for method
demonstration.

They are **not** the Cole & Giordano Historical GIS of 1944 Budapest
(3,300+ residences and 100+ public places). That dataset is the intended
production input. Contact Alberto Giordano (a.giordano@txstate.edu) and
Tim Cole (Tim.Cole@bristol.ac.uk).

## Swap-in contract

Replace `public/data/houses.geojson` with a FeatureCollection of points.

Required properties per feature:

| property | type | notes |
| --- | --- | --- |
| id | string | stable building id |
| address | string | 1944 street address |
| district | number | historical district 1–14 |
| inPestGhetto | boolean | inside 10 Dec 1944 wall |
| inInternational | boolean | inside Újlipótváros protected-house zone |

Optional: `source` (`hgis` | `osa-reconstructed`), `listDate` (`1944-06-16` or `1944-06-22`).

Then run:

```
python3 scripts/build_data.py
```

Or, if supplying already-geocoded coordinates, skip the OSM snap and pass
the GeoJSON to `score_origin` for each period in `public/data/periods.json`.

`resources.geojson` can likewise be replaced with the Collaborative's
public-place layer (market halls, hospitals, council offices). Keep the
`purpose` property as `food` | `medical` | `work` so the index does not
need to change.

## What this prototype is allowed to claim

- The *method* (LUPTAI banding + occupation modifiers) is the contribution.
- The *magnitudes* (91% composite drop, etc.) are illustrative until the
  HGIS is licensed.
- Cole & Giordano already quantified walking-to-market under the 2–5 p.m.
  window. This project does not replicate that paper; it adds medical and
  work purposes, a composite, and the sealed-ghetto regime when markets
  stop being the relevant destination set.
