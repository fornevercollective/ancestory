import React from "react";
import { SearchHeader } from "./SearchHeader";
import { EventTimeline } from "./EventTimeline";
import { MapView } from "./MapView";
import type { IndiRec, FamRec } from "./types";
import type { PartnerOverlayMap } from "./partnerOverlayStorage";
import type { MapScope } from "./MapView";

type Props = {
  nameQuery: string;
  onNameQueryChange: (v: string) => void;
  searchHits: Array<{ id: string; name: string }>;
  onFocusStory: (id?: string) => void;

  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
  rootId: string;
  patIds: string[];
  matIds: string[];
  timeRange: [number, number];

  // Map props
  mapScope: MapScope;
  mapConnectLine: boolean;
  mapIncludePartners: boolean;
  partnerOverlay?: PartnerOverlayMap;
  patMatBirthDualLines: boolean;
  streamAccent: "pat" | "mat";

  // Timeline props
  proposals: any[];
  majorEvents: any[];
  onEventClick: (evt: any) => void;

  onExpandMap: () => void;
};

/**
 * NarrativeCockpit
 * The cohesive "story surface" at the top of the app.
 * Search drives everything below it.
 * Feels like one unified instrument panel for exploring deep narratives.
 */
export function NarrativeCockpit({
  nameQuery,
  onNameQueryChange,
  searchHits,
  onFocusStory,
  individuals,
  families,
  rootId,
  patIds,
  matIds,
  timeRange,
  mapScope,
  mapConnectLine,
  mapIncludePartners,
  partnerOverlay,
  patMatBirthDualLines,
  streamAccent,
  proposals,
  majorEvents,
  onEventClick,
  onExpandMap,
}: Props) {
  return (
    <div className="narrative-cockpit" style={{
      background: "linear-gradient(180deg, #0f1114 0%, #14181f 100%)",
      borderBottom: "1px solid #2d323c",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    }}>
      {/* Unified header label */}
      <div style={{
        padding: "6px 20px 0",
        fontSize: 10,
        letterSpacing: "1px",
        color: "#5ab0ff",
        opacity: 0.7,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        LIVE STORY EXPLORER
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, #5ab0ff22, transparent)" }} />
        <span style={{ fontSize: 9, opacity: 0.5 }}>{timeRange[0]} — {timeRange[1]}</span>
      </div>

      {/* 1. Search — the primary control surface */}
      <SearchHeader
        value={nameQuery}
        onChange={onNameQueryChange}
        onFocusStory={onFocusStory}
        searchHits={searchHits}
      />

      {/* 2. Deep Narrative Timeline — tightly coupled to search + time */}
      <div style={{ padding: "6px 20px 12px", background: "#0f1114" }}>
        <div style={{ 
          fontSize: 10, 
          fontWeight: 600, 
          color: "#5ab0ff", 
          marginBottom: 4, 
          paddingLeft: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>DEEP NARRATIVE TIMELINE</span>
          <span style={{ fontSize: 9, opacity: 0.5 }}>Filtered by search &amp; time window</span>
        </div>
        <EventTimeline
          individuals={individuals}
          patIds={patIds}
          matIds={matIds}
          proposals={proposals}
          majorEvents={majorEvents}
          onEventClick={onEventClick}
          timeRange={timeRange}
          height={165}
        />
      </div>

      {/* 3. Map — always visible, story-aware, one click to expand */}
      <div style={{ padding: "0 20px 16px", background: "#111418" }}>
        <div style={{ 
          fontSize: 10, 
          fontWeight: 600, 
          color: "#5ab0ff", 
          marginBottom: 4, 
          paddingLeft: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>MAP — CURRENT STORY &amp; TIME WINDOW</span>
          <button
            onClick={onExpandMap}
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(90,176,255,0.1)",
              color: "#5ab0ff",
              border: "1px solid #5ab0ff33",
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
          >
            Expand Map
          </button>
        </div>
        <div className="map-window" style={{ 
          height: 220, 
          borderRadius: 6, 
          overflow: "hidden", 
          border: "1px solid #2d323c",
          position: "relative"
        }}>
          <MapView
            individuals={individuals}
            families={families}
            rootId={rootId}
            patIds={patIds}
            matIds={matIds}
            scope={mapScope}
            connectLine={mapConnectLine}
            includePartners={mapIncludePartners}
            partnerOverlay={partnerOverlay}
            embed={true}
            showFoot={false}
            patMatBirthDualLines={patMatBirthDualLines}
            streamAccent={streamAccent}
            timeRange={timeRange}
          />
        </div>
      </div>
    </div>
  );
}
