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
  displaced?: boolean;
  detail: Record<"food" | "medical" | "work", PurposeDetail>;
};

export type HouseProps = {
  id: string;
  address: string;
  district: number;
  geocode: string;
  inPestGhetto: boolean;
  inInternational: boolean;
  displacedInSealed?: boolean;
  deltaYellowStarToSealed?: number;
  scores: Partial<Record<PeriodId, ScoreBlock>>;
};

export type SeriesPoint = {
  id: string;
  short: string;
  label: string;
  mean: number;
  n: number;
  nDisplaced: number;
};

export type DistrictRow = {
  district: number;
  nYellowStar: number;
  meanYellowStar: number | null;
  nSealed: number;
  meanSealed: number | null;
  nDisplaced: number;
};

export type Summary = {
  houses: number;
  streetMatched: number;
  matchRate: number;
  inPestGhetto: number;
  inInternational: number;
  series?: SeriesPoint[];
  districts?: DistrictRow[];
  periods: Record<string, PeriodStats | DeltaStats>;
  provenance: Record<string, string>;
};

export type PeriodStats = {
  n: number;
  nDisplaced?: number;
  meanComposite: number;
  meanIncludingDisplaced?: number;
  medianComposite: number;
  p10: number;
  p90: number;
  shareFoodNone: number;
  shareMedicalNone: number;
  foodBands: Record<string, number>;
};

export type DeltaStats = {
  meanCompositeDrop: number;
  percentDrop: number;
  nDisplaced?: number;
  shareDisplaced?: number;
  meanIncludingDisplaced?: number;
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
