import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { geocodePlacesContrail } from "./geocode";
import { MapGeocodeOverlay, useGeocodeElapsedMs } from "./MapGeocodeOverlay";
import { localPartnerMeta, type PartnerOverlayMap } from "./partnerOverlayStorage";
import type { FamRec, IndiRec } from "./types";
import { formatName, partnersForGeneticMap } from "./trace";
import { birthYear } from "./timeBands";

/** GED-backed map layers + labels for life domains; unsupported items are in MapScopeSelect (disabled). */
export type MapScope =
  | "root-life"
  | "root-birth-context"
  | "root-marriage"
  | "root-divorce"
  | "pat-births"
  | "mat-births"
  | "pat-births-male"
  | "pat-births-female"
  | "mat-births-male"
  | "mat-births-female"
  | "pat-deaths"
  | "mat-deaths"
  | "pat-travel"
  | "mat-travel"
  | "pat-marriage"
  | "mat-marriage"
  | "pat-divorce"
  | "mat-divorce"
  | "pat-burial"
  | "mat-burial";

export function mapScopeSupportsConnectLine(scope: MapScope): boolean {
  return scope !== "root-birth-context";
}

/** Partner birth or death places: FAMS + GED `gp` + optional browser overlay (any count per person). */
export function mapScopeSupportsPartnersToggle(scope: MapScope): boolean {
  return (
    scope === "pat-births" ||
    scope === "mat-births" ||
    scope === "pat-births-male" ||
    scope === "pat-births-female" ||
    scope === "mat-births-male" ||
    scope === "mat-births-female" ||
    scope === "pat-deaths" ||
    scope === "mat-deaths"
  );
}

type Mk = "b" | "d" | "m" | "w" | "v" | "u" | "p";

type Props = {
  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
  rootId: string;
  patIds: string[];
  matIds: string[];
  scope: MapScope;
  connectLine: boolean;
  /** When true (pat/mat births or deaths), also map partners: FAMS + NOTE genetic partners (birth or death place). */
  includePartners?: boolean;
  /** Browser-only partner xrefs per person (any count); merged after FAMS + GED `gp`. */
  partnerOverlay?: PartnerOverlayMap;
  embed?: boolean;
  /** Full viewport map (mobile page) — enables wheel zoom and flex height. */
  fullPage?: boolean;
  showFoot?: boolean;
  /** When true and scope is pat/mat *births*, geocode the opposite stream and draw a second polyline. */
  patMatBirthDualLines?: boolean;
  /** Thicker polyline for the focused stream when dual birth lines are shown. */
  streamAccent?: "pat" | "mat";
  /** Global time filter from the persistent Deep Narrative header / slider */
  timeRange?: [number, number];
};

function FitToCoords({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    const nudge = () => map.invalidateSize({ animate: false });
    nudge();
    if (coords.length === 1) {
      map.setView(coords[0], 8);
    } else {
      const latLngs = coords.map(([la, lo]) => L.latLng(la, lo));
      map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32], maxZoom: 11 });
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(nudge);
    });
    const t = window.setTimeout(nudge, 120);
    return () => window.clearTimeout(t);
  }, [map, coords]);
  return null;
}

function MapResize({ revision }: { revision: string }) {
  const map = useMap();
  useEffect(() => {
    const nudge = () => map.invalidateSize({ animate: false });
    nudge();
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(nudge);
    });
    const timers = [60, 200, 500].map((ms) => window.setTimeout(nudge, ms));
    window.addEventListener("resize", nudge);
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", nudge);
    };
  }, [map, revision]);
  return null;
}

