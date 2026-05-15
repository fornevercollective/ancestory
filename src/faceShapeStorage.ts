export type FaceShape =
  | ""
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "diamond"
  | "rectangle"
  | "triangle";

const KEY = (jsonUrl: string) => `ancestory-face-v1::${jsonUrl}`;

const LABELS: Record<Exclude<FaceShape, "">, string> = {
  oval: "Oval — length > width; forehead wider than jaw",
  round: "Round — length ≈ width; soft curves",
  square: "Square — angular jaw; forehead, cheek, jaw similar width",
  heart: "Heart — wide forehead/cheekbones taper to narrow chin",
  diamond: "Diamond — narrow forehead & jaw; wide high cheekbones",
  rectangle: "Rectangle / oblong — long face, angular jaw",
  triangle: "Triangle / pear — narrow forehead, wider jaw",
};

export function faceShapeLabel(s: FaceShape): string {
  if (!s) return "—";
  return LABELS[s] ?? s;
}

const SHORT: Record<Exclude<FaceShape, "">, string> = {
  oval: "Oval",
  round: "Round",
  square: "Square",
  heart: "Heart",
  diamond: "Diamond",
  rectangle: "Oblong",
  triangle: "Triangle",
};

export function faceShapeShort(s: FaceShape): string {
  if (!s) return "";
  return SHORT[s] ?? s;
}

export function loadFaceMap(jsonUrl: string): Record<string, FaceShape> {
  try {
    const raw = localStorage.getItem(KEY(jsonUrl));
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    const allowed = new Set(["", "oval", "round", "square", "heart", "diamond", "rectangle", "triangle"]);
    const out: Record<string, FaceShape> = {};
    for (const [id, v] of Object.entries(o)) {
      if (!id.startsWith("@")) continue;
      const x = typeof v === "string" && allowed.has(v) ? (v as FaceShape) : "";
      if (x) out[id] = x;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveFaceMap(jsonUrl: string, map: Record<string, FaceShape>): void {
  try {
    localStorage.setItem(KEY(jsonUrl), JSON.stringify(map));
  } catch {
    /* quota */
  }
}
