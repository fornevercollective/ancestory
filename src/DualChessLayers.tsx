import type { IndiRec } from "./types";
import { formatBloodLabel, type ABO, type Rh } from "./bloodStorage";
import { faceShapeShort, type FaceShape } from "./faceShapeStorage";
import { formatName } from "./trace";
import type { StreamFanRow } from "./DualFanChart";

type Props = {
  rows: StreamFanRow[];
  individuals: Record<string, IndiRec>;
  bloodMap: Record<string, BloodStored>;
  faceMap: Record<string, FaceShape>;
  /** Column headers; length 2 (dual) or 4 (quad). */
  titles: string[];
};

const MAX_ROWS = 120;

function ChessCard({
  id,
  individuals,
  bloodMap,
  faceMap,
  streamIdx,
}: {
  id: string;
  individuals: Record<string, IndiRec>;
  bloodMap: Record<string, BloodStored>;
  faceMap: Record<string, FaceShape>;
  streamIdx: number;
}) {
  const ind = individuals[id];
  const b = bloodMap[id] ?? { abo: "" as ABO, rh: "" as Rh };
  const f = faceMap[id] ?? ("" as FaceShape);
  const blood = formatBloodLabel(b);
  const face = faceShapeShort(f);
  const pheno = [blood, face].filter(Boolean).join(" · ") || "—";
  const tone =
    streamIdx === 0
      ? "left"
      : streamIdx === 1
        ? "right"
        : streamIdx === 2
          ? "q2"
          : "q3";
  return (
    <div className={`dual-chess-card dual-chess-card--${tone}`}>
      <span className="mono dual-chess-id">{id}</span>
      <div className="dual-chess-name">{formatName(id, individuals)}</div>
      <div className="dual-chess-meta">
        <span className="sex">({ind?.s ?? "?"})</span>
      </div>
      <div className="dual-chess-pheno mono" title="Blood & face (browser-stored, not GEDCOM)">
        {pheno}
      </div>
    </div>
  );
}

export function DualChessLayers({ rows, individuals, bloodMap, faceMap, titles }: Props) {
  const n = titles.length;
  const slice = rows.slice(0, MAX_ROWS);
  const gridCols = `2.25rem repeat(${n}, minmax(0, 1fr))`;

  if (n !== 2 && n !== 4) {
    return (
      <div className="dual-chess-wrap">
        <p className="muted dual-chess-lead">
          Layer cards support <strong>2</strong> or <strong>4</strong> columns. Current layout has <strong>{n}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="dual-chess-wrap">
      <p className="dual-chess-lead">
        Generations as horizontal <strong>layers</strong>: each row is one generation; columns are the{" "}
        {n === 4 ? "four parallel streams (quad)." : "two streams."} Showing first <strong>{slice.length}</strong> of{" "}
        <strong>{rows.length}</strong> rows — lower max gen if you need full depth in table view.
      </p>
      <div className="dual-chess-head" style={{ gridTemplateColumns: gridCols }}>
        <span className="dual-chess-gen-h" aria-hidden="true" />
        {titles.slice(0, n).map((t, i) => (
          <span key={i} className="dual-chess-col-h" title={t}>
            {truncateTitle(t, n === 4 ? 22 : 48)}
          </span>
        ))}
      </div>
      <div className="dual-chess-board" role="list">
        {slice.map(({ gen, ids }) => {
          const cells = ids.slice(0, n);
          while (cells.length < n) cells.push(null);
          return (
            <div key={gen} className="dual-chess-layer" style={{ gridTemplateColumns: gridCols }} role="listitem">
              <div className="dual-chess-gen mono" title={`Generation ${gen}`}>
                {gen}
              </div>
              {cells.map((cellId, si) => (
                <div key={si} className="dual-chess-cell">
                  {cellId ? (
                    <ChessCard
                      id={cellId}
                      individuals={individuals}
                      bloodMap={bloodMap}
                      faceMap={faceMap}
                      streamIdx={si}
                    />
                  ) : (
                    <div className="dual-chess-empty muted-empty">—</div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function truncateTitle(t: string, max: number): string {
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
