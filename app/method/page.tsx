import type { Metadata } from "next";

export const metadata: Metadata = { title: "Method — Mapping Access Under Occupation" };

export default function MethodPage() {
  return (
    <main className="page">
      <article className="paper">
        <p className="meta">Technical note · Occupation-adapted accessibility index</p>
        <h1>From LUPTAI to a sealed street</h1>
        <p>
          LUPTAI — the Land Use and Public Transport Accessibility Index — was built for cities
          that are trying to become more reachable: Brisbane, the Gold Coast, later Queensland
          Transport and Main Roads implementations. It asks a simple question from every origin:
          how long does it take to walk, and then ride, to the things a life needs? The original
          model (Pitot, Yigitcanlar, Sipe and Evans, 2006; Yigitcanlar, Sipe, Evans and Pitot,
          2007) classifies walking catchments to land-use destinations into High, Medium, Low,
          Poor and None, transfers those values onto a 50-metre grid, and blends purposes into a
          composite. Later TMR work recasts the indicator as a simulated mean travel time, with
          exclusion probabilities and Monte Carlo draws over destination eligibility.
        </p>
        <p>
          Budapest in 1944 is the inverse problem. The network still exists. The destinations
          still exist. What changes, month by month, is whether a Jewish resident is allowed to
          use them. An accessibility index that only measures metres will congratulate the sealed
          ghetto for putting seventy thousand people within a short walk of a kitchen that cannot
          feed them, and a hospital that sits one street beyond a wall.
        </p>

        <h2>The occupation-adapted index</h2>
        <p>
          For each origin <em>i</em> (a residence, or a grid cell), each purpose{" "}
          <em>k</em> ∈ {"{"}food, medical, work{"}"}, and each regime <em>t</em>:
        </p>
        <blockquote>
          a<sub>ik</sub>(t) = T(minutes<sub>ik</sub>) × reach<sub>ik</sub> × window<sub>t</sub> ×
          capacity<sub>k</sub>(t)
        </blockquote>
        <p>
          T(minutes) is a linear 0–100 decay that hits zero at 45 minutes — the outer edge of
          LUPTAI’s “poor” walking band, converted from metres to minutes so that a change in walk
          speed moves people between bands even when Euclidean distance does not. Composite access
          is 0.45·food + 0.35·medical + 0.20·work. Those are survival weights, not South East
          Queensland household-travel weights. Food is first because starvation is the binding
          constraint of the sealed month.
        </p>

        <h3>Four modifiers LUPTAI did not need</h3>
        <ol>
          <li>
            <strong>Reach.</strong> If a destination lies outside the origin’s permitted region
            and there is no open gate, reach = 0. If exit is theoretically possible with papers,
            reach is a small permit factor (0.08 when the Pest ghetto is sealed; 0.03 after 10
            January). Inside the same region, reach = 1. Metres through a wall do not count.
          </li>
          <li>
            <strong>Window.</strong> Jews could leave yellow-star houses only 2–5 p.m. (later
            11–5). The sealed ghetto’s practical outdoor window is near zero. Window is
            hours-allowed / 12. A three-hour shopping day is a 0.25 multiplier. Cole and Giordano
            already showed that this timetable, not distance alone, restructured market-hall
            catchments in June. The index keeps that insight and carries it forward into later
            regimes.
          </li>
          <li>
            <strong>Capacity.</strong> Documented adult intake in the Pest ghetto was 781 kcal
            against a 2,200–2,500 kcal note on the same Jewish Council sheet. Spatial proximity
            to the Stern kitchen is not access to food. Capacity is supply/demand, capped at 1.
          </li>
          <li>
            <strong>Speed.</strong> Walk speed falls from 4.6 km/h in April to 2.6 km/h in the
            last week of the siege — crowding, ice, malnutrition, fear. LUPTAI assumes a healthy
            pedestrian. This population was not.
          </li>
        </ol>

        <h2>Regimes, not a single ghetto</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Regime</th>
              <th>Food destinations</th>
              <th>Leave-home window</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>5 Apr 1944</td>
              <td>Occupation, still at home</td>
              <td>Municipal market halls</td>
              <td>~10 h, already with shopping-hour limits</td>
            </tr>
            <tr>
              <td>24 Jun</td>
              <td>Yellow-star houses (1,944 buildings)</td>
              <td>Market halls</td>
              <td>3 h (2–5 p.m.)</td>
            </tr>
            <tr>
              <td>15 Oct</td>
              <td>Arrow Cross coup</td>
              <td>Market halls, under street violence</td>
              <td>3 h, discounted by danger</td>
            </tr>
            <tr>
              <td>29 Nov</td>
              <td>Pest ghetto + international ghetto</td>
              <td>Markets and emerging kitchens</td>
              <td>2 h, then collapsing</td>
            </tr>
            <tr>
              <td>10 Dec</td>
              <td>Pest ghetto sealed</td>
              <td>Kitchens only; markets legally gone</td>
              <td>~none without papers</td>
            </tr>
            <tr>
              <td>10 Jan 1945</td>
              <td>Kis Diófa and Nagy Diófa gates locked</td>
              <td>Kitchens only</td>
              <td>two remaining gates, the most raided</td>
            </tr>
          </tbody>
        </table>
        <p>
          Destination sets change with the regime. That is the difference between this model and
          a static “distance to market” map. After 10 December the relevant food object is no
          longer Hold utca or Fővám tér. It is a soup kitchen on Rumbach Sebestyén utca that
          cannot issue a living ration.
        </p>

        <h2>What this does not copy from Cole and Giordano</h2>
        <p>
          Chapter 5 of <em>Geographies of the Holocaust</em> (“Bringing the Ghetto to the Jew”)
          already geocoded thousands of designated residences and simulated walks to market halls
          under the 2–5 p.m. rule. Stanford’s Spatial History Project animated those journeys.
          This project starts there. It does not redo the market-hall network analysis. It asks
          a different question: how does a composite, occupation-adjusted index move as the
          destination set, the legal region, and the capacity of those destinations all change
          from June to January?
        </p>
        <p>
          The honest limit of the present build: residence coordinates are reconstructed from
          the public OSA Yellow-Star Houses list, snapped to OpenStreetMap streets. The
          production version replaces that layer with the Collaborative’s HGIS. The method does
          not depend on which of those two point files is loaded. See Data.
        </p>
      </article>
    </main>
  );
}
