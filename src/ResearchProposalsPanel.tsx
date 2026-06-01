import { useCallback, useEffect, useState } from "react";
import {
  readResearchProposals,
  updateProposalStatus,
  removeResearchProposal,
  type ResearchProposal,
} from "./researchEnrichmentsStorage";
import { lockPlaceInLedger } from "./placeLedgerStorage";
import { geocodePlace } from "./geocode";

export function ResearchProposalsPanel() {
  const [proposals, setProposals] = useState<ResearchProposal[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  const refresh = useCallback(() => {
    setProposals(readResearchProposals());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAccept = async (p: ResearchProposal) => {
    const e = p.extracted;

    // If we have coords, lock them
    if (e.coords) {
      try {
        await lockPlaceInLedger(
          e.bp || e.dp || p.linkedPerson || "research place",
          e.coords,
          { source: "research", notes: p.sourceUrl }
        );
      } catch {}
    } else {
      // Try to geocode birth or death place from the proposal and lock it
      const placeToGeocode = e.bp || e.dp || e.burp;
      if (placeToGeocode) {
        try {
          const coord = await geocodePlace(placeToGeocode);
          if (coord) {
            await lockPlaceInLedger(placeToGeocode, coord, {
              source: "research",
              notes: `From ${p.source} — ${p.sourceUrl}`,
            });
          }
        } catch {}
      }
    }

    updateProposalStatus(p.id, "accepted");
    refresh();
    setStatusMsg(`Accepted proposal from ${p.source}. Place(s) added to ledger where possible.`);
    setTimeout(() => setStatusMsg(""), 2800);
  };

  const handleDismiss = (id: string) => {
    updateProposalStatus(id, "dismissed");
    refresh();
  };

  const handleDelete = (id: string) => {
    removeResearchProposal(id);
    refresh();
  };

  if (proposals.length === 0) return null;

  return (
    <details className="panel" open={false}>
      <summary style={{ fontWeight: 600 }}>
        Research Proposals ({proposals.filter((p) => p.status === "proposed").length} active)
      </summary>

      <div style={{ marginTop: "0.5rem" }}>
        {statusMsg && <div style={{ color: "#4ade80", marginBottom: 8 }}>{statusMsg}</div>}

        <div style={{ maxHeight: 380, overflow: "auto" }}>
          {proposals.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: 8,
                marginBottom: 6,
                background: p.status === "accepted" ? "rgba(74,222,128,0.08)" : undefined,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{p.source}</strong> — {p.linkedPerson || "Unknown person"}
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.7 }}>
                  {p.status}
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", margin: "4px 0" }}>
                {p.extracted.y && <span>b.{p.extracted.y} </span>}
                {p.extracted.dy && <span>d.{p.extracted.dy} </span>}
                {p.extracted.bp && <span>born {p.extracted.bp} </span>}
                {p.extracted.dp && <span>died {p.extracted.dp}</span>}
                {p.extracted.occu?.length && (
                  <span> · {p.extracted.occu.join(", ")}</span>
                )}
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {p.status === "proposed" && (
                  <>
                    <button className="btn btn-small" onClick={() => handleAccept(p)}>
                      Accept &amp; Lock Places (maps + timeline)
                    </button>
                    <button className="btn btn-small" onClick={() => handleDismiss(p.id)}>
                      Dismiss
                    </button>
                  </>
                )}
                <button className="btn btn-small" onClick={() => handleDelete(p.id)}>
                  Delete
                </button>
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-small"
                  style={{ textDecoration: "none" }}
                >
                  Source
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
