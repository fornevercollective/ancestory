import { useCallback, useId, useState } from "react";
import { publicUrl } from "./rulersTestPath";

export type SniffedKind = "tree" | "rulers";

export function sniffJsonKind(text: string): SniffedKind | null {
  try {
    const o = JSON.parse(text) as Record<string, unknown>;
    if (o.individuals && o.families && typeof o.individuals === "object" && typeof o.families === "object") {
      return "tree";
    }
    if (Array.isArray(o.people)) {
      return "rulers";
    }
  } catch {
    return null;
  }
  return null;
}

function kindFromFilename(name: string): SniffedKind | null {
  const n = name.toLowerCase();
  if (n.includes("ruler")) return "rulers";
  if (n.includes("tree")) return "tree";
  return null;
}

type Props = {
  onTreeText: (text: string) => void;
  onRulersText: (text: string) => void;
  onClear: () => void;
  onIngestError: (msg: string) => void;
  treeFromFile: boolean;
  rulersFromFile: boolean;
  /** Resolved rulers fetch URL (bundled, override, or blob). */
  rulersUrlDisplay?: string;
  message: string | null;
};

export function FileDropToolbar({
  onTreeText,
  onRulersText,
  onClear,
  onIngestError,
  treeFromFile,
  rulersFromFile,
  rulersUrlDisplay,
  message,
}: Props) {
  const baseId = useId();
  const [pasteDraft, setPasteDraft] = useState("");
  const [dragOver, setDragOver] = useState<"tree" | "rulers" | null>(null);

  const handleFile = useCallback(
    async (file: File, forced?: SniffedKind) => {
      const text = await file.text();
      let kind = forced ?? kindFromFilename(file.name) ?? sniffJsonKind(text);
      if (!kind) {
        onIngestError("Could not tell tree vs rulers — use tree.json / rulers.json names or paste JSON.");
        return;
      }
      if (kind === "tree") onTreeText(text);
      else onRulersText(text);
    },
    [onTreeText, onRulersText, onIngestError]
  );

  const onDropZone =
    (kind: SniffedKind) =>
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(null);
      const f = e.dataTransfer.files?.[0];
      if (f) await handleFile(f, kind);
    };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const applyPaste = useCallback(() => {
    const text = pasteDraft.trim();
    const kind = sniffJsonKind(text);
    if (!kind) {
      onIngestError("Paste does not look like tree.json or rulers.json.");
      return;
    }
    if (kind === "tree") onTreeText(text);
    else onRulersText(text);
    setPasteDraft("");
  }, [pasteDraft, onTreeText, onRulersText, onIngestError]);

  const busy = treeFromFile || rulersFromFile;

  return (
    <section className="ingest-toolbar panel" aria-label="Load tree and rulers from files or paste">
      <div className="ingest-toolbar-row">
        <span className="ingest-toolbar-title">Quick load</span>
        <span className="ingest-toolbar-hint muted">
          Drop <strong>tree.json</strong> / <strong>rulers.json</strong> or paste — browser session only (blob URL).
        </span>
        {busy && (
          <button type="button" className="btn btn-small ingest-clear" onClick={onClear}>
            Clear files → use URL / defaults
          </button>
        )}
      </div>
      <div className="ingest-drops">
        <div
          className={`ingest-drop ${dragOver === "tree" ? "ingest-drop--active" : ""}`}
          onDragOver={(e) => {
            onDragOver(e);
            setDragOver("tree");
          }}
          onDragLeave={() => setDragOver((d) => (d === "tree" ? null : d))}
          onDrop={onDropZone("tree")}
        >
          <span className="ingest-drop-label">tree.json</span>
          <span className="ingest-drop-sub muted">Individuals + families</span>
          <label className="ingest-file-label">
            <input
              id={`${baseId}-tree`}
              type="file"
              accept=".json,application/json"
              className="ingest-file-input"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) await handleFile(f, "tree");
              }}
            />
            <span className="linkbtn">Choose file</span>
          </label>
        </div>
        <div
          className={`ingest-drop ${dragOver === "rulers" ? "ingest-drop--active" : ""}`}
          onDragOver={(e) => {
            onDragOver(e);
            setDragOver("rulers");
          }}
          onDragLeave={() => setDragOver((d) => (d === "rulers" ? null : d))}
          onDrop={onDropZone("rulers")}
        >
          <span className="ingest-drop-label">rulers.json</span>
          <span className="ingest-drop-sub muted">Rulers tab export</span>
          <label className="ingest-file-label">
            <input
              id={`${baseId}-rulers`}
              type="file"
              accept=".json,application/json"
              className="ingest-file-input"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) await handleFile(f, "rulers");
              }}
            />
            <span className="linkbtn">Choose file</span>
          </label>
        </div>
      </div>
      <details className="ingest-paste">
        <summary>Paste JSON instead</summary>
        <div className="ingest-paste-body">
          <textarea
            className="inp ingest-paste-ta"
            value={pasteDraft}
            onChange={(e) => setPasteDraft(e.target.value)}
            placeholder="Paste full tree.json or rulers.json…"
            rows={4}
            spellCheck={false}
          />
          <div className="ingest-paste-actions">
            <button type="button" className="btn btn-small" onClick={applyPaste} disabled={!pasteDraft.trim()}>
              Parse &amp; load
            </button>
          </div>
        </div>
      </details>
      {message && <p className="ingest-msg">{message}</p>}
      <p className="ingest-status muted">
        Tree: {treeFromFile ? <strong>local file</strong> : <span>URL field below</span>}
        {" · "}
        Rulers: {rulersFromFile ? <strong>local file</strong> : <span>{rulersUrlDisplay ?? publicUrl("rulers.json")}</span>}
      </p>
    </section>
  );
}
