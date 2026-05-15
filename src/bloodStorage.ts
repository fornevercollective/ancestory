export type ABO = "" | "A" | "B" | "AB" | "O";
export type Rh = "" | "+" | "-";

export type BloodStored = { abo: ABO; rh: Rh };

function key(jsonUrl: string): string {
  return `ancestory-blood-v1::${jsonUrl}`;
}

function normalize(raw: unknown): BloodStored {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const abo = o.abo;
  const rh = o.rh;
  const a = abo === "A" || abo === "B" || abo === "AB" || abo === "O" ? abo : "";
  const r = rh === "+" || rh === "-" ? rh : "";
  return { abo: a, rh: r };
}

export function loadBloodMap(jsonUrl: string): Record<string, BloodStored> {
  try {
    const raw = localStorage.getItem(key(jsonUrl));
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, BloodStored> = {};
    for (const [id, v] of Object.entries(o)) {
      if (!id.startsWith("@")) continue;
      out[id] = normalize(v);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveBloodMap(jsonUrl: string, map: Record<string, BloodStored>): void {
  try {
    localStorage.setItem(key(jsonUrl), JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function formatBloodLabel(b: BloodStored): string {
  if (!b.abo && !b.rh) return "—";
  if (b.abo && b.rh) return `${b.abo}${b.rh === "+" ? "+" : "−"}`;
  if (b.abo) return b.abo;
  return b.rh === "+" ? "Rh+" : "Rh−";
}
