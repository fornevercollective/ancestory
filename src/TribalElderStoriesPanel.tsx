import { useCallback, useEffect, useState } from "react";
import {
  readElderStories,
  addElderStory,
  removeElderStory,
  type ElderStory,
} from "./tribalElderStorage";
import type { IndiRec } from "./types";
import { TRIBAL_ENTRIES } from "./worldDirectoryData";

type Props = {
  individuals: Record<string, IndiRec>;
  defaultTribalId?: string;
};

export function TribalElderStoriesPanel({ individuals, defaultTribalId }: Props) {
  const [stories, setStories] = useState<ElderStory[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    tribalId: defaultTribalId || "",
    title: "",
    content: "",
    source: "",
    period: "",
    language: "",
    themes: "",
    linkedAncestorId: "",
    sensitivityNote: "",
  });

  const refresh = useCallback(() => {
    setStories(readElderStories());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = () => {
    if (!form.tribalId || !form.title.trim() || !form.content.trim()) return;

    const tribal = TRIBAL_ENTRIES.find((t) => t.id === form.tribalId);

    addElderStory({
      tribalId: form.tribalId,
      tribalName: tribal?.endonym || form.tribalId,
      title: form.title.trim(),
      content: form.content.trim(),
      source: form.source.trim() || "Anonymous Elder",
      period: form.period.trim() || undefined,
      language: form.language.trim() || undefined,
      themes: form.themes ? form.themes.split(",").map((t) => t.trim()) : undefined,
      linkedAncestorIds: form.linkedAncestorId ? [form.linkedAncestorId] : undefined,
      sourceType: "elder",
      sensitivityNote: form.sensitivityNote.trim() || undefined,
    });

    // Reset form
    setForm({
      ...form,
      title: "",
      content: "",
      themes: "",
    });
    setShowForm(false);
    refresh();
  };

  return (
    <div className="panel" style={{ borderLeft: "4px solid #ff8a65" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Tribal Elder Stories — Preserving the Circles</div>
        <button className="btn btn-small" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Record Elder Story"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid var(--border)", borderRadius: 6 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <select
              value={form.tribalId}
              onChange={(e) => setForm({ ...form, tribalId: e.target.value })}
            >
              <option value="">Select tribe / people</option>
              {TRIBAL_ENTRIES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.endonym} ({t.macroRegion})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Story title or teaching name"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              placeholder="The story, memory, teaching, or fragment as shared..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Elder or circle who shared"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                placeholder="Period or era"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>

            <input
              type="text"
              placeholder="Language originally told in"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            />

            <input
              type="text"
              placeholder="Themes (comma separated: migration, kinship, ceremony...)"
              value={form.themes}
              onChange={(e) => setForm({ ...form, themes: e.target.value })}
            />

            <select
              value={form.linkedAncestorId}
              onChange={(e) => setForm({ ...form, linkedAncestorId: e.target.value })}
            >
              <option value="">Link to ancestor in tree (optional)</option>
              {Object.keys(individuals).slice(0, 30).map((id) => (
                <option key={id} value={id}>
                  {(individuals[id].n || id).replace(/\//g, "")}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Sensitivity note (optional) — e.g. 'For family only' or 'Public teaching'"
              value={form.sensitivityNote}
              onChange={(e) => setForm({ ...form, sensitivityNote: e.target.value })}
              rows={2}
            />

            <button className="btn" onClick={handleAdd} disabled={!form.tribalId || !form.title.trim() || !form.content.trim()}>
              Preserve This Story
            </button>
          </div>
          <div className="muted" style={{ fontSize: "0.7rem", marginTop: 8 }}>
            These stories strengthen the Oracle, Resonance matching, and Timeline. They are treated with care.
          </div>
        </div>
      )}

      {stories.length === 0 && !showForm && (
        <div className="muted" style={{ marginTop: 8 }}>
          No elder stories recorded yet. Use this space to help preserve what is fading.
        </div>
      )}

      {stories.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {stories.map((s) => (
            <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 4, padding: 10 }}>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: "0.9rem", margin: "4px 0", whiteSpace: "pre-wrap" }}>{s.content}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                {s.tribalName || s.tribalId} • Shared by {s.source} {s.period ? `(${s.period})` : ""}
                {s.language && ` • in ${s.language}`}
              </div>
              {s.themes && s.themes.length > 0 && (
                <div style={{ fontSize: "0.7rem", marginTop: 4, opacity: 0.6 }}>
                  Themes: {s.themes.join(", ")}
                </div>
              )}
              <button
                className="btn btn-small"
                style={{ marginTop: 6 }}
                onClick={() => {
                  removeElderStory(s.id);
                  refresh();
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
