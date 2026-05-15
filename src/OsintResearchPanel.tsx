import { useCallback, useId, useState } from "react";

/** Open every <details> inside the app shell (ingest paste, blood/morph cards, etc.). */
function expandAllCollapsiblesBelow() {
  document.querySelectorAll(".app-wide details, .app details").forEach((el) => {
    try {
      (el as HTMLDetailsElement).open = true;
    } catch {
      /* ignore */
    }
  });
}

function firstLine(text: string): string {
  return text.trim().split(/\r?\n/)[0]?.trim() ?? "";
}

type Props = {
  /** When true, the research strip starts open */
  defaultOpen?: boolean;
};

/**
 * Browser-only “OSINT” helper: opens public search pages with your query.
 * Does not scrape third-party sites or call paid APIs from this app.
 */
export function OsintResearchPanel({ defaultOpen = false }: Props) {
  const baseId = useId();
  const [prompt, setPrompt] = useState("");

  const openInNewTab = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const withQuery = useCallback(
    (build: (encoded: string) => string) => {
      const raw = firstLine(prompt);
      if (!raw) return;
      openInNewTab(build(encodeURIComponent(raw)));
    },
    [prompt, openInNewTab]
  );

  return (
    <details className="osint-research panel" open={defaultOpen}>
      <summary>Open research helper — search / OSINT prompts (browser only)</summary>
      <div className="osint-research-body">
        <p className="osint-research-lead muted">
          Use this as a scratchpad: type a <strong>name, place, or question</strong>, then launch web searches in new
          tabs. This app does <strong>not</strong> run automated scraping or background lookups — you stay in control.
          Re-export <code className="mono">rulers.json</code> after enriching your GED (residences, marriage places,
          etc.); the export now carries more life-path fields when present.
        </p>
        <label className="osint-research-label" htmlFor={`${baseId}-prompt`}>
          Search / prompt (first line is used for quick links)
        </label>
        <textarea
          id={`${baseId}-prompt`}
          className="inp osint-research-ta"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Henry II Chinon marriage · or paste notes to refine before searching…"
          spellCheck={true}
        />
        <div className="osint-research-actions">
          <button
            type="button"
            className="btn btn-small"
            disabled={!prompt.trim()}
            onClick={() => withQuery((e) => `https://duckduckgo.com/?q=${e}`)}
          >
            DuckDuckGo
          </button>
          <button
            type="button"
            className="btn btn-small"
            disabled={!prompt.trim()}
            onClick={() => withQuery((e) => `https://en.wikipedia.org/w/index.php?search=${e}`)}
          >
            Wikipedia
          </button>
          <button
            type="button"
            className="btn btn-small"
            disabled={!prompt.trim()}
            onClick={() => withQuery((e) => `https://www.google.com/search?q=${e}`)}
          >
            Google
          </button>
          <button
            type="button"
            className="btn btn-small"
            disabled={!prompt.trim()}
            onClick={() =>
              withQuery((e) => `https://www.wikidata.org/w/index.php?search=${e}&title=Special:Search&fulltext=1`)
            }
          >
            Wikidata
          </button>
          <button
            type="button"
            className="btn btn-small"
            disabled={!prompt.trim()}
            onClick={() => {
              const raw = firstLine(prompt);
              if (!raw) return;
              openInNewTab(
                `https://duckduckgo.com/?q=${encodeURIComponent(`site:familysearch.org ${raw}`)}`
              );
            }}
            title="DuckDuckGo restricted to familysearch.org"
          >
            FamilySearch (via DDG)
          </button>
        </div>
        <div className="osint-research-expand">
          <button type="button" className="btn btn-small" onClick={expandAllCollapsiblesBelow}>
            Expand all collapsible sections below
          </button>
          <span className="muted osint-research-expand-hint">
            Opens every <code className="mono">details</code> (paste JSON, blood/morph panels, etc.) in one click.
          </span>
        </div>
      </div>
    </details>
  );
}
