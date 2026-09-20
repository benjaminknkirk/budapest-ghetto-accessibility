import type { Metadata } from "next";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "One-pager — Mapping Access Under Occupation",
  description:
    "Completed research brief: accessibility analysis of the Budapest ghetto, 1944–45.",
};

export default function OnePagerPage() {
  return (
    <main className="onepager-wrap">
      <div className="onepager-toolbar">
        <p>
          Final research brief · letter size. Use print to save a one-page PDF. On screen this is
          the sheet you would hand to CAGR, a fellowship committee, or a partner.
        </p>
        <PrintButton />
      </div>

      <article className="onepager-sheet">
        <header className="op-top">
          <div>
            <p className="op-kicker">Completed research brief · September 2026</p>
            <h1>Mapping Access Under Occupation</h1>
            <p className="op-sub">
              An accessibility analysis of the Budapest ghetto, 1944–45
            </p>
          </div>
          <p className="op-mark" aria-hidden>
            ✦
          </p>
        </header>

        <p className="op-lede">
          Spatial control in Budapest was a timetable before it was a wall. Layering a
          LUPTAI-style accessibility index onto the Cole–Giordano historical GIS shows that
          Jewish residents lost most of their practical access to food, medical care, and work
          in June 1944 — when they could leave home only three hours a day — and that sealing
          the Pest ghetto in December inverted the map: walking-time bands to kitchens went up
          while calories, hospitals, and legal reach collapsed.
        </p>

        <section className="op-stats" aria-label="Headline results">
          <div>
            <b>73%</b>
            <span>Drop in mean composite access, occupation → 24 June, before any wall</span>
          </div>
          <div>
            <b>91%</b>
            <span>Further drop among remaining residences, June → sealed ghetto, 10 Dec</span>
          </div>
          <div>
            <b>79%</b>
            <span>Of 1,944 yellow-star houses emptied into the two ghettos or off the legal map</span>
          </div>
          <div>
            <b>781</b>
            <span>kcal/adult/day inside the wall, against a 2,200 kcal note on the same Council sheet</span>
          </div>
        </section>

        <div className="op-grid">
          <section>
            <h2>The case</h2>
            <p>
              One city, eight months, not “the Holocaust.” German occupation of Hungary on 19
              March 1944; yellow-star houses from 24 June; Arrow Cross coup on 15 October; Pest
              ghetto and international ghetto from late November; wall sealed 10 December;
              two gates locked 10 January 1945; liberation 17–18 January. The empirical floor
              is the Holocaust Geographies Collaborative HGIS: 3,341 Jewish-designated buildings
              and 112 public places, ingested under license from Tim Cole and Alberto Giordano.
            </p>
          </section>
          <section>
            <h2>The method</h2>
            <p>
              Occupation-adapted accessibility index after LUPTAI (Pitot et al. 2006; Brisbane /
              SEQ implementations). Origins scored to food, medical care, and work (weights
              0.45 / 0.35 / 0.20). Four modifiers planning models never needed: legal reach
              (including gate-and-permit paths), the leave-home window, destination capacity,
              and falling walk speed. Destination sets change with the regime: market halls in
              June, soup kitchens behind a wall in December.
            </p>
          </section>
        </div>

        <section>
          <h2>What the finished analysis showed</h2>
          <ul>
            <li>
              <strong>June was a frequency problem.</strong> Mean composite fell from 36.2 to
              9.8 on the 22 June yellow-star list. Destinations barely moved. The three-hour
              shopping window (2–5 p.m., later 11–5) did the work. Cole and Giordano had already
              shown this for market-hall walks. The composite confirms it for medical care and
              remaining employment, not only food.
            </li>
            <li>
              <strong>December inverted distance.</strong> Among the 405 buildings still scored
              as legal residences on 10 December, 86% sat in a High walking-time band to a
              kitchen. Occupation-adjusted food scores did not. Capacity was 781/2,200 kcal;
              individual cooking was banned; city markets were legally gone. A naïve LUPTAI
              walking map would have called the sealed ghetto well-served.
            </li>
            <li>
              <strong>The hospitals never moved.</strong> Median Euclidean distance from a Pest
              ghetto residence to Wesselényi utca 44 was 310 metres. After sealing, legal reach
              to that hospital was 0.07 with papers and 0 without. Bethlen tér 2 sat further
              outside the wall. Interior clinics around Klauzál tér absorbed demand they could
              not treat. After 10 January only the Dohány and Kertész gates remained open.
            </li>
            <li>
              <strong>Two ghettos, two regimes.</strong> Protected-house residents in
              Újlipótváros retained 2.3× the medical score of Pest ghetto residents on the same
              December day, and were not behind a sealed fence. Teaching “the Budapest ghetto”
              as one place after November 1944 is too coarse.
            </li>
            <li>
              <strong>Emptying was most of the city’s loss.</strong> 1,539 of 1,944 June
              yellow-star houses (79%) were no longer legal Jewish residences by 10 December.
              District VI kept 4 of 331; VII kept 162 of 478. If emptied addresses are scored
              zero, city-wide mean composite is 0.16. Boundary maps show two polygons. The
              index shows the rest of Budapest going dark.
            </li>
          </ul>
        </section>

        <div className="op-grid op-grid-3">
          <section>
            <h2>Outputs delivered</h2>
            <ul>
              <li>Interactive atlas of accessibility change, six regimes, June vs sealed compare</li>
              <li>Working paper: method, findings, limits, HGIS ingest</li>
              <li>
                Findings presented to USC Shoah Foundation, Center for Advanced Genocide Research,
                12 March 2026
              </li>
              <li>
                IWitness companion module, “When the kitchen is close and there is still no food,”
                piloted with 186 students in 2026
              </li>
            </ul>
          </section>
          <section>
            <h2>What this added</h2>
            <p>
              Prior Holocaust geography reconstructed where boundaries ran and, in this case,
              how far a yellow-star resident could walk to a market in three hours. This project
              added a composite index, medical and work purposes, and the sealed month when
              markets stop being the right object. The result that cannot be read off a ghetto
              outline: proximity without permission, and permission without calories.
            </p>
          </section>
          <section>
            <h2>Partners</h2>
            <p>
              Historical GIS licensed from Tim Cole (Bristol) and Alberto Giordano (Texas State),
              Holocaust Geographies Collaborative. Research presentation at CAGR. Spatial method
              reviewed with USC Spatial Sciences Institute (Yao-Yi Chiang lab). Yellow-star
              address public history: Blinken OSA Archivum. Education loop: Shoah Foundation
              IWitness.
            </p>
          </section>
        </div>

        <footer className="op-foot">
          <span>Mapping Access Under Occupation · Budapest, March 1944–January 1945</span>
          <span>Completed 2026 · One city, not the Holocaust</span>
        </footer>
      </article>
    </main>
  );
}
