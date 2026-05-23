import { useCallback, useEffect, useMemo, useState } from "react";
import type { FooterActiveId } from "./MobileFooterMenu";
import type { FamRec, IndiRec } from "./types";
import type { PartnerOverlayMap } from "./partnerOverlayStorage";
import type { StreamFanRow } from "./DualFanChart";
import { flattenLayerCards } from "./layerCardEntries";
import { LayerCardIndex } from "./LayerCardIndex";
import { ThroughlineBar } from "./ThroughlineBar";
import { OsintWorkbench } from "./OsintWorkbench";
import { WorldDirectoryPage } from "./WorldDirectoryPage";
import { DualPortraitColumns } from "./DualPortraitColumns";
import {
  readStreamFlags,
  readThroughlinePins,
  toggleThroughlinePin,
  writeStreamFlags,
  type StreamFlags,
} from "./throughlineStorage";

import { genreMeta, type IdentityGenre } from "./identityFilter";

export type LinesTab = "dual" | "layers";

type Props = {
  rootLabel: string;
  compareLabel: string;
  dualMode: "pat-mat" | "pat-pat" | "quad";
  dualRows: StreamFanRow[];
  vizColumnTitles: string[];
  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
  nameQuery: string;
  partnerOverlay?: PartnerOverlayMap;
  onSetRoot: (id: string) => void;
  onSetCompare: (id: string) => void;
  onDualModeChange: (m: "pat-mat" | "pat-pat" | "quad") => void;
  onFooterActiveChange: (id: FooterActiveId) => void;
  linesTab: LinesTab;
  onLinesTabChange: (tab: LinesTab) => void;
  identityGenre: IdentityGenre;
  onIdentityGenreChange: (g: IdentityGenre) => void;
};

const SCROLL_SECTIONS: { id: string; footer: FooterActiveId }[] = [
  { id: "mobile-lines", footer: "mobile-layers" },
  { id: "mobile-directory", footer: "mobile-directory" },
  { id: "mobile-osint", footer: "mobile-osint" },
];

