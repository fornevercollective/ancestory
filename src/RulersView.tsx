import { useCallback, useEffect, useMemo, useState } from "react";
import { publicUrl } from "./rulersTestPath";
import { LineageFlowTree } from "./LineageFlowTree";
import { RulersMap } from "./RulersMap";
import { timeBandClass } from "./timeBands";

export type RulerFamEvent = { k: string; pl: string; y?: number };

export type RulerPerson = {
  id: string;
  n: string;
  t?: string | null;
  co: string;
  bp?: string | null;
  dp?: string | null;
  y?: number | null;
  dy?: number | null;
  /** Years in same GED fragment as war/battle keywords (export heuristic) */
  wy?: number[] | null;
  st: { war: number; land: number; money: number; award: number };
  src: number;
  sn: string[];
  c?: number | null;
  /** Birth → residences → death (GED order), when export includes them */
  lw?: string[] | null;
  /** MARR/DIV places from family records (re-export after ged_export) */
  ev?: RulerFamEvent[] | null;
  occu?: string[] | null;
  burp?: string | null;
};

type RulersPayload = {
  source: string;
  hint?: string;
  count: number;
  people: RulerPerson[];
};

function fmtName(raw: string): string {
  return raw.replace(/\//g, "").replace(/\s+/g, " ").trim() || "?";
}

/** GED place strings sometimes export empty comma runs — normalize for display. */
function fmtPlace(raw: string | null | undefined): string {
  let t = (raw ?? "").trim();
  t = t.replace(/(\s*,\s*)+/g, ", ").replace(/^,\s*|,\s*$/g, "").trim();
  if (!t || /^[, ]+$/.test(t)) return "—";
  return t;
}

function dataYearExtent(people: RulerPerson[]): { lo: number; hi: number } {
  let lo = 99999;
  let hi = 0;
  for (const p of people) {
    for (const v of [p.y, p.dy, ...(p.wy ?? [])]) {
      if (typeof v === "number" && Number.isFinite(v)) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
  }
  if (lo > hi) return { lo: 1000, hi: 2100 };
  if (lo === hi) return { lo: lo - 50, hi: hi + 50 };
  return { lo, hi };
}

/** Life dates or wy battle-mention years intersect [lo, hi]; full data span = no year filter. */
function passesYearWindow(
  p: RulerPerson,
  lo: number,
  hi: number,
  extent: { lo: number; hi: number }
): boolean {
  if (lo <= extent.lo && hi >= extent.hi) return true;
  for (const y of p.wy ?? []) {
    if (y >= lo && y <= hi) return true;
  }
  const a = p.y ?? null;
  const b = p.dy ?? null;
  if (a == null && b == null) return false;
  if (a != null && a >= lo && a <= hi) return true;
  if (b != null && b >= lo && b <= hi) return true;
  if (a != null && b != null) {
    const mn = Math.min(a, b);
    const mx = Math.max(a, b);
    if (mx >= lo && mn <= hi) return true;
  }
  return false;
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="ruler-bar-row">
      <span className="ruler-bar-lbl">{label}</span>
      <div className="ruler-bar-track">
        <div className="ruler-bar-fill" style={{ width: `${w}%` }} />
      </div>
      <span className="ruler-bar-val mono">{value}</span>
    </div>
  );
}

type Props = {
  /** Jump to Dual lines with this person as root */
  onOpenInDual?: (id: string) => void;
  /** Default bundled rulers JSON; pass a blob URL after dropping rulers.json in App */
  rulersJsonUrl?: string;
};

export function RulersView({ onOpenInDual, rulersJsonUrl = publicUrl("rulers.json") }: Props) {
  const [data, setData] = useState<RulersPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("__all__");
  const [selected, setSelected] = useState<RulerPerson | null>(null);
  const [q, setQ] = useState("");
  const [compareLeftId, setCompareLeftId] = useState<string>("");
  const [compareRightId, setCompareRightId] = useState<string>("");
  const [yearLo, setYearLo] = useState<number | null>(null);
  const [yearHi, setYearHi] = useState<number | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch(rulersJsonUrl);
      if (!res.ok) throw new Error(`${res.status} Run ged_export to create rulers.json`);
      const j = (await res.json()) as RulersPayload;
      setData(j);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [rulersJsonUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const h = () => {
      const m = window.location.hash.match(/^#ruler=([^&]+)/);
      if (!m || !data) return;
      const id = decodeURIComponent(m[1]);
      const p = data.people.find((x) => x.id === id);
      if (p) setSelected(p);
    };
    h();
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, [data]);

  const countries = useMemo(() => {
    if (!data) return [] as string[];
    const u = new Set(data.people.map((p) => p.co));
    return [...u].sort((a, b) => a.localeCompare(b));
  }, [data]);

  const extent = useMemo(
    () => (data ? dataYearExtent(data.people) : { lo: 1000, hi: 2100 }),
    [data]
  );

  useEffect(() => {
    if (!data) return;
    setYearLo((prev) => (prev == null ? extent.lo : prev));
    setYearHi((prev) => (prev == null ? extent.hi : prev));
  }, [data, extent.lo, extent.hi]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const qq = q.trim().toLowerCase();
    return data.people.filter((p) => {
      if (country !== "__all__" && p.co !== country) return false;
      if (!qq) return true;
      const blob = `${p.n} ${p.t ?? ""} ${p.bp ?? ""} ${p.dp ?? ""}`.toLowerCase();
      return blob.includes(qq);
    });
  }, [data, country, q]);

  const yLo = yearLo ?? extent.lo;
  const yHi = yearHi ?? extent.hi;

  const visiblePeople = useMemo(() => {
    return filtered.filter((p) => passesYearWindow(p, yLo, yHi, extent));
  }, [filtered, yLo, yHi, extent]);

  const compareLeft = useMemo(
    () => visiblePeople.find((p) => p.id === compareLeftId) ?? null,
    [visiblePeople, compareLeftId]
  );
  const compareRight = useMemo(
    () => visiblePeople.find((p) => p.id === compareRightId) ?? null,
    [visiblePeople, compareRightId]
  );

  const cohort = useMemo(() => {
    if (!selected) return null;
    if (selected.c === null || selected.c === undefined) return null;
    const peers = (data?.people ?? []).filter((p) => p.c === selected.c);
    if (peers.length < 2) return null;
    const avg = (k: keyof RulerPerson["st"]) =>
      peers.reduce((s, p) => s + p.st[k], 0) / peers.length;
    return { n: peers.length, war: avg("war"), land: avg("land"), money: avg("money"), award: avg("award") };
  }, [data, selected]);

  const sameCountry = useMemo(() => {
    if (!selected || !data) return [];
    return data.people.filter((p) => p.co === selected.co && p.id !== selected.id).slice(0, 40);
  }, [data, selected]);

  const maxStat = useMemo(() => {
    if (!visiblePeople.length) return 1;
    let m = 1;
    for (const p of visiblePeople) {
      m = Math.max(m, p.st.war, p.st.land, p.st.money, p.st.award, 1);
    }
    return m;
  }, [visiblePeople]);

  const open = (p: RulerPerson) => {
    setSelected(p);
    window.location.hash = `ruler=${encodeURIComponent(p.id)}`;
  };

  const selectOpts = useMemo(() => {
    return [...visiblePeople].sort((a, b) => fmtName(a.n).localeCompare(fmtName(b.n)));
  }, [visiblePeople]);

  const wySummary = (p: RulerPerson | null) => {
    if (!p?.wy?.length) return "—";
    const s = p.wy.join(", ");
    return s.length > 42 ? `${s.slice(0, 40)}…` : s;
  };

  const fmtLifeWaypoints = (lw: string[] | null | undefined) => {
    if (!lw?.length) return "—";
    return lw.join(" → ");
  };

  const fmtEvShort = (ev: RulerPerson["ev"]) => {
    if (!ev?.length) return "—";
    return ev
      .map((e) => {
        const tag = e.k === "marr" ? "Marr." : e.k === "div" ? "Div." : e.k;
        const y = typeof e.y === "number" ? String(e.y) : "?";
        return `${tag} ${y}: ${e.pl}`;
      })
      .join(" · ");
  };

  useEffect(() => {
    if (compareLeftId && !visiblePeople.some((p) => p.id === compareLeftId)) setCompareLeftId("");
    if (compareRightId && !visiblePeople.some((p) => p.id === compareRightId)) setCompareRightId("");
  }, [visiblePeople, compareLeftId, compareRightId]);

  useEffect(() => {
    if (selected && !visiblePeople.some((p) => p.id === selected.id)) setSelected(null);
  }, [visiblePeople, selected]);

  if (err) {
    return (
      <div className="rulers-panel err">
        <strong>Rulers data missing.</strong> {err}
      </div>
    );
  }
  if (!data) return <p className="map-meta">Loading rulers.json…</p>;

  return (
    <div className="rulers-root">
      <p className="rulers-hint">{data.hint}</p>
      <p className="rulers-count mono">
        {data.count} entries · source: {data.source}
      </p>

      <section className="rulers-context" aria-label="Year window and ruler compare">
        <h3 className="rulers-context-h">Historical window & compare</h3>
        <p className="rulers-context-lead">
          Scrub the <strong>year range</strong> to filter rows and the map: a row stays visible if a
          birth/death year or any <span className="mono">wy</span> battle-mention year falls in the
          window, or if their lifespan overlaps it. This is GED text heuristics only — not verified
          military history.
        </p>
        <div className="rulers-year-grid">
          <label className="rulers-year-lbl">
            <span>
              From <strong className="mono">{yLo}</strong>
            </span>
            <input
              type="range"
              className="rulers-year-range"
              min={extent.lo}
              max={extent.hi}
              value={Math.min(yLo, yHi)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setYearLo(v);
                setYearHi((h) => (h < v ? v : h));
              }}
            />
          </label>
          <label className="rulers-year-lbl">
            <span>
              To <strong className="mono">{yHi}</strong>
            </span>
            <input
              type="range"
              className="rulers-year-range"
              min={extent.lo}
              max={extent.hi}
              value={Math.max(yLo, yHi)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setYearHi(v);
                setYearLo((lo) => (lo > v ? v : lo));
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-small rulers-year-reset"
            onClick={() => {
              setYearLo(extent.lo);
              setYearHi(extent.hi);
            }}
          >
            Full span
          </button>
        </div>
        <p className="rulers-window-meta mono">
          {visiblePeople.length} / {filtered.length} rows in window · data span {extent.lo}–{extent.hi}
        </p>

        <div className="rulers-compare-bar">
          <label className="rulers-compare-pick">
            <span>Column A</span>
            <select
              className="sel"
              value={compareLeftId}
              onChange={(e) => setCompareLeftId(e.target.value)}
            >
              <option value="">—</option>
              {selectOpts.map((p) => (
                <option key={p.id} value={p.id}>
                  {fmtName(p.n)} ({p.co})
                </option>
              ))}
            </select>
          </label>
          <label className="rulers-compare-pick">
            <span>Column B</span>
            <select
              className="sel"
              value={compareRightId}
              onChange={(e) => setCompareRightId(e.target.value)}
            >
              <option value="">—</option>
              {selectOpts.map((p) => (
                <option key={`b-${p.id}`} value={p.id}>
                  {fmtName(p.n)} ({p.co})
                </option>
              ))}
            </select>
          </label>
          <div className="rulers-compare-actions">
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                setCompareLeftId(compareRightId);
                setCompareRightId(compareLeftId);
              }}
            >
              Swap A/B
            </button>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                setCompareLeftId("");
                setCompareRightId("");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {(compareLeft || compareRight) && (
          <div className="rulers-compare-cols" role="region" aria-label="Side by side ruler stats">
            <div className={`rulers-compare-col ${compareLeft ? "on" : ""}`}>
              <h4 className="rulers-compare-col-h">A</h4>
              {compareLeft ? (
                <>
                  <p className="rulers-compare-name">{fmtName(compareLeft.n)}</p>
                  <p className="mono rulers-compare-id">{compareLeft.id}</p>
                  <dl className="rulers-compare-dl">
                    <dt>Realm</dt>
                    <dd className="mono">{compareLeft.co}</dd>
                    <dt>War / Land / $ / A</dt>
                    <dd className="mono">
                      {compareLeft.st.war} · {compareLeft.st.land} · {compareLeft.st.money} ·{" "}
                      {compareLeft.st.award}
                    </dd>
                    <dt>Birth — death</dt>
                    <dd>
                      {compareLeft.y ?? "—"} — {compareLeft.dy ?? "—"}
                    </dd>
                    <dt>
                      <span className="mono">wy</span> (GED battle yrs)
                    </dt>
                    <dd className="mono">{wySummary(compareLeft)}</dd>
                    <dt>Places</dt>
                    <dd className="rulers-compare-places">
                      {fmtPlace(compareLeft.bp)} → {fmtPlace(compareLeft.dp)}
                    </dd>
                    <dt>Life path (GED)</dt>
                    <dd className="rulers-compare-places">{fmtLifeWaypoints(compareLeft.lw)}</dd>
                    <dt>Marr. / div. (FAM)</dt>
                    <dd className="rulers-compare-places">{fmtEvShort(compareLeft.ev)}</dd>
                    <dt>Occupation</dt>
                    <dd className="rulers-compare-places">
                      {compareLeft.occu?.length ? compareLeft.occu.join(" · ") : "—"}
                    </dd>
                    <dt>Burial</dt>
                    <dd className="rulers-compare-places">{fmtPlace(compareLeft.burp)}</dd>
                  </dl>
                </>
              ) : (
                <p className="muted">Empty</p>
              )}
            </div>
            <div className={`rulers-compare-col ${compareRight ? "on" : ""}`}>
              <h4 className="rulers-compare-col-h">B</h4>
              {compareRight ? (
                <>
                  <p className="rulers-compare-name">{fmtName(compareRight.n)}</p>
                  <p className="mono rulers-compare-id">{compareRight.id}</p>
                  <dl className="rulers-compare-dl">
                    <dt>Realm</dt>
                    <dd className="mono">{compareRight.co}</dd>
                    <dt>War / Land / $ / A</dt>
                    <dd className="mono">
                      {compareRight.st.war} · {compareRight.st.land} · {compareRight.st.money} ·{" "}
                      {compareRight.st.award}
                    </dd>
                    <dt>Birth — death</dt>
                    <dd>
                      {compareRight.y ?? "—"} — {compareRight.dy ?? "—"}
                    </dd>
                    <dt>
                      <span className="mono">wy</span> (GED battle yrs)
                    </dt>
                    <dd className="mono">{wySummary(compareRight)}</dd>
                    <dt>Places</dt>
                    <dd className="rulers-compare-places">
                      {fmtPlace(compareRight.bp)} → {fmtPlace(compareRight.dp)}
                    </dd>
                    <dt>Life path (GED)</dt>
                    <dd className="rulers-compare-places">{fmtLifeWaypoints(compareRight.lw)}</dd>
                    <dt>Marr. / div. (FAM)</dt>
                    <dd className="rulers-compare-places">{fmtEvShort(compareRight.ev)}</dd>
                    <dt>Occupation</dt>
                    <dd className="rulers-compare-places">
                      {compareRight.occu?.length ? compareRight.occu.join(" · ") : "—"}
                    </dd>
                    <dt>Burial</dt>
                    <dd className="rulers-compare-places">{fmtPlace(compareRight.burp)}</dd>
                  </dl>
                </>
              ) : (
                <p className="muted">Empty</p>
              )}
            </div>
          </div>
        )}

        <RulersMap
          people={visiblePeople}
          compareLeftId={compareLeftId || null}
          compareRightId={compareRightId || null}
          maxPoints={44}
        />
      </section>

      <div className="rulers-tabs" role="tablist" aria-label="Country of origin / realm">
        <button
          type="button"
          role="tab"
          className={`ruler-tab ${country === "__all__" ? "on" : ""}`}
          onClick={() => setCountry("__all__")}
        >
          All realms
        </button>
        {countries.map((co) => (
          <button
            key={co}
            type="button"
            role="tab"
            className={`ruler-tab ${country === co ? "on" : ""}`}
            onClick={() => setCountry(co)}
          >
            {co}{" "}
            <span className="ruler-tab-n">({data.people.filter((p) => p.co === co).length})</span>
          </button>
        ))}
      </div>

      <input
        className="inp wide ruler-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter by name, title, place…"
      />

      <div className="rulers-layout">
        <div className="rulers-list-wrap">
          <table className="rulers-table">
            <thead>
              <tr>
                <th>Name / title</th>
                <th>Realm</th>
                <th className="num">b.</th>
                <th className="num">d.</th>
                <th className="num" title="Years near war/battle words in GED (re-export for column)">
                  wy
                </th>
                <th className="num" title="Life waypoint count (birth → RESI → death) when export includes lw">
                  #Δ
                </th>
                <th className="num" title="Keyword hits in GED notes/titles">
                  W
                </th>
                <th className="num">L</th>
                <th className="num">$</th>
                <th className="num">A</th>
                <th className="num">src</th>
              </tr>
            </thead>
            <tbody>
              {visiblePeople.map((p) => (
                <tr
                  key={p.id}
                  className={selected?.id === p.id ? "sel" : ""}
                  onClick={() => open(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open(p);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <td>
                    <div className="ruler-name">{fmtName(p.n)}</div>
                    {p.t && <div className="ruler-titl mono">{p.t}</div>}
                  </td>
                  <td className="mono">{p.co}</td>
                  <td className="num">{p.y ?? "—"}</td>
                  <td className="num">{p.dy ?? "—"}</td>
                  <td className="num mono" title={(p.wy ?? []).join(", ") || undefined}>
                    {p.wy?.length ? p.wy.length : "—"}
                  </td>
                  <td className="num" title={fmtLifeWaypoints(p.lw)}>
                    {p.lw && p.lw.length > 0 ? p.lw.length : "—"}
                  </td>
                  <td className="num">{p.st.war}</td>
                  <td className="num">{p.st.land}</td>
                  <td className="num">{p.st.money}</td>
                  <td className="num">{p.st.award}</td>
                  <td className="num">{p.src}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visiblePeople.length === 0 && (
            <p className="rulers-empty">
              No rows for this filter or year window. Widen the year range or choose another realm.
            </p>
          )}
        </div>

        <aside className="rulers-detail" aria-live="polite">
          {visiblePeople.length > 0 && (
            <div className="rulers-card-rail-wrap">
              <LineageFlowTree
                mode="flat"
                maxItems={22}
                cards={visiblePeople.slice(0, 22).map((p) => ({
                  id: p.id,
                  name: fmtName(p.n),
                  year: typeof p.y === "number" ? p.y : null,
                  detail: p.co,
                  bandClass: timeBandClass(typeof p.y === "number" ? p.y : undefined),
                }))}
                onPickRoot={(id) => {
                  const p = data.people.find((x) => x.id === id);
                  if (p) open(p);
                }}
                leadText="First rows in table order — tap to select (same as row click)."
                ariaLabel="Ruler cards — tap to select row"
              />
            </div>
          )}
          {!selected && <p className="muted">Select a row for life stats, snippets, and cross-refs.</p>}
          {selected && (
            <>
              <h3 className="ruler-d-h">{fmtName(selected.n)}</h3>
              <p className="mono ruler-d-id">{selected.id}</p>
              {onOpenInDual && (
                <p className="ruler-d-actions">
                  <button type="button" className="btn btn-small" onClick={() => onOpenInDual(selected.id)}>
                    Open in Dual lines
                  </button>
                </p>
              )}
              {selected.t && <p className="ruler-d-t">{selected.t}</p>}
              <p className="ruler-d-meta">
                <strong>Realm (guess):</strong> {selected.co}
                <br />
                <strong>Birth:</strong> {selected.bp ?? "—"} ({selected.y ?? "?"})
                <br />
                <strong>Death:</strong> {selected.dp ?? "—"} ({selected.dy ?? "?"})
                <br />
                <strong>Burial:</strong> {fmtPlace(selected.burp)}
              </p>
              {(selected.lw && selected.lw.length > 1) || selected.ev?.length ? (
                <div className="ruler-d-life">
                  <h4 className="ruler-d-sub">Life path &amp; civil events (GED export)</h4>
                  {selected.lw && selected.lw.length > 0 && (
                    <p className="ruler-d-small rulers-compare-places">
                      <strong>Waypoints:</strong> {fmtLifeWaypoints(selected.lw)}
                    </p>
                  )}
                  {selected.ev && selected.ev.length > 0 && (
                    <ul className="ruler-ev-list">
                      {selected.ev.map((e, i) => (
                        <li key={i}>
                          <span className="mono">{e.k === "marr" ? "MARR" : e.k === "div" ? "DIV" : e.k}</span>
                          {typeof e.y === "number" ? ` (${e.y})` : ""}: {e.pl}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
              {selected.occu && selected.occu.length > 0 && (
                <p className="ruler-d-small">
                  <strong>Occupation:</strong> {selected.occu.join(" · ")}
                </p>
              )}
              {selected.wy && selected.wy.length > 0 && (
                <p className="ruler-d-small mono">
                  <strong>wy (GED years near battle words):</strong> {selected.wy.join(", ")}
                </p>
              )}

              <h4 className="ruler-d-sub">GED text statistics (keyword scan)</h4>
              <p className="ruler-d-small">
                W = war / battle language · L = land / territory · $ = money / tax · A = awards /
                orders. These are <em>counts in notes &amp; titles</em>, not verified events.
              </p>
              <Bar label="War / military" value={selected.st.war} max={maxStat} />
              <Bar label="Land / realm" value={selected.st.land} max={maxStat} />
              <Bar label="Money / finance" value={selected.st.money} max={maxStat} />
              <Bar label="Awards / honours" value={selected.st.award} max={maxStat} />

              {cohort && (
                <div className="ruler-cohort">
                  <h4 className="ruler-d-sub">Cross-ref: same century cohort (n={cohort.n})</h4>
                  <p className="ruler-d-small">
                    Avg hits in this export for people tagged century {selected.c}00–{selected.c}99:
                    war {cohort.war.toFixed(1)} · land {cohort.land.toFixed(1)} · money{" "}
                    {cohort.money.toFixed(1)} · award {cohort.award.toFixed(1)}
                  </p>
                </div>
              )}

              <h4 className="ruler-d-sub">Cross-ref: same realm</h4>
              <ul className="ruler-xlist">
                {sameCountry.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="linkbtn" onClick={() => open(p)}>
                      {fmtName(p.n)}
                    </button>
                  </li>
                ))}
                {sameCountry.length === 0 && <li className="muted">No other matches in this realm.</li>}
              </ul>

              {selected.sn.length > 0 && (
                <>
                  <h4 className="ruler-d-sub">Snippets (from GED)</h4>
                  <ul className="ruler-snips">
                    {selected.sn.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
