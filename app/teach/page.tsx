import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Teaching module — Mapping Access Under Occupation" };

export default function TeachPage() {
  return (
    <main className="page">
      <article className="paper">
        <p className="meta">Education-facing output · IWitness companion, not a replacement</p>
        <h1>When the kitchen is close and there is still no food</h1>
        <p>
          Shoah Foundation’s mission is testimony, not GIS. This module exists only if it makes
          a ghetto’s spatial control legible to students who will then watch someone who lived
          it. It is sized for one class period plus a short IWitness assignment.
        </p>

        <h2>Learning aims</h2>
        <ol>
          <li>Students can tell the yellow-star-house regime from the sealed Pest ghetto.</li>
          <li>
            They can explain why a short walk to a resource can coexist with no practical access.
          </li>
          <li>
            They can use one survivor account to name a constraint the map only scores: fear,
            papers, hunger, weather, a gate.
          </li>
        </ol>

        <div className="lesson">
          <h3>0–10 min · Two maps, same city</h3>
          <p>
            Open the <Link href="/">atlas</Link> on 24 June. Residences are scattered. Destinations
            are city-scale. Ask: “If you have three hours, which of these halls can you reach?”
            Do not lecture LUPTAI. Let them feel the clock.
          </p>
        </div>
        <div className="lesson">
          <h3>10–25 min · Seal the ghetto</h3>
          <p>
            Advance to 10 December. The outline tightens; the hospitals sit just outside it.
            Click a house on Klauzál tér. Read the walking-time band and the food score aloud.
            Ask for a sentence that holds both numbers. The paradox is the lesson.
          </p>
        </div>
        <div className="lesson">
          <h3>25–40 min · Testimony</h3>
          <p>
            In IWitness, assign a Budapest testimony in which food, a doctor, a yellow-star
            house, or the ghetto wall is actually described. (CAGR can help lock a short list;
            Kitty Salsberg’s published memoir of being cold and hungry in the Pest ghetto is a
            public starting point if a testimony clip is not yet cleared.) Students highlight
            one sentence the index can score and one sentence it cannot.
          </p>
        </div>
        <div className="lesson">
          <h3>Take-home · 400 words</h3>
          <p>
            “Using the atlas and your testimony, explain how spatial control in Budapest in 1944
            was a timetable as well as a fence. Do not write about ‘the Holocaust’ in general.”
          </p>
        </div>

        <h2>Why this belongs with IWitness rather than instead of it</h2>
        <p>
          Redlands-style survivor-journey story maps are narrative. This is quantitative. The
          education gain is the friction between them. A student who has only heard “they were
          trapped in the ghetto” has a polygon. A student who has watched the index fall in June
          because of a shopping-hour decree, then collapse in December because a hospital was
          left outside the wall, has a mechanism. Testimony then returns the mechanism to a
          person.
        </p>
        <p>
          For Lesly and the education staff: this is one module, one city, one paradox. It can
          live as an IWitness activity prompt with a link to the atlas. It does not need a new
          platform.
        </p>
      </article>
    </main>
  );
}
