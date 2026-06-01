import { useMemo } from "react";
import type { IndiRec } from "./types";
import type { ResearchProposal } from "./researchEnrichmentsStorage";
import { formatName } from "./trace";
import { NAME_ENTRIES, TRIBAL_ENTRIES, type TribalEntry } from "./worldDirectoryData";
import { readElderStories } from "./tribalElderStorage";

type Props = {
  individuals: Record<string, IndiRec>;
  proposals: ResearchProposal[];
  personAId: string;
  personBId: string; // can be a historical figure id from proposals or another tree person
  onHighlightTimeline?: (years: number[]) => void;
};

/**
 * Ancestral Resonance Matcher
 * 
 * The "deeper matches based on ancestral story overlaps, language similarities, tribal data and their stories"
 * 
 * This is the advanced "robots + dating + science + AI" layer.
 * It scores resonance across:
 * - Story overlaps (shared historical events from proposals)
 * - Language / etymology (from world directory)
 * - Tribal knowledge & migrations
 * - Geographic + temporal resonance
 * - Phenotype / blood echoes (when available)
 *
 * Output is rich, narrative, and slightly sci-fi in tone — exactly the "cooler" version of boring genealogy.
 */
export function AncestralResonance({
  individuals,
  proposals,
  personAId,
  personBId,
  onHighlightTimeline,
}: Props) {
  const a = individuals[personAId];
  const bRec = individuals[personBId]; // may be undefined if historical

  const resonance = useMemo(() => {
    if (!a) return null;

    const nameA = formatName(personAId, individuals);
    const nameB = bRec ? formatName(personBId, individuals) : personBId;

    let score = 40; // baseline
    const signals: string[] = [];
    const storyOverlaps: string[] = [];
    const languageResonance: string[] = [];
    const tribalEchoes: string[] = [];

    // 1. Story overlaps from research proposals (historical events, regions, figures)
    const aProposals = proposals.filter((p) => 
      (p.linkedPerson || "").toLowerCase().includes(nameA.toLowerCase().split(" ")[0]) ||
      p.sourceUrl.includes(nameA.split(" ").pop() || "")
    );
    const bProposals = proposals.filter((p) => 
      (p.linkedPerson || "").toLowerCase().includes((nameB || "").toLowerCase().split(" ")[0])
    );

    const sharedEvents = aProposals.filter((pa) => 
      bProposals.some((pb) => 
        (pa.extracted.bp && pa.extracted.bp === pb.extracted.bp) ||
        (pa.extracted.notes && pb.extracted.notes && pa.extracted.notes.includes(pb.extracted.notes.split(" ")[0]))
      )
    );

    if (sharedEvents.length > 0) {
      score += 22;
      storyOverlaps.push(`${sharedEvents.length} shared historical or research story threads`);
    }

    // 2. Language / etymology resonance (world directory)
    const aNameData = NAME_ENTRIES.find((n) => 
      nameA.toLowerCase().includes(n.name.toLowerCase()) || n.spoken?.toLowerCase() === nameA.toLowerCase()
    );
    const bNameData = NAME_ENTRIES.find((n) => 
      (nameB || "").toLowerCase().includes(n.name.toLowerCase())
    );

    if (aNameData && bNameData) {
      if (aNameData.lang === bNameData.lang) {
        score += 15;
        languageResonance.push(`Shared language family (${aNameData.langLabel})`);
      }
      if (aNameData.tribalIds?.some((t) => bNameData.tribalIds?.includes(t))) {
        score += 12;
        languageResonance.push("Overlapping tribal name roots");
      }
    }

    // 3. Tribal data & elder stories (deep fading knowledge)
    const relevantTribes: TribalEntry[] = TRIBAL_ENTRIES.filter((t) =>
      aNameData?.tribalIds?.includes(t.id) || bNameData?.tribalIds?.includes(t.id)
    );

    if (relevantTribes.length > 0) {
      score += 18;
      tribalEchoes.push(
        `Resonance with ${relevantTribes.map((t) => t.endonym).join(", ")} — elder knowledge systems still carried in stories`
      );
    }

    // Bonus: direct elder stories recorded for these lines
    const elderStories = readElderStories();
    const directElderConnections = elderStories.filter((s) =>
      s.linkedAncestorIds?.includes(personAId) || s.linkedAncestorIds?.includes(personBId)
    );
    if (directElderConnections.length > 0) {
      score += 14;
      tribalEchoes.push(`${directElderConnections.length} preserved elder teachings directly connected to these lines`);
    }

    // 4. Time + geography from proposals (migration story overlap)
    if (aProposals.length && bProposals.length) {
      const geoOverlap = aProposals.some((pa) =>
        bProposals.some((pb) => pa.extracted.bp === pb.extracted.bp)
      );
      if (geoOverlap) {
        score += 10;
        storyOverlaps.push("Overlapping ancestral homelands or migration corridors");
      }
    }

    // Cap and flavor
    const finalScore = Math.min(96, Math.max(28, Math.round(score)));

    const narrative = 
      finalScore > 80
        ? "Deep ancestral resonance — these lines have brushed against the same stories, languages, and lands across centuries."
        : finalScore > 60
        ? "Meaningful echoes. Shared threads of migration, language, or witnessed history."
        : "Distant but intriguing — different rivers that may have crossed in forgotten times.";

    return {
      nameA,
      nameB,
      score: finalScore,
      narrative,
      storyOverlaps,
      languageResonance,
      tribalEchoes,
      relevantTribes,
    };
  }, [a, bRec, proposals, personAId, personBId, individuals]);

  if (!resonance) return null;

  return (
    <div className="panel" style={{ borderLeft: "4px solid #7e57c2" }}>
      <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 8 }}>
        Ancestral Resonance • {resonance.nameA} × {resonance.nameB}
      </div>

      <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-1.5px", margin: "8px 0" }}>
        {resonance.score}% resonance
      </div>

      <div style={{ fontSize: "0.95rem", lineHeight: 1.45, marginBottom: 12 }}>
        {resonance.narrative}
      </div>

      {(resonance.storyOverlaps.length > 0 || resonance.languageResonance.length > 0 || resonance.tribalEchoes.length > 0) && (
        <div style={{ fontSize: "0.85rem" }}>
          {resonance.storyOverlaps.length > 0 && (
            <div><strong>Story Overlaps:</strong> {resonance.storyOverlaps.join(" • ")}</div>
          )}
          {resonance.languageResonance.length > 0 && (
            <div><strong>Language &amp; Name Resonance:</strong> {resonance.languageResonance.join(" • ")}</div>
          )}
          {resonance.tribalEchoes.length > 0 && (
            <div><strong>Tribal &amp; Elder Knowledge:</strong> {resonance.tribalEchoes.join(" • ")}</div>
          )}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: "0.7rem", opacity: 0.6 }}>
        Powered by research proposals, world etymology, tribal registries, and deep-time pattern matching.
        This is how the robots help you feel the living connections across the fading circles.
      </div>
    </div>
  );
}
