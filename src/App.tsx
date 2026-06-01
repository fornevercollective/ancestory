import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TreePayload } from "./types";
import { DataFilesHelp } from "./DataFilesHelp";
import { BloodMigrationPanel } from "./BloodMigrationPanel";
import { DualChessLayers } from "./DualChessLayers";
import { DualFanChart } from "./DualFanChart";
import { ExternalDnaToolsPanel } from "./ExternalDnaToolsPanel";
import { FileDropToolbar } from "./FileDropToolbar";
import { OsintResearchPanel } from "./OsintResearchPanel";
import { PlaceCurationPanel } from "./PlaceCurationPanel";
import { ResearchProposalsPanel } from "./ResearchProposalsPanel";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { MobileHomeShell } from "./MobileHomeShell";
import { WorldDirectoryPage } from "./WorldDirectoryPage";
import {
  genreSortWeight,
  identitySignal,
  personMatchesGenre,
  type IdentityGenre,
} from "./identityFilter";
import { LineageFlowTree } from "./LineageFlowTree";
import { GeneticPartnerOverlayPanel } from "./GeneticPartnerOverlayPanel";
import { PhenotypeSelects } from "./PhenotypeSelects";
import { usePartnerOverlay } from "./usePartnerOverlay";
import { usePhenotype } from "./usePhenotype";
import {
  MapView,
  MapScopeSelect,
  mapScopeSupportsConnectLine,
  mapScopeSupportsPartnersToggle,
  type MapScope,
} from "./MapView";
import { RulersPageTest } from "./RulersPageTest";
import { RulersView } from "./RulersView";
import { RAW_GITHUB_RULERS_MAIN, RAW_GITHUB_TREE_MAIN } from "./repoDataUrls";
import { leaveRulersTestPath, pathnameIsRulersTest, publicUrl } from "./rulersTestPath";
import { MediaThumb } from "./MediaThumb";
import { birthYear, rowRepresentativeYear, timeBandClass } from "./timeBands";
import { formatBloodLabel, type ABO, type Rh } from "./bloodStorage";
import { DualDnaStreamCharts } from "./DualDnaStreamCharts";
import { EventTimeline } from "./EventTimeline";
import { readResearchProposals } from "./researchEnrichmentsStorage";
import { AncestoryOracle } from "./AncestoryOracle";
import { LineageCompatibility } from "./LineageCompatibility";
import { AncestralResonance } from "./AncestralResonance";
import { ForwardLineagePanel } from "./ForwardLineagePanel";
import { readForwardConnections, forwardConnectionsToTimelineEvents } from "./forwardLineageStorage";
import { TribalElderStoriesPanel } from "./TribalElderStoriesPanel";
import { MAJOR_EVENTS } from "./majorHistoricalEvents";
import { TopNav } from "./TopNav";
import { NarrativeCockpit } from "./NarrativeCockpit";
import { DeepNarrativeCards } from "./DeepNarrativeCards";
import { readElderStories, elderStoriesToTimelineEvents } from "./tribalElderStorage";
import type { FaceShape } from "./faceShapeStorage";
import {
  ancestorSet,
  ancestorsByGeneration,
  formatName,
  matriline,
  patriline,
} from "./trace";

const DEFAULT_ROOT = "@P1@";
/** Default tree when no blob override — `publicUrl` uses site root in dev, Vite `base` in prod (e.g. `/ancestory/tree.json`). */
const DEFAULT_JSON = publicUrl("tree.json");

function useTreeData(url: string | null) {
  const [data, setData] = useState<TreePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (target: string) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const j = (await res.json()) as TreePayload;
      if (!j.individuals || !j.families) throw new Error("Invalid tree.json");
      setData(j);
    } catch (e) {
      setData(null);
      const msg = e instanceof Error ? e.message : String(e);
      const networkish =
        msg === "Failed to fetch" ||
        (e instanceof TypeError && /fetch|network|load failed/i.test(msg)) ||
        /networkerror|load failed|cors/i.test(msg);
      const corsNote = networkish
        ? " Some hosts block cross-origin fetches (CORS). Try the GitHub raw preset, publish JSON with permissive CORS, or use Quick load (paste / drop)."
        : "";
      setErr(msg + corsNote);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (url) void load(url);
  }, [url, load]);

  return { data, err, loading, reload: () => (url ? load(url) : undefined) };
}

type Tab =
  | "home"
  | "dual"
  | "patriline"
  | "matriline"
  | "male-anc"
  | "female-anc"
  | "by-gen"
  | "search"
  | "map"
  | "rulers"
  | "directory"
  | "deep-history";

type DualMode = "pat-mat" | "pat-pat" | "quad";

type DualVizMode = "table" | "fan" | "chess";

type TreeSourcePreset = "site" | "github-main" | "custom";

