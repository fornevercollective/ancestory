import type { ABO, BloodStored } from "./bloodStorage";

/** Popular "blood type diet" framing — not supported by mainstream clinical nutrition evidence. */
export const BLOOD_DIET_EVIDENCE_DISCLAIMER =
  "The blood-type diet is a popular book idea, not a guideline major medical societies endorse for disease prevention. Treat as cultural / narrative context only.";

export const BLOOD_HEALTH_DISCLAIMER =
  "ABO/Rh does not predict your personal disease risk. Some population studies link blood groups to odds ratios for certain conditions; that is not a diagnosis. Use clinicians and screening appropriate to your history.";

const DIET_BY_ABO: Record<Exclude<ABO, "">, string> = {
  O: "Popular framing: high protein emphasis — lean meat, fish, and poultry; limit dairy and grains.",
  A: "Popular framing: mostly plant-forward diet; avoid or minimize red meat.",
  B: "Popular framing: omnivore pattern; meat allowed but less heavily emphasized than in the Type O narrative.",
  AB: "Popular framing: mixed omnivore pattern; meat not as central as in the Type O narrative.",
};

export function dietLoreLines(abo: ABO): string | null {
  if (!abo) return null;
  return DIET_BY_ABO[abo];
}

export function uniqueAbosFromMap(ids: string[], bloodMap: Record<string, BloodStored>): ABO[] {
  const seen = new Set<ABO>();
  const out: ABO[] = [];
  for (const id of ids) {
    const a = bloodMap[id]?.abo;
    if (!a || seen.has(a)) continue;
    seen.add(a);
    out.push(a);
  }
  return out;
}
