import type { Metadata } from "next";
import Link from "next/link";
import summary from "@/public/data/summary.json";

export const metadata: Metadata = {
  title: "Working paper — Mapping Access Under Occupation",
};

const sealed = summary.periods.sealed as { meanComposite: number; n: number; nDisplaced: number; meanIncludingDisplaced: number };
const yellow = summary.periods["yellow-star"] as { meanComposite: number; n: number };
const occ = summary.periods.occupation as { meanComposite: number };
const drop = summary.periods.deltaYellowStarToSealed as {
  percentDrop: number;
  meanCompositeDrop: number;
  nDisplaced: number;
  shareDisplaced: number;
};

export default function PaperPage() {
  return (
    <main className="page">
      <article className="paper">
        <p className="meta">
          Working paper · bounded case study · Budapest, March 1944 – January 1945
          <br />
          Mapping Access Under Occupation · prototype results from a reconstructed residence file
        </p>
        <h1>Mapping Access Under Occupation: An Accessibility Analysis of the Budapest Ghetto</h1>
        <p>
          Most Holocaust geography reconstructs what happened in space: where the boundary ran,
          which building was listed, who was moved. This paper does something narrower. It takes
          the accessibility-index method used in contemporary urban planning — the family of
          tools of which Hickman’s LUPTAI work in Brisbane is the type — and applies it to one
          ghetto, in one city, across the eight months in which Nazi and Arrow Cross rule
          redrew Jewish Budapest. The question is not “where was the ghetto?” It is: as those
          lines moved, what happened to practical access to food, medical care, and work?
        </p>

        <h2>1. A bounded case, on purpose</h2>
        <p>
          The Budapest ghetto is the strongest candidate for this method because the empirical
          floor already exists. Tim Cole and Alberto Giordano, as part of the Holocaust
          Geographies Collaborative, built a historical GIS that locates more than 3,300
          Jewish-designated residences and more than 100 public places in 1944 Budapest, from
          the 16 and 22 June lists through the November ghettos. Their chapter in{" "}
          <em>Geographies of the Holocaust</em> (Indiana, 2014) showed that perpetrators “brought
          the ghetto to the Jew”: designated houses followed the city’s existing Jewish
          geography rather than inventing a new one. They also showed, in related work, that a
          three-hour shopping window restructured who could reach a market hall.
        </p>
        <p>
          This paper treats that HGIS as the intended production dataset, not as something to
          recreate. The interactive atlas alongside this text currently runs on a public
          reconstruction: 1,952 addresses from the Blinken OSA Archivum Yellow-Star Houses list,
          geocoded to OpenStreetMap street segments ({(summary.matchRate * 100).toFixed(0)}%
          snapped to a named street). Magnitudes below are therefore prototype results. The
          method is the claim; the numbers wait on a licensed HGIS ingest.
        </p>

        <h2>2. What prior spatial work already quantified — and what it did not</h2>
        <p>
          Cole and Giordano already went beyond boundary maps. They estimated walking time to
          market halls, identified residences outside a thirty- and sixty-minute threshold, and
          argued that District V likely saw more competition for food than other parts of the
          city. Stanford’s Spatial History Project turned those walks into an animation of
          streets that filled, and streets that emptied, between 2 and 5 p.m.
        </p>
        <p>
          Three things remain unmeasured at that level of specificity. First, medical care and
          work are not in the composite. Second, the destination set is not held constant: after
          10 December 1944 the municipal market hall is the wrong object. Third, the sealed
          ghetto produces an apparent improvement in walking-time bands (everyone is closer to
          a kitchen) that is the opposite of survival. An index that cannot show that paradox
          is not yet an accessibility index of occupation.
        </p>

        <h2>3. Method, in brief</h2>
        <p>
          The occupation-adapted accessibility index (OAAI) keeps LUPTAI’s origin-based scores,
          walking-time bands (High ≤ 8 min, Medium ≤ 15, Low ≤ 25, Poor ≤ 45, None beyond), and
          purpose composite. It adds four modifiers: legal reach (including gate-and-permit
          paths), the leave-home time window, destination capacity, and falling walk speed.
          Survival weights are food 0.45, medical 0.35, work 0.20. Full specification is on the{" "}
          <Link href="/method">method page</Link>. Six regimes are scored: occupation-at-home;
          yellow-star houses; Arrow Cross coup; dual ghetto, still unsealed; Pest ghetto sealed;
          two gates locked on 10 January.
        </p>
        <p>
          Pest ghetto geometry follows the 29 November 1944 decree (Dohány, Nagyatádi Szabó
          István / Kertész, Király, Csányi 3–6, Rumbach Sebestyén 15–19, Madách Imre út and
          tér, Károly körút), drawn inside the curb line because buildings facing boundary
          streets were excluded — Cole’s “island looking in on itself.” The two central
          hospitals, Wesselényi utca 44 and Bethlen tér 2, sit outside that polygon, which is
          historically the point. The international ghetto is the Újlipótváros rectangle of
          protected houses, not a second wall.
        </p>

        <h2>4. Prototype findings</h2>
        <p>
          On the reconstructed file, mean composite access falls from {occ.meanComposite} in
          early occupation to {yellow.meanComposite} on 24 June — before anyone has been walled
          in. Almost all of that collapse is the three-hour window. The map of homes has
          changed; the map of destinations has not. Accessibility was already a timetable.
        </p>
        <p>
          From yellow-star houses to the sealed ghetto the mean composite falls again, from{" "}
          {yellow.meanComposite} to {sealed.meanComposite}, a {drop.percentDrop}% drop among
          the {sealed.n} residences that remain in the model (buildings inside the Pest wall or
          the protected-house zone). That remaining mean hides a larger emptying:{" "}
          {drop.nDisplaced.toLocaleString()} of {summary.houses.toLocaleString()} June buildings
          ({Math.round(drop.shareDisplaced * 100)}%) are no longer legal Jewish residences. If
          those emptied addresses are scored as zero, city-wide mean composite is{" "}
          {sealed.meanIncludingDisplaced}. Walking-time <em>bands</em> to food among those still
          inside do not collapse. They improve. People are now a few hundred metres from a kitchen. The occupation-adjusted
          food score still goes toward zero because capacity is 781/2200 kcal and reach through
          the wall is 0. That is the result a boundary map cannot show and a naïve distance
          map will invert.
        </p>
        <p>
          Medical access inverts in a different way. The converted hospital at Wesselényi 44 is
          adjacent to the eastern gate. Euclidean distance from Klauzál tér is short. Legal
          distance, after 10 December, is a permit, a gate that Arrow Cross men use as an
          entrance, and, after 10 January, one of only two remaining exits. The index records
          that as near-zero reach, not as a short walk.
        </p>
        <p>
          Work leaves the model almost entirely after mid-October. Labour-battalion assembly
          points and Csepel-scale destinations are scored as present but unreachable once the
          wall exists. What remains inside — council administration, internal workshops — is
          not livelihood. The low work weight is deliberate: after the coup, “access to work”
          is often access to being marched away.
        </p>
        <table>
          <thead>
            <tr>
              <th>Regime</th>
              <th>Mean composite</th>
              <th>What the number is mostly made of</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Occupation, still at home</td>
              <td>{occ.meanComposite}</td>
              <td>City-scale walking to halls and hospitals; shopping hours already biting</td>
            </tr>
            <tr>
              <td>Yellow-star houses, 24 June</td>
              <td>{yellow.meanComposite}</td>
              <td>Same destinations × a 3-hour day</td>
            </tr>
            <tr>
              <td>Sealed Pest ghetto, 10 Dec</td>
              <td>{sealed.meanComposite}</td>
              <td>High proximity × empty kitchens × a wall in front of the hospitals</td>
            </tr>
          </tbody>
        </table>
        <h3>Displacement is most of the city’s accessibility loss</h3>
        <p>
          Districts V–VIII held the traditional Jewish geography Cole and Giordano mapped.
          After November, only a slice of VII and the Újlipótváros protected-house zone (XIII)
          still count as origin points. Buda and the outer Pest districts go to zero not
          because markets moved, but because the people did — or rather, were moved.
        </p>
        <table>
          <thead>
            <tr>
              <th>District</th>
              <th>June houses</th>
              <th>June mean</th>
              <th>Still scored 10 Dec</th>
              <th>Emptied</th>
            </tr>
          </thead>
          <tbody>
            {(summary.districts ?? [])
              .filter((d) => d.nYellowStar >= 30)
              .map((d) => (
                <tr key={d.district}>
                  <td>{d.district}</td>
                  <td>{d.nYellowStar}</td>
                  <td>{d.meanYellowStar ?? "—"}</td>
                  <td>{d.nSealed}</td>
                  <td>{d.nDisplaced}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <h2>5. What this reveals that a ghetto outline does not</h2>
        <p>
          A polygon of Erzsébetváros tells you that seventy thousand people were put into 0.3
          km². It does not tell you that the two hospitals the Jewish Council actually had were
          left on the other side of the fence; that individual cooking was banned, so the
          relevant food geography shrank from a city of market halls to a handful of kitchens;
          or that a “high” LUPTAI walking band can coexist with a ration the Council itself
          marked with exclamation points. Accessibility under occupation is the joint product
          of distance, permission, time of day, and whether the destination still has anything
          in it.
        </p>
        <p>
          The dual-ghetto month also splits the population. Protected-house residents in
          Újlipótváros and wall-bound residents in District VII are not in the same
          accessibility regime, even on the same day. Any teaching module that says “the
          Budapest ghetto” as if it were one place in November 1944 is already too coarse.
        </p>

        <h2>6. Limits</h2>
        <p>
          This is not yet a network analysis. Distances are haversine, not 1944 street-network
          paths; Cole and Giordano’s network is the correct next substitution. Several ghetto
          kitchens are reconstructed at district level rather than from a complete Council
          inventory. Walk speeds and permit factors are documented in direction (slower,
          smaller) and chosen in magnitude; they should be calibrated against testimony and
          the Collaborative’s own impedance assumptions. The OSA list is the June yellow-star
          universe, not the November assignment of people to rooms. Population weights (six
          people per room in the sealed ghetto) are not yet on the points. None of those limits
          is a reason to delay showing the method. All of them are reasons to sit down with
          the HGIS rather than pretending this reconstruction is that file.
        </p>

        <h2>7. Where this goes next</h2>
        <p>
          The tangible outputs of the project are this bounded case, the{" "}
          <Link href="/">interactive atlas</Link>, this working paper, a{" "}
          <Link href="/briefing">twelve-minute briefing</Link> written for USC Shoah
          Foundation’s Center for Advanced Genocide Research, a{" "}
          <Link href="/teach">teaching module</Link>, and{" "}
          <Link href="/outreach">ready emails</Link> for Cole/Giordano, CAGR, and IWitness.
          The institutional path is not speculative. The Collaborative has already held CAGR
          residencies. USC’s Spatial Sciences Institute has already worked with Shoah Foundation
          testimony. The missing piece was a demo-able artifact. This is that artifact, with a
          documented ingest for the dataset it is designed to carry.
        </p>
        <p className="meta">
          Prototype statistics: {summary.houses} OSA addresses, {summary.inPestGhetto} inside
          the reconstructed Pest wall, {summary.inInternational} inside the protected-house
          zone. See <Link href="/data">Data</Link> for provenance and the HGIS swap-in
          contract.
        </p>
      </article>
    </main>
  );
}
