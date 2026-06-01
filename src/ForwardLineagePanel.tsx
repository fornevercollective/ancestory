import { useCallback, useEffect, useState } from "react";
import {
  readForwardConnections,
  addForwardConnection,
  removeForwardConnection,
  type ForwardConnection,
} from "./forwardLineageStorage";
import type { IndiRec } from "./types";

type Props = {
  individuals: Record<string, IndiRec>;
  /** Optional: prefill from a selected ancestor */
  defaultAncestorId?: string;
};

export function ForwardLineagePanel({ individuals, defaultAncestorId }: Props) {
  const [connections, setConnections] = useState<ForwardConnection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ancestorId: defaultAncestorId || "",
    year: "2147",
    location: "Mars Colony - Tharsis",
    type: "planetary" as ForwardConnection["type"],
    story: "",
  });

  const refresh = useCallback(() => {
    setConnections(readForwardConnections());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = () => {
    if (!form.ancestorId || !form.story.trim()) return;

    const ancestor = individuals[form.ancestorId];
    addForwardConnection({
      ancestorId: form.ancestorId,
      ancestorName: ancestor ? (ancestor.n || form.ancestorId).replace(/\//g, "") : undefined,
      year: form.year,
      location: form.location,
      type: form.type,
      story: form.story.trim(),
      source: "user",
      resonanceTags: [],
    });

    setForm({ ...form, story: "" });
    setShowForm(false);
    refresh();
  };

  return (
    <div className="panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Forward Lineage — Off-World &amp; Future Branches</div>
        <button className="btn btn-small" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Future Branch"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid var(--border)", borderRadius: 6 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <select
              value={form.ancestorId}
              onChange={(e) => setForm({ ...form, ancestorId: e.target.value })}
            >
              <option value="">Choose ancestor this branch descends from</option>
              {Object.keys(individuals).slice(0, 50).map((id) => (
                <option key={id} value={id}>
                  { (individuals[id].n || id).replace(/\//g, "") }
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Year or era (e.g. 2147 or 'Mid 23rd Century')"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />

            <input
              type="text"
              placeholder="Location (e.g. 'Mars - Olympus Mons Habitat', 'Generation Ship Persephone')"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="planetary">Planetary Colony</option>
              <option value="generation_ship">Generation Ship</option>
              <option value="exoplanet">Exoplanet Settlement</option>
              <option value="orbital">Orbital Habitat</option>
              <option value="other">Other</option>
            </select>

            <textarea
              placeholder="Narrative for this future branch... (the robot historian is listening)"
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
              rows={3}
            />

            <button className="btn" onClick={handleAdd} disabled={!form.ancestorId || !form.story.trim()}>
              Record Future Branch
            </button>
          </div>
          <div className="muted" style={{ fontSize: "0.75rem", marginTop: 6 }}>
            These speculative branches appear on the Deep Narrative Timeline and feed the Oracle and Resonance systems.
          </div>
        </div>
      )}

      {connections.length === 0 && !showForm && (
        <div className="muted" style={{ marginTop: 8 }}>
          No forward branches recorded yet. Add one to start writing the next chapters of the lineage.
        </div>
      )}

      {connections.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {connections.map((c) => (
            <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: 4, padding: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{c.ancestorName || c.ancestorId}</strong> → {c.location} ({c.year})
                </div>
                <button className="btn btn-small" onClick={() => { removeForwardConnection(c.id); refresh(); }}>
                  Remove
                </button>
              </div>
              <div style={{ fontSize: "0.9rem", marginTop: 4, opacity: 0.9 }}>{c.story}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: 4 }}>
                {c.type} • Recorded by {c.source}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
