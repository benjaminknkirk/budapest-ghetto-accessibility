export type Purpose = "composite" | "food" | "medical" | "work";

export type PeriodId =
  | "occupation"
  | "yellow-star"
  | "arrow-cross"
  | "dual-ghetto"
  | "sealed"
  | "gates-cut";

export type Band = "high" | "medium" | "low" | "poor" | "none";

export type Period = {
  id: PeriodId;
  date: string;
  end: string;
  label: string;
  short: string;
  walkKmh: number;
  windowHours: number;
  permitReach: number;
  sealed: boolean;
  residences: string;
  foodMode: string;
  medicalMode: string;
  workMode: string;
  narrative: string;
};

export type PurposeDetail = {
  minutes: number;
  reach: number;
  window: number;
  capacity: number;
  score: number;
  band: Band;
  destination: string | null;
};

export type ScoreBlock = {
  composite: number;
  food: number;
  medical: number;
  work: number;
  detail: Record<"food" | "medical" | "work", PurposeDetail>;
};

export type HouseProps = {
  id: string;
  address: string;
  district: number;
  geocode: string;
  inPestGhetto: boolean;
  inInternational: boolean;
  scores: Partial<Record<PeriodId, ScoreBlock>>;
};

export type Summary = {
  houses: number;
  streetMatched: number;
  matchRate: number;
  inPestGhetto: number;
  inInternational: number;
  periods: Record<string, PeriodStats | { meanCompositeDrop: number; percentDrop: number }>;
  provenance: Record<string, string>;
};

export type PeriodStats = {
  n: number;
  meanComposite: number;
  medianComposite: number;
  p10: number;
  p90: number;
  shareFoodNone: number;
  shareMedicalNone: number;
  foodBands: Record<string, number>;
};

export const PURPOSE_LABEL: Record<Purpose, string> = {
  composite: "Composite",
  food: "Food",
  medical: "Medical",
  work: "Work",
};

export const BAND_LABEL: Record<Band, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  poor: "Poor",
  none: "None",
};
