export type LatLng = { lat: number; lng: number };

const mem = new Map<string, LatLng | null>();
const SS_KEY = "ancestory-nominatim-v1";
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

function readDisk(): Record<string, LatLng | null> {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LatLng | null>;
  } catch {
    return {};
  }
}

function writeDisk(cache: Record<string, LatLng | null>) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(cache));
  } catch {
    /* quota */
  }
}

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/** Single place → coordinates (Nominatim). Cached in-memory and sessionStorage. */
export async function geocodePlace(
  query: string,
  signal?: AbortSignal
): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  const key = q.toLowerCase();
  if (mem.has(key)) return mem.get(key)!;

  const disk = readDisk();
  if (Object.prototype.hasOwnProperty.call(disk, key)) {
    const v = disk[key];
    mem.set(key, v);
    return v;
  }

  await throttle();
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({ format: "json", q, limit: "1" }).toString();

  const res = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json",
      "User-Agent": "ancestory/0.1 (private genealogy research; +https://openstreetmap.org/copyright)",
    },
  });
  if (!res.ok) {
    mem.set(key, null);
    disk[key] = null;
    writeDisk(disk);
    return null;
  }
  const data = (await res.json()) as { lat?: string; lon?: string }[];
  if (!data?.length || data[0].lat == null || data[0].lon == null) {
    mem.set(key, null);
    disk[key] = null;
    writeDisk(disk);
    return null;
  }
  const o: LatLng = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
  if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) {
    mem.set(key, null);
    disk[key] = null;
    writeDisk(disk);
    return null;
  }
  mem.set(key, o);
  disk[key] = o;
  writeDisk(disk);
  return o;
}

/** Geocode in order with rate limiting between requests. */
export async function geocodePlacesSequential(
  places: string[],
  signal?: AbortSignal
): Promise<(LatLng | null)[]> {
  const out: (LatLng | null)[] = [];
  for (const p of places) {
    if (signal?.aborted) break;
    try {
      out.push(await geocodePlace(p, signal));
    } catch {
      out.push(null);
    }
  }
  return out;
}
