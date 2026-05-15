import type { IndiRec } from "./types";
import { birthYear, timeBandClass } from "./timeBands";
import { formatName } from "./trace";

export type LineageFlowCard = {
  id: string;
  name: string;
  sex?: string;
  year?: number | null;
  /** Extra line (e.g. realm for rulers) */
  detail?: string;
  bandClass: string;
};

type Props = {
  ariaLabel: string;
  /** Father/mother chain connectors */
  mode?: "chain" | "flat";
  /** Override auto lead copy */
  leadText?: string;
  /** Limit cards; lead notes truncation */
  maxItems?: number;
  /** Pedigree rows from compact tree */
  ids?: string[];
  individuals?: Record<string, IndiRec>;
  /** Pre-built rows (e.g. rulers) — used when non-empty; ignores ids/individuals */
  cards?: LineageFlowCard[];
  onPickRoot?: (id: string) => void;
};

function cardsFromIndi(ids: string[], individuals: Record<string, IndiRec>): LineageFlowCard[] {
  return ids.map((id) => {
    const rec = individuals[id];
    return {
      id,
      name: formatName(id, individuals),
      sex: rec?.s,
      year: birthYear(rec) ?? null,
      bandClass: timeBandClass(birthYear(rec)),
    };
  });
}

export function LineageFlowTree({
  ariaLabel,
  mode = "chain",
  leadText,
  maxItems,
  ids = [],
  individuals = {},
  cards: cardsProp,
  onPickRoot,
}: Props) {
  const built = cardsProp?.length ? cardsProp : cardsFromIndi(ids, individuals);
  const fullLen = built.length;
  const display = typeof maxItems === "number" && maxItems > 0 ? built.slice(0, maxItems) : built;
  const truncated = fullLen > display.length;

  const defaultLead =
    mode === "flat"
      ? onPickRoot
        ? "Stacked cards (same order as the list). Tap to set root."
        : "Stacked cards — read-only."
      : onPickRoot
        ? "Live flow (same order as the list). Tap a card to set that person as root."
        : "Live flow aligned with the list — read-only.";

  const lead =
    (leadText ?? defaultLead) +
    (truncated ? ` Showing ${display.length} of ${fullLen}.` : "");

  const showConnectors = mode === "chain";

  return (
    <div className="lineage-flow-card-tree" role="region" aria-label={ariaLabel}>
      <p className="lineage-flow-lead muted">{lead}</p>
      <div className={`lineage-flow ${mode === "flat" ? "lineage-flow--flat" : ""}`} role="list">
        {display.map((item, gen) => {
          const inner = (
            <>
              <span className="lineage-flow-gen mono" aria-hidden="true">
                {gen}
              </span>
              <span className="lineage-flow-card-main">
                <span className="mono lineage-flow-id">{item.id}</span>
                <span className="lineage-flow-name">{item.name}</span>
                {item.sex !== undefined && <span className="sex"> ({item.sex || "?"})</span>}
                {item.detail && <span className="lineage-flow-detail">{item.detail}</span>}
              </span>
              {item.year != null && <span className="lineage-flow-year mono">{item.year}</span>}
            </>
          );
          return (
            <div key={`${item.id}-${gen}`} className="lineage-flow-step" role="listitem">
              {showConnectors && gen > 0 && (
                <div className="lineage-flow-connector" aria-hidden="true">
                  <span className="lineage-flow-rod" />
                  <span className="lineage-flow-chev" />
                </div>
              )}
              {onPickRoot ? (
                <button type="button" className={`lineage-flow-node ${item.bandClass}`} onClick={() => onPickRoot(item.id)}>
                  {inner}
                </button>
              ) : (
                <div className={`lineage-flow-node ${item.bandClass}`}>{inner}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