function markerStyle(kind: Mk) {
  switch (kind) {
    case "d":
      return { color: "#ffb74d", fillColor: "#ffb74d", fillOpacity: 0.82, weight: 2 };
    case "b":
      return { color: "#81c784", fillColor: "#81c784", fillOpacity: 0.82, weight: 2 };
    case "w":
      return { color: "#f06292", fillColor: "#f06292", fillOpacity: 0.86, weight: 2 };
    case "v":
      return { color: "#ba68c8", fillColor: "#ba68c8", fillOpacity: 0.86, weight: 2 };
    case "u":
      return { color: "#a1887f", fillColor: "#a1887f", fillOpacity: 0.86, weight: 2 };
    case "p":
      return { color: "#ec407a", fillColor: "#ec407a", fillOpacity: 0.88, weight: 2 };
    default:
      return { color: "#90caf9", fillColor: "#90caf9", fillOpacity: 0.82, weight: 2 };
  }
}

function lineIdsForPatMat(scope: MapScope, patIds: string[], matIds: string[]): string[] {
  return scope.startsWith("mat-") ? matIds : patIds;
}

function filterSex(ids: string[], individuals: Record<string, IndiRec>, sex: "M" | "F"): string[] {
  return ids.filter((id) => (individuals[id]?.s ?? "U") === sex);
}

function idsForLineScope(
  scope: MapScope,
  patIds: string[],
  matIds: string[],
  individuals: Record<string, IndiRec>
): string[] {
  let ids = lineIdsForPatMat(scope, filteredPat, filteredMat);
  if (scope === "pat-births-male" || scope === "mat-births-male") ids = filterSex(ids, individuals, "M");
  if (scope === "pat-births-female" || scope === "mat-births-female") ids = filterSex(ids, individuals, "F");
  return ids;
}

/** Opposite pat/mat birth scope for dual throughlines (same sex filter when applicable). */
function oppositePatMatBirthScope(scope: MapScope): MapScope | null {
  switch (scope) {
    case "pat-births":
      return "mat-births";
    case "mat-births":
      return "pat-births";
    case "pat-births-male":
      return "mat-births-male";
    case "mat-births-male":
      return "pat-births-male";
    case "pat-births-female":
      return "mat-births-female";
    case "mat-births-female":
      return "pat-births-female";
    default:
      return null;
  }
}

function footerForScope(scope: MapScope, includePartners: boolean): string {
  if (scope === "root-life" || scope === "pat-travel" || scope === "mat-travel") {
    return "Life / travel uses BIRT, RESI, and DEAT in GED order; the line extends waypoint-by-waypoint as geocoding completes.";
  }
  if (scope === "root-birth-context") {
    return "BIRT.TYPE (when exported) labels birth locale — hospital/church/home depends on how your GED encodes it.";
  }
  if (scope.includes("marriage") || scope.includes("divorce")) {
    return "Marriage / divorce use MARR.PLAC and DIV.PLAC from family records when the exporter found them.";
  }
  if (scope.includes("burial")) {
    return "Burial uses BURI.PLAC when present in the GED export.";
  }
  if (scope.includes("births") || scope.includes("deaths")) {
    const sp =
      includePartners && mapScopeSupportsPartnersToggle(scope)
        ? " Pink markers: FAMS + GED NOTE partners + optional browser partner list (any count). "
        : "";
    return `Patriline / matriline maps follow root → furthest ancestor order; the path draws segment-by-segment as each place resolves (cached places are instant).${sp}`;
  }
  return "Dark basemap (CARTO + OSM). Full story layer: partners • travel • historical events • elder knowledge • forward branches. Use Place Curation to lock story places for instant maps.";
}

