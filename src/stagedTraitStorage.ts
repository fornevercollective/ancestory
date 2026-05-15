/**
 * Browser-only staged phenotype + identity (not GEDCOM).
 * Life stages support narrative transitions (eyes, hair, gender journey).
 */

export const LIFE_STAGES = [
  { key: "baby", label: "Baby (≈0–2 yr)" },
  { key: "youngChild", label: "Young child" },
  { key: "puberty", label: "Puberty" },
  { key: "youngAdult", label: "Young adult" },
  { key: "adult", label: "Adult" },
] as const;

export type LifeStage = (typeof LIFE_STAGES)[number]["key"];

export type EyeTrait =
  | ""
  | "blue"
  | "brown"
  | "hazel"
  | "green"
  | "gray"
  | "amber"
  | "darkBrown"
  | "heterochromia"
  | "other";

export type HairTrait =
  | ""
  | "black"
  | "brown"
  | "auburn"
  | "blonde"
  | "red"
  | "gray"
  | "white"
  | "other";

/** Pronoun sets — inclusive defaults; not exhaustive of every community form. */
export type PronounsOption =
  | ""
  | "they"
  | "she"
  | "he"
  | "sheThey"
  | "heThey"
  | "xe"
  | "ey"
  | "fae"
  | "any"
  | "nameOnly"
  | "ask"
  | "unspecified";

export type GenderIdentity =
  | ""
  | "woman"
  | "man"
  | "nonbinary"
  | "twoSpirit"
  | "transfem"
  | "transmasc"
  | "genderfluid"
  | "agender"
  | "bigender"
  | "questioning"
  | "intersex"
  | "other";

export type StagedPhenotype = {
  eyes: Partial<Record<LifeStage, EyeTrait>>;
  hair: Partial<Record<LifeStage, HairTrait>>;
  pronouns?: PronounsOption;
  gender?: Partial<Record<LifeStage, GenderIdentity>>;
  /** Multi-valued attraction / orientation slugs (LGBTQIA+ inclusive list below). */
  orientations?: string[];
};

const KEY = (jsonUrl: string) => `ancestory-staged-traits-v1::${jsonUrl}`;

const STAGES = new Set<string>(LIFE_STAGES.map((s) => s.key));
const EYES = new Set<string>([
  "",
  "blue",
  "brown",
  "hazel",
  "green",
  "gray",
  "amber",
  "darkBrown",
  "heterochromia",
  "other",
]);
const HAIR = new Set<string>([
  "",
  "black",
  "brown",
  "auburn",
  "blonde",
  "red",
  "gray",
  "white",
  "other",
]);

const PRONOUNS = new Set<string>([
  "",
  "they",
  "she",
  "he",
  "sheThey",
  "heThey",
  "xe",
  "ey",
  "fae",
  "any",
  "nameOnly",
  "ask",
  "unspecified",
]);

const GENDER = new Set<string>([
  "",
  "woman",
  "man",
  "nonbinary",
  "twoSpirit",
  "transfem",
  "transmasc",
  "genderfluid",
  "agender",
  "bigender",
  "questioning",
  "intersex",
  "other",
]);

export const EYE_OPTIONS: { value: EyeTrait; label: string }[] = [
  { value: "", label: "—" },
  { value: "blue", label: "Blue" },
  { value: "brown", label: "Brown" },
  { value: "hazel", label: "Hazel" },
  { value: "green", label: "Green" },
  { value: "gray", label: "Gray" },
  { value: "amber", label: "Amber" },
  { value: "darkBrown", label: "Dark brown" },
  { value: "heterochromia", label: "Heterochromia" },
  { value: "other", label: "Other / mixed" },
];

export const HAIR_OPTIONS: { value: HairTrait; label: string }[] = [
  { value: "", label: "—" },
  { value: "black", label: "Black" },
  { value: "brown", label: "Brown" },
  { value: "auburn", label: "Auburn" },
  { value: "blonde", label: "Blonde" },
  { value: "red", label: "Red / ginger" },
  { value: "gray", label: "Gray" },
  { value: "white", label: "White" },
  { value: "other", label: "Other" },
];

