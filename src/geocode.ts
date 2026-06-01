import {
  lookupLedgerCoord,
  lockPlaceInLedger,
  normalizePlaceKey,
  type LatLng,
  type PlaceEntry,
} from "./placeLedgerStorage";

export type { LatLng, PlaceEntry };
export { normalizePlaceKey, lockPlaceInLedger };

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

/** Single place → coordinates (Nominatim). Cached in-memory and sessionStorage.
 *  Ledger (IndexedDB/localStorage) is checked early and takes precedence for speed.
 */
export async function geocodePlace(
  query: string,
  signal?: AbortSignal
): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  const key = q.toLowerCase();

  if (mem.has(key)) return mem.get(key)!;

  // 1. Fast path: persistent Place Ledger (user-locked / research / imported coords)
  try {
    const ledgerHit = await lookupLedgerCoord(q);
    if (ledgerHit) {
      mem.set(key, ledgerHit);
      return ledgerHit;
    }
  } catch {
    /* ledger unavailable — continue to other caches */
  }

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

  // Auto-promote fresh Nominatim results into the persistent ledger (source-tagged).
  // This makes subsequent visits / scope changes / reloads instant for these places.
  // UI in later slices can let the user "lock" / override with higher confidence.
  void lockPlaceInLedger(q, o, { source: 'nominatim', confidence: 0.7 }).catch(() => {
    /* non-fatal */
  });

  return o;
}

/** Geocode in order with rate limiting between requests. */
export async function geocodePlacesSequential(
  places: string[],
  signal?: AbortSignal
): Promise<(LatLng | null)[]> {
  return geocodePlacesContrail(places, signal);
}

export type ContrailProgress = {
  index: number;
  total: number;
  coord: LatLng | null;
};

/**
 * Contrail-style lazy geocode (kbatch flowPath): one segment at a time in order.
 * Cached places resolve immediately; each step can extend the map polyline before the next fetch.
 */
export async function geocodePlacesContrail(
  places: string[],
  signal?: AbortSignal,
  onStep?: (progress: ContrailProgress) => void
): Promise<(LatLng | null)[]> {
  const out: (LatLng | null)[] = [];
  const total = places.length;
  for (let i = 0; i < places.length; i++) {
    if (signal?.aborted) break;
    let coord: LatLng | null = null;
    try {
      coord = await geocodePlace(places[i], signal);
    } catch {
      coord = null;
    }
    out.push(coord);
    onStep?.({ index: i, total, coord });
  }
  return out;
}

/* ------------------------------------------------------------------
 * Dev-only debugging helpers (available in browser console during `npm run dev`)
 * Usage example:
 *   await __ANCESTORY_LEDGER.lock("Paris, France", {lat:48.8566, lng:2.3522}, {source:'user', notes:'manual test'})
 *   await __ANCESTORY_LEDGER.get()
 *   // Then hard reload and geocode the same string — should be instant from ledger
 * ------------------------------------------------------------------ */
if (import.meta.env.DEV) {
  const w = window as any;
  w.__ANCESTORY_LEDGER = {
    lock: lockPlaceInLedger,
    get: async () => (await import('./placeLedgerStorage')).getPlaceLedger(),
    clear: async () => (await import('./placeLedgerStorage')).clearPlaceLedger(),
    normalize: normalizePlaceKey,
  };
  // Also expose the main geocode for easy testing
  w.__ANCESTORY_GEOCODE = geocodePlace;
}
