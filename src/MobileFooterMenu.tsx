import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useJsonIngest } from "./useJsonIngest";
import { IdentityGenreBar } from "./IdentityGenreBar";
import { genreMeta, type IdentityGenre } from "./identityFilter";

export type MobileSectionId = "mobile-map" | "mobile-layers" | "mobile-directory" | "mobile-osint";
/** Footer highlight — dual/more are in-page actions, not separate scroll sections. */
export type FooterActiveId = MobileSectionId | "dual" | "more";

const SECTIONS: { id: MobileSectionId; label: string; icon: string }[] = [
  { id: "mobile-map", label: "Map", icon: "⌖" },
  { id: "mobile-layers", label: "Lines", icon: "☰" },
  { id: "mobile-directory", label: "World", icon: "🌐" },
  { id: "mobile-osint", label: "OSINT", icon: "⌕" },
];

type SearchHit = { id: string; name: string };

type Props = {
  activeId: FooterActiveId;
  homeView?: "lines" | "map";
  onSelect: (id: MobileSectionId) => void;
  onOpenMap?: () => void;
  onOpenLines?: () => void;
  nameQuery: string;
  onNameQueryChange: (q: string) => void;
  searchHits: SearchHit[];
  onPickRoot: (id: string) => void;
  onPickCompare: (id: string) => void;
  onTreeText: (text: string) => void;
  onRulersText: (text: string) => void;
  onClearIngest: () => void;
  onIngestError: (msg: string) => void;
  treeFromFile: boolean;
  rulersFromFile: boolean;
  ingestMessage: string | null;
  sourceLine?: string;
  onOpenDual: () => void;
  identityGenre: IdentityGenre;
  onIdentityGenreChange: (g: IdentityGenre) => void;
};