export const PRONOUN_OPTIONS: { value: PronounsOption; label: string }[] = [
  { value: "", label: "—" },
  { value: "they", label: "They / them" },
  { value: "she", label: "She / her" },
  { value: "he", label: "He / him" },
  { value: "sheThey", label: "She / they" },
  { value: "heThey", label: "He / they" },
  { value: "xe", label: "Xe / xem" },
  { value: "ey", label: "Ey / em" },
  { value: "fae", label: "Fae / faer" },
  { value: "any", label: "Any / all pronouns" },
  { value: "nameOnly", label: "Use name only" },
  { value: "ask", label: "Ask me" },
  { value: "unspecified", label: "Prefer not to say" },
];

export const GENDER_OPTIONS: { value: GenderIdentity; label: string }[] = [
  { value: "", label: "—" },
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "twoSpirit", label: "Two-Spirit (2S)" },
  { value: "transfem", label: "Transfeminine spectrum" },
  { value: "transmasc", label: "Transmasculine spectrum" },
  { value: "genderfluid", label: "Genderfluid" },
  { value: "agender", label: "Agender" },
  { value: "bigender", label: "Bigender / multigender" },
  { value: "questioning", label: "Questioning / exploring" },
  { value: "intersex", label: "Intersex (identity)" },
  { value: "other", label: "Another label (notes)" },
];

export const ORIENTATION_OPTIONS: { slug: string; label: string }[] = [
  { slug: "lesbian", label: "Lesbian" },
  { slug: "gay", label: "Gay" },
  { slug: "bi", label: "Bisexual" },
  { slug: "pan", label: "Pansexual" },
  { slug: "ace", label: "Asexual spectrum" },
  { slug: "aro", label: "Aromantic spectrum" },
  { slug: "demi", label: "Demisexual / demiromantic" },
  { slug: "queer", label: "Queer" },
  { slug: "questioningAttraction", label: "Questioning (attraction)" },
  { slug: "straight", label: "Straight / heterosexual" },
  { slug: "fluid", label: "Fluid (orientation shifts over time)" },
  { slug: "poly", label: "Polyamorous / ethically non-mono" },
  { slug: "sapphic", label: "Sapphic / WLW" },
  { slug: "achillean", label: "Achillean / MLM" },
  { slug: "t4t", label: "T4T (trans-for-trans attraction)" },
  { slug: "preferNot", label: "Prefer not to say" },
];

const ORIENTATION_SLUGS = new Set(ORIENTATION_OPTIONS.map((o) => o.slug));

function normEye(v: unknown): EyeTrait {
  return typeof v === "string" && EYES.has(v) ? (v as EyeTrait) : "";
}

function normHair(v: unknown): HairTrait {
  return typeof v === "string" && HAIR.has(v) ? (v as HairTrait) : "";
}

function normPronouns(v: unknown): PronounsOption {
  return typeof v === "string" && PRONOUNS.has(v) ? (v as PronounsOption) : "";
}

function normGender(v: unknown): GenderIdentity {
  return typeof v === "string" && GENDER.has(v) ? (v as GenderIdentity) : "";
}

