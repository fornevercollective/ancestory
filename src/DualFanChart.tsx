import type { IndiRec } from "./types";
import { formatBloodLabel, type BloodStored } from "./bloodStorage";
import { faceShapeShort, type FaceShape } from "./faceShapeStorage";
import { formatName } from "./trace";

/** One generation row: parallel streams (2 = dual, 4 = quad). */
export type StreamFanRow = { gen: number; ids: (string | null)[] };

type Props = {
  rows: StreamFanRow[];
  individuals: Record<string, IndiRec>;
  bloodMap: Record<string, BloodStored>;
  faceMap: Record<string, FaceShape>;
  /** Column titles; length must match each row’s `ids.length` (2 or 4). */
  titles: string[];
};

const MAX_RING = 56;

const PAT_A0 = (2 * Math.PI) / 3;
const PAT_A1 = (4 * Math.PI) / 3;
const MAT_A0 = -Math.PI / 3;
const MAT_A1 = Math.PI / 3;

/** SVG angles (clockwise from +x): west, north, east, south — matches table left→right as ring sweep. */
const QUAD_CENTER = [Math.PI, -Math.PI / 2, 0, Math.PI / 2];
const QUAD_HALF = Math.PI / 4 - 0.06;

const huePat = (g: number) => 200 + (g % 5) * 14;
const hueMat = (g: number) => 115 + (g % 5) * 12;
const hueQuad = (stream: number, g: number) => {
  const bases = [200, 115, 280, 38];
  return bases[stream % 4] + (g % 5) * 11;
};

