import { useMemo } from "react";

export type StreamBloodTally = { pat: Record<string, number>; mat: Record<string, number> };

type Props = {
  leftMixPct: number;
  mixLeftLabel: string;
  mixRightLabel: string;
  patDepth: number;
  matDepth: number;
  bloodTally: StreamBloodTally;
  onStreamFocus: (stream: "pat" | "mat") => void;
};

function topEntries(tally: Record<string, number>, max = 4): [string, number][] {
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max);
}

export function DualDnaStreamCharts({
  leftMixPct,
  mixLeftLabel,
  mixRightLabel,
  patDepth,
  matDepth,
  bloodTally,
  onStreamFocus,
}: Props) {
  const patBar = useMemo(() => topEntries(bloodTally.pat), [bloodTally.pat]);
  const matBar = useMemo(() => topEntries(bloodTally.mat), [bloodTally.mat]);
  const maxCount = Math.max(
    1,
    ...patBar.map(([, n]) => n),
    ...matBar.map(([, n]) => n)
  );

  return (
    <div className="dual-dna-stream-charts" aria-label="Patriline vs matriline mix and blood tally">
      <div className="dual-dna-stream-mix">
        <span className="dual-dna-stream-mix-label">{mixLeftLabel}</span>
        <div className="dual-dna-stream-mix-bar" title={`${leftMixPct}% / ${100 - leftMixPct}%`}>
          <span className="dual-dna-stream-mix-pat" style={{ width: `${leftMixPct}%` }} />
          <span className="dual-dna-stream-mix-mat" style={{ width: `${100 - leftMixPct}%` }} />
        </div>
        <span className="dual-dna-stream-mix-label">{mixRightLabel}</span>
      </div>
      <div className="dual-dna-stream-depths">
        <button type="button" className="dual-dna-stream-chip dual-dna-stream-chip--pat" onClick={() => onStreamFocus("pat")}>
          Pat depth <strong>{patDepth}</strong>
        </button>
        <button type="button" className="dual-dna-stream-chip dual-dna-stream-chip--mat" onClick={() => onStreamFocus("mat")}>
          Mat depth <strong>{matDepth}</strong>
        </button>
      </div>
      <div className="dual-dna-stream-blood-grid">
        <div className="dual-dna-stream-blood-col">
          <span className="dual-dna-stream-blood-title">Blood (pat line)</span>
          {patBar.length === 0 ? (
            <span className="muted">No typed blood on pat line</span>
          ) : (
            <ul className="dual-dna-stream-blood-list">
              {patBar.map(([label, n]) => (
                <li key={label}>
                  <span className="dual-dna-stream-blood-label">{label}</span>
                  <span className="dual-dna-stream-blood-meter">
                    <span style={{ width: `${(n / maxCount) * 100}%` }} />
                  </span>
                  <span className="dual-dna-stream-blood-n">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dual-dna-stream-blood-col">
          <span className="dual-dna-stream-blood-title">Blood (mat line)</span>
          {matBar.length === 0 ? (
            <span className="muted">No typed blood on mat line</span>
          ) : (
            <ul className="dual-dna-stream-blood-list">
              {matBar.map(([label, n]) => (
                <li key={label}>
                  <span className="dual-dna-stream-blood-label">{label}</span>
                  <span className="dual-dna-stream-blood-meter dual-dna-stream-blood-meter--mat">
                    <span style={{ width: `${(n / maxCount) * 100}%` }} />
                  </span>
                  <span className="dual-dna-stream-blood-n">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="dual-dna-stream-hint muted">Tap pat/mat depth to accent that stream on dual birth map lines.</p>
    </div>
  );
}
