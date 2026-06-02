import React from "react";

type Tab =
  | "home"
  | "dual"
  | "patriline"
  | "matriline"
  | "map"
  | "rulers"
  | "directory"
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
  /** Opens World directory, or data upgrade when demo tree is loaded */
  onOpenHumanity: () => void;
  showUpgradePill?: boolean;
};

const TABS: { key: Tab; label: string; icon?: string }[] = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "dual", label: "Dual Lines", icon: "⇄" },
  { key: "map", label: "Map", icon: "🗺️" },
  { key: "directory", label: "World", icon: "🌐" },
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
  onOpenHumanity,
  showUpgradePill,
}: Props) {
  return (
    <header className="top-nav" aria-label="Main navigation">
      <div className="top-nav-inner">
        {/* Brand */}
        <div className="top-nav-brand">
          <div className="top-nav-title">Ancestory</div>
          <div className="top-nav-tagline">deep time • private</div>
        </div>

        {/* Main Navigation */}
        <div className="top-nav-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={`top-nav-tab${currentTab === t.key ? " top-nav-tab--active" : ""}`}
              aria-current={currentTab === t.key ? "page" : undefined}
            >
              {t.icon && <span aria-hidden="true">{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>

        <div className="top-nav-spacer" />

        <button
          type="button"
          onClick={onOpenHumanity}
          className={`top-nav-humanity${showUpgradePill ? " top-nav-humanity--upgrade" : ""}${currentTab === "directory" ? " top-nav-humanity--active" : ""}`}
          aria-current={currentTab === "directory" ? "page" : undefined}
          title={showUpgradePill ? "Upgrade demo data" : "World name directory — tribes, etymology, hominins"}
        >
          🌍 Humanity
          {showUpgradePill && <span className="top-nav-upgrade-pill">Upgrade</span>}
        </button>
      </div>
    </header>
  );
}
