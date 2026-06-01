import React from "react";

type Props = {
  minYear: number;
  maxYear: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  onFullTime: () => void;
  label?: string;
};

/**
 * Global History Slider — always visible control for the entire app.
 * Filters timelines, maps, and lineage views by active time window.
 * Supports deep time (negative years for ancient/legendary periods).
 */
export function GlobalHistorySlider({
  minYear,
  maxYear,
  value,
  onChange,
  onFullTime,
  label = "Active Time Window",
}: Props) {
  const [start, end] = value;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), end);
    onChange([v, end]);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), start);
    onChange([start, v]);
  };

  const span = maxYear - minYear;
  const startPercent = ((start - minYear) / span) * 100;
  const endPercent = ((end - minYear) / span) * 100;

  return (
    <div className="global-history-slider" style={{
      background: "var(--panel)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: "8px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      minWidth: 280,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
          {label}
          <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.6 }}>
            {start} — {end}
          </span>
        </div>
        <button
          type="button"
          onClick={onFullTime}
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--accent)",
            cursor: "pointer",
          }}
        >
          Full Time
        </button>
      </div>

      <div style={{ position: "relative", height: 28 }}>
        {/* Visual track */}
        <div style={{
          position: "absolute",
          top: 11,
          left: 0,
          right: 0,
          height: 4,
          background: "#2a313f",
          borderRadius: 999,
        }} />

        {/* Active range highlight */}
        <div style={{
          position: "absolute",
          top: 11,
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
          height: 4,
          background: "linear-gradient(90deg, #5ab0ff, #8ab4f8)",
          borderRadius: 999,
        }} />

        {/* Start slider */}
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={start}
          onChange={handleStartChange}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            pointerEvents: "none",
          }}
        />

        {/* End slider */}
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={end}
          onChange={handleEndChange}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            pointerEvents: "none",
          }}
        />
      </div>

      <div style={{ fontSize: 10, opacity: 0.6, display: "flex", justifyContent: "space-between" }}>
        <span>{minYear}</span>
        <span style={{ color: "#5ab0ff" }}>Deep Time → Future</span>
        <span>{maxYear}</span>
      </div>
    </div>
  );
}
