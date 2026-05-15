/**
 * Browser-only genetic / sexual network edges (not GEDCOM).
 * Each entry can carry relation + notes for inclusive “sexual pedigree” storytelling
 * (maps still geocode by partner id only; labels can show your relation tag).
 */

export type PartnerEntry = {
  id: string;
  /** How you classify this connection for your research narrative */
  relation?: string;
  /** Free text: context, consent framing, time window, etc. */
  notes?: string;
};

export type PartnerOverlayMap = Record<string, PartnerEntry[]>;

const KEY = (jsonUrl: string) => `ancestory-partner-overlay-v1::${jsonUrl}`;

const XREF = /^@[^@\s]+@$/;

export function isPartnerXref(s: string): boolean {
  return XREF.test(s.trim());
}

export function normalizePartnerEntry(x: unknown): PartnerEntry | null {
  if (typeof x === "string") {
    const id = x.trim();
    return isPartnerXref(id) ? { id } : null;
  }
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    if (!isPartnerXref(id)) return null;
    const relation = typeof o.relation === "string" ? o.relation.trim().slice(0, 120) : undefined;
    const notes = typeof o.notes === "string" ? o.notes.trim().slice(0, 2000) : undefined;
    return {
      id,
      relation: relation || undefined,
      notes: notes || undefined,
    };
  }
  return null;
}

function normalizeList(raw: unknown): PartnerEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: PartnerEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const e = normalizePartnerEntry(item);
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

export function loadPartnerOverlay(jsonUrl: string): PartnerOverlayMap {
  if (!jsonUrl) return {};
  try {
    const raw = localStorage.getItem(KEY(jsonUrl));
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: PartnerOverlayMap = {};
    for (const [k, v] of Object.entries(o)) {
      if (!k.startsWith("@")) continue;
      const list = normalizeList(v);
      if (list.length) out[k] = list;
    }
    return out;
  } catch {
    return {};
  }
}

export function savePartnerOverlay(jsonUrl: string, map: PartnerOverlayMap): void {
  if (!jsonUrl) return;
  try {
    localStorage.setItem(KEY(jsonUrl), JSON.stringify(map));
  } catch {
    /* quota */
  }
}

/** Ordered partner ids for map / trace merge. */
export function partnerIdsFromOverlay(map: PartnerOverlayMap | undefined, personId: string): string[] {
  return (map?.[personId] ?? []).map((e) => normalizePartnerEntry(e)?.id).filter((x): x is string => Boolean(x));
}

export function localPartnerMeta(
  map: PartnerOverlayMap | undefined,
  personId: string,
  partnerId: string
): Pick<PartnerEntry, "relation" | "notes"> | undefined {
  const list = map?.[personId];
  if (!list) return;
  for (const raw of list) {
    const e = normalizePartnerEntry(raw);
    if (e?.id === partnerId) return { relation: e.relation, notes: e.notes };
  }
  return;
}

export const PARTNER_RELATION_PRESETS: { value: string; label: string }[] = [
  { value: "", label: "— (unspecified)" },
  { value: "spouse_like", label: "Spouse / long-term partner" },
  { value: "former_partner", label: "Former partner / ex" },
  { value: "coparent", label: "Co-parent" },
  { value: "genetic_parent", label: "Known genetic parent (non-FAMS)" },
  { value: "donor_surrogate", label: "Donor / surrogate context" },
  { value: "dating", label: "Dating / relationship" },
  { value: "fluid_network", label: "Fluid or overlapping connections" },
  { value: "other", label: "Other (see notes)" },
];
