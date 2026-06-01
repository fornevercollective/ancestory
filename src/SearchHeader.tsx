import React from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onFocusStory: (id?: string) => void; // Called when user selects or searches to reshape the page
  placeholder?: string;
  searchHits?: Array<{ id: string; name: string }>;
};

/**
 * Prominent Search Bar that acts as the main header.
 * Searching here "reshapes the page as the story evolves":
 * - Filters timeline, map, cards
 * - Can auto-adjust the global history slider
 * - Surfaces relevant deep narrative elements
 */
export function SearchHeader({
  value,
  onChange,
  onFocusStory,
  placeholder = "Search people, events, places, or stories… (e.g. Rachtmar, Fortner, birth in Leinster)",
  searchHits = [],
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchHits.length > 0) {
      // Reshape the story around the top match
      onFocusStory(searchHits[0].id);
    }
  };

  return (
    <div className="search-header" style={{
      padding: "12px 20px",
      background: "linear-gradient(180deg, #0f1114 0%, #171a20 100%)",
      borderBottom: "1px solid #2d323c",
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#5ab0ff", whiteSpace: "nowrap" }}>
            ANCESTORY
          </div>

          <input
            type="text"
            className="inp"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              flex: 1,
              fontSize: 15,
              padding: "10px 16px",
              background: "#111418",
              border: "1px solid #3a4a63",
              borderRadius: 8,
              color: "#e8eaed",
            }}
          />

          {value.trim() && (
            <button
              onClick={() => {
                onChange("");
                onFocusStory(undefined);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid #3a4a63",
                background: "transparent",
                color: "#9aa0a6",
                cursor: "pointer",
              }}
            >
              Clear story
            </button>
          )}
        </div>

        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, paddingLeft: 4 }}>
          Search reshapes the Deep Narrative Timeline, Map, and Story Cards below in real time.
        </div>
      </div>
    </div>
  );
}
