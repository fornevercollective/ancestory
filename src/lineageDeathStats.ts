import type { IndiRec } from "./types";

export type DeathAgeBucket =
  | "infant_lt2"
  | "child_2_17"
  | "adult_18_39"
  | "mid_40_64"
  | "senior_65_79"
  | "long_80p"
  | "unknown";

export type LineageDeathRollup = {
  nIds: number;
  withBothYears: number;
  unknownAge: number;
  buckets: Record<DeathAgeBucket, number>;
  /** Normalized free-text DEAT.CAUSE counts (when exported) */
  causeCounts: Map<string, number>;
  sampleCauses: string[];
};

function ageAtDeath(r: IndiRec): number | null {
  if (r.y == null || r.dy == null) return null;
  const a = r.dy - r.y;
  if (!Number.isFinite(a) || a < 0 || a > 120) return null;
  return a;
}

function bucketForAge(a: number): DeathAgeBucket {
  if (a < 2) return "infant_lt2";
  if (a < 18) return "child_2_17";
  if (a < 40) return "adult_18_39";
  if (a < 65) return "mid_40_64";
  if (a < 80) return "senior_65_79";
  return "long_80p";
}

function normCause(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 120).toLowerCase();
}

const BUCKET_LABEL: Record<DeathAgeBucket, string> = {
  infant_lt2: "Died under 2 (possible infant mortality)",
  child_2_17: "Age 2–17",
  adult_18_39: "Age 18–39",
  mid_40_64: "Age 40–64",
  senior_65_79: "Age 65–79",
  long_80p: "Age 80+",
  unknown: "Age at death unknown (missing birth or death year)",
};

export function rollupLineageDeaths(ids: string[], individuals: Record<string, IndiRec>): LineageDeathRollup {
  const buckets: Record<DeathAgeBucket, number> = {
    infant_lt2: 0,
    child_2_17: 0,
    adult_18_39: 0,
    mid_40_64: 0,
    senior_65_79: 0,
    long_80p: 0,
    unknown: 0,
  };
  const causeCounts = new Map<string, number>();
  let withBothYears = 0;

  for (const id of ids) {
    const r = individuals[id];
    if (!r) continue;
    const a = ageAtDeath(r);
    if (a == null) {
      buckets.unknown += 1;
    } else {
      withBothYears += 1;
      buckets[bucketForAge(a)] += 1;
    }
    const dc = r.dc?.trim();
    if (dc) {
      const k = normCause(dc);
      if (k) causeCounts.set(k, (causeCounts.get(k) ?? 0) + 1);
    }
  }

  const sampleCauses = [...causeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, n]) => `${k} (${n})`);

  return {
    nIds: ids.length,
    withBothYears,
    unknownAge: buckets.unknown,
    buckets,
    causeCounts,
    sampleCauses,
  };
}

const BUCKET_ORDER: DeathAgeBucket[] = [
  "infant_lt2",
  "child_2_17",
  "adult_18_39",
  "mid_40_64",
  "senior_65_79",
  "long_80p",
];

export type BucketPct = {
  bucket: DeathAgeBucket;
  shortLabel: string;
  count: number;
  pct: number;
};

const SHORT: Record<DeathAgeBucket, string> = {
  infant_lt2: "<2 yr",
  child_2_17: "2–17",
  adult_18_39: "18–39",
  mid_40_64: "40–64",
  senior_65_79: "65–79",
  long_80p: "80+",
  unknown: "?",
};

/** Percentages of known-age-at-death individuals per bucket (sums to ~100). */
export function deathAgeBucketPercentages(rollup: LineageDeathRollup): BucketPct[] {
  const d = rollup.withBothYears;
  if (d <= 0) return [];
  const out: BucketPct[] = [];
  for (const b of BUCKET_ORDER) {
    const count = rollup.buckets[b];
    if (count === 0) continue;
    out.push({
      bucket: b,
      shortLabel: SHORT[b],
      count,
      pct: Math.round((100 * count) / d),
    });
  }
  return out;
}

