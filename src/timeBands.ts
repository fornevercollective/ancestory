import type { IndiRec } from "./types";

/** Birth year from compact JSON (`y`), when present and plausible. */
export function birthYear(r: IndiRec | undefined): number | undefined {
  if (!r) return undefined;
  const y = r.y;
  if (typeof y !== "number" || !Number.isFinite(y)) return undefined;
  if (y < 400 || y > 2200) return undefined;
  return Math.round(y);
}

/**
 * CSS class for subtle row tint: changes with each decade; century nudges the
 * palette so long runs read as time moving backward.
 */
export function timeBandClass(y: number | undefined): string {
  if (y == null) return "time-unknown";
  const decade = Math.floor(y / 10);
  const century = Math.floor(y / 100);
  const idx = (century * 2 + (decade % 10) + (decade % 3)) % 12;
  return `time-${idx}`;
}

/** Representative year for a dual row (average when both known). */
export function rowRepresentativeYear(
  ly: number | undefined,
  ry: number | undefined
): number | undefined {
  if (ly != null && ry != null) return Math.round((ly + ry) / 2);
  return ly ?? ry;
}
