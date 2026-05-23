import type { IndiRec } from "./types";
import { birthYear } from "./timeBands";
import { formatName } from "./trace";
import type { StreamFlags } from "./throughlineStorage";
import type { StreamFanRow } from "./DualFanChart";

export type LayerCardEntry = {
  id: string;
  name: string;
  sortKey: string;
  letter: string;
  gen: number;
  streamIdx: number;
  streamLabel: string;
  year?: number;
  sex: string;
};

function sortLetter(name: string): string {
  const t = name.trim();
  if (!t) return "#";
  const c = t[0]!.toUpperCase();
  if (c >= "A" && c <= "Z") return c;
  return "#";
}

/** Flatten generational layer rows into an A–Z sortable list (Spotify-style index). */
export function flattenLayerCards(
  rows: StreamFanRow[],
  streamLabels: string[],
  individuals: Record<string, IndiRec>,
  streams: StreamFlags,
  dualMode: "pat-mat" | "pat-pat" | "quad"
): LayerCardEntry[] {
  const activeIdx: number[] = [];
  if (dualMode === "quad") {
    if (streams.pat) activeIdx.push(0);
    if (streams.mat) activeIdx.push(1);
    if (streams.patCompare) activeIdx.push(2);
    if (streams.matCompare) activeIdx.push(3);
  } else {
    if (streams.pat) activeIdx.push(0);
    if (dualMode === "pat-mat" && streams.mat) activeIdx.push(1);
    if (dualMode === "pat-pat" && streams.patCompare) activeIdx.push(1);
  }

  const out: LayerCardEntry[] = [];
  for (const row of rows) {
    for (const si of activeIdx) {
      const id = row.ids[si];
      if (!id || !individuals[id]) continue;
      const name = formatName(id, individuals);
      out.push({
        id,
        name,
        sortKey: name.toLowerCase(),
        letter: sortLetter(name),
        gen: row.gen,
        streamIdx: si,
        streamLabel: streamLabels[si] ?? `Stream ${si + 1}`,
        year: birthYear(individuals[id]),
        sex: individuals[id]?.s ?? "?",
      });
    }
  }

  const seen = new Set<string>();
  const deduped: LayerCardEntry[] = [];
  for (const e of out) {
    const key = `${e.id}::${e.streamIdx}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }

  deduped.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.gen - b.gen);
  return deduped;
}

export function groupByLetter(entries: LayerCardEntry[]): Map<string, LayerCardEntry[]> {
  const map = new Map<string, LayerCardEntry[]>();
  for (const e of entries) {
    const list = map.get(e.letter) ?? [];
    list.push(e);
    map.set(e.letter, list);
  }
  return map;
}

export const INDEX_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