/** Annulus sector path (angles in radians, SVG y-down, CCW from +x). */
function sectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number
): string {
  const x0o = cx + rOuter * Math.cos(a0);
  const y0o = cy + rOuter * Math.sin(a0);
  const x1o = cx + rOuter * Math.cos(a1);
  const y1o = cy + rOuter * Math.sin(a1);
  const x1i = cx + rInner * Math.cos(a1);
  const y1i = cy + rInner * Math.sin(a1);
  const x0i = cx + rInner * Math.cos(a0);
  const y0i = cy + rInner * Math.sin(a0);
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 0 ${sweep} ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 0 ${1 - sweep} ${x0i} ${y0i} Z`;
}

function dupHint(ids: (string | null)[], streamIdx: number, id: string, titles: string[]): string {
  const dupCols = ids
    .map((x, j) => (j !== streamIdx && x === id ? titles[j] ?? `col ${j + 1}` : null))
    .filter((x): x is string => Boolean(x));
  if (dupCols.length === 0) return "";
  return ` · also in ${dupCols.join(", ")}`;
}

export function DualFanChart({ rows, individuals, bloodMap, faceMap, titles }: Props) {
  const nStreams = rows[0] ? rows[0].ids.length : titles.length;
  const G = Math.min(rows.length, MAX_RING);
  const slice = rows.slice(0, G);
  const cx = 220;
  const cy = 220;
  const rMax = 200;
  const rMin = 28;
  const dr = (rMax - rMin) / Math.max(1, G);

  const isQuad = nStreams === 4;
  const isDual = nStreams === 2;
  const colTitles = titles.slice(0, nStreams);

  if (!isDual && !isQuad) {
    return (
      <div className="dual-fan-wrap">
        <p className="muted dual-fan-lead">
          Ring fan supports <strong>2</strong> or <strong>4</strong> streams (dual or quad layout). This view has{" "}
          <strong>{nStreams}</strong> columns.
        </p>
      </div>
    );
  }

  return (
    <div className="dual-fan-wrap">
      <p className="dual-fan-lead">
        {isQuad ? (
          <>
            Radial <strong>quad</strong> fan — four streams as rings (columns 1–4). Hover sectors for names.
            When the same person appears in more than one column at one generation, tooltips note the overlap; sectors use
            a slightly lighter fill when that happens.
            Capped at {MAX_RING} generations; lower max gen in top controls for a smaller ring set.
          </>
        ) : (
          <>
            Radial “fan” with generations as rings:             <strong>{colTitles[0] ?? "Left"}</strong> (left wedge) vs <strong>{colTitles[1] ?? "Right"}</strong> (right
            wedge). Hover sectors for names. Capped at {MAX_RING}{" "}
            generations — lower max gen in top controls to redraw a smaller ring set.
          </>
        )}
      </p>
      <svg
        className="dual-fan-svg"
        viewBox="0 0 440 440"
        role="img"
        aria-label={isQuad ? "Quad lineage fan chart" : "Dual lineage fan chart"}
      >
        <rect x="0" y="0" width="440" height="440" fill="var(--panel)" rx="8" />
        {slice.map(({ gen, ids }, i) => {
          const r0 = rMin + i * dr;
          const r1 = rMin + (i + 1) * dr;
          const rowIds = ids.slice(0, nStreams);
          while (rowIds.length < nStreams) rowIds.push(null);

          if (isDual) {
            const [leftId, rightId] = rowIds;
            const leftName = leftId ? formatName(leftId, individuals) : "";
            const rightName = rightId ? formatName(rightId, individuals) : "";
            const leftTip = leftId
              ? `Gen ${gen} · ${leftName} · ${formatBloodLabel(bloodMap[leftId] ?? { abo: "", rh: "" })} ${faceShapeShort(faceMap[leftId] ?? "")}`.trim() +
                dupHint(rowIds, 0, leftId, colTitles)
              : "";
            const rightTip = rightId
              ? `Gen ${gen} · ${rightName} · ${formatBloodLabel(bloodMap[rightId] ?? { abo: "", rh: "" })} ${faceShapeShort(faceMap[rightId] ?? "")}`.trim() +
                dupHint(rowIds, 1, rightId, colTitles)
              : "";
            return (
              <g key={gen}>
                {leftId && (
                  <path
                    d={sectorPath(cx, cy, r0, r1, PAT_A0, PAT_A1)}
                    fill={`hsla(${huePat(gen)}, 38%, 42%, 0.55)`}
                    stroke="var(--border)"
                    strokeWidth={0.6}
                  >
                    <title>{leftTip}</title>
                  </path>
                )}
                {rightId && (
                  <path
                    d={sectorPath(cx, cy, r0, r1, MAT_A0, MAT_A1)}
                    fill={`hsla(${hueMat(gen)}, 32%, 38%, 0.55)`}
                    stroke="var(--border)"
                    strokeWidth={0.6}
                  >
                    <title>{rightTip}</title>
                  </path>
                )}
              </g>
            );
          }

          if (isQuad) {
            return (
              <g key={gen}>
                {[0, 1, 2, 3].map((si) => {
                  const id = rowIds[si];
                  if (!id) return null;
                  const c = QUAD_CENTER[si];
                  const a0 = c - QUAD_HALF;
                  const a1 = c + QUAD_HALF;
                  const name = formatName(id, individuals);
                  const tip =
                    `Gen ${gen} · ${colTitles[si] ?? `Stream ${si + 1}`} · ${name} · ` +
                    `${formatBloodLabel(bloodMap[id] ?? { abo: "", rh: "" })} ${faceShapeShort(faceMap[id] ?? "")}`.trim() +
                    dupHint(rowIds, si, id, colTitles);
                  const sameElsewhere = rowIds.some((x, j) => j !== si && x === id);
                  const fillAlpha = sameElsewhere ? 0.42 : 0.52;
                  return (
                    <path
                      key={si}
                      d={sectorPath(cx, cy, r0, r1, a0, a1)}
                      fill={`hsla(${hueQuad(si, gen)}, 36%, 40%, ${fillAlpha})`}
                      stroke="var(--border)"
                      strokeWidth={0.55}
                    >
                      <title>{tip}</title>
                    </path>
                  );
                })}
              </g>
            );
          }

          return null;
        })}
        <circle cx={cx} cy={cy} r={rMin - 4} fill="var(--bg)" stroke="var(--border)" strokeWidth={1} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="dual-fan-ct" fontSize={11}>
          root
        </text>
        {isDual && (
          <>
            <text x={70} y={32} className="dual-fan-legend" fontSize={11} fill="var(--muted)">
              ← {(colTitles[0] ?? "").slice(0, 28)}
              {(colTitles[0] ?? "").length > 28 ? "…" : ""}
            </text>
            <text x={280} y={32} className="dual-fan-legend" fontSize={11} fill="var(--muted)" textAnchor="end">
              {(colTitles[1] ?? "").slice(0, 28)}
              {(colTitles[1] ?? "").length > 28 ? "…" : ""} →
            </text>
          </>
        )}
        {isQuad && (
          <>
            <text x={52} y={cy} className="dual-fan-legend" fontSize={9.5} fill="var(--muted)" textAnchor="start">
              {(colTitles[0] ?? "").slice(0, 18)}
              {(colTitles[0] ?? "").length > 18 ? "…" : ""}
            </text>
            <text x={cx} y={26} className="dual-fan-legend" fontSize={9.5} fill="var(--muted)" textAnchor="middle">
              {(colTitles[1] ?? "").slice(0, 18)}
              {(colTitles[1] ?? "").length > 18 ? "…" : ""}
            </text>
            <text x={388} y={cy} className="dual-fan-legend" fontSize={9.5} fill="var(--muted)" textAnchor="end">
              {(colTitles[2] ?? "").slice(0, 18)}
              {(colTitles[2] ?? "").length > 18 ? "…" : ""}
            </text>
            <text x={cx} y={422} className="dual-fan-legend" fontSize={9.5} fill="var(--muted)" textAnchor="middle">
              {(colTitles[3] ?? "").slice(0, 22)}
              {(colTitles[3] ?? "").length > 22 ? "…" : ""}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
