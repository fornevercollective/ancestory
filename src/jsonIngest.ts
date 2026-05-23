export type SniffedKind = "tree" | "rulers";

export function sniffJsonKind(text: string): SniffedKind | null {
  try {
    const o = JSON.parse(text) as Record<string, unknown>;
    if (o.individuals && o.families && typeof o.individuals === "object" && typeof o.families === "object") {
      return "tree";
    }
    if (Array.isArray(o.people)) {
      return "rulers";
    }
  } catch {
    return null;
  }
  return null;
}

export function kindFromFilename(name: string): SniffedKind | null {
  const n = name.toLowerCase();
  if (n.includes("ruler")) return "rulers";
  if (n.includes("tree")) return "tree";
  return null;
}
