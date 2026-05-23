import type { FamRec, IndiRec } from "./types";
import { birthYear, timeBandClass } from "./timeBands";
import { formatName, partnersForGeneticMap, type GeneticPartnerVia } from "./trace";
import type { PartnerOverlayMap } from "./partnerOverlayStorage";

export type PersonCardView = {
  id: string;
  name: string;
  sex: string;
  year?: number;
  deathYear?: number;
  bandClass: string;
  photoUrl?: string;
  birthPlace?: string;
  deathPlace?: string;
  lifePlaces: string[];
  occupations: string[];
  partners: { id: string; name: string; via: GeneticPartnerVia }[];
  tagline: string;
};

export function personCardView(
  id: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>,
  partnerOverlay?: PartnerOverlayMap
): PersonCardView | null {
  const rec = individuals[id];
  if (!rec) return null;
  const y = birthYear(rec);
  const dy = rec.dy;
  const lw = rec.lw ?? [];
  const bp = rec.bp?.trim();
  const dp = rec.dp?.trim();
  const parts: string[] = [];
  if (y != null) parts.push(String(y));
  if (dy != null) parts.push(String(dy));
  const yearSpan = parts.length ? parts.join(" – ") : "";
  const placeBit = bp || lw[0] || "";
  const tagline = [yearSpan, placeBit].filter(Boolean).join(" · ") || rec.c?.replace(/^@|@$/g, "") || id;

  return {
    id,
    name: formatName(id, individuals),
    sex: rec.s ?? "?",
    year: y,
    deathYear: dy,
    bandClass: timeBandClass(y),
    photoUrl: rec.p,
    birthPlace: bp,
    deathPlace: dp,
    lifePlaces: lw.filter(Boolean).slice(0, 6),
    occupations: (rec.occu ?? []).slice(0, 4),
    partners: partnersForGeneticMap(id, individuals, families, partnerOverlay).map((p) => ({
      id: p.id,
      name: formatName(p.id, individuals),
      via: p.via,
    })),
    tagline,
  };
}
