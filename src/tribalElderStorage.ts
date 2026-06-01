/**
 * Tribal Elder Stories Storage
 *
 * First-class system for preserving fading tribal knowledge, oral histories,
 * language fragments, ceremony notes, migration memories, and elder stories.
 *
 * This directly addresses the user's request for support around "tribal data
 * and their stories are fading with elders in circles/groups".
 *
 * These entries are treated as sacred but usable data:
 * - Feed the Ancestory Oracle (preservation insights)
 * - Strengthen Ancestral Resonance matching (story + language + tribal overlap)
 * - Appear on the Deep Narrative Timeline as "Living Knowledge" events
 * - Can be linked to people in the tree and to research proposals
 */

const KEY = "ancestory-tribal-elder-stories";

export type ElderStory = {
  id: string;
  /** The tribe or people this story belongs to (use ids from worldDirectoryData when possible) */
  tribalId: string;
  tribalName?: string; // human readable
  /** Short title for the story */
  title: string;
  /** The actual story, memory, teaching, or fragment */
  content: string;
  /** Who shared it (elder name, circle, or "Anonymous Elder") */
  source: string;
  /** Approximate or known date the story was recorded or refers to */
  period?: string;
  /** Language the story was originally told in */
  language?: string;
  /** Key themes (e.g. "migration", "kinship", "land", "ceremony", "star knowledge") */
  themes?: string[];
  /** Link to specific people in the tree (ids) */
  linkedAncestorIds?: string[];
  /** How this was captured */
  sourceType: "elder" | "community" | "user" | "proposal" | "imported";
  createdAt: number;
  /** Optional notes about sensitivity or permission */
  sensitivityNote?: string;
};

function load(): ElderStory[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is ElderStory => {
      return x && typeof x === "object" && typeof (x as any).id === "string";
    });
  } catch {
    return [];
  }
}

function save(list: ElderStory[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function readElderStories(): ElderStory[] {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function addElderStory(input: Omit<ElderStory, "id" | "createdAt">): ElderStory {
  const story: ElderStory = {
    ...input,
    id: `elder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  const next = [story, ...load()];
  save(next);
  return story;
}

export function removeElderStory(id: string) {
  save(load().filter((s) => s.id !== id));
}

export function updateElderStory(id: string, patch: Partial<ElderStory>) {
  save(
    load().map((s) =>
      s.id === id
        ? {
            ...s,
            ...patch,
          }
        : s
    )
  );
}

/** Convert elder stories into timeline-friendly events */
export function elderStoriesToTimelineEvents(stories: ElderStory[]) {
  return stories.map((s) => ({
    year: s.period ? parseInt(s.period) || -1000 : -1000,
    label: `${s.tribalName || s.tribalId} — ${s.title}`,
    category: "tribal" as const,
    description: s.content,
  }));
}