export function MapView({
  individuals,
  families,
  rootId,
  patIds,
  matIds,
  scope,
  connectLine,
  includePartners = false,
  partnerOverlay,
  embed = false,
  fullPage = false,
  showFoot = true,
  patMatBirthDualLines = false,
  streamAccent = "pat",
  timeRange = [-5000, 2300],
}: Props) {
  const [pts, setPts] = useState<{ label: string; lat: number; lng: number; kind: Mk }[]>([]);
  const [line, setLine] = useState<[number, number][]>([]);
  const [lineB, setLineB] = useState<[number, number][]>([]);
  const [status, setStatus] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const geocodeElapsedMs = useGeocodeElapsedMs(geocoding);

  const partnersOn = includePartners && mapScopeSupportsPartnersToggle(scope);
  const foot = useMemo(() => footerForScope(scope, includePartners), [scope, includePartners]);

  const partnerSig = useMemo(() => {
    if (!partnerOverlay || Object.keys(partnerOverlay).length === 0) return "0";
    let n = 0;
    for (const v of Object.values(partnerOverlay)) n += v.length;
    return `${Object.keys(partnerOverlay).length}:${n}`;
  }, [partnerOverlay]);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    let alive = true;

    async function run() {
      setGeocoding(true);
      try {
        setPts([]);
        setLine([]);
        setLineB([]);

        // === Deeper time range + search-aware filtering ===
        const [tStart, tEnd] = timeRange;
        const isInRange = (id: string) => {
          const rec = individuals[id];
          if (!rec) return false;
          const by = birthYear(rec);
          const dy = rec.dy;
          const inBirth = by != null && by >= tStart && by <= tEnd;
          const inDeath = dy != null && dy >= tStart && dy <= tEnd;
          return inBirth || inDeath;
        };

        const filteredPat = patIds.filter(isInRange);
        const filteredMat = matIds.filter(isInRange);

        // Helper for ordering markers by year when time filtering is active
        const getYearForId = (id: string) => birthYear(individuals[id]) ?? 0;

        const geocodeRun = async (
        places: string[],
        labels: string[],
        kinds: Mk[],
        statusMsg: string,
        doneMsg: (n: number) => string
      ) => {
        if (places.length === 0) {
          setStatus(statusMsg);
          return;
        }
        const markers: typeof pts = [];
        const ok: [number, number][] = [];
        const flush = () => {
          if (cancelled) return;
          setPts([...markers]);
          setLine(connectLine && ok.length >= 2 ? [...ok] : []);
        };
        await geocodePlacesContrail(places, ac.signal, ({ index, total, coord }) => {
          if (cancelled) return;
          setStatus(`Plotting waypoint ${index + 1}/${total} (start → line end)…`);
          if (coord) {
            markers.push({
              label: labels[index] ?? places[index],
              lat: coord.lat,
              lng: coord.lng,
              kind: kinds[index] ?? "m",
            });
            ok.push([coord.lat, coord.lng]);
          }
          flush();
        });
        if (cancelled) return;
        setStatus(markers.length ? doneMsg(markers.length) : "No coordinates returned.");
      };

      if (scope === "root-life") {
        const r = individuals[rootId];
        const rawLw = r?.lw?.length ? r.lw : [];
        const places =
          rawLw.length > 0 ? [...rawLw] : ([r?.bp, r?.dp].filter(Boolean) as string[]);
        if (places.length === 0) {
          setStatus("No birth, death, or residence places in the export for this person.");
          return;
        }
        const markers: typeof pts = [];
        const ok: [number, number][] = [];
        const flushLife = () => {
          if (cancelled) return;
          setPts([...markers]);
          setLine(connectLine && ok.length >= 2 ? [...ok] : []);
        };
        await geocodePlacesContrail(places, ac.signal, ({ index, total, coord }) => {
          if (cancelled) return;
          setStatus(`Life path waypoint ${index + 1}/${total} (birth → death)…`);
          if (!coord) {
            flushLife();
            return;
          }
          const pl = places[index];
          const role =
            index === 0 ? "Birth / start" : index === places.length - 1 ? "Death / end" : "Residence";
          const kind: Mk = index === 0 ? "b" : index === places.length - 1 ? "d" : "m";
          markers.push({
            label: `${role}: ${pl}`,
            lat: coord.lat,
            lng: coord.lng,
            kind,
          });
          ok.push([coord.lat, coord.lng]);
          flushLife();
        });
        if (cancelled) return;
        setStatus(
          ok.length
            ? `Life path: ${ok.length} point(s). ${connectLine && ok.length >= 2 ? "Line draws in GED order as each place resolves." : 'Use "Connect line" to draw between waypoints.'}`
            : "No coordinates returned (try different spelling in GED)."
        );
        return;
      }

      if (scope === "root-birth-context") {
        const r = individuals[rootId];
        const bp = r?.bp?.trim();
        if (!bp) {
          setStatus("No birth place (BIRT.PLAC) for root in this export.");
          return;
        }
        const typ = r?.btyp?.trim();
        const label = typ
          ? `Birth (${typ}) — ${bp}`
          : `Birth — ${bp} (add BIRT.TYPE in GED for hospital/church/stillborn etc.)`;
        await geocodeRun([bp], [label], ["b"], "", () => "Birth context: 1 point.");
        return;
      }

      if (scope === "root-marriage" || scope === "root-divorce") {
        const want = scope === "root-marriage" ? "marr" : "div";
        const rows = (individuals[rootId]?.ev ?? [])
          .filter((e) => e.k === want && e.pl?.trim())
          .map((e) => ({
            pl: e.pl.trim(),
            y: e.y ?? 0,
            label: `${want === "marr" ? "Marriage" : "Divorce"}${e.y != null ? ` (${e.y})` : ""} — ${e.pl.trim()}`,
          }));
        rows.sort((a, b) => a.y - b.y);
        const kinds: Mk[] = rows.map(() => (want === "marr" ? "w" : "v"));
        await geocodeRun(
          rows.map((x) => x.pl),
          rows.map((x) => x.label),
          kinds,
          `No ${want === "marr" ? "marriage" : "divorce"} places (MARR.PLAC/DIV.PLAC) on family records for root.`,
          (n) => `${n} point(s) for root ${want === "marr" ? "marriages" : "divorces"}.`
        );
        return;
      }

      const lineScopes = [
        "pat-births",
        "mat-births",
        "pat-births-male",
        "pat-births-female",
        "mat-births-male",
        "mat-births-female",
        "pat-deaths",
        "mat-deaths",
        "pat-travel",
        "mat-travel",
        "pat-marriage",
        "mat-marriage",
        "pat-divorce",
        "mat-divorce",
        "pat-burial",
        "mat-burial",
      ] as const;

      if ((lineScopes as readonly string[]).includes(scope)) {
        const ids = idsForLineScope(scope, filteredPat, filteredMat, individuals);
        const places: string[] = [];
        const labels: string[] = [];
        const kinds: Mk[] = [];

        if (
          scope === "pat-births" ||
          scope === "mat-births" ||
          scope === "pat-births-male" ||
          scope === "pat-births-female" ||
          scope === "mat-births-male" ||
          scope === "mat-births-female"
        ) {
          for (const id of ids) {
            const bp = individuals[id]?.bp?.trim();
            if (bp) {
              places.push(bp);
              labels.push(`${formatName(id, individuals)} — birth — ${bp}`);
              kinds.push("b");
            }
            if (partnersOn) {
              for (const { id: sid, via } of partnersForGeneticMap(id, individuals, families, partnerOverlay)) {
                const sbp = individuals[sid]?.bp?.trim();
                if (!sbp) continue;
                places.push(sbp);
                const rel =
                  via === "fams"
                    ? "partner (FAMS)"
                    : via === "note"
                      ? "partner (NOTE genetics)"
                      : "partner (browser)";
                const meta = via === "local" ? localPartnerMeta(partnerOverlay, id, sid) : undefined;
                const metaBit =
                  meta?.relation || meta?.notes
                    ? ` [${[meta.relation, meta.notes].filter(Boolean).join(" · ").slice(0, 120)}]`
                    : "";
                labels.push(
                  `${formatName(id, individuals)} — ${rel}${metaBit}: ${formatName(sid, individuals)} — birth — ${sbp}`
                );
                kinds.push("p");
              }
            }
          }

          // Deeper ordering: sort by birth year when global time filter is active
          if (timeRange && ids.length > 1) {
            const withYears = places.map((p, i) => ({ place: p, label: labels[i], kind: kinds[i], year: getYearForId(ids[i] || '') }));
            withYears.sort((a, b) => a.year - b.year);
            places.length = 0; labels.length = 0; kinds.length = 0;
            withYears.forEach(item => {
              places.push(item.place);
              labels.push(item.label);
              kinds.push(item.kind);
            });
          }

          await geocodeRun(
            places,
            labels,
            kinds,
            "No birth places (bp) on this line in the export.",
            (n) =>
              `Birth map: ${n} place(s)${connectLine && n >= 2 ? " (connected in list order)" : ""}${partnersOn ? ", incl. partners" : ""}.`
          );
          if (cancelled) return;
          if (patMatBirthDualLines && connectLine) {
            const opp = oppositePatMatBirthScope(scope);
            if (opp) {
              const oppIds = idsForLineScope(opp, filteredPat, filteredMat, individuals);
              const oppPlaces: string[] = [];
              for (const id of oppIds) {
                const bp = individuals[id]?.bp?.trim();
                if (bp) oppPlaces.push(bp);
              }
              if (oppPlaces.length >= 2) {
                const okB: [number, number][] = [];
                await geocodePlacesContrail(oppPlaces, ac.signal, ({ index, total, coord }) => {
                  if (cancelled) return;
                  setStatus(`Opposite line waypoint ${index + 1}/${total} (start → line end)…`);
                  if (coord) okB.push([coord.lat, coord.lng]);
                  setLineB(connectLine && okB.length >= 2 ? [...okB] : []);
                });
                if (cancelled) return;
              } else {
                setLineB([]);
              }
            } else {
              setLineB([]);
            }
          } else {
            setLineB([]);
          }
          return;
        }

        if (scope === "pat-deaths" || scope === "mat-deaths") {
          for (const id of ids) {
            const dp = individuals[id]?.dp?.trim();
            if (dp) {
              places.push(dp);
              labels.push(`${formatName(id, individuals)} — death — ${dp}`);
              kinds.push("d");
            }
            if (partnersOn) {
              for (const { id: sid, via } of partnersForGeneticMap(id, individuals, families, partnerOverlay)) {
                const sdp = individuals[sid]?.dp?.trim();
                if (!sdp) continue;
                places.push(sdp);
                const rel =
                  via === "fams"
                    ? "partner (FAMS)"
                    : via === "note"
                      ? "partner (NOTE genetics)"
                      : "partner (browser)";
                const meta = via === "local" ? localPartnerMeta(partnerOverlay, id, sid) : undefined;
                const metaBit =
                  meta?.relation || meta?.notes
                    ? ` [${[meta.relation, meta.notes].filter(Boolean).join(" · ").slice(0, 120)}]`
                    : "";
                labels.push(
                  `${formatName(id, individuals)} — ${rel}${metaBit}: ${formatName(sid, individuals)} — death — ${sdp}`
                );
                kinds.push("p");
              }
            }
          }
          await geocodeRun(
            places,
            labels,
            kinds,
            "No death places (dp) on this line in the export.",
            (n) => `Death map: ${n} place(s)${partnersOn ? ", incl. partners" : ""}.`
          );
          return;
        }

        if (scope === "pat-travel" || scope === "mat-travel") {
          for (const id of ids) {
            const lw = individuals[id]?.lw;
            if (!lw || lw.length < 3) continue;
            for (const pl of lw.slice(1, -1)) {
              const t = pl.trim();
              if (!t) continue;
              places.push(t);
              labels.push(`${formatName(id, individuals)} — residence — ${t}`);
              kinds.push("m");
            }
          }
          await geocodeRun(
            places,
            labels,
            kinds,
            "No intermediate residence places (RESI between birth and death) on this line.",
            (n) => `Residence / travel: ${n} waypoint(s) from GED RESI.`
          );
          return;
        }

        if (scope === "pat-marriage" || scope === "mat-marriage") {
          for (const id of ids) {
            for (const e of individuals[id]?.ev ?? []) {
              if (e.k !== "marr" || !e.pl?.trim()) continue;
              places.push(e.pl.trim());
              labels.push(
                `${formatName(id, individuals)} — marriage${e.y != null ? ` (${e.y})` : ""} — ${e.pl.trim()}`
              );
              kinds.push("w");
            }
          }
          await geocodeRun(
            places,
            labels,
            kinds,
            "No marriage places exported (re-run ged_export after MARR.PLAC in GED).",
            (n) => `Marriage places: ${n}.`
          );
          return;
        }

        if (scope === "pat-divorce" || scope === "mat-divorce") {
          for (const id of ids) {
            for (const e of individuals[id]?.ev ?? []) {
              if (e.k !== "div" || !e.pl?.trim()) continue;
              places.push(e.pl.trim());
              labels.push(
                `${formatName(id, individuals)} — divorce${e.y != null ? ` (${e.y})` : ""} — ${e.pl.trim()}`
              );
              kinds.push("v");
            }
          }
          await geocodeRun(
            places,
            labels,
            kinds,
            "No divorce places exported (DIV.PLAC in GED + re-export).",
            (n) => `Divorce places: ${n}.`
          );
          return;
        }

        if (scope === "pat-burial" || scope === "mat-burial") {
          for (const id of ids) {
            const bur = individuals[id]?.burp?.trim();
            if (!bur) continue;
            places.push(bur);
            labels.push(`${formatName(id, individuals)} — burial — ${bur}`);
            kinds.push("u");
          }
          await geocodeRun(
            places,
            labels,
            kinds,
            "No burial places (BURI.PLAC) on this line — re-export after adding BURI in GED.",
            (n) => `Burial map: ${n} place(s).`
          );
          return;
        }
      }

        setStatus("Unknown map scope.");
      } catch (e) {
        if (!cancelled) {
          setStatus(
            `Map data error: ${e instanceof Error ? e.message : String(e)}. Check network / ad blockers for Nominatim.`
          );
        }
      } finally {
        if (alive) setGeocoding(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
      alive = false;
      ac.abort();
    };
  }, [
    individuals,
    families,
    rootId,
    patIds,
    matIds,
    scope,
    connectLine,
    partnersOn,
    partnerOverlay,
    patMatBirthDualLines,
  ]);

  const center: [number, number] = pts[0] ? [pts[0].lat, pts[0].lng] : [39.8283, -98.5795];
  const fitCoords: [number, number][] = (() => {
    const fromPts = pts.map((p) => [p.lat, p.lng] as [number, number]);
    if (line.length >= 2 && lineB.length >= 2) return [...line, ...lineB];
    if (line.length >= 2) return line;
    if (lineB.length >= 2) return lineB;
    return fromPts;
  })();
  const mapSessionKey = `${embed ? "e" : "p"}|${rootId}|${scope}|${connectLine}|${partnersOn ? "1" : "0"}|${partnerSig}|${patMatBirthDualLines ? "1" : "0"}|${streamAccent}|${patIds.length}|${matIds.length}`;
  const mapFitRevision = `${mapSessionKey}|${pts.length}|${line.length}|${lineB.length}`;

  const dualBirthLines = lineB.length >= 2;
  const primaryIsPat =
    scope === "pat-births" ||
    scope === "pat-births-male" ||
    scope === "pat-births-female";

  return (
    <div
      className={`map-shell map-shell--dark${embed ? " map-shell--embed" : ""}${fullPage ? " map-shell--fullpage" : ""}`}
      aria-busy={geocoding}
    >
      <p className="map-meta">{status}</p>
      <div className={`map-canvas${embed ? " map-canvas--embed" : ""}${fullPage ? " map-canvas--fullpage" : ""}`}>
        <MapGeocodeOverlay active={geocoding} elapsedMs={geocodeElapsedMs} detail={status} />
        <MapContainer
          key={mapSessionKey}
          center={center}
          zoom={4}
          scrollWheelZoom={fullPage}
          className="map-leaflet"
        >
          <MapResize revision={mapFitRevision} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          {line.length >= 2 && (
            <Polyline
              positions={line}
              color={primaryIsPat ? "#7eb8ff" : "#f06292"}
              weight={
                dualBirthLines
                  ? streamAccent === (primaryIsPat ? "pat" : "mat")
                    ? 4
                    : 2
                  : 3
              }
              opacity={0.92}
            />
          )}
          {lineB.length >= 2 && (
            <Polyline
              positions={lineB}
              color={primaryIsPat ? "#f06292" : "#7eb8ff"}
              weight={
                streamAccent === (primaryIsPat ? "mat" : "pat")
                  ? 4
                  : 2
              }
              opacity={0.92}
            />
          )}
          {pts.map((m, i) => (
            <CircleMarker
              key={`${m.lat.toFixed(4)}-${m.lng.toFixed(4)}-${i}`}
              center={[m.lat, m.lng]}
              radius={m.kind === "d" || m.kind === "v" || m.kind === "p" ? 5 : 7}
              pathOptions={markerStyle(m.kind)}
            >
              <Popup>
                <div className="map-popup">{m.label}</div>
              </Popup>
            </CircleMarker>
          ))}
          {fitCoords.length > 0 && <FitToCoords coords={fitCoords} />}
        </MapContainer>
      </div>
      {showFoot && <p className="map-foot">{foot}</p>}
    </div>
  );
}

