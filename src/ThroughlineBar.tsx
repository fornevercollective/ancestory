import type { StreamFlags } from "./throughlineStorage";

type Props = {
  flags: StreamFlags;
  dualMode: "pat-mat" | "pat-pat" | "quad";
  onChange: (flags: StreamFlags) => void;
};

export function ThroughlineBar({ flags, dualMode, onChange }: Props) {
  const set = (key: keyof StreamFlags, v: boolean) => onChange({ ...flags, [key]: v });

  return (
    <div className="throughline-bar" role="group" aria-label="Throughlines to show in layer index">
      <span className="throughline-bar-title">Throughlines</span>
      <label className="throughline-chip">
        <input type="checkbox" checked={flags.pat} onChange={(e) => set("pat", e.target.checked)} />
        Patriline
      </label>
      {dualMode === "pat-mat" && (
        <label className="throughline-chip">
          <input type="checkbox" checked={flags.mat} onChange={(e) => set("mat", e.target.checked)} />
          Matriline
        </label>
      )}
      {dualMode === "pat-pat" && (
        <label className="throughline-chip">
          <input
            type="checkbox"
            checked={flags.patCompare}
            onChange={(e) => set("patCompare", e.target.checked)}
          />
          Compare patriline
        </label>
      )}
      {dualMode === "quad" && (
        <>
          <label className="throughline-chip">
            <input type="checkbox" checked={flags.mat} onChange={(e) => set("mat", e.target.checked)} />
            Root matriline
          </label>
          <label className="throughline-chip">
            <input
              type="checkbox"
              checked={flags.patCompare}
              onChange={(e) => set("patCompare", e.target.checked)}
            />
            Compare pat
          </label>
          <label className="throughline-chip">
            <input
              type="checkbox"
              checked={flags.matCompare}
              onChange={(e) => set("matCompare", e.target.checked)}
            />
            Compare mat
          </label>
        </>
      )}
    </div>
  );
}
