import { useMemo } from "react";
import type { FamRec, IndiRec } from "./types";
import type { PartnerOverlayMap } from "./partnerOverlayStorage";
import type { StreamFanRow } from "./DualFanChart";
import { personCardView } from "./personCardModel";
import { PersonPortraitCard } from "./PersonPortraitCard";

type DualMode = "pat-mat" | "pat-pat" | "quad";

type Props = {
  dualMode: DualMode;
  dualRows: StreamFanRow[];
  columnTitles: string[];
  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
  partnerOverlay?: PartnerOverlayMap;
  onPickRoot: (id: string) => void;
  onPickCompare: (id: string) => void;
};

type RowSlots = {
  left: string | null;
  right: string | null;
  left2: string | null;
  right2: string | null;
};

function truncateTitle(t: string, max = 28): string {
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function slotsForRow(row: StreamFanRow, dualMode: DualMode): RowSlots {
  if (dualMode === "quad") {
    return {
      left: row.ids[0] ?? null,
      right: row.ids[2] ?? null,
      left2: row.ids[1] ?? null,
      right2: row.ids[3] ?? null,
    };
  }
  return { left: row.ids[0] ?? null, right: row.ids[1] ?? null, left2: null, right2: null };
}

export function DualPortraitColumns({
  dualMode,
  dualRows,
  columnTitles,
  individuals,
  families,
  partnerOverlay,
  onPickRoot,
  onPickCompare,
}: Props) {
  const leftTitle = dualMode === "quad" ? "Root lines" : truncateTitle(columnTitles[0] ?? "Left");
  const rightTitle = dualMode === "quad" ? "Compare lines" : truncateTitle(columnTitles[1] ?? "Right");

  const rows = useMemo(() => dualRows, [dualRows]);

  const renderSlot = (id: string | null, side: "left" | "right") => {
    if (!id || !individuals[id]) {
      return <div className="dual-portrait-empty muted">—</div>;
    }
    const card = personCardView(id, individuals, families, partnerOverlay);
    if (!card) return <div className="dual-portrait-empty muted">—</div>;
    return (
      <PersonPortraitCard
        card={card}
        medium
        onActivate={() => (side === "left" ? onPickRoot(id) : onPickCompare(id))}
      />
    );
  };

  const renderRow = (row: StreamFanRow, index: number) => {
    const slots = slotsForRow(row, dualMode);
    const genLabel = row.gen ?? index;

    return (
      <div
        key={`gen-${genLabel}-${index}`}
        className="dual-portrait-row"
        id={`dual-portrait-gen-${index}`}
      >
        <div className="dual-portrait-row-label mono">Gen {genLabel}</div>
        <div className={`dual-portrait-grid ${dualMode === "quad" ? "dual-portrait-grid--quad" : ""}`}>
          <div className="dual-portrait-col">{renderSlot(slots.left, "left")}</div>
          <div className="dual-portrait-col">{renderSlot(slots.right, "right")}</div>
          {dualMode === "quad" && (
            <>
              <div className="dual-portrait-col dual-portrait-col--sub">{renderSlot(slots.left2, "left")}</div>
              <div className="dual-portrait-col dual-portrait-col--sub">{renderSlot(slots.right2, "right")}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dual-portrait-columns" role="region" aria-label="Dual portrait compare">
      <div className="dual-portrait-col-headers">
        <span className="dual-portrait-col-label">{leftTitle}</span>
        <span className="dual-portrait-col-label">{rightTitle}</span>
      </div>

      {rows.length === 0 ? (
        <p className="dual-portrait-empty dual-portrait-empty--block muted">No generations in this line layout.</p>
      ) : (
        <div className="dual-portrait-scroll" tabIndex={0} aria-label="Generations — scroll vertically">
          {rows.map((row, i) => renderRow(row, i))}
        </div>
      )}

      <p className="dual-portrait-hint muted">Scroll for more generations · tap left or right card to set root or compare.</p>
    </div>
  );
}
