import type { Band, PeriodStats, Summary } from "./types";

export function periodStats(summary: Summary, id: string): PeriodStats | null {
  const block = summary.periods[id];
  if (!block || !("meanComposite" in block)) return null;
  return block;
}

export function dropLabel(summary: Summary): string {
  const d = summary.periods.deltaYellowStarToSealed;
  if (!d || !("percentDrop" in d)) return "";
  return `${d.percentDrop}%`;
}

export function romanDistrict(n: number): string {
  const map: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    5: "V",
    6: "VI",
    7: "VII",
    8: "VIII",
    9: "IX",
    10: "X",
    11: "XI",
    12: "XII",
    13: "XIII",
    14: "XIV",
  };
  return map[n] ?? String(n);
}

export function bandClass(band: Band | undefined): string {
  return `band band-${band ?? "none"}`;
}
