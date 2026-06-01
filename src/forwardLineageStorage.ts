/**
 * Forward Lineage Storage — first-class support for speculative future / off-world / multi-planetary connections.
 *
 * This is the "space forward travel and connection out of this planet" layer the user wants.
 * It lives alongside research proposals and the Place Ledger.
 *
 * Entries can come from:
 * - Manual user input (sci-fi storytelling)
 * - Research proposals tagged as "forward"
 * - AI/Oracle suggested branches (future)
 *
 * These feed the EventTimeline (as future events), the Oracle (future insights), and Ancestral Resonance (time-spanning matches).
 */

const KEY = "ancestory-forward-lineage";

export type ForwardConnection = {
  id: string;
  /** The ancestor this future branch descends from (tree id or name) */
  ancestorId: string;
  ancestorName?: string;
  /** Year or era (e.g. 2147, "Late 22nd Century", "Generation Ship Era") */
  year: string | number;
  /** Location / vessel / world */
  location: string; // "Mars Colony - Olympus Mons", "Generation Ship 'Endeavour'", "Kepler-442b Settlement"
  /** Type of connection */
  type: "planetary" | "generation_ship" | "exoplanet" | "orbital" | "other";
  /** Narrative / story for this future branch */
  story: string;
  /** Optional tags for resonance (e.g. ["tribal", "blood-type-O", "language-navajo"]) */
  resonanceTags?: string[];
  /** How this was created */
  source: "user" | "proposal" | "oracle" | "imported";
  createdAt: number;
  /** Optional link back to a research proposal that inspired this */
  inspiredByProposalId?: string;
};

function load(): ForwardConnection[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is ForwardConnection => {
      return x && typeof x === "object" && typeof (x as any).id === "string";
    });
  } catch {
    return [];
  }
}

function save(list: ForwardConnection[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function readForwardConnections(): ForwardConnection[] {
  return load().sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
}

export function addForwardConnection(
  input: Omit<ForwardConnection, "id" | "createdAt">
): ForwardConnection {
  const conn: ForwardConnection = {
    ...input,
    id: `forward-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  const next = [conn, ...load()];
  save(next);
  return conn;
}

export function removeForwardConnection(id: string) {
  save(load().filter((c) => c.id !== id));
}

export function updateForwardConnection(id: string, patch: Partial<ForwardConnection>) {
  save(
    load().map((c) =>
      c.id === id
        ? {
            ...c,
            ...patch,
          }
        : c
    )
  );
}

/** Helper: Turn forward connections into timeline-ready events */
export function forwardConnectionsToTimelineEvents(connections: ForwardConnection[]) {
  return connections.map((c) => ({
    year: typeof c.year === "number" ? c.year : parseInt(String(c.year)) || 2100,
    label: `${c.ancestorName || "Descendant"} — ${c.location}`,
    category: "space" as const,
    description: c.story,
  }));
}
