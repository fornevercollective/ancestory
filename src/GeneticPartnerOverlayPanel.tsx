import { useEffect, useState } from "react";
import type { IndiRec } from "./types";
import { formatName } from "./trace";
import {
  isPartnerXref,
  normalizePartnerEntry,
  PARTNER_RELATION_PRESETS,
  type PartnerEntry,
  type PartnerOverlayMap,
} from "./partnerOverlayStorage";

type DualMode = "pat-mat" | "pat-pat" | "quad";

type Props = {
  rootId: string;
  compareRootId: string;
  dualMode: DualMode;
  individuals: Record<string, IndiRec>;
  partnerOverlay: PartnerOverlayMap;
  addPartner: (personId: string, partnerXref: string) => void;
  removePartner: (personId: string, index: number) => void;
  updatePartnerEntry: (personId: string, index: number, patch: Partial<Pick<PartnerEntry, "relation" | "notes">>) => void;
};

export function GeneticPartnerOverlayPanel({
  rootId,
  compareRootId,
  dualMode,
  individuals,
  partnerOverlay,
  addPartner,
  removePartner,
  updatePartnerEntry,
}: Props) {
  const showCompare = dualMode === "pat-pat" || dualMode === "quad";
  const [edPerson, setEdPerson] = useState(rootId);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setEdPerson((cur) => {
      if (cur === rootId || (showCompare && cur === compareRootId)) return cur;
      return rootId;
    });
  }, [rootId, compareRootId, showCompare]);

  const rootLabel = formatName(rootId, individuals);
  const compareLabel = formatName(compareRootId, individuals) || compareRootId;

  const list: PartnerEntry[] = (partnerOverlay[edPerson] ?? [])
    .map((x) => normalizePartnerEntry(x))
    .filter((x): x is PartnerEntry => Boolean(x));

  const tryAdd = () => {
    const id = draft.trim();
    if (!isPartnerXref(id)) return;
    if (!individuals[id]) return;
    if (id === edPerson) return;
    addPartner(edPerson, id);
    setDraft("");
  };

  return (
    <details className="partner-overlay-details">
      <summary>Genetic / sexual network — browser list (any number)</summary>
      <div className="partner-overlay-body">
        <p className="partner-overlay-lead">
          Add <span className="mono">@xref@</span> for people in this <span className="mono">tree.json</span>. Entries
          merge with <strong>FAMS</strong> and GED <span className="mono">ANCESTORY_GENETIC_PARTNER</span> for maps.
          Use <strong>relation</strong> + <strong>notes</strong> to record how each tie fits your inclusive sexual /
          genetic pedigree narrative (consent-aware; not automatic DNA math).
        </p>
        <div className="partner-overlay-row">
          <label className="partner-overlay-field">
            <span>Person to annotate</span>
            <select
              className="sel"
              value={edPerson}
              onChange={(e) => setEdPerson(e.target.value)}
              aria-label="Person whose extra partners you are editing"
            >
              <option value={rootId}>
                Root {rootId} — {rootLabel}
              </option>
              {showCompare && (
                <option value={compareRootId}>
                  Compare {compareRootId} — {compareLabel}
                </option>
              )}
            </select>
          </label>
        </div>
        {list.length > 0 ? (
          <ul className="partner-overlay-list partner-overlay-list--rich">
            {list.map((p, i) => (
              <li key={`${p.id}-${i}`} className="partner-overlay-li partner-overlay-li--rich">
                <div className="partner-overlay-li-top">
                  <span className="mono">{p.id}</span>
                  <span className="partner-overlay-name">{formatName(p.id, individuals)}</span>
                  <button type="button" className="linkbtn" onClick={() => removePartner(edPerson, i)}>
                    Remove
                  </button>
                </div>
                <label className="partner-overlay-sub">
                  <span>Relation tag</span>
                  <select
                    className="sel partner-overlay-rel-sel"
                    value={p.relation ?? ""}
                    onChange={(e) => updatePartnerEntry(edPerson, i, { relation: e.target.value || undefined })}
                  >
                    {PARTNER_RELATION_PRESETS.map((o) => (
                      <option key={o.value || "rel"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="partner-overlay-sub">
                  <span>Notes (context, time, consent framing)</span>
                  <textarea
                    className="inp partner-overlay-notes"
                    rows={2}
                    value={p.notes ?? ""}
                    placeholder="Optional — your research narrative only"
                    onChange={(e) => updatePartnerEntry(edPerson, i, { notes: e.target.value || undefined })}
                  />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted partner-overlay-empty">No browser-only partners for this person yet.</p>
        )}
        <div className="partner-overlay-add">
          <input
            className="inp mono partner-overlay-inp"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="@P9@"
            aria-label="Partner xref to add"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                tryAdd();
              }
            }}
          />
          <button type="button" className="btn btn-small" onClick={tryAdd}>
            Add partner
          </button>
        </div>
      </div>
    </details>
  );
}