/** Coarse “profile %” from death ages only — not genetics. */
export function lineageMortalityProfilePct(rollup: LineageDeathRollup): {
  earlyLoss: number;
  midLife: number;
  lateLife: number;
  denom: number;
} {
  const d = rollup.withBothYears;
  if (d <= 0) return { earlyLoss: 0, midLife: 0, lateLife: 0, denom: 0 };
  const early =
    rollup.buckets.infant_lt2 + rollup.buckets.child_2_17 + rollup.buckets.adult_18_39;
  const mid = rollup.buckets.mid_40_64;
  const late = rollup.buckets.senior_65_79 + rollup.buckets.long_80p;
  return {
    earlyLoss: Math.round((100 * early) / d),
    midLife: Math.round((100 * mid) / d),
    lateLife: Math.round((100 * late) / d),
    denom: d,
  };
}

/** Combined pat + mat for a single “tree-wide” death-age profile. */
export function mergeRollups(a: LineageDeathRollup, b: LineageDeathRollup): LineageDeathRollup {
  const buckets = { ...a.buckets };
  for (const k of BUCKET_ORDER) {
    buckets[k] = (buckets[k] ?? 0) + b.buckets[k];
  }
  buckets.unknown = a.buckets.unknown + b.buckets.unknown;
  const causeCounts = new Map<string, number>(a.causeCounts);
  for (const [k, v] of b.causeCounts) {
    causeCounts.set(k, (causeCounts.get(k) ?? 0) + v);
  }
  const sampleCauses = [...causeCounts.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 12)
    .map(([k, n]) => `${k} (${n})`);
  return {
    nIds: a.nIds + b.nIds,
    withBothYears: a.withBothYears + b.withBothYears,
    unknownAge: a.unknownAge + b.unknownAge,
    buckets,
    causeCounts,
    sampleCauses,
  };
}

const PRECURSOR_RULES: { re: RegExp; msg: string }[] = [
  {
    re: /\b(heart|cardiac|angina|apoplexy|stroke|cerebral)\b/i,
    msg: "Cardiovascular or stroke-like wording appears in some death causes — reflects historical diagnoses, not your arteries today.",
  },
  {
    re: /\b(tb|tuberculosis|consumption|phthisis)\b/i,
    msg: "Tuberculosis / “consumption” language appears — common in 19th-century registers before antibiotics.",
  },
  {
    re: /\b(cancer|carcinoma|tumor|tumour|malignant)\b/i,
    msg: "Cancer-related wording appears — modern cancer risk is not inferred from ancestors’ death certificates.",
  },
  {
    re: /\b(fever|typhoid|influenza|flu|pneumonia|cholera|smallpox|diphtheria|measles|scarlet)\b/i,
    msg: "Infectious disease terms appear — often era-specific; not a forecast of your immune profile.",
  },
  {
    re: /\b(childbirth|puerperal|labor|labour)\b/i,
    msg: "Maternal or childbirth-related causes appear — historical obstetric risk, not a predictor for descendants.",
  },
  {
    re: /\b(accident|drown|fall|injury|wound|killed|battle|war)\b/i,
    msg: "Accident or violence wording appears — environmental or historical events, not inherited “proclivity.”",
  },
];

export function precursorHintsFromRollup(rollup: LineageDeathRollup): string[] {
  const corpus = [...rollup.causeCounts.keys()].join(" | ");
  if (!corpus.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { re, msg } of PRECURSOR_RULES) {
    if (re.test(corpus) && !seen.has(msg)) {
      seen.add(msg);
      out.push(msg);
    }
  }
  return out;
}

export function formatBucketLine(rollup: LineageDeathRollup): string[] {
  const order = BUCKET_ORDER;
  const lines: string[] = [];
  for (const b of order) {
    const n = rollup.buckets[b];
    if (n > 0) lines.push(`${BUCKET_LABEL[b]}: ${n}`);
  }
  if (rollup.buckets.unknown > 0) {
    lines.push(`${BUCKET_LABEL.unknown}: ${rollup.buckets.unknown}`);
  }
  return lines;
}
