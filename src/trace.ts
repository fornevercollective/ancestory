import { partnerIdsFromOverlay, type PartnerOverlayMap } from "./partnerOverlayStorage";
import type { FamRec, IndiRec, TreePayload } from "./types";

export function fatherId(
  id: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>
): string | null {
  const p = individuals[id];
  if (!p?.c) return null;
  const h = families[p.c]?.h;
  return h || null;
}

export function motherId(
  id: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>
): string | null {
  const p = individuals[id];
  if (!p?.c) return null;
  const w = families[p.c]?.w;
  return w || null;
}

export function patriline(
  root: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>,
  maxGen = 5000
): string[] {
  const out: string[] = [];
  let cur: string | null = root;
  const seen = new Set<string>();
  while (cur && out.length < maxGen && !seen.has(cur)) {
    seen.add(cur);
    out.push(cur);
    cur = fatherId(cur, individuals, families);
  }
  return out;
}

export function matriline(
  root: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>,
  maxGen = 5000
): string[] {
  const out: string[] = [];
  let cur: string | null = root;
  const seen = new Set<string>();
  while (cur && out.length < maxGen && !seen.has(cur)) {
    seen.add(cur);
    out.push(cur);
    cur = motherId(cur, individuals, families);
  }
  return out;
}

/** All distinct ancestors of `root` (including root). */
export function ancestorSet(
  root: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>
): Set<string> {
  const acc = new Set<string>();
  const stack = [root];
  while (stack.length) {
    const id = stack.pop()!;
    if (acc.has(id)) continue;
    acc.add(id);
    const f = fatherId(id, individuals, families);
    const m = motherId(id, individuals, families);
    if (f) stack.push(f);
    if (m) stack.push(m);
  }
  return acc;
}

export function ancestorsByGeneration(
  root: string,
  data: TreePayload,
  maxGen = 100
): Map<number, string[]> {
  const { individuals, families } = data;
  const byGen = new Map<number, string[]>();
  let frontier = [root];
  byGen.set(0, [...frontier]);
  for (let g = 1; g <= maxGen && frontier.length; g++) {
    const next: string[] = [];
    for (const id of frontier) {
      const f = fatherId(id, individuals, families);
      const m = motherId(id, individuals, families);
      if (f) next.push(f);
      if (m) next.push(m);
    }
    const uniq = [...new Set(next)];
    if (uniq.length === 0) break;
    byGen.set(g, uniq);
    frontier = uniq;
  }
  return byGen;
}

export function formatName(id: string, individuals: Record<string, IndiRec>): string {
  const r = individuals[id];
  if (!r) return id;
  const raw = r.n || id;
  return raw.replace(/\//g, "").replace(/\s+/g, " ").trim() || id;
}

/**
 * Spouse / partner xrefs from each FAMS family (GED order, deduped).
 * Standard GEDCOM only records partners via marriage families — not unmarried partners unless modeled as custom events.
 */
export function spouseChainOrdered(
  pid: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>
): string[] {
  const famRefs = individuals[pid]?.m ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const fid of famRefs) {
    const f = families[fid];
    if (!f) continue;
    const other = f.h === pid ? f.w : f.w === pid ? f.h : "";
    if (!other || other === pid || seen.has(other)) continue;
    seen.add(other);
    out.push(other);
  }
  return out;
}

export type GeneticPartnerVia = "fams" | "note" | "local";

/** FAMS spouses, then GED `gp`, then optional browser overlay — any number of partners across sources. */
export function partnersForGeneticMap(
  pid: string,
  individuals: Record<string, IndiRec>,
  families: Record<string, FamRec>,
  browserOverlay?: PartnerOverlayMap
): { id: string; via: GeneticPartnerVia }[] {
  const out: { id: string; via: GeneticPartnerVia }[] = [];
  const seen = new Set<string>();
  for (const id of spouseChainOrdered(pid, individuals, families)) {
    if (!individuals[id]) continue;
    seen.add(id);
    out.push({ id, via: "fams" });
  }
  for (const id of individuals[pid]?.gp ?? []) {
    if (!id?.startsWith("@") || seen.has(id) || id === pid || !individuals[id]) continue;
    seen.add(id);
    out.push({ id, via: "note" });
  }
  for (const id of partnerIdsFromOverlay(browserOverlay, pid)) {
    if (!id?.startsWith("@") || seen.has(id) || id === pid || !individuals[id]) continue;
    seen.add(id);
    out.push({ id, via: "local" });
  }
  return out;
}
