import { useCallback, useId, useState } from "react";
import { extractExifOsint, exifOsintToNotes, formatExifOsintSummary, type ExifOsintPack } from "./exifOsint";
import { addOsintFind } from "./osintFindsStorage";

export function ExifOsintPanel() {
  const id = useId();
  const [pack, setPack] = useState<ExifOsintPack | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(async (f: File | undefined | null) => {
    if (!f) return;
    setBusy(true);
    try {
      const p = await extractExifOsint(f);
      setPack(p);
    } finally {
      setBusy(false);
    }
  }, []);

  const saveFind = useCallback(() => {
    if (!pack) return;
    const label = formatExifOsintSummary(pack).slice(0, 240);
    addOsintFind(label || "EXIF capture", exifOsintToNotes(pack));
    setPack(null);
  }, [pack]);

  return (
    <section className="panel exif-osint-panel" aria-label="Image EXIF (browser)">
      <div className="panel-head-row">
        <span className="panel-kicker">OSINT · EXIF</span>
        <span className="muted" style={{ fontSize: 11 }}>
          JPEG/PNG/HEIC in-browser via exifr — cross-check with desktop exiftool when possible.
        </span>
      </div>
      <div className="exif-osint-row">
        <label className="linkbtn" htmlFor={`${id}-exif`}>
          Choose image
        </label>
        <input
          id={`${id}-exif`}
          type="file"
          accept="image/*,.heic,.heif,.avif"
          className="ingest-file-input"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void onFile(f);
          }}
        />
        {pack && (
          <button type="button" className="btn btn-small" onClick={saveFind}>
            Save to OSINT finds
          </button>
        )}
      </div>
      {busy && <p className="muted">Reading metadata…</p>}
      {pack && !busy && (
        <pre className="exif-osint-pre">{JSON.stringify(pack, null, 2)}</pre>
      )}
    </section>
  );
}
