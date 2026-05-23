import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  OSINT_LAUNCHERS,
  osintSourceColor,
  readOsintCycleMs,
  readOsintCycleOn,
  searchOsintContrail,
  writeOsintCycleMs,
  writeOsintCycleOn,
  type OsintHit,
} from "./osintSearch";

function firstLine(text: string): string {
  return text.trim().split(/\r?\n/)[0]?.trim() ?? "";
}

type Props = {
  /** Triggers rolling deep-search when set (e.g. active OSINT deck card) */
  seedQuery?: string;
  /** Fills the textarea only — does not auto-run */
  prefill?: string;
  /** Highlight launchers on a timer */
  autoCycle?: boolean;
  compact?: boolean;
  onOpenHit?: (hit: OsintHit) => void;
  onOpenLauncher?: (id: string, query: string) => void;
};

export function OsintDeepSearchHub({
  seedQuery = "",
  prefill = "",
  autoCycle = true,
  compact = false,
  onOpenHit,
  onOpenLauncher,
}: Props) {
  const baseId = useId();
  const [prompt, setPrompt] = useState(seedQuery);
  const [cycleOn, setCycleOn] = useState(() => readOsintCycleOn());
  const [cycleMs, setCycleMs] = useState(() => readOsintCycleMs());
  const [cycleIndex, setCycleIndex] = useState(0);
  const [results, setResults] = useState<OsintHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const lastAutoQuery = useRef("");

  useEffect(() => {
    if (seedQuery.trim()) setPrompt(seedQuery);
  }, [seedQuery]);

  useEffect(() => {
    if (prefill.trim()) setPrompt((p) => (p.trim() ? p : prefill));
  }, [prefill]);

  const query = firstLine(prompt);

  useEffect(() => {
    if (!autoCycle || !cycleOn || OSINT_LAUNCHERS.length < 2) return;
    const id = window.setInterval(() => {
      setCycleIndex((i) => (i + 1) % OSINT_LAUNCHERS.length);
    }, cycleMs);
    return () => clearInterval(id);
  }, [autoCycle, cycleOn, cycleMs]);

  const runDeepSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setSearching(true);
    setResults([]);
    setStatus("Starting deep search cycle…");
    try {
      let finalCount = 0;
      await searchOsintContrail(
        trimmed,
        ({ results: r, index, total, connector }) => {
          finalCount = r.length;
          setResults(r.slice());
          setStatus(`Rolling ${index + 1}/${total} — ${connector}`);
        },
        ac.signal
      );
      if (!ac.signal.aborted && finalCount > 0) {
        setStatus(`Done — ${finalCount} hits — tap a result to read in-app`);
      }
    } catch {
      if (!ac.signal.aborted) setStatus("Search interrupted.");
    } finally {
      if (!ac.signal.aborted) {
        setSearching(false);
        setStatus((prev) => {
          if (prev.startsWith("Rolling")) return `Loaded — select a result below`;
          return prev;
        });
      }
    }
  }, []);

  useEffect(() => {
    const q = seedQuery.trim();
    if (!q || q.length < 2 || !autoCycle) return;
    if (lastAutoQuery.current === q) return;
    lastAutoQuery.current = q;
    const t = window.setTimeout(() => void runDeepSearch(q), 700);
    return () => clearTimeout(t);
  }, [seedQuery, autoCycle, runDeepSearch]);

  const toggleCycle = () => {
    setCycleOn((on) => {
      const next = !on;
      writeOsintCycleOn(next);
      return next;
    });
  };

  const onCycleMsChange = (ms: number) => {
    setCycleMs(ms);
    writeOsintCycleMs(ms);
  };

  const activeLauncher = OSINT_LAUNCHERS[cycleIndex];

  return (
    <div className={`osint-hub ${compact ? "osint-hub--compact" : ""}`} role="region" aria-label="Deep search hub">
      <p className="osint-hub-lead muted">
        Free OSINT &amp; deep search — Social Blade, OSINT Framework, KeyCDN, all major wikis (incl. Grokipedia),
        socials, archives. Results load in a <strong>rolling cycle</strong>; everything opens in the <strong>in-app
        viewer</strong> below (Reader API text or Embed — use Archive if a site blocks framing).
      </p>

      <label className="osint-research-label" htmlFor={`${baseId}-prompt`}>
        Query
      </label>
      <textarea
        id={`${baseId}-prompt`}
        className="inp osint-research-ta"
        rows={compact ? 2 : 3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Name, place, handle, domain, or hypothesis…"
        spellCheck={true}
      />

      <div className="osint-hub-controls">
        <button
          type="button"
          className="btn btn-small"
          disabled={!query || searching}
          onClick={() => void runDeepSearch(query)}
        >
          {searching ? "Searching…" : "Run deep search cycle"}
        </button>
        <button
          type="button"
          className="btn btn-small"
          disabled={!query}
          onClick={() => onOpenLauncher?.("ddg", query)}
        >
          Quick DDG
        </button>
        <button
          type="button"
          className={`btn btn-small ${cycleOn ? "" : "btn-muted"}`}
          onClick={toggleCycle}
          title="Auto-rotate launcher highlight"
        >
          {cycleOn ? "Cycle on" : "Cycle off"}
        </button>
        <label className="osint-hub-cycle-ms muted">
          <span className="sr-only">Cycle interval</span>
          <select
            className="sel sel-tiny"
            value={cycleMs}
            onChange={(e) => onCycleMsChange(Number(e.target.value))}
            aria-label="Launcher cycle interval"
          >
            <option value={3000}>3s</option>
            <option value={4000}>4s</option>
            <option value={6000}>6s</option>
            <option value={8000}>8s</option>
          </select>
        </label>
      </div>

      {activeLauncher && (
        <div className="osint-hub-cycle-spotlight" aria-live="polite">
          <span className="osint-hub-cycle-label muted">Rolling launcher</span>
          <button
            type="button"
            className="osint-hub-cycle-active"
            disabled={!query && activeLauncher.id !== "osint-fw"}
            onClick={() => onOpenLauncher?.(activeLauncher.id, query)}
            title={activeLauncher.name}
          >
            <span className="osint-hub-cycle-icon">{activeLauncher.icon}</span>
            <span>{activeLauncher.name}</span>
          </button>
        </div>
      )}

      <div className="osint-hub-launchers" role="list" aria-label="Search launchers">
        {OSINT_LAUNCHERS.map((l, i) => (
          <button
            key={l.id}
            type="button"
            role="listitem"
            className={`osint-hub-chip osint-hub-chip--${l.category} ${i === cycleIndex && cycleOn ? "osint-hub-chip--active" : ""}`}
            disabled={!query && l.id !== "osint-fw"}
            onClick={() => onOpenLauncher?.(l.id, query)}
            title={l.name}
          >
            <span className="osint-hub-chip-icon">{l.icon}</span>
            <span className="osint-hub-chip-name">{l.name}</span>
          </button>
        ))}
      </div>

      {status && <p className="osint-hub-status mono muted">{status}</p>}

      {results.length > 0 && (
        <ul className="osint-hub-results" aria-label="Deep search results">
          {results.map((hit, i) => (
            <li key={`${hit.url}-${i}`} className="osint-hub-hit">
              <button
                type="button"
                className="osint-hub-hit-link"
                onClick={() => onOpenHit?.(hit)}
              >
                <span
                  className="osint-hub-hit-src"
                  style={{ borderColor: osintSourceColor(hit.source), color: osintSourceColor(hit.source) }}
                >
                  {hit.source}
                </span>
                <span className="osint-hub-hit-title">{hit.title}</span>
              </button>
              {hit.snippet && <p className="osint-hub-hit-snippet muted">{hit.snippet}</p>}
            </li>
          ))}
        </ul>
      )}

      <p className="osint-hub-foot muted">
        Optional CORS proxy: <code className="mono">localStorage.ancestory-fetch-proxy-url</code> (same as mueee{" "}
        <code className="mono">uvspeed-fetch-proxy-url</code>) for Grokipedia / DuckDuckGo JSON.
      </p>
    </div>
  );
}
