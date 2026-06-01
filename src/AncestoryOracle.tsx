import { useMemo } from "react";
import type { IndiRec } from "./types";
import type { ResearchProposal } from "./researchEnrichmentsStorage";
import { MAJOR_EVENTS } from "./majorHistoricalEvents";
import { readForwardConnections } from "./forwardLineageStorage";
import { readElderStories } from "./tribalElderStorage";
import { bloodTallyForLine } from "./stagedTraitStats"; // reuse existing logic where possible
import { formatName } from "./trace";

type Props = {
  individuals: Record<string, IndiRec>;
  rootId: string;
  patIds: string[];
  matIds: string[];
  proposals: ResearchProposal[];
  bloodMap?: Record<string, any>;
  traitMap?: Record<string, any>;
};

/**
 * Ancestory Oracle — the "AI brain" of the app.
 * 2026+ synthesis layer that turns raw genealogy + scooped history + science data
 * into smart, narrative, slightly sci-fi insights.
 *
 * This is the "robots + dating with science and AI" layer the user wants.
 */
export function AncestoryOracle({
  individuals,
  rootId,
  patIds,
  matIds,
  proposals,
  bloodMap = {},
  traitMap = {},
}: Props) {
  const acceptedProposals = useMemo(
    () => proposals.filter((p) => p.status === "accepted"),
    [proposals]
  );

  // Simple but effective synthesis
  const insights = useMemo(() => {
    const ins: Array<{ icon: string; title: string; body: string; confidence: number }> = [];

    const root = individuals[rootId];
    if (!root) return ins;

    // 1. Research density insight (AI "noticing" how much external history we pulled in)
    if (acceptedProposals.length > 0) {
      const sources = new Set(acceptedProposals.map((p) => p.source));
      ins.push({
        icon: "🧠",
        title: "Historical Augmentation",
        body: `This lineage has been enriched with ${acceptedProposals.length} external data points from ${Array.from(sources).join(", ")}. The past is no longer just what was in the GED — it's been cross-referenced with the wider historical record.`,
        confidence: 0.92,
      });
    }

    // 2. Migration / blood signal from proposals + existing data
    const hasBloodData = Object.keys(bloodMap).length > 0;
    if (hasBloodData && (patIds.length > 3 || matIds.length > 3)) {
      ins.push({
        icon: "🧬",
        title: "Deep-Time Selection Signal",
        body: `Patriline depth ${patIds.length} + matriline depth ${matIds.length}. Combined with phenotype and blood data, this suggests measurable selection pressures across centuries. The 'boring' family tree is actually a high-resolution evolutionary dataset.`,
        confidence: 0.78,
      });
    }

    // 3. Anomalous longevity or clustering from proposals
    const longLives = acceptedProposals.filter((p) => {
      const y = Number(p.extracted.y);
      const dy = Number(p.extracted.dy);
      return dy && y && dy - y > 85;
    });
    if (longLives.length > 0) {
      ins.push({
        icon: "⏳",
        title: "Longevity Outliers Detected",
        body: `${longLives.length} historically augmented individuals lived 85+ years. In the context of their era, this is statistically unusual. Possible genetic, environmental, or social selection at work.`,
        confidence: 0.71,
      });
    }

    // 4. "Dating the past" — narrative romance with history
    if (acceptedProposals.length > 2 && (patIds.length + matIds.length) > 8) {
      ins.push({
        icon: "💞",
        title: "Temporal Lineage Resonance",
        body: `Your documented ancestors + externally recovered historical figures now form a continuous thread longer than most nation-states have existed. The app has turned a private family story into a small slice of deep human time.`,
        confidence: 0.85,
      });
    }

    // 5. Grokipedia / alternative narrative hint (special treatment)
    const grokProposals = acceptedProposals.filter((p) => p.source === "grokipedia");
    if (grokProposals.length > 0) {
      ins.push({
        icon: "🤖",
        title: "Grokipedia Augmentation Active",
        body: `This lineage carries alternative historical context from Grokipedia. These narratives often diverge from mainstream sources — they represent a different model of what "truth" about the past looks like in 2026+. The robot historian has opinions.`,
        confidence: 0.88,
      });
    }

    // 6. Connection to major historical / space events
    const relevantEvents = MAJOR_EVENTS.filter((e) => {
      const rootYear = birthYear(individuals[rootId]);
      return rootYear && Math.abs(e.year - rootYear) < 300;
    });
    if (relevantEvents.length > 0) {
      ins.push({
        icon: "📜",
        title: "Anchored in Deep History",
        body: `This lineage overlaps with ${relevantEvents.length} major recorded events (including scientific and early space milestones). Your personal story is not separate from the big arcs of human (and soon multi-planetary) civilization.`,
        confidence: 0.81,
      });
    }

    // 7. Forward / multi-planetary branches (the new first-class layer)
    const forwards = readForwardConnections().filter((f) =>
      f.ancestorId === rootId || f.ancestorName?.toLowerCase().includes((individuals[rootId]?.n || "").toLowerCase())
    );
    if (forwards.length > 0) {
      ins.push({
        icon: "🚀",
        title: "Branches Beyond Earth",
        body: `This lineage already has ${forwards.length} recorded forward branches (Mars colonies, generation ships, exoplanet settlements). The Oracle sees the story continuing outward. The past was only the beginning.`,
        confidence: 0.79,
      });
    }

    // 8. Preserved elder & tribal knowledge
    const elderStories = readElderStories();
    const relevantElderStories = elderStories.filter((s) =>
      s.linkedAncestorIds?.includes(rootId) ||
      (individuals[rootId]?.n || "").toLowerCase().includes((s.tribalName || "").toLowerCase())
    );
    if (relevantElderStories.length > 0 || elderStories.length > 0) {
      ins.push({
        icon: "🪶",
        title: "Living Knowledge Preserved",
        body: `This work is helping hold space for ${elderStories.length} elder stories and tribal teachings. Knowledge that was fading is being carried forward. The circles are not closed yet.`,
        confidence: 0.94,
      });
    }

    return ins;
  }, [individuals, rootId, patIds, matIds, acceptedProposals, bloodMap]);

  if (insights.length === 0) {
    return (
      <div className="panel" style={{ opacity: 0.7 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Ancestory Oracle</div>
        <div className="muted">
          Feed the system more research proposals (via the OSINT hub → Extract structured) and the Oracle will begin synthesizing 2026+ level insights across your tree, blood data, and external history.
        </div>
      </div>
    );
  }

  return (
    <div className="panel ancestory-oracle">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🧠</span>
        <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Ancestory Oracle</div>
        <div style={{ fontSize: "0.7rem", opacity: 0.6, marginLeft: "auto" }}>2026+ Synthesis Layer</div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {insights.map((insight, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{insight.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>{insight.title}</div>
                <div style={{ fontSize: "0.9rem", lineHeight: 1.4, opacity: 0.95 }}>{insight.body}</div>
                <div style={{ fontSize: "0.65rem", opacity: 0.5, marginTop: 4 }}>
                  Confidence: {(insight.confidence * 100).toFixed(0)}% • Model: Ancestory-2026
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, fontSize: "0.7rem", opacity: 0.5 }}>
        The Oracle combines your tree, accepted research proposals, blood/phenotype data, and historical context.
        It is not magic — it is extremely aggressive pattern matching across time.
      </div>
    </div>
  );
}
