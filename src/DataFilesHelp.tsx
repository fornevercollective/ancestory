import { GITHUB_DIST_DIR, GITHUB_PUBLIC_DIR } from "./repoDataUrls";

export function DataFilesHelp() {
  return (
    <section className="data-files-help panel" aria-label="Repository data files">
      <h3 className="h3">Data files</h3>
      <p className="data-files-help-lead muted">
        Editable source JSON for this app lives under{" "}
        <a href={GITHUB_PUBLIC_DIR} target="_blank" rel="noreferrer">
          <code className="mono">public/</code> on GitHub
        </a>
        . The Vite build copies those files into the site output; CI deploys that folder to Pages.
      </p>
      <p className="data-files-help-note muted">
        <strong>dist/</strong> is build output (often git-ignored) — not the hand-edited source. Use{" "}
        <a href={GITHUB_PUBLIC_DIR} target="_blank" rel="noreferrer">
          <code className="mono">public/</code>
        </a>{" "}
        for <code className="mono">tree.json</code> and <code className="mono">rulers.json</code> you intend to
        commit. The <code className="mono">dist/</code> layout is illustrated in{" "}
        <a href={GITHUB_DIST_DIR} target="_blank" rel="noreferrer">
          <code className="mono">dist/</code> on GitHub
        </a>{" "}
        (may be empty if not committed).
      </p>
    </section>
  );
}