export function MobileFooterMenu({
  activeId,
  homeView = "lines",
  onSelect,
  onOpenMap,
  onOpenLines,
  nameQuery,
  onNameQueryChange,
  searchHits,
  onPickRoot,
  onPickCompare,
  onTreeText,
  onRulersText,
  onClearIngest,
  onIngestError,
  treeFromFile,
  rulersFromFile,
  ingestMessage,
  sourceLine,
  onOpenDual,
  identityGenre,
  onIdentityGenreChange,
}: Props) {
  const genre = genreMeta(identityGenre);
  const [genreOpen, setGenreOpen] = useState(false);
  const searchId = useId();
  const loadId = useId();
  const moreId = useId();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [hitsOpen, setHitsOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const filterActive = identityGenre !== "all";
  const showHits =
    hitsOpen &&
    !loadOpen &&
    !moreOpen &&
    !genreOpen &&
    (nameQuery.trim().length > 0 || filterActive) &&
    searchHits.length > 0;
  const busy = treeFromFile || rulersFromFile;

  const {
    pasteDraft,
    setPasteDraft,
    dragOver,
    setDragOver,
    handleFile,
    onDropZone,
    onDragOver,
    applyPaste,
  } = useJsonIngest({ onTreeText, onRulersText, onIngestError });

  const focusLines = useCallback(() => {
    onOpenLines?.();
    onSelect("mobile-layers");
  }, [onSelect, onOpenLines]);

  const closeLoad = useCallback(() => setLoadOpen(false), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  const closeOverlays = useCallback(() => {
    setLoadOpen(false);
    setMoreOpen(false);
    setHitsOpen(false);
  }, []);

  const jumpSection = useCallback(
    (id: MobileSectionId) => {
      closeOverlays();
      if (id === "mobile-map") {
        onOpenMap?.();
        return;
      }
      onOpenLines?.();
      onSelect(id);
    },
    [closeOverlays, onSelect, onOpenMap, onOpenLines]
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <footer className="mobile-footer-menu" role="navigation" aria-label="Main menu">
      <div className="mobile-footer-search-wrap">
        {moreOpen && (
          <div className="mobile-footer-more" role="menu" aria-labelledby={moreId}>
            <div className="mobile-footer-more-head">
              <span id={moreId} className="mobile-footer-more-title">
                More
              </span>
              <button type="button" className="linkbtn mobile-footer-more-close" onClick={closeMore}>
                Done
              </button>
            </div>
            <div className="mobile-footer-more-grid">
              {SECTIONS.map(({ id, label, icon }) => (
                <button key={id} type="button" className="mobile-footer-more-item" onClick={() => jumpSection(id)}>
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </button>
              ))}
              <button
                type="button"
                className="mobile-footer-more-item"
                onClick={() => {
                  closeMore();
                  onOpenDual();
                }}
              >
                <span aria-hidden="true">⇄</span>
                Dual
              </button>
              <button
                type="button"
                className="mobile-footer-more-item"
                onClick={() => {
                  setMoreOpen(false);
                  setLoadOpen(true);
                  setHitsOpen(false);
                }}
              >
                <span aria-hidden="true">↑</span>
                Load JSON
              </button>
              <button
                type="button"
                className="mobile-footer-more-item"
                onClick={() => {
                  setMoreOpen(false);
                  setLoadOpen(false);
                  setHitsOpen(true);
                  window.setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
              >
                <span aria-hidden="true">⌕</span>
                Search tree
              </button>
            </div>
          </div>
        )}

        {loadOpen && (
          <div className="mobile-footer-load" role="region" aria-labelledby={loadId}>
            <div className="mobile-footer-load-head">
              <span id={loadId} className="mobile-footer-load-title">
                Quick load
              </span>
              <button type="button" className="linkbtn mobile-footer-load-close" onClick={closeLoad}>
                Done
              </button>
            </div>
            <p className="mobile-footer-load-hint muted">
              Drop or choose <strong>tree.json</strong> / <strong>rulers.json</strong> — session only.
            </p>
            <div className="mobile-footer-load-drops">
              <div
                className={`mobile-footer-load-drop ${dragOver === "tree" ? "mobile-footer-load-drop--on" : ""}`}
                onDragOver={(e) => {
                  onDragOver(e);
                  setDragOver("tree");
                }}
                onDragLeave={() => setDragOver((d) => (d === "tree" ? null : d))}
                onDrop={onDropZone("tree")}
              >
                <span className="mobile-footer-load-label">tree.json</span>
                <label className="ingest-file-label">
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="ingest-file-input"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) {
                        await handleFile(f, "tree");
                        closeLoad();
                      }
                    }}
                  />
                  <span className="btn btn-small">Choose</span>
                </label>
              </div>
              <div
                className={`mobile-footer-load-drop ${dragOver === "rulers" ? "mobile-footer-load-drop--on" : ""}`}
                onDragOver={(e) => {
                  onDragOver(e);
                  setDragOver("rulers");
                }}
                onDragLeave={() => setDragOver((d) => (d === "rulers" ? null : d))}
                onDrop={onDropZone("rulers")}
              >
                <span className="mobile-footer-load-label">rulers.json</span>
                <label className="ingest-file-label">
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="ingest-file-input"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) {
                        await handleFile(f, "rulers");
                        closeLoad();
                      }
                    }}
                  />
                  <span className="btn btn-small">Choose</span>
                </label>
              </div>
            </div>
            <details className="mobile-footer-load-paste">
              <summary>Paste JSON</summary>
              <textarea
                className="inp mobile-footer-load-ta"
                value={pasteDraft}
                onChange={(e) => setPasteDraft(e.target.value)}
                placeholder="Paste tree.json or rulers.json…"
                rows={3}
                spellCheck={false}
              />
              <button
                type="button"
                className="btn btn-small"
                disabled={!pasteDraft.trim()}
                onClick={() => {
                  applyPaste();
                  closeLoad();
                }}
              >
                Parse &amp; load
              </button>
            </details>
            {busy && (
              <button type="button" className="btn btn-small mobile-footer-load-clear" onClick={onClearIngest}>
                Clear files → use bundled JSON
              </button>
            )}
            {ingestMessage && <p className="mobile-footer-load-msg">{ingestMessage}</p>}
            {sourceLine && (
              <p className="mobile-footer-load-src mono muted" title={sourceLine}>
                {sourceLine}
              </p>
            )}
          </div>
        )}

        {showHits && (
          <ul className="mobile-footer-hits" role="listbox" aria-label="Search results">
            {searchHits.slice(0, 8).map(({ id, name }) => (
              <li key={id} role="option">
                <button
                  type="button"
                  className="mobile-footer-hit"
                  onClick={() => {
                    onPickRoot(id);
                    setHitsOpen(false);
                    focusLines();
                  }}
                >
                  <span className="mobile-footer-hit-name">{name}</span>
                  <span className="mobile-footer-hit-id mono">{id}</span>
                </button>
                <button
                  type="button"
                  className="mobile-footer-hit-compare"
                  title="Set compare"
                  onClick={() => {
                    onPickCompare(id);
                    setHitsOpen(false);
                    focusLines();
                  }}
                >
                  ↔
                </button>
              </li>
            ))}
            {searchHits.length > 8 && (
              <li className="mobile-footer-hits-more muted">+{searchHits.length - 8} more — refine search</li>
            )}
          </ul>
        )}

        {genreOpen && (
          <div className="mobile-footer-genre" role="region" aria-label="2SLGBTQI+ identity filter">
            <p className="mobile-footer-genre-lead muted">
              Filter by <strong>self-identified</strong> gender or orientation — chosen identity is matched first,
              then GED-assigned sex (only for <em>Straight / cis</em>). Background recolors to match the genre.
            </p>
            <IdentityGenreBar value={identityGenre} onChange={onIdentityGenreChange} />
          </div>
        )}

        <div className="mobile-footer-search-row">
          <label className="sr-only" htmlFor={searchId}>
            Search tree by name or xref
          </label>
          <input
            id={searchId}
            ref={searchInputRef}
            type="search"
            enterKeyHint="search"
            className="inp mobile-footer-search"
            value={nameQuery}
            onChange={(e) => {
              onNameQueryChange(e.target.value);
              setHitsOpen(true);
              setLoadOpen(false);
              setMoreOpen(false);
            }}
            onFocus={() => {
              setHitsOpen(true);
              setMoreOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && nameQuery.trim()) {
                focusLines();
                setMoreOpen(false);
              }
            }}
            placeholder="Search names, @xref…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            className={`btn btn-small mobile-footer-genre-btn ${genreOpen ? "on" : ""} ${identityGenre !== "all" ? "mobile-footer-genre-btn--active" : ""}`}
            onClick={() => {
              setGenreOpen((o) => !o);
              setLoadOpen(false);
              setMoreOpen(false);
              setHitsOpen(false);
            }}
            aria-expanded={genreOpen}
            aria-label={`Identity filter: ${genre.label}`}
            title={`Identity filter — ${genre.label}`}
            style={
              identityGenre !== "all"
                ? { borderColor: genre.accent, color: genre.accent }
                : undefined
            }
          >
            <span className="mobile-footer-genre-icon" aria-hidden="true">
              {genre.icon}
            </span>
            <span className="mobile-footer-genre-short">{genre.short}</span>
          </button>
          <button
            type="button"
            className={`btn btn-small mobile-footer-load-btn ${loadOpen ? "on" : ""} ${busy ? "mobile-footer-load-btn--busy" : ""}`}
            onClick={() => {
              setLoadOpen((o) => !o);
              setHitsOpen(false);
              setMoreOpen(false);
              setGenreOpen(false);
            }}
            aria-expanded={loadOpen}
            aria-controls={loadId}
            title="Load tree.json or rulers.json"
          >
            {busy ? "Loaded" : "Load"}
          </button>
        </div>
      </div>

      <div className="mobile-footer-bar mobile-footer-bar--6">
        {SECTIONS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`mobile-footer-item ${activeId === id ? "on" : ""}`}
            onClick={() => {
              closeOverlays();
              if (id === "mobile-map") {
                onOpenMap?.();
              } else {
                onOpenLines?.();
                onSelect(id);
              }
            }}
            aria-current={activeId === id ? "page" : undefined}
          >
            <span className="mobile-footer-icon" aria-hidden="true">
              {icon}
            </span>
            <span className="mobile-footer-label">{label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`mobile-footer-item ${activeId === "dual" ? "on" : ""}`}
          onClick={() => {
            setMoreOpen(false);
            setLoadOpen(false);
            onOpenLines?.();
            onOpenDual();
          }}
          title="Dual lineage layer cards"
          aria-current={activeId === "dual" ? "page" : undefined}
        >
          <span className="mobile-footer-icon" aria-hidden="true">
            ⇄
          </span>
          <span className="mobile-footer-label">Dual</span>
        </button>
        <button
          type="button"
          className={`mobile-footer-item ${activeId === "more" ? "on" : ""}`}
          onClick={() => {
            setLoadOpen(false);
            setHitsOpen(false);
            setMoreOpen((o) => !o);
          }}
          aria-expanded={moreOpen}
          aria-controls={moreId}
          title="More sections and tools"
          aria-current={activeId === "more" || moreOpen ? "page" : undefined}
        >
          <span className="mobile-footer-icon" aria-hidden="true">
            ⋯
          </span>
          <span className="mobile-footer-label">More</span>
        </button>
      </div>
    </footer>,
    document.body
  );
}