export function MobileOnePage({
  rootLabel,
  compareLabel,
  dualMode,
  dualRows,
  vizColumnTitles,
  individuals,
  families,
  nameQuery,
  partnerOverlay,
  onSetRoot,
  onSetCompare,
  onDualModeChange,
  onFooterActiveChange,
  linesTab,
  onLinesTabChange,
  identityGenre,
  onIdentityGenreChange,
}: Props) {
  const activeGenre = genreMeta(identityGenre);
  const genreActive = identityGenre !== "all";
  const [streamFlags, setStreamFlags] = useState<StreamFlags>(() => readStreamFlags());
  const [throughlinePins, setThroughlinePins] = useState(() => readThroughlinePins());

  useEffect(() => {
    const nodes = SCROLL_SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        const match = SCROLL_SECTIONS.find((s) => s.id === top);
        if (!match) return;
        if (match.id === "mobile-lines") {
          onFooterActiveChange(linesTab === "dual" ? "dual" : "mobile-layers");
        } else {
          onFooterActiveChange(match.footer);
        }
      },
      { root: null, rootMargin: "-12% 0px -55% 0px", threshold: [0.08, 0.2, 0.4, 0.6] }
    );
    for (const n of nodes) obs.observe(n);
    return () => obs.disconnect();
  }, [onFooterActiveChange, linesTab]);

  const persistStreams = useCallback((flags: StreamFlags) => {
    setStreamFlags(flags);
    writeStreamFlags(flags);
  }, []);

  const layerEntries = useMemo(
    () => flattenLayerCards(dualRows, vizColumnTitles, individuals, streamFlags, dualMode),
    [dualRows, vizColumnTitles, individuals, streamFlags, dualMode]
  );

  const onTogglePin = useCallback((id: string) => {
    setThroughlinePins((prev) => toggleThroughlinePin(id, prev));
  }, []);

  return (
    <div className="mobile-one-page">
      <div className="mobile-root-bar mono mobile-one-page-roots">
        <span>
          Root <strong>{rootLabel}</strong>
        </span>
        <span>
          Compare <strong>{compareLabel}</strong>
        </span>
      </div>

      {genreActive && (
        <div
          className="identity-genre-banner"
          role="status"
          aria-live="polite"
          style={{ borderColor: activeGenre.accent, color: activeGenre.accent }}
        >
          <span className="identity-genre-banner-icon" aria-hidden="true">
            {activeGenre.icon}
          </span>
          <span className="identity-genre-banner-text">
            Filtering by <strong>{activeGenre.label}</strong> — chosen identity over GED sex
          </span>
          <button
            type="button"
            className="linkbtn identity-genre-banner-clear"
            onClick={() => onIdentityGenreChange("all")}
          >
            Clear
          </button>
        </div>
      )}

      <label className="mobile-layout-sel">
        <span>Line layout</span>
        <select
          className="sel"
          value={dualMode}
          onChange={(e) => onDualModeChange(e.target.value as typeof dualMode)}
        >
          <option value="pat-mat">Pat + mat (one root)</option>
          <option value="pat-pat">Two patrilines</option>
          <option value="quad">Quad streams</option>
        </select>
      </label>

      <section
        className="mobile-section mobile-section--lines"
        id="mobile-lines"
        aria-labelledby="mobile-lines-h"
      >
        <div className="lines-tabs" role="tablist" aria-label="Lines view">
          <button
            type="button"
            role="tab"
            id="lines-tab-dual"
            aria-controls="lines-panel-dual"
            aria-selected={linesTab === "dual"}
            className={`lines-tab ${linesTab === "dual" ? "lines-tab--active" : ""}`}
            onClick={() => onLinesTabChange("dual")}
          >
            <span className="lines-tab-icon" aria-hidden="true">
              ⇄
            </span>
            <span>Dual</span>
          </button>
          <button
            type="button"
            role="tab"
            id="lines-tab-layers"
            aria-controls="lines-panel-layers"
            aria-selected={linesTab === "layers"}
            className={`lines-tab ${linesTab === "layers" ? "lines-tab--active" : ""}`}
            onClick={() => onLinesTabChange("layers")}
          >
            <span className="lines-tab-icon" aria-hidden="true">
              ☰
            </span>
            <span>Layers A–Z</span>
          </button>
        </div>

        <h2 id="mobile-lines-h" className="sr-only">
          Lines — {linesTab === "dual" ? "Dual streams" : "Generational layers"}
        </h2>

        {linesTab === "dual" ? (
          <div
            role="tabpanel"
            id="lines-panel-dual"
            aria-labelledby="lines-tab-dual"
            className="lines-panel"
          >
            <p className="mobile-dual-lead muted">
              Two portrait columns by generation — tap a card to set root or compare.
            </p>
            <DualPortraitColumns
              dualMode={dualMode}
              dualRows={dualRows}
              columnTitles={vizColumnTitles}
              individuals={individuals}
              families={families}
              partnerOverlay={partnerOverlay}
              onPickRoot={onSetRoot}
              onPickCompare={onSetCompare}
            />
          </div>
        ) : (
          <div
            role="tabpanel"
            id="lines-panel-layers"
            aria-labelledby="lines-tab-layers"
            className="lines-panel"
          >
            <ThroughlineBar flags={streamFlags} dualMode={dualMode} onChange={persistStreams} />
            <LayerCardIndex
              entries={layerEntries}
              individuals={individuals}
              query={nameQuery}
              throughlinePins={throughlinePins}
              onTogglePin={onTogglePin}
              onPickRoot={onSetRoot}
              onPickCompare={onSetCompare}
            />
          </div>
        )}
      </section>

      <section className="mobile-section mobile-section--directory" id="mobile-directory" aria-labelledby="mobile-directory-h">
        <h2 id="mobile-directory-h" className="mobile-section-h">
          World directory — names, tribes, hominins
        </h2>
        <WorldDirectoryPage compact />
      </section>

      <section className="mobile-section" id="mobile-osint" aria-labelledby="mobile-osint-h">
        <h2 id="mobile-osint-h" className="mobile-section-h">
          Open research — new finds
        </h2>
        <OsintWorkbench prefill={nameQuery} />
      </section>
    </div>
  );
}