export function App() {
  const [treeSourcePreset, setTreeSourcePreset] = useState<TreeSourcePreset>("site");
  const [jsonUrl, setJsonUrl] = useState(DEFAULT_JSON);
  /** When set, overrides bundled `publicUrl("rulers.json")` for fetch (not used with rulers blob). */
  const [rulersCustomUrl, setRulersCustomUrl] = useState("");
  /** Blob URL from dropped / pasted tree.json — overrides URL field for fetch */
  const [treeBlobUrl, setTreeBlobUrl] = useState<string | null>(null);
  const [rulersBlobUrl, setRulersBlobUrl] = useState<string | null>(null);
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);
  const treeBlobRef = useRef<string | null>(null);
  const rulersBlobRef = useRef<string | null>(null);
  const [rootId, setRootId] = useState(DEFAULT_ROOT);
  const [compareRootId, setCompareRootId] = useState("@P2@");
  const [dualMode, setDualMode] = useState<DualMode>("pat-mat");
  const [tab, setTab] = useState<Tab>("home");
  const [rulersTestPath, setRulersTestPath] = useState(
    () => typeof window !== "undefined" && pathnameIsRulersTest(window.location.pathname)
  );
  const [nameQuery, setNameQuery] = useState("");
  const [identityGenre, setIdentityGenre] = useState<IdentityGenre>("all");
  const [maxGenerations, setMaxGenerations] = useState(100);
  const [mapScope, setMapScope] = useState<MapScope>("root-life");
  const [mapConnectLine, setMapConnectLine] = useState(true);
  /** Partner places: FAMS + GED `gp` + browser overlay (any count) on pat/mat birth & death maps */
  const [mapIncludePartners, setMapIncludePartners] = useState(true);
  /** Optional second birth polyline on pat/mat birth map scopes */
  const [patMatBirthDualLines, setPatMatBirthDualLines] = useState(false);
  /** Which stream gets the thicker line when dual birth throughlines are on */
  const [streamAccent, setStreamAccent] = useState<"pat" | "mat">("pat");
  const [lastTimelineEvent, setLastTimelineEvent] = useState<{ year: number; label: string; type: string } | null>(null);

  // === New: Global persistent history slider state ===
  // Supports deep time (negative years) for legendary/ancient figures like Felim Rachtmar and beyond.
  const [timeRange, setTimeRange] = useState<[number, number]>([-3000, 2200]);

  const handleFullTime = () => {
    setTimeRange([-5000, 2300]);
  };

  // === Dynamic layout reshaping based on search + time depth ===
  const storyFocus = useMemo(() => {
    if (nameQuery.trim()) return 'search-focus';
    const width = timeRange[1] - timeRange[0];
    if (width < 600) return 'deep-narrow';
    if (timeRange[0] < -500) return 'deep-history';
    return 'normal';
  }, [nameQuery, timeRange]);
  /** Path map above dual summary (same scope as Map tab) */
  const [dualShowPathMap, setDualShowPathMap] = useState(true);
  const [dualMapFull, setDualMapFull] = useState(false);
  const [dualVizMode, setDualVizMode] = useState<DualVizMode>("table");
  /** Table / ring fan / layer cards — hide to reduce clutter while keeping toolbar + picks. */
  const [dualMainLayerVisible, setDualMainLayerVisible] = useState(true);
  /** Blood / face selects in dual table cells only — controlled from toolbar, not inside the cell. */
  const [dualTablePhenotypesVisible, setDualTablePhenotypesVisible] = useState(true);
  /** Dual-tab DNA / mix strip (above table) */
  const [childLineageLabel, setChildLineageLabel] = useState("");
  const [leftMixPct, setLeftMixPct] = useState(50);
  const [dnaNotes, setDnaNotes] = useState("");
  const [dualColTitles, setDualColTitles] = useState<string[]>([
    "Patriline (father’s line)",
    "Matriline (mother’s line)",
  ]);
  const [dualPartnerLine, setDualPartnerLine] = useState<string[]>(["", ""]);
  useEffect(() => {
    treeBlobRef.current = treeBlobUrl;
  }, [treeBlobUrl]);
  useEffect(() => {
    rulersBlobRef.current = rulersBlobUrl;
  }, [rulersBlobUrl]);
  useEffect(() => {
    return () => {
      const tb = treeBlobRef.current;
      const rb = rulersBlobRef.current;
      if (tb?.startsWith("blob:")) URL.revokeObjectURL(tb);
      if (rb?.startsWith("blob:")) URL.revokeObjectURL(rb);
    };
  }, []);

  useEffect(() => {
    const sync = () => setRulersTestPath(pathnameIsRulersTest(window.location.pathname));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const effectiveJsonUrl = treeBlobUrl ?? jsonUrl;
  const effectiveRulersJsonUrl = rulersBlobUrl ?? (rulersCustomUrl.trim() || publicUrl("rulers.json"));
  const { data, err, loading, reload } = useTreeData(effectiveJsonUrl || null);

  // Smart detection: is the currently loaded tree the tiny fixture or otherwise very limited?
  const isMinimalData = !data || Object.keys(data.individuals || {}).length < 12;
  const isFixtureData = data?.source?.includes("fixture:minimal");

  const onTreeFileText = useCallback((text: string) => {
    try {
      const o = JSON.parse(text) as { individuals?: unknown; families?: unknown };
      if (!o.individuals || !o.families || typeof o.individuals !== "object" || typeof o.families !== "object") {
        throw new Error("Need individuals + families objects (tree.json).");
      }
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setTreeBlobUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      setIngestMsg("Loaded tree from file or paste.");
    } catch (e) {
      setIngestMsg(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const onRulersFileText = useCallback((text: string) => {
    try {
      const o = JSON.parse(text) as { people?: unknown };
      if (!Array.isArray(o.people)) throw new Error("Need people array (rulers.json).");
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      setRulersBlobUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
      setIngestMsg("Loaded rulers from file or paste.");
    } catch (e) {
      setIngestMsg(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const onClearIngestFiles = useCallback(() => {
    setTreeBlobUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setRulersBlobUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setIngestMsg(null);
  }, []);

  const onOpenInDualFromRulersTest = useCallback((id: string) => {
    setRootId(id);
    setTab("dual");
    leaveRulersTestPath();
  }, []);
  const {
    bloodMap,
    faceMap,
    traitMap,
    setBlood,
    setFace,
    setStageEye,
    setStageHair,
    setPronouns,
    setStageGender,
    toggleOrientation,
  } = usePhenotype(jsonUrl);
  const { partnerOverlay, addPartner, removePartner, updatePartnerEntry } = usePartnerOverlay(jsonUrl);

  /** Patriline / matriline are linear; allow deep chains. By generation uses the same cap (very high values can be slow on huge trees). */
  const maxGenClamped = useMemo(() => {
    const n = Math.floor(Number(maxGenerations));
    if (!Number.isFinite(n)) return 100;
    return Math.min(5000, Math.max(1, n));
  }, [maxGenerations]);

  const indi = data?.individuals ?? {};
  const fam = data?.families ?? {};

  const rootLabel = useMemo(() => formatName(rootId, indi), [rootId, indi]);

  const pat = useMemo(
    () => (data ? patriline(rootId, indi, fam, maxGenClamped) : []),
    [data, rootId, indi, fam, maxGenClamped]
  );
  const mat = useMemo(
    () => (data ? matriline(rootId, indi, fam, maxGenClamped) : []),
    [data, rootId, indi, fam, maxGenClamped]
  );

  const patCompare = useMemo(
    () =>
      data && compareRootId
        ? patriline(compareRootId, indi, fam, maxGenClamped)
        : [],
    [data, compareRootId, indi, fam, maxGenClamped]
  );

  const matCompare = useMemo(
    () =>
      data && compareRootId
        ? matriline(compareRootId, indi, fam, maxGenClamped)
        : [],
    [data, compareRootId, indi, fam, maxGenClamped]
  );

  const compareLabel = useMemo(
    () => formatName(compareRootId, indi) || compareRootId,
    [compareRootId, indi]
  );

  const dualColCount = dualMode === "quad" ? 4 : 2;

  const dualRows = useMemo(() => {
    if (dualMode === "quad") {
      const n = Math.max(pat.length, mat.length, patCompare.length, matCompare.length);
      return Array.from({ length: n }, (_, i) => ({
        gen: i,
        ids: [
          pat[i] ?? null,
          mat[i] ?? null,
          patCompare[i] ?? null,
          matCompare[i] ?? null,
        ] as (string | null)[],
      }));
    }
    const left = pat;
    const right = dualMode === "pat-mat" ? mat : patCompare;
    const n = Math.max(left.length, right.length);
    return Array.from({ length: n }, (_, i) => ({
      gen: i,
      ids: [left[i] ?? null, right[i] ?? null] as (string | null)[],
    }));
  }, [pat, mat, dualMode, patCompare, matCompare]);

  const defaultDualColTitles = useMemo((): string[] => {
    if (dualMode === "pat-mat")
      return ["Patriline (father’s line)", "Matriline (mother’s line)"];
    if (dualMode === "pat-pat")
      return [`Patriline — ${rootLabel}`, `Patriline — ${compareLabel}`];
    return [
      `${rootLabel} — patriline`,
      `${rootLabel} — matriline`,
      `${compareLabel} — patriline`,
      `${compareLabel} — matriline`,
    ];
  }, [dualMode, rootLabel, compareLabel]);

  useEffect(() => {
    setDualColTitles((prev) => {
      const def = defaultDualColTitles;
      const next = prev.slice(0, dualColCount);
      while (next.length < dualColCount) next.push(def[next.length] ?? "");
      return next;
    });
    setDualPartnerLine((prev) => {
      const next = prev.slice(0, dualColCount);
      while (next.length < dualColCount) next.push("");
      return next;
    });
  }, [dualColCount, defaultDualColTitles]);

  const leftColTitle = dualColTitles[0] ?? defaultDualColTitles[0];
  const rightColTitle = dualColTitles[1] ?? defaultDualColTitles[1];

  const vizColumnTitles = useMemo(() => {
    const def = defaultDualColTitles;
    return Array.from({ length: dualColCount }, (_, i) => {
      const t = (dualColTitles[i] ?? "").trim();
      return t || def[i] || `Column ${i + 1}`;
    });
  }, [dualColCount, dualColTitles, defaultDualColTitles]);

  const dnaStorageKey = useMemo(
    () => `ancestory-dual-dna::${rootId}::${compareRootId}::${dualMode}`,
    [rootId, compareRootId, dualMode]
  );

  useLayoutEffect(() => {
    const need = dualMode === "quad" ? 4 : 2;
    const padTitles = (arr: string[]) => {
      const def = defaultDualColTitles;
      const out = arr.slice(0, need);
      while (out.length < need) out.push(def[out.length] ?? "");
      return out;
    };
    const padPartners = (arr: string[]) => {
      const out = arr.slice(0, need);
      while (out.length < need) out.push("");
      return out;
    };
    try {
      const raw = localStorage.getItem(dnaStorageKey);
      if (raw) {
        const o = JSON.parse(raw) as {
          child?: string;
          left?: number;
          dna?: string;
          ct?: unknown;
          pt?: unknown;
        };
        setChildLineageLabel(typeof o.child === "string" ? o.child : rootLabel);
        const L =
          typeof o.left === "number" && Number.isFinite(o.left)
            ? Math.min(100, Math.max(0, Math.round(o.left)))
            : 50;
        setLeftMixPct(L);
        setDnaNotes(typeof o.dna === "string" ? o.dna : "");
        const ct = Array.isArray(o.ct) ? o.ct.filter((x): x is string => typeof x === "string") : [];
        const pt = Array.isArray(o.pt) ? o.pt.filter((x): x is string => typeof x === "string") : [];
        setDualColTitles(padTitles(ct));
        setDualPartnerLine(padPartners(pt));
        return;
      }
    } catch {
      /* ignore */
    }
    setChildLineageLabel(rootLabel);
    setLeftMixPct(50);
    setDnaNotes("");
    setDualColTitles(padTitles([]));
    setDualPartnerLine(padPartners([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload persisted dual UI only when storage key changes
  }, [dnaStorageKey]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(
          dnaStorageKey,
          JSON.stringify({
            child: childLineageLabel,
            left: leftMixPct,
            dna: dnaNotes,
            ct: dualColTitles,
            pt: dualPartnerLine,
          })
        );
      } catch {
        /* quota */
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [dnaStorageKey, childLineageLabel, leftMixPct, dnaNotes, dualColTitles, dualPartnerLine]);

  useEffect(() => {
    if (!dualMapFull) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDualMapFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dualMapFull]);

  const rightMixPct = 100 - leftMixPct;
  const mixLeftLabel =
    dualMode === "quad"
      ? "—"
      : dualMode === "pat-mat"
        ? "Paternal (left col.)"
        : "Left column line";
  const mixRightLabel =
    dualMode === "quad"
      ? "—"
      : dualMode === "pat-mat"
        ? "Maternal (right col.)"
        : "Right column line";

  const dnaBloodTally = useMemo(() => {
    const tally = (ids: string[]) => {
      const out: Record<string, number> = {};
      for (const id of ids) {
        const label = formatBloodLabel(bloodMap[id] ?? { abo: "" as ABO, rh: "" as Rh });
        if (label === "—") continue;
        out[label] = (out[label] ?? 0) + 1;
      }
      return out;
    };
    return { pat: tally(pat), mat: tally(mat) };
  }, [pat, mat, bloodMap]);

  const anc = useMemo(
    () => (data ? ancestorSet(rootId, indi, fam) : new Set<string>()),
    [data, rootId, indi, fam]
  );

  const maleAnc = useMemo(() => {
    const ids = [...anc].filter((id) => (indi[id]?.s ?? "U") === "M");
    ids.sort((a, b) => formatName(a, indi).localeCompare(formatName(b, indi)));
    return ids;
  }, [anc, indi]);

  const femaleAnc = useMemo(() => {
    const ids = [...anc].filter((id) => (indi[id]?.s ?? "U") === "F");
    ids.sort((a, b) => formatName(a, indi).localeCompare(formatName(b, indi)));
    return ids;
  }, [anc, indi]);

  const byGen = useMemo(
    () => (data ? ancestorsByGeneration(rootId, data, maxGenClamped) : new Map()),
    [data, rootId, maxGenClamped]
  );

  // === Extended Search for larger history throughlines ===
  // Now searches people + major historical events (rulers, deep time, legendary figures like Rachtmar line)
  const searchHits = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!data && !MAJOR_EVENTS.length) return [] as { id: string; name: string }[];
    const filterActive = identityGenre !== "all";
    if (!q && !filterActive) return [] as { id: string; name: string }[];

    const hits: { id: string; name: string; weight: number; year?: number }[] = [];

    // People search (existing)
    for (const id of Object.keys(indi)) {
      const name = formatName(id, indi);
      const nl = name.toLowerCase();
      const idl = id.toLowerCase();
      if (q && !nl.includes(q) && !idl.includes(q)) continue;
      const sig = identitySignal(id, indi, traitMap);
      if (filterActive && !personMatchesGenre(sig, identityGenre)) continue;
      hits.push({ id, name, weight: genreSortWeight(sig, identityGenre) });
    }

    // Extended: History throughlines (major events, ancient rulers, deep legendary)
    for (const evt of MAJOR_EVENTS) {
      const label = evt.label.toLowerCase();
      if (q && !label.includes(q)) continue;
      hits.push({
        id: `event-${evt.year}-${evt.label.slice(0, 20)}`,
        name: `📜 ${evt.label}`,
        weight: 50, // lower priority than people but still surfaces
        year: evt.year,
      });
    }

    hits.sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      return a.name.localeCompare(b.name);
    });
    return hits.slice(0, 400).map(({ id, name }) => ({ id, name }));
  }, [nameQuery, data, indi, identityGenre, traitMap]);

  const maleAncFlowIds = useMemo(() => {
    return [...maleAnc].sort((a, b) => {
      const ya = birthYear(indi[a]);
      const yb = birthYear(indi[b]);
      if (ya != null && yb != null && ya !== yb) return ya - yb;
      if (ya != null && yb == null) return -1;
      if (ya == null && yb != null) return 1;
      return formatName(a, indi).localeCompare(formatName(b, indi)) || a.localeCompare(b);
    });
  }, [maleAnc, indi]);

  const femaleAncFlowIds = useMemo(() => {
    return [...femaleAnc].sort((a, b) => {
      const ya = birthYear(indi[a]);
      const yb = birthYear(indi[b]);
      if (ya != null && yb != null && ya !== yb) return ya - yb;
      if (ya != null && yb == null) return -1;
      if (ya == null && yb != null) return 1;
      return formatName(a, indi).localeCompare(formatName(b, indi)) || a.localeCompare(b);
    });
  }, [femaleAnc, indi]);

  const byGenFlatIds = useMemo(() => {
    const out: string[] = [];
    for (const g of [...byGen.keys()].sort((a, b) => a - b)) {
      out.push(...(byGen.get(g) ?? []));
    }
    return out;
  }, [byGen]);

  const searchHitIds = useMemo(() => searchHits.map((h) => h.id), [searchHits]);

  // === Story Cards derived from current search + time range + data ===
  // These update as the search "reshapes the page"
  const currentStoryCards = useMemo(() => {
    const cards: any[] = [];

    if (!data || !nameQuery.trim()) {
      // Default deep narrative cards when no specific search
      if (MAJOR_EVENTS && MAJOR_EVENTS.length > 0) {
        MAJOR_EVENTS.slice(0, 4).forEach((evt, idx) => {
          if (evt.year >= timeRange[0] && evt.year <= timeRange[1]) {
            cards.push({
              id: `event-${idx}`,
              title: evt.label,
              year: evt.year,
              type: "event",
              description: (evt as any).category || "Historical moment",
            });
          }
        });
      }
      return cards;
    }

    // When searching, generate cards around the top matches
    searchHits.slice(0, 6).forEach((hit, idx) => {
      const rec = indi[hit.id];
      if (!rec) return;

      const by = birthYear(rec);
      if (by != null && by >= timeRange[0] && by <= timeRange[1]) {
        cards.push({
          id: `birth-${hit.id}`,
          title: `${hit.name} — Born`,
          year: by,
          type: "birth",
          subtitle: rec.bp || "",
          onClick: () => setRootId(hit.id),
        });
      }

      if (rec.dy && rec.dy >= timeRange[0] && rec.dy <= timeRange[1]) {
        cards.push({
          id: `death-${hit.id}`,
          title: `${hit.name} — Died`,
          year: rec.dy,
          type: "death",
          onClick: () => setRootId(hit.id),
        });
      }
    });

    // Add any major events overlapping the search context
    (MAJOR_EVENTS || []).slice(0, 3).forEach((evt: any, idx: number) => {
      if (evt.year >= timeRange[0] && evt.year <= timeRange[1]) {
        cards.push({
          id: `story-event-${idx}`,
          title: evt.label,
          year: evt.year,
          type: "event",
        });
      }
    });

    return cards;
  }, [data, nameQuery, searchHits, indi, timeRange]);

  return (
    <div className={`app app-wide story-${storyFocus}${tab === "home" ? " app--mobile-home" : ""}`}>
      {/* === COHESIVE NARRATIVE COCKPIT === */}
      {/* One unified, search-driven story surface at the top of the app */}
      <NarrativeCockpit
        nameQuery={nameQuery}
        onNameQueryChange={setNameQuery}
        searchHits={searchHits}
        onFocusStory={(personId) => {
          if (personId) {
            if (personId.startsWith('event-')) {
              const yearMatch = personId.match(/event-(-?\d+)/);
              if (yearMatch) {
                const y = parseInt(yearMatch[1]);
                setTimeRange([y - 150, y + 150]);
              }
              setTab("deep-history");
            } else {
              setRootId(personId);
              const rec = indi[personId];
              const by = birthYear(rec);
              if (by != null) {
                const lifespanStart = by - 30;
                const lifespanEnd = (rec?.dy || by + 80) + 50;
                setTimeRange([Math.max(-5000, lifespanStart), Math.min(2300, lifespanEnd)]);
              }
              setTab("deep-history");
            }
          }
        }}
        individuals={indi}
        families={fam}
        rootId={rootId}
        patIds={pat}
        matIds={mat}
        timeRange={timeRange}
        mapScope={mapScope}
        mapConnectLine={mapConnectLine}
        mapIncludePartners={mapIncludePartners}
        partnerOverlay={partnerOverlay}
        patMatBirthDualLines={patMatBirthDualLines}
        streamAccent={streamAccent}
        proposals={readResearchProposals().filter((p) => p.status === "accepted")}
        majorEvents={[
          ...MAJOR_EVENTS,
          ...forwardConnectionsToTimelineEvents(readForwardConnections()),
          ...elderStoriesToTimelineEvents(readElderStories()),
        ]}
        onEventClick={(evt) => setLastTimelineEvent(evt)}
        onExpandMap={() => setTab("map" as any)}
        timeSliderProps={{
          fullMin: -5000,
          fullMax: 2300,
          onTimeRangeChange: setTimeRange,
          onFullTime: handleFullTime,
        }}
      />

      {/* Secondary navigation (views + data + global slider) */}
      <TopNav
        currentTab={tab as any}
        onTabChange={(newTab) => setTab(newTab as any)}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        fullMin={-5000}
        fullMax={2300}
        onFullTime={handleFullTime}
        onOpenData={() => {
          const controls = document.querySelector('.controls');
          controls?.scrollIntoView({ behavior: 'smooth' });
        }}
        showUpgradePill={isMinimalData || isFixtureData}
        // Note: slider props no longer needed in TopNav (moved into NarrativeCockpit next to timeline)
      />

      {/* Deep Narrative Cards — the living story feed (no duplicate timeline title) */}
      <div className="deep-narrative-cards" style={{ padding: "12px 20px 20px" }}>
        <DeepNarrativeCards 
          cards={currentStoryCards} 
          title="Story Beats"
        />
      </div>

      {!rulersTestPath && tab !== "home" && <OsintResearchPanel />}

      {!rulersTestPath && tab !== "home" && <PWAInstallPrompt />}

      {!rulersTestPath && tab !== "home" && data && (
        <PlaceCurationPanel
          individuals={indi}
          onLedgerChange={() => {
            // Future: could trigger map refresh if needed
          }}
        />
      )}

      {!rulersTestPath && tab !== "home" && <ResearchProposalsPanel />}

      {tab !== "home" && (
        <FileDropToolbar
          onTreeText={onTreeFileText}
          onRulersText={onRulersFileText}
          onClear={onClearIngestFiles}
          onIngestError={setIngestMsg}
          treeFromFile={Boolean(treeBlobUrl)}
          rulersFromFile={Boolean(rulersBlobUrl)}
          rulersUrlDisplay={effectiveRulersJsonUrl}
          message={ingestMsg}
        />
      )}

      <DataFilesHelp />

      {rulersTestPath && (
        <section className="panel rulers-test-page" aria-label="Rulers manual QA">
          <p className="rulers-test-exit-row muted">
            <button type="button" className="linkbtn" onClick={() => leaveRulersTestPath()}>
              Open full Ancestory app
            </button>{" "}
            <span className="rulers-test-exit-hint">(returns to the main URL in this session)</span>
          </p>
          <RulersPageTest
            rulersJsonUrl={effectiveRulersJsonUrl}
            onOpenInDual={onOpenInDualFromRulersTest}
          />
        </section>
      )}

      {!rulersTestPath && (
      <section className="panel controls" style={{ borderTop: "2px solid #2a3a4f" }}>
        <div style={{ marginBottom: 6, fontSize: "0.85em", opacity: 0.75, fontWeight: 500 }}>
          Data Sources — your trees load instantly in the browser with zero uploads
        </div>
        <div className="controls-row controls-row--data-source">
          <label>
            <span>Primary tree</span>
            <select
              className="sel data-source-preset"
              value={treeSourcePreset}
              onChange={(e) => {
                const v = e.target.value as TreeSourcePreset;
                if (v === "site") {
                  setTreeSourcePreset("site");
                  setJsonUrl(publicUrl("tree.json"));
                  setRulersCustomUrl("");
                } else if (v === "github-main") {
                  setTreeSourcePreset("github-main");
                  setJsonUrl(RAW_GITHUB_TREE_MAIN);
                  setRulersCustomUrl(RAW_GITHUB_RULERS_MAIN);
                } else {
                  setTreeSourcePreset("custom");
                }
              }}
            >
              <option value="site">Bundled (this build)</option>
              <option value="github-main">GitHub (full rich demo data)</option>
              <option value="custom">Custom URL / paste below</option>
            </select>
          </label>
          <label className="controls-tree-url">
            <span>tree.json URL</span>
            <input
              className="inp mono wide"
              value={jsonUrl}
              onChange={(e) => {
                setJsonUrl(e.target.value);
                setTreeSourcePreset("custom");
              }}
              placeholder={publicUrl("tree.json")}
            />
          </label>
          <label>
            <span>Root person xref</span>
            <input
              className="inp mono"
              value={rootId}
              onChange={(e) => setRootId(e.target.value.trim())}
              placeholder="@P1@"
            />
          </label>
          <label>
            <span>Max generations (lines + by gen)</span>
            <input
              className="inp inp-narrow mono"
              type="number"
              min={1}
              max={5000}
              value={maxGenerations}
              onChange={(e) => setMaxGenerations(Number(e.target.value))}
              title="Patriline & matriline depth, dual table rows, and By generation layers (1–5000). Default 100. Extreme values may lag on By generation for very large trees."
            />
          </label>
          <button type="button" className="btn" onClick={() => reload()} disabled={loading}>
            {loading ? "Loading…" : "Reload"}
          </button>
          {data && (
            <span className="meta">
              {Object.keys(indi).length} persons · {Object.keys(fam).length} families
            </span>
          )}
        </div>
        <details className="controls-advanced data-source-advanced">
          <summary>Optional: rulers.json URL</summary>
          <div className="controls-row">
            <label className="controls-tree-url">
              <span>rulers.json fetch URL (blank = bundled path)</span>
              <input
                className="inp mono wide"
                value={rulersCustomUrl}
                onChange={(e) => setRulersCustomUrl(e.target.value)}
                placeholder={publicUrl("rulers.json")}
              />
            </label>
          </div>
        </details>
        {data && (
          <div className="controls-search">
            <label className="controls-search-label">
              <span>Search names (or xref like P4807)</span>
              <input
                className="inp wide"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Hauteville, Fortner, @P2@…"
              />
            </label>
            {nameQuery.trim() && (
              <ul className="controls-hits">
                {searchHits.length === 0 && (
                  <li className="controls-hit-empty">No matches</li>
                )}
                {searchHits.slice(0, 24).map(({ id, name }) => (
                  <li key={id} className="controls-hit">
                    <span className="mono hit-id">{id}</span>
                    <span className="hit-name">{name}</span>
                    <span className="hit-actions">
                      <button type="button" className="linkbtn" onClick={() => setRootId(id)}>
                        Root
                      </button>
                      <button
                        type="button"
                        className="linkbtn"
                        onClick={() => {
                          setCompareRootId(id);
                          setDualMode("pat-pat");
                          setTab("dual");
                        }}
                      >
                        Compare
                      </button>
                    </span>
                  </li>
                ))}
                {searchHits.length > 24 && (
                  <li className="controls-hit-more">
                    +{searchHits.length - 24} more — open Search tab for full list
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </section>
      )}

      {loading && !rulersTestPath && !data && (
        <section className="panel" style={{ 
          textAlign: "center", 
          padding: "32px 16px",
          background: "linear-gradient(180deg, #171a20 0%, #111418 100%)" 
        }}>
          <div style={{ fontSize: "1.1em", fontWeight: 500, marginBottom: 8 }}>
            Loading your ancestry data…
          </div>
          <div style={{ fontSize: "0.9em", opacity: 0.75, maxWidth: 420, margin: "0 auto" }}>
            Large family trees can take a few seconds on first visit. 
            Everything runs privately in your browser.
          </div>
          <div style={{ 
            marginTop: 18, 
            height: 4, 
            background: "#222a38", 
            borderRadius: 999,
            overflow: "hidden",
            maxWidth: 260,
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            <div style={{ 
              height: "100%", 
              width: "40%", 
              background: "linear-gradient(90deg, #5ab0ff, #8ab4f8)", 
              animation: "loading-progress 1.6s infinite ease-in-out" 
            }} />
          </div>
          <style>{`
            @keyframes loading-progress {
              0% { transform: translateX(-80%); }
              100% { transform: translateX(280%); }
            }
          `}</style>
        </section>
      )}

      {err && !rulersTestPath && (
        <section className="panel err">
          <strong>Could not load tree data.</strong> {err}
          <div style={{ marginTop: 8, fontSize: "0.9em" }}>
            Try the <strong>“Tree data source”</strong> dropdown above and select{" "}
            <em>GitHub (full rich demo data)</em> or paste your own file.
            <br />
            You can also run the export locally:
            <code className="mono" style={{ marginLeft: 4 }}>
              python3 tools/ged_export.py "path/to/tree.ged" public/tree.json
            </code>
          </div>
        </section>
      )}

      {/* Prominent "make it better" upgrade experience — this is a key differentiator */}
      {!rulersTestPath && (isMinimalData || isFixtureData) && !treeBlobUrl && (
        <section className="panel upgrade-banner" style={{
          background: "linear-gradient(135deg, #1a2333 0%, #11181f 100%)",
          border: "1px solid #3a5a8c",
          borderLeft: "5px solid #5ab0ff"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong style={{ fontSize: "1.05em" }}>This is the minimal demo dataset.</strong>
              <div style={{ marginTop: 4, opacity: 0.9 }}>
                Ancestory shines with a real family tree. Load the full rich demo data (the actual Fortner/Ericson tree used during development) with one click.
              </div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setTreeSourcePreset("github-main");
                setJsonUrl(RAW_GITHUB_TREE_MAIN);
                setRulersCustomUrl(RAW_GITHUB_RULERS_MAIN);
                // Trigger reload of the new source
                setTimeout(() => reload?.(), 50);
              }}
              style={{
                padding: "10px 20px",
                fontSize: "0.95em",
                whiteSpace: "nowrap",
                background: "#5ab0ff",
                color: "#111",
                fontWeight: 600
              }}
            >
              Load full rich demo data →
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: "0.8em", opacity: 0.7 }}>
            Or drop/paste your own tree.json above. Your data stays 100% in your browser.
          </div>
        </section>
      )}

      {data && !rulersTestPath && (
        <>
          {/* Navigation moved to persistent TopNav (top of app) */}

          <section className="panel">
            <h2 className="h2">
              {tab === "home" && "Home — lines, OSINT, map"}
              {tab === "dual" && "Dual streams (side by side)"}
              {tab === "patriline" && "Patriline (father’s line)"}
              {tab === "matriline" && "Matriline (mother’s line)"}
              {tab === "male-anc" && "All male ancestors in the cone"}
              {tab === "female-anc" && "All female ancestors in the cone"}
              {tab === "by-gen" && "Ancestors grouped by generation"}
              {tab === "map" && "Map — birth / death / life path (full page)"}
              {tab === "rulers" && "Rulers, titles & realm (heuristic export)"}
              {tab === "directory" && "World name directory — etymology, tribes, hominins"}
              {tab === "search" && "Search by name"}
              {tab === "deep-history" && "Deep History & Legendary Extension"}
            </h2>

            {tab === "deep-history" && (
              <div style={{ padding: 16, background: "#0f1114", borderRadius: 8, margin: "12px 0" }}>
                <h3 style={{ marginTop: 0, color: "#5ab0ff" }}>Extending Far Back — Test Case: Felim Rachtmar (Rachtmar-3)</h3>
                
                <p>
                  This profile on WikiTree represents one of Ireland’s legendary High Kings (~80–119 AD). 
                  His line connects backward through Tuathal Teachtmar into the ancient royal dynasties of Ireland.
                </p>

                <button
                  onClick={() => {
                    // Reshape the entire story view for deep legendary time
                    setTimeRange([-100, 400]); // Focus on the era around Rachtmar and immediate ancestors
                    setTab("deep-history");
                    // Add some visual emphasis by clearing narrow search if any
                    if (nameQuery) setNameQuery("");
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "#3a5a8c",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginBottom: 12,
                  }}
                >
                  Load Rachtmar-era Deep Time View
                </button>

                <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
                  <strong>Tips for pushing lineages as far back as possible:</strong>
                  <ul style={{ marginTop: 6 }}>
                    <li>Use the global History Slider (in the top bar) to explore from -5000 BCE through the early medieval period.</li>
                    <li>Add legendary/ancient figures to your tree.json with approximate years (negative for BCE).</li>
                    <li>The Deep Narrative Timeline and Cards above will automatically surface relevant beats.</li>
                    <li>Combine with Rulers view for overlaps with known High Kings and historical events.</li>
                  </ul>
                </div>
              </div>
            )}
            <p className="rootcap">
              Root: <code className="mono">{rootId}</code> — {rootLabel}
              {tab === "dual" && (dualMode === "pat-pat" || dualMode === "quad") && (
                <>
                  {" "}
                  · Compare: <code className="mono">{compareRootId}</code> — {compareLabel}
                </>
              )}
            </p>

            {tab === "home" && (isMinimalData || isFixtureData) && !treeBlobUrl && (
              <section className="panel" style={{ 
                background: "linear-gradient(180deg, #1a2333 0%, #14181f 100%)",
                border: "1px solid #2f3f55",
                marginBottom: 12
              }}>
                <div style={{ fontSize: "1.05em", fontWeight: 600, marginBottom: 8 }}>
                  Welcome to Ancestory
                </div>
                <div style={{ opacity: 0.9, lineHeight: 1.5 }}>
                  A different kind of ancestry tool — built for depth, honesty, and beauty.
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: "0.92em", opacity: 0.85 }}>
                    <li>Dual patriline + matriline visualizations side-by-side</li>
                    <li>Morphology, phenotype &amp; staged traits across a lifetime</li>
                    <li>Historical rulers, blood migration, OSINT research tools</li>
                    <li>100% private — your data never leaves this browser</li>
                  </ul>
                </div>
                <div style={{ marginTop: 12, fontSize: "0.85em", opacity: 0.7 }}>
                  Load the full rich demo data using the floating <strong>Data</strong> button (bottom right) or the controls below.
                </div>
              </section>
            )}

            {tab === "home" && (
              <MobileHomeShell
                rootId={rootId}
                rootLabel={rootLabel}
                compareLabel={compareLabel}
                dualMode={dualMode}
                dualRows={dualRows}
                vizColumnTitles={vizColumnTitles}
                individuals={indi}
                families={fam}
                nameQuery={nameQuery}
                onNameQueryChange={setNameQuery}
                partnerOverlay={partnerOverlay}
                patIds={pat}
                matIds={mat}
                mapScope={mapScope}
                onMapScopeChange={setMapScope}
                mapConnectLine={mapConnectLine}
                onMapConnectLineChange={setMapConnectLine}
                mapIncludePartners={mapIncludePartners}
                onMapIncludePartnersChange={setMapIncludePartners}
                onSetRoot={setRootId}
                onSetCompare={(id) => {
                  setCompareRootId(id);
                  setDualMode("pat-pat");
                }}
                onDualModeChange={setDualMode}
                sourceLine={data?.source}
                searchHits={searchHits}
                onTreeText={onTreeFileText}
                onRulersText={onRulersFileText}
                onClearIngest={onClearIngestFiles}
                onIngestError={setIngestMsg}
                treeFromFile={Boolean(treeBlobUrl)}
                rulersFromFile={Boolean(rulersBlobUrl)}
                ingestMessage={ingestMsg}
                bloodMap={bloodMap}
                faceMap={faceMap}
                traitMap={traitMap}
                identityGenre={identityGenre}
                onIdentityGenreChange={setIdentityGenre}
              />
            )}

            {tab === "dual" && (
              <>
                <div className="dual-toolbar">
                  <label className="dual-label">
                    <span>Layout</span>
                    <select
                      className="sel"
                      value={dualMode}
                      onChange={(e) => setDualMode(e.target.value as DualMode)}
                    >
                      <option value="pat-mat">Patriline | Matriline (one root)</option>
                      <option value="pat-pat">Patriline | Patriline (two roots)</option>
                      <option value="quad">
                        Quad — root pat | mat + compare pat | mat (four columns)
                      </option>
                    </select>
                  </label>
                  {(dualMode === "pat-pat" || dualMode === "quad") && (
                    <label className="dual-label grow">
                      <span>Second root (compare person)</span>
                      <input
                        className="inp mono"
                        value={compareRootId}
                        onChange={(e) => setCompareRootId(e.target.value.trim())}
                        placeholder="@P2@"
                      />
                    </label>
                  )}
                </div>

                <section className="dual-map-above" aria-label="Path map above lineage summary">
                  <div className="dual-map-bar">
                    <label className="dual-map-show">
                      <input
                        type="checkbox"
                        checked={dualShowPathMap}
                        onChange={(e) => setDualShowPathMap(e.target.checked)}
                      />
                      <span>Show path map here</span>
                    </label>
                    <label className="dual-label dual-label-mapscope">
                      <span>Plot</span>
                      <MapScopeSelect value={mapScope} onChange={setMapScope} />
                    </label>
                    {mapScopeSupportsConnectLine(mapScope) && (
                      <label className="map-chk">
                        <input
                          type="checkbox"
                          checked={mapConnectLine}
                          onChange={(e) => setMapConnectLine(e.target.checked)}
                        />
                        <span>Connect line</span>
                      </label>
                    )}
                    {mapScopeSupportsPartnersToggle(mapScope) && (
                      <label
                        className="map-chk"
                        title="FAMS + GED NOTE (gp) + optional browser partner list (any count). See Dual tab details + ged_export.py."
                      >
                        <input
                          type="checkbox"
                          checked={mapIncludePartners}
                          onChange={(e) => setMapIncludePartners(e.target.checked)}
                        />
                        <span>
                          Partners (FAMS + GED + browser) —{" "}
                          {mapScope.includes("births") ? "their birth places" : "their death places"}
                        </span>
                      </label>
                    )}
                    <div className="dual-map-bar-actions">
                      <button
                        type="button"
                        className="btn btn-small"
                        disabled={!dualShowPathMap}
                        onClick={() => setDualMapFull(true)}
                      >
                        Full screen
                      </button>
                      <button type="button" className="btn btn-small" onClick={() => setTab("map")}>
                        Map tab
                      </button>
                    </div>
                  </div>
                  {dualShowPathMap && !dualMapFull && (
                    <MapView
                      embed
                      showFoot={false}
                      individuals={indi}
                      families={fam}
                      rootId={rootId}
                      patIds={pat}
                      matIds={mat}
                      scope={mapScope}
                      connectLine={mapConnectLine}
                      includePartners={mapIncludePartners}
                      partnerOverlay={partnerOverlay}
                      patMatBirthDualLines={patMatBirthDualLines}
                      streamAccent={streamAccent}
                    />
                  )}
                </section>

                <p className="map-meta dual-line-summary">
                  {dualMode === "pat-mat" && "Patriline | Matriline"}
                  {dualMode === "pat-pat" && "Patriline | Patriline"}
                  {dualMode === "quad" && "Root pat | root mat | compare pat | compare mat"}
                  {" · "}
                  max depth <strong>{maxGenClamped}</strong> (top controls) · <strong>{dualRows.length}</strong> rows ·
                  row tint from birth years when <code className="mono">BIRT.DATE</code> was exported.
                  {dualMode === "quad" && (
                    <>
                      {" "}
                      Column titles and partner/child notes are editable in the table header (saved with this layout).
                    </>
                  )}
                </p>
                <GeneticPartnerOverlayPanel
                  rootId={rootId}
                  compareRootId={compareRootId}
                  dualMode={dualMode}
                  individuals={indi}
                  partnerOverlay={partnerOverlay}
                  addPartner={addPartner}
                  removePartner={removePartner}
                  updatePartnerEntry={updatePartnerEntry}
                />
                <div className="dual-dna-strip" aria-label="Child and DNA mix">
                <div className="dual-dna-grid">
                    <label className="map-chk dual-dna-mapline">
                      <input type="checkbox" checked={patMatBirthDualLines} onChange={(e) => setPatMatBirthDualLines(e.target.checked)} />
                      <span>Map: dual pat/mat birth throughlines (when plot is pat or mat births)</span>
                    </label>
                    {dualMode !== "quad" && (
                      <>
                        <DualDnaStreamCharts
                          leftMixPct={leftMixPct}
                          mixLeftLabel={mixLeftLabel}
                          mixRightLabel={mixRightLabel}
                          patDepth={pat.length}
                          matDepth={mat.length}
                          bloodTally={dnaBloodTally}
                          onStreamFocus={setStreamAccent}
                        />

                        <EventTimeline
                          individuals={indi}
                          patIds={pat}
                          matIds={mat}
                          timeRange={timeRange}
                          proposals={readResearchProposals().filter((p) => p.status === "accepted")}
                          majorEvents={[
                            ...MAJOR_EVENTS,
                            ...forwardConnectionsToTimelineEvents(readForwardConnections()),
                            ...elderStoriesToTimelineEvents(readElderStories()),
                          ]}
                          onEventClick={(evt) => {
                            // Timeline is the star — clicking an event gives rich feedback
                            setLastTimelineEvent(evt);
                            console.log("[Ancestory Timeline Event]", evt);
                            // Future: highlight related places on map, open details, filter proposals, etc.
                          }}
                        />

                        <AncestoryOracle
                          individuals={indi}
                          rootId={rootId}
                          patIds={pat}
                          matIds={mat}
                          proposals={readResearchProposals()}
                          bloodMap={bloodMap}
                          traitMap={traitMap}
                        />

                        {/* Deeper ancestral matching — story overlaps, language, tribal knowledge */}
                        {pat.length > 3 && (
                          <AncestralResonance
                            individuals={indi}
                            proposals={readResearchProposals()}
                            personAId={rootId}
                            personBId={pat[3]}
                          />
                        )}

                        {/* First-class Forward / Space Layer */}
                        <ForwardLineagePanel individuals={indi} defaultAncestorId={rootId} />

                        {/* Tribal Elder Stories — preserving what is fading */}
                        <TribalElderStoriesPanel individuals={indi} />

                        {pat.length > 2 && (
                          <LineageCompatibility
                            individuals={indi}
                            personA={rootId}
                            personB={pat[2] ?? pat[1]}
                            labelA="You / Root"
                            labelB="3rd generation ancestor"
                          />
                        )}
                      </>
                    )}
                  <label className="dual-dna-field">
                    <span>Child / focus (who inherits both streams)</span>
                    <input
                      className="inp"
                      value={childLineageLabel}
                      onChange={(e) => setChildLineageLabel(e.target.value)}
                      placeholder={rootLabel}
                    />
                  </label>
                  <label className="dual-dna-field">
                    <span>DNA &amp; ethnicity notes (optional)</span>
                    <input
                      className="inp"
                      value={dnaNotes}
                      onChange={(e) => setDnaNotes(e.target.value)}
                      placeholder="e.g. 48.2% match to kit · Iberian 12%"
                    />
                  </label>
                </div>
                {dualMode !== "quad" && (
                  <>
                    <div className="dual-mix-head">
                      <span className="dual-mix-title">Est. autosomal mix (manual)</span>
                      <span className="dual-mix-pcts mono">
                        {mixLeftLabel} {leftMixPct}% · {mixRightLabel} {rightMixPct}%
                      </span>
                    </div>
                    <div className="dual-mix-bar" role="img" aria-label="Lineage mix ratio">
                      <span className="dual-mix-seg dual-mix-seg--left" style={{ width: `${leftMixPct}%` }} />
                      <span className="dual-mix-seg dual-mix-seg--right" style={{ width: `${rightMixPct}%` }} />
                    </div>
                    <div className="dual-mix-controls">
                      <label className="dual-mix-slider-label">
                        {mixLeftLabel}
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={leftMixPct}
                          onChange={(e) => setLeftMixPct(Number(e.target.value))}
                        />
                      </label>
                      <div className="dual-mix-num">
                        <label>
                          Left %
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="inp inp-narrow mono"
                            value={leftMixPct}
                            onChange={(e) => {
                              const v = Math.min(100, Math.max(0, Math.round(Number(e.target.value)) || 0));
                              setLeftMixPct(v);
                            }}
                          />
                        </label>
                        <label>
                          Right %
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="inp inp-narrow mono"
                            value={rightMixPct}
                            onChange={(e) => {
                              const v = Math.min(100, Math.max(0, Math.round(Number(e.target.value)) || 0));
                              setLeftMixPct(100 - v);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}
                {dualMode === "quad" && (
                  <p className="dual-mix-hint dual-mix-hint--quad">
                    Quad view uses four streams; the autosomal mix slider is hidden. Use the DNA notes field
                    above for free-form percentages if needed.
                  </p>
                )}
                <p className="dual-mix-hint">
                  Saved per root + compare + layout. Not from genetics—enter numbers from your DNA
                  test or your own estimate.
                  {dualMode !== "quad" && " Shown above the dual table."}
                </p>
                <BloodMigrationPanel
                  jsonUrl={jsonUrl}
                  rootId={rootId}
                  maxGenerations={maxGenClamped}
                  individuals={indi}
                  families={fam}
                  bloodMap={bloodMap}
                  faceMap={faceMap}
                  traitMap={traitMap}
                  setBlood={setBlood}
                  setFace={setFace}
                  setStageEye={setStageEye}
                  setStageHair={setStageHair}
                  setPronouns={setPronouns}
                  setStageGender={setStageGender}
                  toggleOrientation={toggleOrientation}
                />
                <ExternalDnaToolsPanel />
              </div>
                <div className="dual-viz-toolbar" role="group" aria-label="Dual lineage layout">
                  <span className="dual-viz-label">View</span>
                  {(
                    [
                      ["table", "Table + picks"],
                      ["fan", "Ring fan"],
                      ["chess", "Layer cards"],
                    ] as const
                  ).map(([id, label]) => (
                    <label key={id} className="dual-viz-opt">
                      <input
                        type="radio"
                        name="dual-viz"
                        checked={dualVizMode === id}
                        onChange={() => setDualVizMode(id)}
                      />
                      {label}
                    </label>
                  ))}
                  <div className="dual-viz-toolbar-toggles">
                    <label className="dual-viz-bar-check">
                      <input
                        type="checkbox"
                        checked={dualMainLayerVisible}
                        onChange={(e) => setDualMainLayerVisible(e.target.checked)}
                      />
                      Main layer
                    </label>
                    <label className="dual-viz-bar-check">
                      <input
                        type="checkbox"
                        checked={dualTablePhenotypesVisible}
                        onChange={(e) => setDualTablePhenotypesVisible(e.target.checked)}
                      />
                      Table phenotypes
                    </label>
                  </div>
                </div>
                <p className="dual-viz-ref muted">
                  Fan / pedigree metaphors in desktop genealogy tools are surveyed in{" "}
                  <a
                    href="https://organizeyourfamilyhistory.com/in-praise-of-the-family-fan-chart/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    In praise of the family fan chart
                  </a>{" "}
                  (Organize Your Family History). This app’s ring view is a dual-lineage sketch, not a print chart.
                </p>
                {!dualMainLayerVisible && (
                  <p className="dual-viz-main-hidden muted" role="status">
                    Main layer off — enable <strong>Main layer</strong> in the toolbar to show the table, ring fan, or
                    layer cards.
                  </p>
                )}
                {dualMainLayerVisible && dualVizMode === "table" && (
                <div className="dual-wrap">
                <table className="dual-table">
                  <thead>
                    <tr>
                      <th className="col-gen" scope="col">
                        Gen
                      </th>
                      {Array.from({ length: dualColCount }, (_, ci) => (
                        <th key={ci} scope="col" className="dual-th-stack">
                          <input
                            className="inp dual-th-partner"
                            value={dualPartnerLine[ci] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDualPartnerLine((prev) => {
                                const next = [...prev];
                                while (next.length < dualColCount) next.push("");
                                next[ci] = v;
                                return next;
                              });
                            }}
                            placeholder="Child / children / partner notes"
                            aria-label={`Column ${ci + 1} — child, children, or partner notes`}
                          />
                          <input
                            className="inp dual-th-title"
                            value={dualColTitles[ci] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDualColTitles((prev) => {
                                const next = [...prev];
                                while (next.length < dualColCount) next.push("");
                                next[ci] = v;
                                return next;
                              });
                            }}
                            placeholder={defaultDualColTitles[ci] ?? `Column ${ci + 1}`}
                            aria-label={`Column ${ci + 1} — title`}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dualRows.map(({ gen, ids }) => {
                      const ys = ids
                        .filter((x): x is string => Boolean(x))
                        .map((id) => birthYear(indi[id]))
                        .filter((y): y is number => y != null);
                      const rowY =
                        ys.length === 0 ? undefined : Math.round(ys.reduce((a, c) => a + c, 0) / ys.length);
                      return (
                        <tr key={gen} className={`dual-table-tr ${timeBandClass(rowY)}`}>
                          <td className="col-gen mono">{gen}</td>
                          {ids.map((cellId, ci) => {
                            const showThumb =
                              dualMode === "quad" ? ci === 1 || ci === 3 : ci === 1;
                            return (
                              <td
                                key={ci}
                                className={showThumb ? "dual-cell dual-cell--with-thumb" : "dual-cell"}
                              >
                                {cellId ? (
                                  showThumb ? (
                                    <>
                                      <div className="dual-cell-row">
                                        <div className="dual-cell-text">
                                          <span className="mono">{cellId}</span>
                                          <br />
                                          <span className="dual-name">{formatName(cellId, indi)}</span>
                                          <span className="sex"> ({indi[cellId]?.s ?? "?"})</span>
                                        </div>
                                        <MediaThumb url={indi[cellId]?.p} title={formatName(cellId, indi)} />
                                      </div>
                                      {dualTablePhenotypesVisible && (
                                        <PhenotypeSelects
                                          compact
                                          id={cellId}
                                          blood={bloodMap[cellId] ?? { abo: "" as ABO, rh: "" as Rh }}
                                          face={(faceMap[cellId] ?? "") as FaceShape}
                                          setBlood={setBlood}
                                          setFace={setFace}
                                        />
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="mono">{cellId}</span>
                                      <br />
                                      <span className="dual-name">{formatName(cellId, indi)}</span>
                                      <span className="sex"> ({indi[cellId]?.s ?? "?"})</span>
                                      {dualTablePhenotypesVisible && (
                                        <PhenotypeSelects
                                          compact
                                          id={cellId}
                                          blood={bloodMap[cellId] ?? { abo: "" as ABO, rh: "" as Rh }}
                                          face={(faceMap[cellId] ?? "") as FaceShape}
                                          setBlood={setBlood}
                                          setFace={setFace}
                                        />
                                      )}
                                    </>
                                  )
                                ) : (
                                  <span className="muted-empty">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                )}
                {dualMainLayerVisible && dualVizMode === "fan" && (
                  <DualFanChart
                    rows={dualRows}
                    individuals={indi}
                    bloodMap={bloodMap}
                    faceMap={faceMap}
                    titles={vizColumnTitles}
                  />
                )}
                {dualMainLayerVisible && dualVizMode === "chess" && (
                  <DualChessLayers
                    rows={dualRows}
                    individuals={indi}
                    bloodMap={bloodMap}
                    faceMap={faceMap}
                    titles={vizColumnTitles}
                  />
                )}
              </>
            )}

            {tab === "patriline" && (
              <div className="lineage-split">
                <div className="lineage-split-list">
                  <ol className="list pedigree-list">
                    {pat.map((id, i) => (
                      <li key={`${id}-${i}`} className={timeBandClass(birthYear(indi[id]))}>
                        <span className="gen">{i}</span>{" "}
                        <span className="mono">{id}</span> — {formatName(id, indi)}{" "}
                        <span className="sex">({indi[id]?.s ?? "?"})</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <aside className="lineage-split-tree" aria-label="Patriline flow diagram">
                  <LineageFlowTree
                    ids={pat}
                    individuals={indi}
                    onPickRoot={(id) => setRootId(id)}
                    ariaLabel="Patriline flow — tap a card to set root"
                  />
                </aside>
              </div>
            )}

            {tab === "matriline" && (
              <div className="lineage-split">
                <div className="lineage-split-list">
                  <ol className="list pedigree-list">
                    {mat.map((id, i) => (
                      <li key={`${id}-${i}`} className={timeBandClass(birthYear(indi[id]))}>
                        <span className="gen">{i}</span>{" "}
                        <span className="mono">{id}</span> — {formatName(id, indi)}{" "}
                        <span className="sex">({indi[id]?.s ?? "?"})</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <aside className="lineage-split-tree" aria-label="Matriline flow diagram">
                  <LineageFlowTree
                    ids={mat}
                    individuals={indi}
                    onPickRoot={(id) => setRootId(id)}
                    ariaLabel="Matriline flow — tap a card to set root"
                  />
                </aside>
              </div>
            )}

            {tab === "male-anc" && (
              <div className="lineage-split lineage-split--cone">
                <div className="lineage-split-list">
                  <ul className="list dense">
                    {maleAnc.map((id) => (
                      <li key={id}>
                        <span className="mono">{id}</span> — {formatName(id, indi)}
                      </li>
                    ))}
                  </ul>
                </div>
                <aside className="lineage-split-tree" aria-label="Male ancestors card flow">
                  <LineageFlowTree
                    mode="flat"
                    maxItems={100}
                    ids={maleAncFlowIds}
                    individuals={indi}
                    onPickRoot={(id) => setRootId(id)}
                    leadText="Male cone — oldest-first by birth year when known, then name."
                    ariaLabel="Male ancestors — tap a card to set root"
                  />
                </aside>
              </div>
            )}

            {tab === "female-anc" && (
              <div className="lineage-split lineage-split--cone">
                <div className="lineage-split-list">
                  <ul className="list dense">
                    {femaleAnc.map((id) => (
                      <li key={id}>
                        <span className="mono">{id}</span> — {formatName(id, indi)}
                      </li>
                    ))}
                  </ul>
                </div>
                <aside className="lineage-split-tree" aria-label="Female ancestors card flow">
                  <LineageFlowTree
                    mode="flat"
                    maxItems={100}
                    ids={femaleAncFlowIds}
                    individuals={indi}
                    onPickRoot={(id) => setRootId(id)}
                    leadText="Female cone — oldest-first by birth year when known, then name."
                    ariaLabel="Female ancestors — tap a card to set root"
                  />
                </aside>
              </div>
            )}

            {tab === "by-gen" && (
              <div className="lineage-split lineage-split--cone">
                <div className="lineage-split-list">
                  <div className="gens">
                    {[...byGen.entries()].map(([g, ids]) => (
                      <div key={g} className="genblock">
                        <h3 className="h3">Generation {g}</h3>
                        <ul className="list dense">
                          {ids.map((id: string) => (
                            <li key={id}>
                              <span className="mono">{id}</span> — {formatName(id, indi)}{" "}
                              <span className="sex">({indi[id]?.s ?? "?"})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <aside className="lineage-split-tree" aria-label="By generation card flow">
                  <LineageFlowTree
                    mode="flat"
                    maxItems={120}
                    ids={byGenFlatIds}
                    individuals={indi}
                    onPickRoot={(id) => setRootId(id)}
                    leadText="Same people in BFS generation order (gen 0, then 1, then 2…)."
                    ariaLabel="By generation — tap a card to set root"
                  />
                </aside>
              </div>
            )}

            {tab === "rulers" && (
              <RulersView
                rulersJsonUrl={effectiveRulersJsonUrl}
                onOpenInDual={(id) => {
                  setRootId(id);
                  setTab("dual");
                }}
              />
            )}

            {tab === "directory" && (
              <WorldDirectoryPage />
            )}

            {tab === "map" && (
              <div className="map-tab">
                <p className="map-tab-lead">
                  Full story layer active: partners, travel, historical events, elder knowledge, forward branches.
                  Use Place Curation and the new story panels to lock coordinates for instant, rich maps.
                </p>
                <p className="map-tab-lead" style={{ fontSize: "0.8rem", marginTop: -8 }}>
                  Same controls as the embedded map on Dual lines. Click events on the Deep Narrative Timeline to explore.
                </p>
                {lastTimelineEvent && (
                  <div style={{ fontSize: "0.75rem", marginTop: 4, padding: "4px 8px", background: "rgba(0,0,0,0.2)", borderRadius: 4 }}>
                    Last timeline event: <strong>{lastTimelineEvent.label}</strong> ({lastTimelineEvent.year}) — {lastTimelineEvent.type}
                  </div>
                )}
                <div className="map-toolbar">
                  <label className="dual-label grow dual-label-mapscope">
                    <span>What to show</span>
                    <MapScopeSelect value={mapScope} onChange={setMapScope} />
                  </label>
                  {mapScopeSupportsConnectLine(mapScope) && (
                    <label className="map-chk">
                      <input
                        type="checkbox"
                        checked={mapConnectLine}
                        onChange={(e) => setMapConnectLine(e.target.checked)}
                      />
                      <span>Connect points with a line (GED list order — not migration)</span>
                    </label>
                  )}
                  {mapScopeSupportsPartnersToggle(mapScope) && (
                    <label
                      className="map-chk"
                      title="FAMS + GED NOTE (gp) + browser partner list (any count). See Dual tab + ged_export.py."
                    >
                      <input
                        type="checkbox"
                        checked={mapIncludePartners}
                        onChange={(e) => setMapIncludePartners(e.target.checked)}
                      />
                      <span>
                        Partners (FAMS + GED + browser) —{" "}
                        {mapScope.includes("births") ? "their birth places" : "their death places"}
                      </span>
                    </label>
                  )}
                </div>
                <MapView
                  individuals={indi}
                  families={fam}
                  rootId={rootId}
                  patIds={pat}
                  matIds={mat}
                  scope={mapScope}
                  connectLine={mapConnectLine}
                  includePartners={mapIncludePartners}
                  partnerOverlay={partnerOverlay}
                  embed={false}
                  showFoot
                  patMatBirthDualLines={patMatBirthDualLines}
                  streamAccent={streamAccent}
                />
              </div>
            )}

            {tab === "search" && (
              <div className="lineage-split lineage-split--cone">
                <div className="lineage-split-list">
                  <p className="search-sync-hint">
                    Same search field as in the top controls panel above.
                  </p>
                  <input
                    className="inp wide"
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    placeholder="Type part of a name…"
                  />
                  <ul className="list hits">
                    {searchHits.slice(0, 200).map(({ id, name }) => (
                      <li key={id}>
                        <button type="button" className="linkbtn" onClick={() => setRootId(id)}>
                          Set root
                        </button>{" "}
                        <button
                          type="button"
                          className="linkbtn"
                          onClick={() => {
                            setCompareRootId(id);
                            setDualMode("pat-pat");
                            setTab("dual");
                          }}
                        >
                          Set compare
                        </button>{" "}
                        <span className="mono">{id}</span> — {name}
                      </li>
                    ))}
                  </ul>
                  {searchHits.length > 200 && (
                    <p className="search-more">
                      Showing 200 of {searchHits.length} matches. Refine the search to narrow
                      results.
                    </p>
                  )}
                </div>
                <aside className="lineage-split-tree" aria-label="Search hits card flow">
                  {searchHitIds.length > 0 ? (
                    <LineageFlowTree
                      mode="flat"
                      maxItems={40}
                      ids={searchHitIds}
                      individuals={indi}
                      onPickRoot={(id: string) => setRootId(id)}
                      leadText="Top matches as cards (same order as list)."
                      ariaLabel="Search hits — tap a card to set root"
                    />
                  ) : (
                    <div className="lineage-flow-card-tree" role="region" aria-label="Search hits">
                      <p className="lineage-flow-lead muted">Type in the search box to show hit cards here.</p>
                    </div>
                  )}
                </aside>
              </div>
            )}
          </section>

          {tab !== "home" && <footer className="ftr mono">{data.source}</footer>}
        </>
      )}

      {data &&
        !rulersTestPath &&
        dualMapFull &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="map-fs-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Full map"
            onClick={() => setDualMapFull(false)}
          >
            <div className="map-fs-panel" onClick={(e) => e.stopPropagation()}>
              <div className="map-fs-head">
                <span className="map-fs-title">Map / path — full view</span>
                <button type="button" className="btn" onClick={() => setDualMapFull(false)}>
                  Close
                </button>
              </div>
              <div className="map-fs-body">
                <MapView
                  individuals={indi}
                  families={fam}
                  rootId={rootId}
                  patIds={pat}
                  matIds={mat}
                  scope={mapScope}
                  connectLine={mapConnectLine}
                  includePartners={mapIncludePartners}
                  partnerOverlay={partnerOverlay}
                  embed={false}
                  showFoot
                  patMatBirthDualLines={patMatBirthDualLines}
                  streamAccent={streamAccent}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Floating Data Sources button — always accessible, especially powerful on mobile/home */}
      {!rulersTestPath && (
        <button
          type="button"
          onClick={() => {
            // Scroll to the data controls section
            const controls = document.querySelector('.controls');
            if (controls) {
              controls.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Briefly highlight the upgrade banner if visible
              setTimeout(() => {
                const banner = document.querySelector('.upgrade-banner');
                if (banner) {
                  banner.classList.add('pulse-highlight');
                  setTimeout(() => banner.classList.remove('pulse-highlight'), 1600);
                }
              }, 650);
            } else {
              // Fallback: focus the preset select
              const sel = document.querySelector('.data-source-preset');
              (sel as HTMLElement)?.focus();
            }
          }}
          style={{
            position: 'fixed',
            bottom: 18,
            right: 18,
            zIndex: 999,
            background: 'rgba(26, 35, 51, 0.92)',
            color: '#c9d4e8',
            border: '1px solid #3a4a63',
            borderRadius: 999,
            padding: '9px 16px 9px 15px',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Open data sources and tree loading options"
        >
          <span style={{ fontSize: 15 }}>📁</span>
          <span>Data</span>
          {(isMinimalData || isFixtureData) && (
            <span style={{ 
              background: '#5ab0ff', 
              color: '#111', 
              fontSize: 10, 
              padding: '1px 6px', 
              borderRadius: 999, 
              fontWeight: 700,
              marginLeft: 2
            }}>
              Upgrade
            </span>
          )}
        </button>
      )}
    </div>
  );
}
