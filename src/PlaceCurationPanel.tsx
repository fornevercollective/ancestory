import { useCallback, useEffect, useMemo, useState } from "react";
import type { IndiRec } from "./types";
import {
  collectAllPlacesFromTree,
  computePlaceStats,
  type PlaceStats,
} from "./placeUtils";
import {
  geocodePlacesContrail,
  type LatLng,
} from "./geocode";
import {
  getPlaceLedger,
  lockPlaceInLedger,
  removeLedgerEntry,
  clearPlaceLedger,
  normalizePlaceKey,
  type PlaceEntry,
} from "./placeLedgerStorage";

type Props = {
  individuals: Record<string, IndiRec>;
  /** Optional: called when a place is locked/updated so maps can react if needed */
  onLedgerChange?: () => void;
};

type PlaceRow = {
  place: string;
  key: string;
  entry?: PlaceEntry;
};

export function PlaceCurationPanel({ individuals, onLedgerChange }: Props) {
  const [ledger, setLedger] = useState<Record<string, PlaceEntry>>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Record<string, { lat: string; lng: string }>>({});

  const allPlaces = useMemo(() => collectAllPlacesFromTree(individuals), [individuals]);

  const rows: PlaceRow[] = useMemo(() => {
    return allPlaces.map((place) => {
      const key = normalizePlaceKey(place);
      return {
        place,
        key,
        entry: ledger[key],
      };
    });
  }, [allPlaces, ledger]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.place.toLowerCase().includes(q) ||
      (r.entry?.notes?.toLowerCase().includes(q) ?? false)
    );
  }, [rows, query]);

  const stats: PlaceStats = useMemo(() => {
    const keys = new Set(Object.keys(ledger));
    return computePlaceStats(allPlaces, keys);
  }, [allPlaces, ledger]);

  const refreshLedger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlaceLedger();
      setLedger(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLedger();
  }, [refreshLedger]);

  const updateEditing = (key: string, field: "lat" | "lng", value: string) => {
    setEditing((prev) => ({
      ...prev,
      [key]: {
        lat: prev[key]?.lat ?? "",
        lng: prev[key]?.lng ?? "",
        [field]: value,
      },
    }));
  };

  const lockRow = async (row: PlaceRow) => {
    const edit = editing[row.key];
    const lat = edit?.lat ? parseFloat(edit.lat) : row.entry?.lat;
    const lng = edit?.lng ? parseFloat(edit.lng) : row.entry?.lng;

    if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStatus("Enter valid numbers for latitude and longitude.");
      return;
    }

    setLoading(true);
    setStatus(`Locking "${row.place}"…`);
    try {
      await lockPlaceInLedger(row.place, { lat, lng }, {
        source: "user",
        notes: row.entry?.notes,
      });
      await refreshLedger();
      onLedgerChange?.();
      setStatus(`Locked "${row.place}".`);
    } catch (e) {
      setStatus("Failed to lock place.");
    } finally {
      setLoading(false);
    }
  };

  const geocodeOne = async (row: PlaceRow) => {
    setLoading(true);
    setStatus(`Geocoding "${row.place}"…`);
    try {
      const results = await geocodePlacesContrail([row.place]);
      const coord = results[0];
      if (coord) {
        await lockPlaceInLedger(row.place, coord, { source: "user" });
        await refreshLedger();
        onLedgerChange?.();
        setStatus(`Geocoded and locked "${row.place}".`);
      } else {
        setStatus(`No coordinates found for "${row.place}".`);
      }
    } catch {
      setStatus("Geocoding failed.");
    } finally {
      setLoading(false);
    }
  };

  const removeRow = async (row: PlaceRow) => {
    if (!row.entry) return;
    setLoading(true);
    await removeLedgerEntry(row.place);
    await refreshLedger();
    onLedgerChange?.();
    setStatus(`Removed "${row.place}" from ledger.`);
    setLoading(false);
  };

  const geocodeMissing = async () => {
    const missing = rows.filter((r) => !r.entry);
    if (missing.length === 0) {
      setStatus("All places are already in the ledger.");
      return;
    }

    setLoading(true);
    setStatus(`Geocoding ${missing.length} missing places (this can take time)…`);

    const places = missing.map((r) => r.place);
    let done = 0;

    try {
      await geocodePlacesContrail(places, undefined, async ({ index, coord }) => {
        done = index + 1;
        setStatus(`Geocoding missing places: ${done}/${missing.length}…`);
        if (coord) {
          const p = places[index];
          await lockPlaceInLedger(p, coord, { source: "nominatim" }).catch(() => {});
        }
      });
      await refreshLedger();
      onLedgerChange?.();
      setStatus(`Finished. ${missing.length} places processed.`);
    } catch {
      setStatus("Geocoding batch stopped early.");
    } finally {
      setLoading(false);
    }
  };

  const clearNonUser = async () => {
    if (!confirm("Remove all non-user locked places from the ledger?")) return;
    setLoading(true);
    const toRemove = Object.values(ledger).filter((e) => e.source !== "user");
    for (const e of toRemove) {
      await removeLedgerEntry(e.key);
    }
    await refreshLedger();
    onLedgerChange?.();
    setStatus(`Cleared ${toRemove.length} non-user entries.`);
    setLoading(false);
  };

  return (
    <details className="panel" open={false}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>
        Place Ledger &amp; Curation — {stats.totalUnique} unique places • {stats.ledgerHitRate}% in ledger
        {loading && " (working…)"}
      </summary>

      <div style={{ marginTop: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <button onClick={geocodeMissing} disabled={loading}>
            Geocode all missing ({stats.missing})
          </button>
          <button onClick={clearNonUser} disabled={loading}>
            Clear non-user entries
          </button>
          <button onClick={refreshLedger} disabled={loading}>
            Refresh ledger
          </button>
          <input
            type="text"
            placeholder="Filter places…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
        </div>

        {status && <div className="muted" style={{ marginBottom: "0.5rem" }}>{status}</div>}

        <div style={{ fontSize: "0.85rem", maxHeight: 420, overflow: "auto", border: "1px solid var(--border)", borderRadius: 4 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--panel)" }}>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Place</th>
                <th style={{ width: 110 }}>Lat / Lng</th>
                <th style={{ width: 90 }}>Source</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted" style={{ padding: 8 }}>No matching places.</td>
                </tr>
              )}
              {filteredRows.map((row) => {
                const e = row.entry;
                const edit = editing[row.key] || { lat: e?.lat?.toString() ?? "", lng: e?.lng?.toString() ?? "" };
                return (
                  <tr key={row.key} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "4px 8px", verticalAlign: "top" }}>
                      <div>{row.place}</div>
                      {e?.notes && <div className="muted" style={{ fontSize: "0.75rem" }}>{e.notes}</div>}
                    </td>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace", fontSize: "0.8rem" }}>
                      <input
                        type="text"
                        value={edit.lat}
                        placeholder={e ? e.lat.toFixed(4) : "—"}
                        onChange={(ev) => updateEditing(row.key, "lat", ev.target.value)}
                        style={{ width: 70, marginRight: 4 }}
                      />
                      <input
                        type="text"
                        value={edit.lng}
                        placeholder={e ? e.lng.toFixed(4) : "—"}
                        onChange={(ev) => updateEditing(row.key, "lng", ev.target.value)}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                      {e ? (
                        <>
                          {e.source ?? "unknown"}
                          <div className="muted" style={{ fontSize: "0.65rem" }}>
                            {new Date(e.updatedAt).toLocaleDateString()}
                          </div>
                        </>
                      ) : (
                        <span className="muted">not locked</span>
                      )}
                    </td>
                    <td style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>
                      <button onClick={() => lockRow(row)} disabled={loading} style={{ marginRight: 4 }}>
                        {e ? "Update" : "Lock"}
                      </button>
                      <button onClick={() => geocodeOne(row)} disabled={loading} style={{ marginRight: 4 }}>
                        Geocode
                      </button>
                      {e && (
                        <button onClick={() => removeRow(row)} disabled={loading}>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="muted" style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
          Places come from birth, death, residences, burials, and marriage/divorce events in your tree.
          Locked coordinates are used instantly by all maps. User-locked entries are protected from bulk clear.
        </div>
      </div>
    </details>
  );
}
