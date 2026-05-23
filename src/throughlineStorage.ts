const STREAM_KEY = "ancestory-throughline-streams";
const PIN_KEY = "ancestory-throughline-pins";

export type StreamFlags = {
  pat: boolean;
  mat: boolean;
  patCompare: boolean;
  matCompare: boolean;
};

const DEFAULT_STREAMS: StreamFlags = {
  pat: true,
  mat: true,
  patCompare: false,
  matCompare: false,
};

export function readStreamFlags(): StreamFlags {
  try {
    const raw = localStorage.getItem(STREAM_KEY);
    if (!raw) return { ...DEFAULT_STREAMS };
    const o = JSON.parse(raw) as Partial<StreamFlags>;
    return {
      pat: o.pat !== false,
      mat: o.mat !== false,
      patCompare: o.patCompare === true,
      matCompare: o.matCompare === true,
    };
  } catch {
    return { ...DEFAULT_STREAMS };
  }
}

export function writeStreamFlags(flags: StreamFlags) {
  localStorage.setItem(STREAM_KEY, JSON.stringify(flags));
}

export function readThroughlinePins(): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function writeThroughlinePins(pins: Set<string>) {
  localStorage.setItem(PIN_KEY, JSON.stringify([...pins]));
}

export function toggleThroughlinePin(id: string, pins: Set<string>): Set<string> {
  const next = new Set(pins);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  writeThroughlinePins(next);
  return next;
}
