import { useCallback, useState } from "react";
import { kindFromFilename, sniffJsonKind, type SniffedKind } from "./jsonIngest";

type Options = {
  onTreeText: (text: string) => void;
  onRulersText: (text: string) => void;
  onIngestError: (msg: string) => void;
};

export function useJsonIngest({ onTreeText, onRulersText, onIngestError }: Options) {
  const [pasteDraft, setPasteDraft] = useState("");
  const [dragOver, setDragOver] = useState<SniffedKind | null>(null);

  const handleFile = useCallback(
    async (file: File, forced?: SniffedKind) => {
      const text = await file.text();
      const kind = forced ?? kindFromFilename(file.name) ?? sniffJsonKind(text);
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
    (kind: SniffedKind) => async (e: React.DragEvent) => {
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

  return {
    pasteDraft,
    setPasteDraft,
    dragOver,
    setDragOver,
    handleFile,
    onDropZone,
    onDragOver,
    applyPaste,
  };
}
