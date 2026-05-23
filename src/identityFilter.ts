/**
 * 2SLGBTQI+ identity filter genres — used to filter & sort tree search.
 * Always prioritizes *chosen* gender identity / orientation (from `traitMap`)
 * over birth-assigned `s` ("M" / "F" / "U") in the GED record.
 */

import {
  latestStagedGender,
  type GenderIdentity,
  type StagedPhenotype,
} from "./stagedTraitStorage";
import type { IndiRec } from "./types";

export type IdentityGenre =
  | "all"
  | "twoSpirit"
  | "transfem"
  | "transmasc"
  | "nonbinary"
  | "intersex"
  | "questioning"
  | "sapphic"
  | "achillean"
  | "bi"
  | "pan"
  | "ace"
  | "queer"
  | "straight"
  | "untagged";

export type IdentityGenreMeta = {
  id: IdentityGenre;
  label: string;
  short: string;
  icon: string;
  /** CSS gradient applied via data-identity-genre on <html>. */
  bg: string;
  accent: string;
};

/** Order matches the natural pride / 2SLGBTQI+ flow + a couple of utility genres at the end. */
export const IDENTITY_GENRES: IdentityGenreMeta[] = [
  {
    id: "all",
    label: "All identities",
    short: "All",
    icon: "✻",
    bg: "linear-gradient(160deg, #0d1117 0%, #131820 60%, #0d1117 100%)",
    accent: "#8ab4f8",
  },
  {
    id: "twoSpirit",
    label: "Two-Spirit (2S)",
    short: "2S",
    icon: "◐",
    bg: "linear-gradient(160deg, #1a1208 0%, #2a1b0a 50%, #0d1117 100%)",
    accent: "#f6c177",
  },
  {
    id: "sapphic",
    label: "Sapphic / WLW",
    short: "L",
    icon: "♀♀",
    bg: "linear-gradient(160deg, #1a0a18 0%, #2a0e2a 55%, #0d1117 100%)",
    accent: "#ec4899",
  },
  {
    id: "achillean",
    label: "Achillean / MLM",
    short: "G",
    icon: "♂♂",
    bg: "linear-gradient(160deg, #061522 0%, #0a2438 55%, #0d1117 100%)",
    accent: "#60a5fa",
  },
  {
    id: "bi",
    label: "Bisexual",
    short: "B",
    icon: "B",
    bg: "linear-gradient(160deg, #1a0a22 0%, #220a18 55%, #0d1117 100%)",
    accent: "#a78bfa",
  },
  {
    id: "pan",
    label: "Pansexual",
    short: "P",
    icon: "P",
    bg: "linear-gradient(160deg, #221806 0%, #0a1a22 55%, #0d1117 100%)",
    accent: "#fbbf24",
  },
  {
    id: "transfem",
    label: "Transfeminine spectrum",
    short: "T♀",
    icon: "T♀",
    bg: "linear-gradient(160deg, #0a1422 0%, #220a1a 55%, #0d1117 100%)",
    accent: "#f9a8d4",
  },
  {
    id: "transmasc",
    label: "Transmasculine spectrum",
    short: "T♂",
    icon: "T♂",
    bg: "linear-gradient(160deg, #220a1a 0%, #0a1422 55%, #0d1117 100%)",
    accent: "#7dd3fc",
  },
  {
    id: "nonbinary",
    label: "Non-binary",
    short: "NB",
    icon: "⚧",
    bg: "linear-gradient(160deg, #161606 0%, #060f22 55%, #0d1117 100%)",
    accent: "#fcd34d",
  },
  {
    id: "intersex",
    label: "Intersex",
    short: "I",
    icon: "I",
    bg: "linear-gradient(160deg, #220a0a 0%, #200a14 55%, #0d1117 100%)",
    accent: "#ffd54f",
  },
  {
    id: "ace",
    label: "Asexual spectrum",
    short: "A",
    icon: "A",
    bg: "linear-gradient(160deg, #050608 0%, #1a1620 60%, #0d1117 100%)",
    accent: "#9ca3af",
  },
  {
    id: "queer",
    label: "Queer (self-identified)",
    short: "Q",
    icon: "Q",
    bg: "linear-gradient(160deg, #0d1117 0%, #220a22 55%, #0d1117 100%)",
    accent: "#c084fc",
  },
  {
    id: "questioning",
    label: "Questioning",
    short: "?",
    icon: "?",
    bg: "linear-gradient(160deg, #0d1117 0%, #14202b 50%, #0d1117 100%)",
    accent: "#7dd3fc",
  },
  {
    id: "straight",
    label: "Straight / cis (GED only)",
    short: "—",
    icon: "—",
    bg: "linear-gradient(160deg, #0a0d11 0%, #11151b 60%, #0a0d11 100%)",
    accent: "#94a3b8",
  },
  {
    id: "untagged",
    label: "No identity tag yet",
    short: "○",
    icon: "○",
    bg: "linear-gradient(160deg, #0d1117 0%, #161b22 60%, #0d1117 100%)",
    accent: "#64748b",
  },
];

