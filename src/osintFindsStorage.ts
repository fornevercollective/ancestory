const KEY = "ancestory-osint-finds";

export type OsintFind = {
  id: string;
  label: string;
  notes?: string;
  createdAt: number;
};

function load(): OsintFind[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is OsintFind =>
        x &&
        typeof x === "object" &&
        typeof (x as OsintFind).id === "string" &&
        typeof (x as OsintFind).label === "string"
    );
  } catch {
    return [];
  }
}

function save(list: OsintFind[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function readOsintFinds(): OsintFind[] {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function addOsintFind(label: string, notes?: string): OsintFind {
  const entry: OsintFind = {
    id: `find-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: label.trim(),
    notes: notes?.trim() || undefined,
    createdAt: Date.now(),
  };
  const next = [entry, ...load()];
  save(next);
  return entry;
}

export function removeOsintFind(id: string) {
  save(load().filter((f) => f.id !== id));
}

export function updateOsintFind(id: string, patch: Partial<Pick<OsintFind, "label" | "notes">>) {
  save(
    load().map((f) =>
      f.id === id
        ? {
            ...f,
            ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
            ...(patch.notes !== undefined ? { notes: patch.notes.trim() || undefined } : {}),
          }
        : f
    )
  );
}
