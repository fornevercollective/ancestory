import type { IndiRec } from "./types";

/**
 * Collects all unique, non-empty place strings from a tree.
 * Sources: bp, dp, burp, lw[], and ev[].pl (marriage/divorce places).
 * This centralizes place discovery so the curation UI, bulk geocode, stats, etc. stay consistent.
 */
export function collectAllPlacesFromTree(
  individuals: Record<string, IndiRec>
): string[] {
  const set = new Set<string>();

  for (const rec of Object.values(individuals)) {
    if (!rec) continue;

    // Direct places
    if (rec.bp) set.add(rec.bp.trim());
    if (rec.dp) set.add(rec.dp.trim());
    if (rec.burp) set.add(rec.burp.trim());

    // Life waypoints
    if (Array.isArray(rec.lw)) {
      for (const p of rec.lw) {
        if (p && p.trim()) set.add(p.trim());
      }
    }

    // Family events (MARR / DIV places)
    if (Array.isArray(rec.ev)) {
      for (const e of rec.ev) {
        if (e?.pl && e.pl.trim()) set.add(e.pl.trim());
      }
    }
  }

  // Sort alphabetically for stable UI
  return Array.from(set)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Simple stats for a set of places vs the ledger.
 */
export type PlaceStats = {
  totalUnique: number;
  inLedger: number;
  missing: number;
  ledgerHitRate: number; // 0-100
};

export function computePlaceStats(
  allPlaces: string[],
  ledgerKeys: Set<string>
): PlaceStats {
  const total = allPlaces.length;
  let inLedger = 0;

  for (const p of allPlaces) {
    const key = p.toLowerCase().trim(); // matches normalizePlaceKey behavior
    if (ledgerKeys.has(key)) inLedger++;
  }

  const missing = total - inLedger;
  const rate = total > 0 ? Math.round((inLedger / total) * 100) : 0;

  return {
    totalUnique: total,
    inLedger,
    missing,
    ledgerHitRate: rate,
  };
}
