import { useCallback, useEffect, useState } from "react";
import {
  archiveEmbedUrl,
  loadOsintInternalContent,
  type OsintInternalPayload,
  type OsintViewRequest,
} from "./osintInternalContent";
import { osintSourceColor } from "./osintSearch";

type Props = {
  request: OsintViewRequest | null;
  onClose: () => void;
};

export function OsintInternalViewer({ request, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<OsintInternalPayload | null>(null);
  const [viewMode, setViewMode] = useState<"reader" | "embed">("reader");
  const [useArchive, setUseArchive] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const load = useCallback(async (req: OsintViewRequest) => {
    const ac = new AbortController();
    setLoading(true);
    setPayload(null);
    setIframeBlocked(false);
    setUseArchive(false);
    try {
      const p = await loadOsintInternalContent(req, ac.signal);
      setPayload(p);
      setViewMode(p.mode === "reader" && p.html ? "reader" : "embed");
    } catch (e) {
      setPayload({
        mode: "embed",
        title: req.title,
        sourceUrl: req.url,
        embedUrl: req.url,
        embedMirror: "direct",
        error: e instanceof Error ? e.message : "Could not load preview",
      });
      setViewMode("embed");
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!request) {
      setPayload(null);
      return;
    }
    void load(request);
  }, [request, load]);

  if (!request) return null;

  const embedSrc = (() => {
    if (!payload?.embedUrl && !request.url) return "";
    const base = payload?.embedUrl ?? request.url;
    return useArchive ? archiveEmbedUrl(base) : base;
  })();

  const sourceColor = osintSourceColor(request.source);

  return (
    <div className="osint-viewer" role="dialog" aria-label="In-app research view" aria-modal="false">
      <div className="osint-viewer-chrome">
        <div className="osint-viewer-chrome-left">
          <span
            className="osint-hub-hit-src"
            style={{ borderColor: sourceColor, color: sourceColor }}
          >
            {request.source}
          </span>
          <h3 className="osint-viewer-title">{payload?.title ?? request.title}</h3>
        </div>
        <div className="osint-viewer-chrome-actions">
          <button
            type="button"
            className={`btn btn-small ${viewMode === "reader" ? "" : "btn-muted"}`}
            disabled={!payload?.html && !payload?.text}
            onClick={() => setViewMode("reader")}
          >
            Reader
          </button>
          <button
            type="button"
            className={`btn btn-small ${viewMode === "embed" ? "" : "btn-muted"}`}
            onClick={() => setViewMode("embed")}
          >
            Embed
          </button>
          <button
            type="button"
            className={`btn btn-small ${useArchive ? "" : "btn-muted"}`}
            onClick={() => {
              setUseArchive((v) => !v);
              setIframeBlocked(false);
            }}
            title="Load via web.archive.org when a site blocks embedding"
          >
            {useArchive ? "Archive on" : "Archive"}
          </button>
          <button type="button" className="btn btn-small" onClick={onClose} aria-label="Close viewer">
            Close
          </button>
        </div>
      </div>

      {loading && (
        <p className="osint-viewer-loading muted" role="status">
          Loading in-app preview…
        </p>
      )}

      {!loading && payload?.error && <p className="osint-viewer-error muted">{payload.error}</p>}

      {!loading && viewMode === "reader" && payload?.html && (
        <div className="osint-viewer-reader" dangerouslySetInnerHTML={{ __html: payload.html }} />
      )}
      {!loading && viewMode === "reader" && !payload?.html && payload?.text && (
        <pre className="osint-viewer-reader osint-json-pre">{payload.text}</pre>
      )}

      {!loading && viewMode === "embed" && embedSrc && (
        <div className="osint-viewer-embed-wrap">
          {iframeBlocked && (
            <p className="osint-viewer-embed-hint muted">
              This site may block embedding — turn on <strong>Archive</strong> or use <strong>Reader</strong> when
              available.
            </p>
          )}
          <iframe
            key={embedSrc}
            className="osint-viewer-embed"
            title={payload?.title ?? request.title}
            src={embedSrc}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            onError={() => setIframeBlocked(true)}
          />
        </div>
      )}

      <p className="osint-viewer-src mono muted">
        {payload?.sourceUrl ?? request.url}
      </p>
    </div>
  );
}