export function genreMeta(id: IdentityGenre): IdentityGenreMeta {
  return IDENTITY_GENRES.find((g) => g.id === id) ?? IDENTITY_GENRES[0];
}

/** Best-effort orientation/gender signal for a person. Always weights *chosen* identity over GED sex. */
export type IdentitySignal = {
  /** Self-chosen latest gender identity (may be ""). */
  chosenGender: GenderIdentity;
  /** Self-chosen orientation slugs. */
  orientations: ReadonlySet<string>;
  /** GED-assigned sex ("M" / "F" / "U" / other) — used only as fallback. */
  bornSex: string;
  /** True when this person has *any* explicit 2SLGBTQI+ identity / orientation tag. */
  hasTag: boolean;
};

export function identitySignal(
  id: string,
  individuals: Record<string, IndiRec>,
  traitMap: Record<string, StagedPhenotype>
): IdentitySignal {
  const trait = traitMap[id];
  const chosenGender = latestStagedGender(trait);
  const orientations = new Set(trait?.orientations ?? []);
  const bornSex = (individuals[id]?.s ?? "U").toUpperCase();
  const hasTag = Boolean(chosenGender) || orientations.size > 0;
  return { chosenGender, orientations, bornSex, hasTag };
}

const QUEER_GENDERS: GenderIdentity[] = [
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
];

const QUEER_ORIENTATIONS = new Set([
  "lesbian",
  "gay",
  "bi",
  "pan",
  "ace",
  "aro",
  "demi",
  "queer",
  "sapphic",
  "achillean",
  "t4t",
  "questioningAttraction",
  "fluid",
]);

/** True when person matches the given identity genre. Chosen identity wins; GED `s` only used for `straight` / `untagged` fallback. */
export function personMatchesGenre(sig: IdentitySignal, genre: IdentityGenre): boolean {
  if (genre === "all") return true;

  if (genre === "untagged") return !sig.hasTag;

  if (genre === "straight") {
    if (sig.hasTag) {
      const queerGender = QUEER_GENDERS.includes(sig.chosenGender);
      const queerOrient = [...sig.orientations].some((o) => QUEER_ORIENTATIONS.has(o));
      return !queerGender && !queerOrient && sig.bornSex !== "U";
    }
    return sig.bornSex === "M" || sig.bornSex === "F";
  }

  if (genre === "twoSpirit") return sig.chosenGender === "twoSpirit";
  if (genre === "transfem") return sig.chosenGender === "transfem";
  if (genre === "transmasc") return sig.chosenGender === "transmasc";
  if (genre === "nonbinary")
    return ["nonbinary", "agender", "bigender", "genderfluid"].includes(sig.chosenGender);
  if (genre === "intersex") return sig.chosenGender === "intersex";
  if (genre === "questioning")
    return sig.chosenGender === "questioning" || sig.orientations.has("questioningAttraction");

  if (genre === "sapphic") return sig.orientations.has("sapphic") || sig.orientations.has("lesbian");
  if (genre === "achillean")
    return sig.orientations.has("achillean") || sig.orientations.has("gay");
  if (genre === "bi") return sig.orientations.has("bi");
  if (genre === "pan") return sig.orientations.has("pan");
  if (genre === "ace") return sig.orientations.has("ace") || sig.orientations.has("demi");
  if (genre === "queer") return sig.orientations.has("queer") || sig.orientations.has("fluid");

  return false;
}

/** Sort weight — chosen-identity tagged people surface first, then GED-only matches. */
export function genreSortWeight(sig: IdentitySignal, genre: IdentityGenre): number {
  if (genre === "all") return sig.hasTag ? 0 : 1;
  if (!sig.hasTag) return 2;
  return 0;
}
