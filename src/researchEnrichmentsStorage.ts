/**
 * Research Proposals / Enrichments storage.
 * Captures structured data scooped from Wikidata, Wikipedia, Find a Grave, etc.
 * Global (like OsintFinds) so it persists across trees, with optional linking.
 */

const KEY = "ancestory-research-proposals";

export type ResearchProposal = {
  id: string;
  sourceUrl: string;
  source: string; // "wikidata" | "wikipedia" | "findagrave" | ...
  extracted: {
    y?: string | number;      // birth year or full date
    dy?: string | number;     // death
    bp?: string;              // birth place
    dp?: string;
    burp?: string;            // burial
    occu?: string[];
    coords?: { lat: number; lng: number };
    notes?: string;
  };
  linkedPerson?: string;      // name or tree id hint
  status: "proposed" | "accepted" | "dismissed";
  createdAt: number;
};

function load(): ResearchProposal[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is ResearchProposal => {
      return (
        x &&
        typeof x === "object" &&
        typeof (x as any).id === "string" &&
        typeof (x as any).sourceUrl === "string"
      );
    });
  } catch {
    return [];
  }
}

function save(list: ResearchProposal[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

export function readResearchProposals(): ResearchProposal[] {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function addResearchProposal(
  input: Omit<ResearchProposal, "id" | "createdAt" | "status">
): ResearchProposal {
  const proposal: ResearchProposal = {
    ...input,
    id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    status: "proposed",
    createdAt: Date.now(),
  };
  const next = [proposal, ...load()];
  save(next);
  return proposal;
}

export function updateProposalStatus(
  id: string,
  status: ResearchProposal["status"],
  patch?: Partial<Pick<ResearchProposal, "linkedPerson" | "extracted">>
) {
  const list = load().map((p) => {
    if (p.id !== id) return p;
    return {
      ...p,
      status,
      ...(patch?.linkedPerson ? { linkedPerson: patch.linkedPerson } : {}),
      ...(patch?.extracted ? { extracted: { ...p.extracted, ...patch.extracted } } : {}),
    };
  });
  save(list);
}

export function removeResearchProposal(id: string) {
  save(load().filter((p) => p.id !== id));
}

export function clearResearchProposals() {
  localStorage.removeItem(KEY);
}

/** Helper to turn a proposal into a useful note string for GED or OsintFinds */
export function proposalToNote(proposal: ResearchProposal): string {
  const e = proposal.extracted;
  const parts: string[] = [];
  if (e.y) parts.push(`b. ${e.y}`);
  if (e.dy) parts.push(`d. ${e.dy}`);
  if (e.bp) parts.push(`born ${e.bp}`);
  if (e.dp) parts.push(`died ${e.dp}`);
  if (e.burp) parts.push(`buried ${e.burp}`);
  if (e.occu?.length) parts.push(e.occu.join(", "));
  const base = parts.join(" · ");
  return `${proposal.source.toUpperCase()}: ${base || "see " + proposal.sourceUrl}${e.notes ? " — " + e.notes : ""}`;
}
