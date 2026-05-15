import { formatBloodLabel, type BloodStored } from "./bloodStorage";
import {
  eyeLabel,
  genderLabel,
  hairLabel,
  latestStagedEye,
  latestStagedGender,
  latestStagedHair,
  orientationLabels,
  pronounsLabel,
  type EyeTrait,
  type GenderIdentity,
  type HairTrait,
  type LifeStage,
  type PronounsOption,
  type StagedPhenotype,
  transitionChain,
} from "./stagedTraitStorage";
import type { IndiRec } from "./types";
import { formatName } from "./trace";

export type PersonPhenoRow = {
  id: string;
  name: string;
  blood: string;
  eyeChain: string;
  hairChain: string;
  genderChain: string;
  pronouns: string;
  orientSummary: string;
  adultEye: EyeTrait;
  adultHair: HairTrait;
  adultGender: GenderIdentity;
  pronounsRaw: PronounsOption;
};

/** People in `ids` who have blood or any staged / identity field. */
export function lineagePhenotypeRows(
  ids: string[],
  individuals: Record<string, IndiRec>,
  bloodMap: Record<string, BloodStored>,
  traitMap: Record<string, StagedPhenotype>
): PersonPhenoRow[] {
  const out: PersonPhenoRow[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const b = bloodMap[id];
    const blood = b ? formatBloodLabel(b) : "";
    const tr = traitMap[id];
    const ae = latestStagedEye(tr);
    const ah = latestStagedHair(tr);
    const ag = latestStagedGender(tr);
    const pr = tr?.pronouns ?? ("" as PronounsOption);
    const hasBlood = Boolean(blood && blood !== "—");
    const hasTrait =
      tr &&
      (Object.keys(tr.eyes).length > 0 ||
        Object.keys(tr.hair).length > 0 ||
        Boolean(tr.pronouns) ||
        (tr.gender && Object.keys(tr.gender).length > 0) ||
        (tr.orientations && tr.orientations.length > 0));
    if (!hasBlood && !hasTrait) continue;
    out.push({
      id,
      name: formatName(id, individuals),
      blood: blood || "—",
      eyeChain: tr ? transitionChain(tr.eyes as Partial<Record<LifeStage, EyeTrait>>, (v) => eyeLabel(v as EyeTrait)) : "—",
      hairChain: tr
        ? transitionChain(tr.hair as Partial<Record<LifeStage, HairTrait>>, (v) => hairLabel(v as HairTrait))
        : "—",
      genderChain: tr?.gender
        ? transitionChain(tr.gender as Partial<Record<LifeStage, GenderIdentity>>, (v) =>
            genderLabel(v as GenderIdentity)
          )
        : "—",
      pronouns: pronounsLabel(pr),
      orientSummary: orientationLabels(tr?.orientations),
      adultEye: ae,
      adultHair: ah,
      adultGender: ag,
      pronounsRaw: pr,
    });
  }
  return out;
}

/** Count keyed by blood label (or "—") × adult eye label. */
export function countBloodByAdultEye(rows: PersonPhenoRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const blood = r.blood || "—";
    const eye = r.adultEye ? eyeLabel(r.adultEye) : "—";
    const k = `${blood} · ${eye}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function countAdultHair(rows: PersonPhenoRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const h = r.adultHair ? hairLabel(r.adultHair) : "—";
    m.set(h, (m.get(h) ?? 0) + 1);
  }
  return m;
}

export function countPronouns(rows: PersonPhenoRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const p = r.pronounsRaw ? pronounsLabel(r.pronounsRaw) : "—";
    m.set(p, (m.get(p) ?? 0) + 1);
  }
  return m;
}
