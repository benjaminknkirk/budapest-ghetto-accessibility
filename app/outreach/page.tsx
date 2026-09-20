import type { Metadata } from "next";
import Link from "next/link";
import summary from "@/public/data/summary.json";

export const metadata: Metadata = { title: "Outreach — Mapping Access Under Occupation" };

const drop = summary.periods.deltaYellowStarToSealed as {
  percentDrop: number;
  nDisplaced: number;
  shareDisplaced: number;
};

export default function OutreachPage() {
  const share = Math.round(drop.shareDisplaced * 100);
  return (
    <main className="page">
      <article className="paper">
        <p className="meta">Leave-behinds · send the atlas, not a concept note</p>
        <h1>Three emails this project is built to travel with</h1>
        <p>
          Each letter is short enough to send. Attach the URL once it is hosted, or the GitHub
          repo now. Do not attach a slide deck instead of the map.
        </p>

        <h2>1. Tim Cole and Alberto Giordano</h2>
        <p className="meta">
          a.giordano@txstate.edu · Tim.Cole@bristol.ac.uk · subject: Occupied-accessibility
          layer on the Budapest HGIS
        </p>
        <blockquote>
          I am building a bounded accessibility-index case on the Budapest ghetto — LUPTAI-style
          composite access to food, medical care, and work, with occupation modifiers (legal
          reach, leave-home window, destination capacity, walk speed) as the 1944 regimes change.
          I am not asking you to rebuild addresses. I would like to license the HGIS you already
          made and ingest it into an atlas that is running now on a public OSA reconstruction
          ({summary.houses} yellow-star addresses). The method is specified so your file can
          replace that layer without rewriting the index. Two results the reconstruction already
          shows, and that I would rather report from your points: (1) most of the June drop is
          the three-hour shopping window, before any wall; (2) after 10 December, walking-time
          bands to kitchens go up while the occupation-adjusted score collapses, and{" "}
          {share}% of June buildings are no longer legal residences. May I send a 15-minute
          walkthrough and the ingest spec?
        </blockquote>

        <h2>2. CAGR (research residency / seminar)</h2>
        <p className="meta">
          USC Shoah Foundation, Center for Advanced Genocide Research · subject: Budapest
          accessibility case, 12-minute briefing
        </p>
        <blockquote>
          The Holocaust Geographies Collaborative has already held residencies at CAGR. I have a
          bounded object those residencies can actually look at: one ghetto, 1944–45, an
          interactive atlas, a working paper, and a twelve-minute briefing. I am not proposing
          “GIS and the Holocaust.” I am proposing a quantitative layer on Cole and Giordano’s
          Budapest file — how practical access to food, doctors, and work moved as yellow-star
          houses became two ghettos and then a wall. I would like 20 minutes with staff who
          handle research residencies, and help locking a short list of Budapest testimonies in
          which food, a physician, a gate, or a yellow-star house is actually described, for the
          teaching module. The briefing script is here: the atlas, then the paradox (high
          walking-time band, 781 kcal), then the ask.
        </blockquote>

        <h2>3. Education / IWitness (Lesly and colleagues)</h2>
        <p className="meta">subject: One class module — when the kitchen is close and there is still no food</p>
        <blockquote>
          I have a single-class activity that uses a Budapest accessibility atlas and then a
          testimony, not a new platform. Students watch the index fall in June because Jews
          could leave home only three hours a day, then collapse in December because the
          hospitals were left outside the wall and individual cooking was banned. They then open
          one IWitness clip and mark one sentence the map can score and one it cannot. That is
          the whole module. If it is useful to Shoah Foundation education, I would rather put it
          on IWitness as an activity prompt with a link than build a portal. Happy to walk
          through it in 15 minutes.
        </blockquote>

        <p>
          Briefing script: <Link href="/briefing">/briefing</Link>. Teaching module:{" "}
          <Link href="/teach">/teach</Link>. Ingest spec: <Link href="/data">/data</Link>.
        </p>
      </article>
    </main>
  );
}
