import { useCallback, useEffect, useRef, useState } from "react";
import {
  addOsintFind,
  readOsintFinds,
  removeOsintFind,
  type OsintFind,
} from "./osintFindsStorage";

const SWIPE_THRESHOLD = 72;

type Props = {
  onLaunchSearch: (query: string) => void;
  /** Active card label — feeds deep-search hub rolling cycle */
  onActiveQueryChange?: (query: string) => void;
};

export function OsintFindsDeck({ onLaunchSearch, onActiveQueryChange }: Props) {
  const [finds, setFinds] = useState<OsintFind[]>(() => readOsintFinds());
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const dragXRef = useRef(0);

  const refresh = useCallback(() => setFinds(readOsintFinds()), []);

  const queue = finds;
  const queueKey = queue.map((f) => f.id).join("|");

  useEffect(() => {
    setIndex(0);
  }, [queueKey]);

  const advance = useCallback(() => {
    setIndex((i) => (queue.length ? (i + 1) % queue.length : 0));
    setDragX(0);
    dragXRef.current = 0;
  }, [queue.length]);

  const current = queue[index];
  const next = queue.length > 1 ? queue[(index + 1) % queue.length] : null;

  useEffect(() => {
    onActiveQueryChange?.(current?.label ?? "");
  }, [current?.label, onActiveQueryChange]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !current) return;
    dragging.current = true;
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    dragXRef.current = dx;
    setDragX(dx);
  };

  const onPointerUp = () => {
    if (!dragging.current || !current) return;
    dragging.current = false;
    const dx = dragXRef.current;
    if (dx < -SWIPE_THRESHOLD) {
      removeOsintFind(current.id);
      refresh();
      advance();
    } else if (dx > SWIPE_THRESHOLD) {
      onLaunchSearch(current.label);
      advance();
    } else {
      setDragX(0);
      dragXRef.current = 0;
    }
  };

  const onAdd = () => {
    const label = draft.trim();
    if (!label) return;
    addOsintFind(label);
    setDraft("");
    refresh();
    setIndex(0);
  };

  const posLabel = queue.length ? `${index + 1} / ${queue.length}` : "0 / 0";

  return (
    <div className="osint-deck" role="region" aria-label="OSINT new finds">
      <p className="osint-deck-lead muted">
        <strong>New finds only</strong> — leads you add for open research. Swipe left to dismiss a lead (not
        anyone in your GED). Swipe right to open in-app search. Your ancestry tree is browsed in the layer list above.
      </p>
      <div className="osint-deck-add">
        <input
          className="inp wide"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Name, place, or hypothesis to track…"
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
        />
        <button type="button" className="btn btn-small" disabled={!draft.trim()} onClick={onAdd}>
          Add find
        </button>
      </div>

      {queue.length === 0 ? (
        <p className="osint-deck-empty muted">No OSINT leads yet. Add a name or clue above.</p>
      ) : (
        <>
          <div className="osint-stack-wrap">
            {next && (
              <div className="osint-stack-back" aria-hidden="true">
                <div className="osint-find-card">
                  <h3>{next.label}</h3>
                  {next.notes && <p className="muted">{next.notes}</p>}
                </div>
              </div>
            )}
            <div
              className="osint-stack-front"
              style={{ transform: dragX ? `translate3d(${dragX}px,0,0)` : undefined }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div className="osint-find-card osint-find-card--active">
                <h3>{current!.label}</h3>
                {current!.notes && <p className="muted">{current!.notes}</p>}
                {dragX < -24 && <span className="discover-hint discover-hint--pass">Dismiss lead</span>}
                {dragX > 24 && <span className="discover-hint discover-hint--compare">Search</span>}
              </div>
            </div>
          </div>
          <p className="discover-pos muted mono">{posLabel}</p>
          <div className="discover-actions" role="toolbar">
            <button
              type="button"
              className="discover-act discover-act--pass"
              onClick={() => {
                removeOsintFind(current!.id);
                refresh();
                advance();
              }}
              title="Dismiss lead"
            >
              <span aria-hidden="true">✕</span>
              <span className="discover-act-label">Dismiss</span>
            </button>
            <button
              type="button"
              className="discover-act discover-act--compare"
              onClick={() => onLaunchSearch(current!.label)}
              title="Open in-app search"
            >
              <span aria-hidden="true">⌕</span>
              <span className="discover-act-label">Search</span>
            </button>
            <button type="button" className="discover-act discover-act--dual" onClick={advance} title="Next lead">
              <span aria-hidden="true">→</span>
              <span className="discover-act-label">Next</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
