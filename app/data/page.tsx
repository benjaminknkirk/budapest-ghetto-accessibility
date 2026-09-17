import type { Metadata } from "next";
import Link from "next/link";
import summary from "@/public/data/summary.json";

export const metadata: Metadata = { title: "Data — Mapping Access Under Occupation" };

export default function DataPage() {
  return (
    <main className="page">
      <article className="paper">
        <p className="meta">Provenance · ingest path · what not to claim</p>
        <h1>Foundation, not a replica</h1>
        <p>
          Cole and Giordano’s Historical GIS of the Budapest ghetto is the starting point of
          this project. It is also not in this repository. The Collaborative hosts an explorer
          and asks researchers to write to Alberto Giordano (
          a.giordano@txstate.edu) or Tim Cole (Tim.Cole@bristol.ac.uk). That is the correct
          next email, and it should attach this atlas rather than a request to “share the data
          for a new ghetto map.”
        </p>

        <h2>What the prototype is running on</h2>
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Residences</td>
              <td>
                Blinken OSA Archivum Yellow-Star Houses list (public addresses), snapped to OSM
                street segments. {summary.houses} points, {(summary.matchRate * 100).toFixed(1)}%
                street-matched.
              </td>
              <td>Reconstruction</td>
            </tr>
            <tr>
              <td>Pest ghetto polygon</td>
              <td>
                29 Nov 1944 decree street list; EHRI topography (Klacsmann); Cole,{" "}
                <em>Holocaust City</em>. Drawn inside boundary streets.{" "}
                {summary.inPestGhetto} prototype houses fall inside (historical yellow-star count
                on the territory was about 162).
              </td>
              <td>Documentary reconstruction</td>
            </tr>
            <tr>
              <td>International ghetto</td>
              <td>
                Újlipótváros rectangle: Szent István park / rakpart / körút / Hegedűs Gyula
                (Csáky) / Victor Hugo (Wahrmann). {summary.inInternational} prototype houses
                tagged.
              </td>
              <td>Documentary reconstruction</td>
            </tr>
            <tr>
              <td>Market halls, hospitals, gates, Stern kitchen</td>
              <td>
                Published locations (EHRI, Braham, hospital histories, Nominatim-constrained
                addresses). A few kitchens are district-level reconstructions.
              </td>
              <td>Mixed: documented + reconstructed</td>
            </tr>
            <tr>
              <td>Street geometry for geocoding</td>
              <td>OpenStreetMap, ODbL.</td>
              <td>Contemporary streets as a 1944 proxy</td>
            </tr>
          </tbody>
        </table>

        <h2>HGIS swap-in</h2>
        <p>
          The scoring code does not care whether a point came from OSA or from the
          Collaborative. Replace <code>public/data/houses.geojson</code> with their geocoded
          buildings, keep <code>inPestGhetto</code> / <code>inInternational</code> (or derive
          them from the Collaborative’s own stage layers), and rerun{" "}
          <code>python3 scripts/build_data.py</code>. The contract is in{" "}
          <code>data/source/ingest-spec.md</code>.
        </p>

        <h2>Contacts this artifact is built to travel with</h2>
        <ul>
          <li>Holocaust Geographies Collaborative — HGIS license and network impedances.</li>
          <li>CAGR — residency / seminar, testimony shortlist for the teaching module.</li>
          <li>
            USC Spatial Sciences Institute, Yao-Yi Chiang’s lab — testimony-aware spatial
            methods; this index is a conversation they can actually run.
          </li>
          <li>
            Blinken OSA Archivum — yellow-star houses public history; cite, don’t scrape as if
            it were a private dump.
          </li>
        </ul>
        <p>
          Method: <Link href="/method">occupation-adapted LUPTAI</Link>. Argument:{" "}
          <Link href="/paper">working paper</Link>. Demo: <Link href="/">the map</Link>.
        </p>
      </article>
    </main>
  );
}
