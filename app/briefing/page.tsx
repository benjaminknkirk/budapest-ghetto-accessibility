import type { Metadata } from "next";
import Link from "next/link";
import summary from "@/public/data/summary.json";

export const metadata: Metadata = { title: "CAGR briefing — Mapping Access Under Occupation" };

const drop = summary.periods.deltaYellowStarToSealed as { percentDrop: number };

export default function BriefingPage() {
  return (
    <main className="page wide">
      <p className="kicker" style={{ marginBottom: "0.6rem" }}>
        Twelve minutes · USC Shoah Foundation, Center for Advanced Genocide Research
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          marginTop: 0,
        }}
      >
        Briefing: why an accessibility index belongs in Holocaust geography
      </h1>
      <p style={{ maxWidth: 720, opacity: 0.8, marginBottom: "1.6rem" }}>
        Speaker notes under each slide. Designed to be given in the CAGR seminar room with the
        atlas on a screen, not as a slide deck of bullet points about “GIS and the Holocaust.”
      </p>
      <div className="slides">
        <section className="slide">
          <div className="num">01 · 60 seconds</div>
          <h2>Open on the paradox, not the polygon</h2>
          <p>
            Show the sealed-ghetto view. Click a building near Klauzál tér. Walking-time band to
            food: High. Occupation-adjusted food score: near zero. Say: “This kitchen is 200
            metres away and the ration is 781 calories. A planning index that only measures
            walking time will call this well-served. The people inside it were starving.”
          </p>
        </section>
        <section className="slide">
          <div className="num">02 · 90 seconds</div>
          <h2>Name the case, and only the case</h2>
          <p>
            Budapest, 1944–45. Not “the Holocaust.” One city, two ghettos, six regimes. Cole and
            Giordano already built the GIS of residences. You are not offering to digitise
            addresses. You are offering a new analytical layer on a file CAGR’s network already
            knows.
          </p>
        </section>
        <section className="slide">
          <div className="num">03 · 2 minutes</div>
          <h2>LUPTAI, then the four modifiers</h2>
          <p>
            One sentence on Brisbane: origin-based walking bands, composite of purposes. Then:
            reach, window, capacity, speed. The 2–5 p.m. shopping rule is a frequency constraint,
            the same species of problem LUPTAI was invented for — except the “headway” is a
            racial decree. Cole and Giordano already proved the window mattered for markets. This
            project carries that logic to hospitals and to the month when markets stop counting.
          </p>
        </section>
        <section className="slide">
          <div className="num">04 · 2 minutes</div>
          <h2>Walk the time strip, June to January</h2>
          <p>
            Occupation → yellow-star (index falls because the day shrinks to three hours) → Arrow
            Cross → dual ghetto → sealed ({drop.percentDrop}% drop among remaining residences) →
            two gates locked. Zoom on Klauzál, then hit “June vs sealed.” Gold dots are still
            legal residences. Grey dots are the{" "}
            {Math.round(
              (summary.periods.deltaYellowStarToSealed as { shareDisplaced: number }).shareDisplaced *
                100,
            )}
            % of June buildings emptied into those two polygons. Say that number out loud.
            Boundary maps show the polygons. This shows the rest of the city going dark.
          </p>
        </section>
        <section className="slide">
          <div className="num">05 · 90 seconds</div>
          <h2>What testimony does that the grid cannot</h2>
          <p>
            The index will never feel like Kitty Salsberg’s “cold and hungry.” That is not a
            failure. It is the division of labour. CAGR’s collection is where capacity and fear
            become evidence. Flag the teaching module: students run the map, then a Budapest
            testimony in IWitness, then have to explain why “I could see the market” and “we had
            nothing to eat” are not a contradiction.
          </p>
        </section>
        <section className="slide">
          <div className="num">06 · 90 seconds</div>
          <h2>Institutional fit, said without overclaiming</h2>
          <p>
            Collaborative residencies at CAGR, 2014 and 2016. Yao-Yi Chiang’s lab already works
            with Shoah Foundation spatial testimony. This is a bounded object those two
            conversations can share: a method, a map, a paper, a classroom loop. Ask for a
            working session on HGIS ingest and on a short list of Budapest testimonies where
            food, doctors, or gates are actually described.
          </p>
        </section>
        <section className="slide">
          <div className="num">07 · 90 seconds · leave-behind</div>
          <h2>What you are asking for</h2>
          <ul>
            <li>A 20-minute follow-up with CAGR staff who handle research residencies.</li>
            <li>An introduction, if they are willing, back to Cole / Giordano for licensed HGIS use.</li>
            <li>
              A conversation with the education side (IWitness) about one module, not a portal.
            </li>
          </ul>
          <p>
            Leave the URL and the <Link href="/paper">working paper</Link>. Do not leave a
            concept note.
          </p>
        </section>
      </div>
    </main>
  );
}
