import { useCallback, useMemo, useRef } from "react";
import type { IndiRec } from "./types";
import { INDEX_LETTERS, groupByLetter, type LayerCardEntry } from "./layerCardEntries";
import { PortraitHero } from "./PortraitHero";
import { birthYear, timeBandClass } from "./timeBands";

type Props = {
  entries: LayerCardEntry[];
  individuals: Record<string, IndiRec>;
  query: string;
  throughlinePins: Set<string>;
  onTogglePin: (id: string) => void;
  onPickRoot: (id: string) => void;
  onPickCompare: (id: string) => void;
};

export function LayerCardIndex({
  entries,
  individuals,
  query,
  throughlinePins,
  onTogglePin,
  onPickRoot,
  onPickCompare,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.streamLabel.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const grouped = useMemo(() => groupByLetter(filtered), [filtered]);
  const lettersPresent = useMemo(() => INDEX_LETTERS.filter((L) => grouped.has(L)), [grouped]);

  const scrollToLetter = useCallback((letter: string) => {
    const el = sectionRefs.current.get(letter);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="layer-index" role="region" aria-label="Generational layer cards A–Z">
      <p className="layer-index-lead muted">
        All people on active throughlines, sorted A–Z. Tap a row to set root; check to pin a throughline
        for data matching. Ancestors are never removed from the tree.
      </p>
      <div className="layer-index-body">
        <div
          ref={listRef}
          className="layer-index-list"
          role="list"
        >
          {filtered.length === 0 && (
            <p className="muted layer-index-empty">No layer cards match. Turn on a throughline or widen search.</p>
          )}
          {lettersPresent.map((letter) => (
            <section
              key={letter}
              className="layer-index-section"
              ref={(el) => {
                if (el) sectionRefs.current.set(letter, el);
                else sectionRefs.current.delete(letter);
              }}
            >
              <h3 className="layer-index-letter" id={`layer-letter-${letter}`}>
                {letter}
              </h3>
              <ul className="layer-index-rows">
                {grouped.get(letter)!.map((e) => {
                  const rec = individuals[e.id];
                  const y = birthYear(rec);
                  const pinned = throughlinePins.has(e.id);
                  return (
                    <li key={`${e.id}-${e.streamIdx}-${e.gen}`} className={`layer-index-row ${pinned ? "layer-index-row--pinned" : ""}`}>
                      <label className="layer-index-pin" title="Pin throughline for data matching">
                        <input
                          type="checkbox"
                          checked={pinned}
                          onChange={() => onTogglePin(e.id)}
                        />
                        <span className="sr-only">Pin {e.name}</span>
                      </label>
                      <button
                        type="button"
                        className="layer-index-row-main"
                        onClick={() => onPickRoot(e.id)}
                      >
                        <PortraitHero
                          url={rec?.p}
                          name={e.name}
                          bandClass={timeBandClass(y)}
                          size="thumb"
                        />
                        <span className="layer-index-row-text">
                          <span className="layer-index-row-name">{e.name}</span>
                          <span className="layer-index-row-meta mono muted">
                            gen {e.gen} · {e.streamLabel}
                            {y != null ? ` · ${y}` : ""} · {e.sex}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="layer-index-compare btn btn-small"
                        onClick={() => onPickCompare(e.id)}
                        title="Set compare"
                      >
                        ↔
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        {lettersPresent.length > 1 && (
          <nav className="layer-index-az" aria-label="Jump to letter">
            {INDEX_LETTERS.map((L) => {
              const on = grouped.has(L);
              return (
                <button
                  key={L}
                  type="button"
                  className={`layer-index-az-btn ${on ? "" : "layer-index-az-btn--off"}`}
                  disabled={!on}
                  onClick={() => scrollToLetter(L)}
                  aria-label={on ? `Jump to ${L}` : `${L} (empty)`}
                >
                  {L}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
