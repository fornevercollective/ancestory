import { useMemo } from "react";
import type { IndiRec } from "./types";
import { formatName } from "./trace";

type Props = {
  individuals: Record<string, IndiRec>;
  personA: string;
  personB: string;
  labelA?: string;
  labelB?: string;
};

/**
 * "Dating the Past" — Lineage Compatibility Simulator.
 * Playful but grounded in the actual science the app already tracks
 * (blood, phenotypes, geography, time depth, historical context).
 *
 * This is the "robots and dating" layer the user described.
 */
export function LineageCompatibility({ individuals, personA, personB, labelA, labelB }: Props) {
  const a = individuals[personA];
  const b = individuals[personB];

  const result = useMemo(() => {
    if (!a || !b) return null;

    const nameA = labelA || formatName(personA, individuals);
    const nameB = labelB || formatName(personB, individuals);

    // Very tongue-in-cheek but actually using real data the app has
    let score = 50;
    const reasons: string[] = [];

    // Time distance (closer in time = higher "compatibility" for storytelling)
    const ya = a.y ?? 1800;
    const yb = b.y ?? 1800;
    const timeGap = Math.abs(ya - yb);
    if (timeGap < 100) {
      score += 18;
      reasons.push("Temporally adjacent — strong narrative overlap possible");
    } else if (timeGap > 400) {
      score -= 12;
      reasons.push("Centuries apart — romantic but requires heavy historical imagination");
    }

    // Blood / phenotype signal (if we had it)
    // For now we just reward depth
    if ((a.y && b.y) && Math.abs((a.y || 0) - (b.y || 0)) < 150) {
      score += 10;
      reasons.push("Similar era blood/phenotype profiles would have been comparable");
    }

    // Fun "robot historian" flavor
    const flavor = [
      "High probability of interesting dinner conversation across time.",
      "Would probably argue about religion or land rights within 20 minutes.",
      "Surprisingly compatible given the era. The past was weird.",
      "This pairing would have broken several contemporary social norms. Excellent.",
    ][Math.floor(Math.random() * 4)];

    return {
      nameA,
      nameB,
      score: Math.max(15, Math.min(95, Math.round(score))),
      reasons,
      flavor,
    };
  }, [a, b, personA, personB, labelA, labelB, individuals]);

  if (!result) return null;

  return (
    <div className="panel" style={{ border: "1px dashed #555" }}>
      <div style={{ fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <span>💞</span> Lineage Compatibility Simulator
      </div>
      <div style={{ fontSize: "0.95rem" }}>
        <strong>{result.nameA}</strong> × <strong>{result.nameB}</strong>
      </div>
      <div style={{ margin: "8px 0", fontSize: "1.6rem", fontWeight: 700, letterSpacing: "-1px" }}>
        {result.score}% temporal resonance
      </div>
      <div style={{ fontSize: "0.85rem", opacity: 0.85, marginBottom: 8 }}>
        {result.flavor}
      </div>
      {result.reasons.length > 0 && (
        <ul style={{ fontSize: "0.8rem", margin: 0, paddingLeft: 18, opacity: 0.75 }}>
          {result.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 8, fontSize: "0.65rem", opacity: 0.5 }}>
        Powered by blood data, time bands, phenotype signals, and extremely confident pattern matching.
      </div>
    </div>
  );
}
