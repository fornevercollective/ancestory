import { useCallback, useEffect, useState } from "react";
import { ExifOsintPanel } from "./ExifOsintPanel";
import { OsintDeepSearchHub } from "./OsintDeepSearchHub";
import { OsintFindsDeck } from "./OsintFindsDeck";
import { OsintInternalViewer } from "./OsintInternalViewer";
import type { OsintViewRequest } from "./osintInternalContent";
import { buildOsintLauncherUrl, launcherMeta, type OsintHit } from "./osintSearch";

type Props = {
  seedQuery?: string;
  prefill?: string;
  autoCycle?: boolean;
};

export function OsintWorkbench({ seedQuery = "", prefill = "", autoCycle }: Props) {
  const [view, setView] = useState<OsintViewRequest | null>(null);
  const [activeQuery, setActiveQuery] = useState(seedQuery);

  useEffect(() => {
    if (seedQuery.trim()) setActiveQuery(seedQuery);
  }, [seedQuery]);

  const openUrl = useCallback((req: OsintViewRequest) => {
    setView(req);
    document.getElementById("osint-viewer")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const openLauncher = useCallback(
    (id: string, query: string) => {
      const url = buildOsintLauncherUrl(id, query);
      if (!url) return;
      const meta = launcherMeta(id);
      openUrl({
        url,
        title: meta ? `${meta.name}${query.trim() ? `: ${query.trim()}` : ""}` : query || url,
        source: meta?.category ?? id,
      });
    },
    [openUrl]
  );

  const openHit = useCallback(
    (hit: OsintHit) => {
      openUrl({
        url: hit.url,
        title: hit.title,
        source: hit.source,
        snippet: hit.snippet,
      });
    },
    [openUrl]
  );

  const onDeckSearch = useCallback(
    (query: string) => {
      openLauncher("ddg", query);
    },
    [openLauncher]
  );

  return (
    <div className="osint-workbench">
      <ExifOsintPanel />
      <OsintFindsDeck onLaunchSearch={onDeckSearch} onActiveQueryChange={setActiveQuery} />
      <OsintDeepSearchHub
        seedQuery={activeQuery}
        prefill={prefill}
        autoCycle={autoCycle ?? activeQuery.trim().length >= 2}
        onOpenHit={openHit}
        onOpenLauncher={openLauncher}
      />
      <div id="osint-viewer">
        <OsintInternalViewer request={view} onClose={() => setView(null)} />
      </div>
    </div>
  );
}
