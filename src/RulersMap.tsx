import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { geocodePlacesSequential } from "./geocode";
import { MapGeocodeOverlay, useGeocodeElapsedMs } from "./MapGeocodeOverlay";
import type { RulerPerson } from "./RulersView";

function fmtName(raw: string): string {
  return raw.replace(/\//g, "").replace(/\s+/g, " ").trim() || "?";
}

type Job = { pid: string; place: string; label: string; kind: "b" | "d" };

function buildGeocodeJobs(people: RulerPerson[], maxPoints: number): Job[] {
  const jobs: Job[] = [];
  for (const p of people) {
    if (jobs.length >= maxPoints) break;
    const name = fmtName(p.n);
    const bp = (p.bp ?? "").trim();
    const dp = (p.dp ?? "").trim();
    if (bp) {
      jobs.push({
        pid: p.id,
        place: bp,
        label: `${name} — birth (${p.y ?? "?"}) — ${bp}`,
        kind: "b",
      });
    }
    if (dp && dp !== bp) {
      if (jobs.length >= maxPoints) break;
      jobs.push({
        pid: p.id,
        place: dp,
        label: `${name} — death (${p.dy ?? "?"}) — ${dp}`,
        kind: "d",
      });
    }
  }
  return jobs;
}

function FitToCoords({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    const nudge = () => map.invalidateSize({ animate: false });
    nudge();
    if (coords.length === 1) {
      map.setView(coords[0], 6);
    } else {
      const latLngs = coords.map(([la, lo]) => L.latLng(la, lo));
      map.fitBounds(L.latLngBounds(latLngs), { padding: [36, 36], maxZoom: 8 });
    }
    requestAnimationFrame(() => requestAnimationFrame(nudge));
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
    const timers = [80, 220, 520].map((ms) => window.setTimeout(nudge, ms));
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

function hashHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

type Pt = { label: string; lat: number; lng: number; kind: "b" | "d"; pid: string };

function markerRank(pid: string, left: string | null, right: string | null): number {
  if (pid === left || pid === right) return 1;
  return 0;
}

type Props = {
  people: RulerPerson[];
  compareLeftId: string | null;
  compareRightId: string | null;
  /** Max geocoded place strings (birth+death each count); Nominatim is ~1/s */
  maxPoints?: number;
};

export function RulersMap({
  people,
  compareLeftId,
  compareRightId,
  maxPoints = 40,
}: Props) {
  const [pts, setPts] = useState<Pt[]>([]);
  const [segmentBase, setSegmentBase] = useState<
    { positions: [number, number][]; pid: string; hue: number }[]
  >([]);
  const [status, setStatus] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const geocodeElapsedMs = useGeocodeElapsedMs(geocoding);

  const personById = useMemo(() => new Map(people.map((p) => [p.id, p] as const)), [people]);

  const jobs = useMemo(() => buildGeocodeJobs(people, maxPoints), [people, maxPoints]);

  const mapRevision = useMemo(
    () =>
      `${people.length}|${jobs.length}|${maxPoints}|${compareLeftId ?? ""}|${compareRightId ?? ""}|${jobs.map((j) => `${j.pid}:${j.kind}`).join("|")}`,
    [people.length, jobs.length, maxPoints, jobs, compareLeftId, compareRightId]
  );

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    let alive = true;

    async function run() {
      setGeocoding(true);
      try {
        setPts([]);
        setSegmentBase([]);
        if (jobs.length === 0) {
          setStatus("No birth or death places in this year window — widen the range or pick another realm.");
          return;
        }
        setStatus(`Geocoding up to ${jobs.length} place(s) for ruler markers (~1/s)…`);
        const coords = await geocodePlacesSequential(
          jobs.map((j) => j.place),
          ac.signal
        );
        if (cancelled) return;

        const byPerson = new Map<string, { b?: [number, number]; d?: [number, number] }>();
        const markers: Pt[] = [];

        jobs.forEach((j, i) => {
          const c = coords[i];
          if (!c) return;
          const pair: [number, number] = [c.lat, c.lng];
          markers.push({
            label: j.label,
            lat: c.lat,
            lng: c.lng,
            kind: j.kind,
            pid: j.pid,
          });
          const cur = byPerson.get(j.pid) ?? {};
          if (j.kind === "b") cur.b = pair;
          else cur.d = pair;
          byPerson.set(j.pid, cur);
        });

        const base: typeof segmentBase = [];
        for (const [pid, { b, d }] of byPerson) {
          if (b && d) {
            base.push({
              positions: [b, d],
              pid,
              hue: hashHue(pid),
            });
          }
        }

        setPts(markers);
        setSegmentBase(base);
        setStatus(
          markers.length
            ? `${markers.length} point(s), ${base.length} birth→death segment(s). Lines are life geography in the GED, not battle routes.`
            : "No coordinates returned."
        );
      } catch (e) {
        if (!cancelled) {
          setStatus(
            `Map error: ${e instanceof Error ? e.message : String(e)}. Check network / Nominatim.`
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
  }, [jobs]);

  const compareMode = Boolean(compareLeftId || compareRightId);

  const segments = useMemo(() => {
    const list = segmentBase.map((s) => ({
      ...s,
      highlight: s.pid === compareLeftId || s.pid === compareRightId,
    }));
    return [...list].sort((a, b) => {
      if (a.highlight === b.highlight) return 0;
      return a.highlight ? 1 : -1;
    });
  }, [segmentBase, compareLeftId, compareRightId]);

  const sortedPts = useMemo(() => {
    return [...pts].sort(
      (a, b) => markerRank(a.pid, compareLeftId, compareRightId) - markerRank(b.pid, compareLeftId, compareRightId)
    );
  }, [pts, compareLeftId, compareRightId]);

  const fitCoords = useMemo(() => {
    const all = pts.map((p) => [p.lat, p.lng] as [number, number]);
    if (compareLeftId || compareRightId) {
      const want = new Set([compareLeftId, compareRightId].filter(Boolean) as string[]);
      const sub = pts.filter((p) => want.has(p.pid)).map((p) => [p.lat, p.lng] as [number, number]);
      if (sub.length >= 1) return sub;
    }
    return all;
  }, [pts, compareLeftId, compareRightId]);

  const center: [number, number] = pts[0] ? [pts[0].lat, pts[0].lng] : [48.5, 12.0];

  const leftPerson = compareLeftId ? personById.get(compareLeftId) : undefined;
  const rightPerson = compareRightId ? personById.get(compareRightId) : undefined;

  const leftHasSegment = compareLeftId ? segments.some((s) => s.pid === compareLeftId && s.highlight) : false;
  const rightHasSegment = compareRightId ? segments.some((s) => s.pid === compareRightId && s.highlight) : false;

  const compareSummary =
    compareLeftId || compareRightId
      ? [
          compareLeftId && leftPerson
            ? `A: ${fmtName(leftPerson.n)}`
            : compareLeftId
              ? `A: ${compareLeftId} (not in window)`
              : null,
          compareRightId && rightPerson
            ? `B: ${fmtName(rightPerson.n)}`
            : compareRightId
              ? `B: ${compareRightId} (not in window)`
              : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "";

  return (
    <div className="map-shell map-shell--dark rulers-map-shell" aria-busy={geocoding}>
      <p className="map-meta">
        {status}
        {compareSummary ? (
          <>
            {" "}
            <span className="rulers-map-compare-meta">Compare focus: {compareSummary}.</span>
          </>
        ) : null}
      </p>
      {compareMode && (
        <div className="rulers-map-legend" role="region" aria-label="Map legend for compare columns">
          <div className="rulers-map-legend-row">
            <span className="rulers-map-legend-swatch rulers-map-legend-swatch--a" aria-hidden />
            <span>
              <strong>Column A</strong>
              {leftPerson ? (
                <>
                  {" "}
                  — {fmtName(leftPerson.n)} <span className="mono">({leftPerson.co})</span>
                </>
              ) : compareLeftId ? (
                <> — not in current window</>
              ) : (
                <> — empty</>
              )}
            </span>
          </div>
          <div className="rulers-map-legend-row">
            <span className="rulers-map-legend-swatch rulers-map-legend-swatch--b" aria-hidden />
            <span>
              <strong>Column B</strong>
              {rightPerson ? (
                <>
                  {" "}
                  — {fmtName(rightPerson.n)} <span className="mono">({rightPerson.co})</span>
                </>
              ) : compareRightId ? (
                <> — not in current window</>
              ) : (
                <> — empty</>
              )}
            </span>
          </div>
          <div className="rulers-map-legend-row rulers-map-legend-row--line">
            <span className="rulers-map-legend-line rulers-map-legend-line--yellow" aria-hidden />
            <span>
              <strong>Yellow</strong> segment = birth→death line for A or B when both places geocode.
            </span>
          </div>
          <ul className="rulers-map-legend-notes">
            {compareLeftId && leftPerson && !leftHasSegment ? (
              <li>
                No yellow line for <strong>A</strong>: need distinct birth and death places in GED, and both must
                return coordinates.
              </li>
            ) : null}
            {compareRightId && rightPerson && !rightHasSegment ? (
              <li>
                No yellow line for <strong>B</strong>: same — check death place text in export.
              </li>
            ) : null}
            {compareMode ? (
              <li>
                Map zoom prioritizes <strong>A &amp; B markers</strong> when either column is set; other rulers stay
                visible but dimmed.
              </li>
            ) : null}
          </ul>
        </div>
      )}
      <div className="map-canvas map-canvas--rulers">
        <MapGeocodeOverlay active={geocoding} elapsedMs={geocodeElapsedMs} detail={status} />
        <MapContainer
          key={mapRevision}
          center={center}
          zoom={4}
          scrollWheelZoom={false}
          className="map-leaflet"
        >
          <MapResize revision={mapRevision} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          {segments.map((s) => (
            <Polyline
              key={`${s.pid}-${s.highlight ? "1" : "0"}`}
              positions={s.positions}
              pathOptions={{
                color: s.highlight ? "#ffd54f" : `hsl(${s.hue} 55% 58%)`,
                weight: s.highlight ? 5 : compareMode ? 1.5 : 2,
                opacity: s.highlight ? 0.98 : compareMode ? 0.28 : 0.55,
              }}
            />
          ))}
          {sortedPts.map((m, i) => {
            const col = m.pid === compareLeftId ? "a" : m.pid === compareRightId ? "b" : null;
            const isCompare = Boolean(col);
            const person = personById.get(m.pid);
            const r = isCompare ? 9 : m.kind === "d" ? 5 : 7;
            const fill = m.kind === "d" ? "#ffb74d" : "#81c784";
            const stroke =
              col === "a" ? "#29b6f6" : col === "b" ? "#e040fb" : m.kind === "d" ? "#ffb74d" : "#66bb6a";
            const tip =
              col === "a"
                ? `Column A · ${person ? fmtName(person.n) : m.pid}`
                : col === "b"
                  ? `Column B · ${person ? fmtName(person.n) : m.pid}`
                  : person
                    ? `${fmtName(person.n)} · ${person.co}`
                    : m.pid;
            return (
              <CircleMarker
                key={`${m.pid}-${m.kind}-${i}`}
                center={[m.lat, m.lng]}
                radius={r}
                pathOptions={{
                  color: stroke,
                  fillColor: fill,
                  fillOpacity: isCompare ? 0.92 : 0.82,
                  weight: isCompare ? 3 : 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={0.95} permanent={false}>
                  {tip} · {m.kind === "b" ? "Birth" : "Death"}
                </Tooltip>
                <Popup>
                  {person ? (
                    <div className="map-popup rulers-map-popup">
                      <strong>{fmtName(person.n)}</strong>
                      {col ? (
                        <div className="rulers-map-popup-col">
                          Column <strong>{col.toUpperCase()}</strong>
                        </div>
                      ) : null}
                      <div className="rulers-map-popup-meta">
                        {person.co} · {person.y ?? "—"}–{person.dy ?? "—"}
                      </div>
                      <div className="rulers-map-popup-role">{m.kind === "b" ? "Birth" : "Death"}</div>
                      <div className="rulers-map-popup-pl">
                        {(m.kind === "b" ? person.bp : person.dp) ?? "—"}
                      </div>
                    </div>
                  ) : (
                    <div className="map-popup">{m.label}</div>
                  )}
                </Popup>
              </CircleMarker>
            );
          })}
          {fitCoords.length > 0 && <FitToCoords coords={fitCoords} />}
        </MapContainer>
      </div>
      <p className="map-foot">
        Heuristic ruler export: markers from birth/death places. <strong>Yellow</strong> segments highlight A/B when
        both ends geocode; <strong>cyan ring</strong> = column A, <strong>magenta ring</strong> = column B. Other
        segments are muted while comparing. Battle language years (<code className="mono">wy</code>) come from GED
        text near war keywords — not verified events.
      </p>
    </div>
  );
}
