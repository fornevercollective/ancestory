import { useEffect, useState } from "react";

/** Milliseconds since `active` became true; resets when inactive. */
export function useGeocodeElapsedMs(active: boolean): number {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!active) {
      setMs(0);
      return;
    }
    const t0 = Date.now();
    const id = window.setInterval(() => setMs(Date.now() - t0), 200);
    return () => clearInterval(id);
  }, [active]);
  return ms;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
  const s = ms / 1000;
  return s >= 60 ? `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s` : `${s.toFixed(1)}s`;
}

type Props = {
  active: boolean;
  elapsedMs: number;
  /** Shown under the timer (e.g. current status line). */
  detail?: string;
};

export function MapGeocodeOverlay({ active, elapsedMs, detail }: Props) {
  if (!active) return null;
  return (
    <div
      className="map-busy-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Map is geocoding places"
    >
      <div className="map-busy-card">
        <span className="map-busy-spinner" aria-hidden />
        <div className="map-busy-copy">
          <span className="map-busy-title">Geocoding map…</span>
          <span className="map-busy-time">{formatElapsed(elapsedMs)}</span>
          {detail?.trim() ? <span className="map-busy-detail">{detail}</span> : null}
        </div>
      </div>
    </div>
  );
}
