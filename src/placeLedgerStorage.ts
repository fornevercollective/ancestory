/**
 * Persistent Place Ledger for fast mapping iterations.
 *
 * Primary: IndexedDB ("ancestory-place-ledger-v1", store "places")
 * Fallback: localStorage JSON blob (same shape)
 *
 * Keys are normalized (lowercase, trimmed, commas collapsed).
 * Values carry coordinates + provenance so we can prefer user/Wikidata locks over fresh Nominatim.
 */

export type LatLng = { lat: number; lng: number };

export type PlaceSource = 'nominatim' | 'wikidata' | 'user' | 'import' | 'research';

export type PlaceEntry = {
  key: string;                 // normalized lowercased place string
  lat: number;
  lng: number;
  aliases?: string[];
  source?: PlaceSource;
  confidence?: number;         // 0-1
  notes?: string;
  updatedAt: number;
};

const DB_NAME = 'ancestory-place-ledger-v1';
const STORE = 'places';
const LS_KEY = 'ancestory-place-ledger-v1'; // fallback

let dbPromise: Promise<IDBDatabase | null> | null = null;
let usingFallback = false;

function normalizePlaceKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/(\s*,\s*)+/g, ', ')
    .replace(/^,\s*|,\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidLatLng(v: unknown): v is LatLng {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.lat === 'number' && Number.isFinite(o.lat) &&
    typeof o.lng === 'number' && Number.isFinite(o.lng)
  );
}

async function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'key' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        usingFallback = true;
        resolve(null);
      };
    } catch {
      usingFallback = true;
      resolve(null);
    }
  }).catch(() => {
    usingFallback = true;
    return null;
  });

  return dbPromise;
}

// ---------- Fallback (localStorage) ----------
function readFallback(): Record<string, PlaceEntry> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, PlaceEntry> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && typeof v === 'object' && isValidLatLng(v) && typeof (v as any).updatedAt === 'number') {
        out[k] = v as PlaceEntry;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeFallback(map: Record<string, PlaceEntry>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

// ---------- Core ops ----------
async function idbGetAll(): Promise<Record<string, PlaceEntry>> {
  const db = await openDB();
  if (!db || usingFallback) return readFallback();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const arr = (req.result || []) as PlaceEntry[];
      const map: Record<string, PlaceEntry> = {};
      for (const e of arr) if (e?.key) map[e.key] = e;
      resolve(map);
    };
    req.onerror = () => resolve(readFallback());
  });
}

async function idbPut(entry: PlaceEntry): Promise<void> {
  const db = await openDB();
  if (!db || usingFallback) {
    const map = readFallback();
    map[entry.key] = entry;
    writeFallback(map);
    return;
  }

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      // degrade to fallback
      const map = readFallback();
      map[entry.key] = entry;
      writeFallback(map);
      resolve();
    };
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  if (!db || usingFallback) {
    const map = readFallback();
    delete map[key];
    writeFallback(map);
    return;
  }

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// ---------- Public API ----------
export { normalizePlaceKey };

export async function getPlaceLedger(): Promise<Record<string, PlaceEntry>> {
  return idbGetAll();
}

export async function getLedgerEntry(rawQuery: string): Promise<PlaceEntry | null> {
  const key = normalizePlaceKey(rawQuery);
  const ledger = await getPlaceLedger();
  return ledger[key] ?? null;
}

export async function lockPlaceInLedger(
  rawQuery: string,
  coord: LatLng,
  meta: Partial<Pick<PlaceEntry, 'aliases' | 'source' | 'confidence' | 'notes'>> = {}
): Promise<PlaceEntry> {
  const key = normalizePlaceKey(rawQuery);
  if (!key || !isValidLatLng(coord)) {
    throw new Error('Invalid place or coordinate');
  }

  const entry: PlaceEntry = {
    key,
    lat: coord.lat,
    lng: coord.lng,
    aliases: meta.aliases?.length ? meta.aliases.map(a => a.trim()).filter(Boolean) : undefined,
    source: meta.source ?? 'user',
    confidence: meta.confidence ?? 0.95,
    notes: meta.notes?.trim() || undefined,
    updatedAt: Date.now(),
  };

  await idbPut(entry);
  return entry;
}

export async function removeLedgerEntry(rawQuery: string): Promise<void> {
  const key = normalizePlaceKey(rawQuery);
  await idbDelete(key);
}

export async function clearPlaceLedger(): Promise<void> {
  const db = await openDB();
  if (!db || usingFallback) {
    localStorage.removeItem(LS_KEY);
    return;
  }
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function exportPlaceLedger(): Promise<PlaceEntry[]> {
  const map = await getPlaceLedger();
  return Object.values(map).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function importPlaceLedger(
  entries: PlaceEntry[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<void> {
  if (mode === 'replace') {
    await clearPlaceLedger();
  }
  for (const e of entries) {
    if (e?.key && isValidLatLng(e)) {
      await idbPut({
        ...e,
        updatedAt: e.updatedAt || Date.now(),
      });
    }
  }
}

/** Convenience: try to resolve a place string instantly from the ledger (no network). */
export async function lookupLedgerCoord(rawQuery: string): Promise<LatLng | null> {
  const hit = await getLedgerEntry(rawQuery);
  if (hit) return { lat: hit.lat, lng: hit.lng };
  return null;
}