export function MapScopeSelect({
  id,
  className = "sel sel-map-scope",
  value,
  onChange,
}: {
  id?: string;
  className?: string;
  value: MapScope;
  onChange: (v: MapScope) => void;
}) {
  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value as MapScope)}
    >
      <optgroup label="Root — life and civil status (GED places)">
        <option value="root-life">Life path — birth, residences, death</option>
        <option value="root-birth-context">Birth locale + BIRT.TYPE (hospital/church if encoded)</option>
        <option value="root-marriage">Marriages — MARR.PLAC from families</option>
        <option value="root-divorce">Divorces — DIV.PLAC from families</option>
      </optgroup>
      <optgroup label="Patriline — births, sex filter, deaths, travel, marriage, divorce, burial">
        <option value="pat-births">Births (all)</option>
        <option value="pat-births-male">Births — males (SEX M)</option>
        <option value="pat-births-female">Births — females (SEX F)</option>
        <option value="pat-deaths">Deaths</option>
        <option value="pat-travel">Travel / residences — RESI between birth &amp; death</option>
        <option value="pat-marriage">Marriages — MARR.PLAC per ancestor</option>
        <option value="pat-divorce">Divorces — DIV.PLAC per ancestor</option>
        <option value="pat-burial">Burials — BURI.PLAC</option>
      </optgroup>
      <optgroup label="Matriline — same layers">
        <option value="mat-births">Births (all)</option>
        <option value="mat-births-male">Births — males (SEX M)</option>
        <option value="mat-births-female">Births — females (SEX F)</option>
        <option value="mat-deaths">Deaths</option>
        <option value="mat-travel">Travel / residences — RESI between birth &amp; death</option>
        <option value="mat-marriage">Marriages — MARR.PLAC per ancestor</option>
        <option value="mat-divorce">Divorces — DIV.PLAC per ancestor</option>
        <option value="mat-burial">Burials — BURI.PLAC</option>
      </optgroup>
      <optgroup label="Not in GED export (no standard place field — disabled)">
        <option disabled value="__ged_taxes">
          Taxes / treasury (no map plac in GEDCOM)
        </option>
        <option disabled value="__ged_war">
          War / battle / famine / illness (Rulers tab text heuristics; no battle map)
        </option>
        <option disabled value="__ged_conceive">
          Conception / pregnancy (no GED plac — use birth maps + partners toggle for FAMS + NOTE genetics)
        </option>
        <option disabled value="__ged_child_dev">
          First word, crawl, walk, school, grades (no timeline export)
        </option>
        <option disabled value="__ged_jobs">
          Jobs — OCCU is text only (no job location in this export)
        </option>
      </optgroup>
    </select>
  );
}
