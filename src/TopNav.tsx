import React from "react";
import { GlobalHistorySlider } from "./GlobalHistorySlider";

type Tab =
  | "home"
  | "dual"
  | "patriline"
  | "matriline"
  | "map"
  | "rulers"
  | "deep-history"
  | "search";

type Props = {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  timeRange: [number, number];
  onTimeRangeChange: (range: [number, number]) => void;
  fullMin: number;
  fullMax: number;
  onFullTime: () => void;
  onOpenData: () => void;
  showUpgradePill?: boolean;
};

const TABS: { key: Tab; label: string; icon?: string }[] = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "dual", label: "Dual Lines", icon: "⇄" },
  { key: "map", label: "Map", icon: "🗺️" },
  { key: "rulers", label: "Rulers", icon: "👑" },
  { key: "deep-history", label: "Deep History", icon: "⏳" },
  { key: "search", label: "Search", icon: "🔍" },
];

export function TopNav({
  currentTab,
  onTabChange,
  timeRange,
  onTimeRangeChange,
  fullMin,
  fullMax,
  onFullTime,
  onOpenData,
  showUpgradePill,
}: Props) {
  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(15, 17, 20, 0.96)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      padding: "8px 16px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
            Ancestory
          </div>
          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>deep time • private</div>
        </div>

        {/* Main Navigation */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: currentTab === t.key ? "1px solid #5ab0ff" : "1px solid transparent",
                background: currentTab === t.key ? "rgba(90, 176, 255, 0.12)" : "transparent",
                color: currentTab === t.key ? "#c9d4e8" : "#9aa0a6",
                fontSize: 13,
                fontWeight: currentTab === t.key ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {t.icon && <span>{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Persistent History Slider */}
        <GlobalHistorySlider
          minYear={fullMin}
          maxYear={fullMax}
          value={timeRange}
          onChange={onTimeRangeChange}
          onFullTime={onFullTime}
        />

        {/* Data Access */}
        <button
          onClick={onOpenData}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: showUpgradePill ? "#5ab0ff" : "var(--panel)",
            color: showUpgradePill ? "#111" : "#c9d4e8",
            border: "1px solid var(--border)",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          📁 Data
          {showUpgradePill && (
            <span style={{
              background: "rgba(0,0,0,0.2)",
              padding: "0 6px",
              borderRadius: 999,
              fontSize: 10,
            }}>
              Upgrade
            </span>
          )}
        </button>
      </div>

      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, paddingLeft: 4 }}>
        Global time filter applies to Map, Timeline, and Lineage views • Supports legendary/deep time (negative years)
      </div>
    </div>
  );
}
