import type { IndiRec } from "./types";
import type { ResearchProposal } from "./researchEnrichmentsStorage";
import type { ElderStory } from "./tribalElderStorage";
import type { ForwardConnection } from "./forwardLineageStorage";
import { MAJOR_EVENTS } from "./majorHistoricalEvents";

/**
 * Utilities to turn all our "stories" (partners, historical events, elder knowledge, forward branches)
 * into mappable data for the map views.
 *
 * This is the "all stories" integration the user wants.
 */

export type StoryMapMarker = {
  lat: number;
  lng: number;
  label: string;
  type: "partner" | "historical" | "elder" | "forward" | "travel";
  year?: number | string;
  source?: string;
};

export function collectStoryMarkersForMap(params: {
  individuals: Record<string, IndiRec>;
  partnerOverlay?: any;
  proposals: ResearchProposal[];
  elderStories: ElderStory[];
  forwardConnections: ForwardConnection[];
  // For now we pass pre-geocoded places from the ledger or current map data
  // In a full version we'd geocode story places on demand
}): StoryMapMarker[] {
  const markers: StoryMapMarker[] = [];

  // Historical / major events with known places (simplified — in real use we'd geocode)
  // For now we add the ones that have explicit place strings in MAJOR_EVENTS if any
  // (Current MAJOR_EVENTS are mostly year + label without places, so this is a hook for future)

  // Elder stories that have linked ancestors with places
  // Forward connections that have locations (we can treat the "location" string as needing geocoding later)

  // This function is intentionally a stub that can be expanded.
  // The real power comes from the Place Ledger + curation already letting users lock story-derived places.

  return markers;
}

/** Simple helper to get a human-friendly label for a story source */
export function getStoryTypeLabel(type: StoryMapMarker["type"]): string {
  switch (type) {
    case "partner": return "Genetic / Sexual Partner";
    case "historical": return "Major Historical Event";
    case "elder": return "Elder / Tribal Knowledge";
    case "forward": return "Forward / Off-World Branch";
    case "travel": return "Life Travel / Waypoint";
    default: return "Story";
  }
}