function normOrientations(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string") continue;
    const s = x.trim();
    if (!ORIENTATION_SLUGS.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function parseStaged(o: unknown): StagedPhenotype {
  const eyes: Partial<Record<LifeStage, EyeTrait>> = {};
  const hair: Partial<Record<LifeStage, HairTrait>> = {};
  const gender: Partial<Record<LifeStage, GenderIdentity>> = {};
  if (!o || typeof o !== "object") return { eyes, hair };
  const r = o as Record<string, unknown>;
  const ey = r.eyes;
  const ha = r.hair;
  const ge = r.gender;
  if (ey && typeof ey === "object") {
    for (const [k, v] of Object.entries(ey as Record<string, unknown>)) {
      if (!STAGES.has(k)) continue;
      const nv = normEye(v);
      if (nv) eyes[k as LifeStage] = nv;
    }
  }
  if (ha && typeof ha === "object") {
    for (const [k, v] of Object.entries(ha as Record<string, unknown>)) {
      if (!STAGES.has(k)) continue;
      const nv = normHair(v);
      if (nv) hair[k as LifeStage] = nv;
    }
  }
  if (ge && typeof ge === "object") {
    for (const [k, v] of Object.entries(ge as Record<string, unknown>)) {
      if (!STAGES.has(k)) continue;
      const nv = normGender(v);
      if (nv) gender[k as LifeStage] = nv;
    }
  }
  const pronouns = normPronouns(r.pronouns);
  const orientations = normOrientations(r.orientations);
  const out: StagedPhenotype = { eyes, hair };
  if (Object.keys(gender).length) out.gender = gender;
  if (pronouns) out.pronouns = pronouns;
  if (orientations.length) out.orientations = orientations;
  return out;
}

export function loadTraitMap(jsonUrl: string): Record<string, StagedPhenotype> {
  if (!jsonUrl) return {};
  try {
    const raw = localStorage.getItem(KEY(jsonUrl));
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, StagedPhenotype> = {};
    for (const [id, v] of Object.entries(o)) {
      if (!id.startsWith("@")) continue;
      out[id] = parseStaged(v);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveTraitMap(jsonUrl: string, map: Record<string, StagedPhenotype>): void {
  if (!jsonUrl) return;
  try {
    localStorage.setItem(KEY(jsonUrl), JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function eyeLabel(e: EyeTrait): string {
  return EYE_OPTIONS.find((x) => x.value === e)?.label ?? "—";
}

export function hairLabel(h: HairTrait): string {
  return HAIR_OPTIONS.find((x) => x.value === h)?.label ?? "—";
}

export function pronounsLabel(p: PronounsOption | undefined): string {
  if (!p) return "—";
  return PRONOUN_OPTIONS.find((x) => x.value === p)?.label ?? "—";
}

export function genderLabel(g: GenderIdentity): string {
  return GENDER_OPTIONS.find((x) => x.value === g)?.label ?? "—";
}

export function orientationLabels(slugs: string[] | undefined): string {
  if (!slugs?.length) return "—";
  return slugs
    .map((s) => ORIENTATION_OPTIONS.find((o) => o.slug === s)?.label ?? s)
    .join(" · ");
}

export function latestStagedEye(t: StagedPhenotype | undefined): EyeTrait {
  if (!t) return "";
  for (let i = LIFE_STAGES.length - 1; i >= 0; i--) {
    const k = LIFE_STAGES[i].key;
    const v = t.eyes[k];
    if (v) return v;
  }
  return "";
}

export function latestStagedHair(t: StagedPhenotype | undefined): HairTrait {
  if (!t) return "";
  for (let i = LIFE_STAGES.length - 1; i >= 0; i--) {
    const k = LIFE_STAGES[i].key;
    const v = t.hair[k];
    if (v) return v;
  }
  return "";
}

export function latestStagedGender(t: StagedPhenotype | undefined): GenderIdentity {
  if (!t?.gender) return "";
  for (let i = LIFE_STAGES.length - 1; i >= 0; i--) {
    const k = LIFE_STAGES[i].key;
    const v = t.gender[k];
    if (v) return v;
  }
  return "";
}

export function transitionChain(
  staged: Partial<Record<LifeStage, EyeTrait | HairTrait | GenderIdentity>>,
  labelFn: (v: string) => string
): string {
  const parts: string[] = [];
  for (const { key, label } of LIFE_STAGES) {
    const v = staged[key];
    if (!v) continue;
    parts.push(`${label.split("(")[0].trim()}: ${labelFn(v)}`);
  }
  return parts.length ? parts.join(" → ") : "—";
}

export function traitRecordIsEmpty(t: StagedPhenotype): boolean {
  return (
    Object.keys(t.eyes ?? {}).length === 0 &&
    Object.keys(t.hair ?? {}).length === 0 &&
    !t.pronouns &&
    (!t.gender || Object.keys(t.gender).length === 0) &&
    (!t.orientations || t.orientations.length === 0)
  );
}
