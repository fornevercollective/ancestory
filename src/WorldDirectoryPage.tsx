import { useCallback, useMemo, useState } from "react";
import { OsintInternalViewer } from "./OsintInternalViewer";
import type { OsintViewRequest } from "./osintInternalContent";
import {
  HOMININ_ENTRIES,
  NAME_ENTRIES,
  TURNER_ARCHIVE,
  TRIBAL_ENTRIES,
  homininById,
  nameById,
  namesForTribe,
  tribeById,
  type HomininEntry,
  type NameEntry,
  type TribalEntry,
} from "./worldDirectoryData";

export type DirectoryView = "names" | "tribes" | "hominins";

type Props = {
  /** Open URL in OSINT internal viewer when provided */
  onOpenUrl?: (url: string, title: string) => void;
  compact?: boolean;
};

const BRANCH_STATUS_LABEL: Record<string, string> = {
  active: "Active branch",
  historical: "Historical",
  merged: "Merged",
  "federally-recognized": "Federally recognized",
  "state-recognized": "State recognized",
};

function NameCard({ n, onSelectTribe }: { n: NameEntry; onSelectTribe: (id: string) => void }) {
  return (
    <article className="wdir-card wdir-card--name">
      <header className="wdir-card-head">
        <h3 className="wdir-card-title">{n.name}</h3>
        <span className="wdir-lang-badge" title={n.langLabel}>
          {n.lang ?? "—"} · {n.langLabel}
        </span>
      </header>
      <dl className="wdir-dl">
        <div>
          <dt>Meaning</dt>
          <dd>{n.meaning}</dd>
        </div>
        <div>
          <dt>Etymology</dt>
          <dd>{n.etymology}</dd>
        </div>
        {n.spoken && (
          <div>
            <dt>Spoken</dt>
            <dd>
              <span className="wdir-spoken">{n.spoken}</span>
              {n.ipa && <span className="wdir-ipa mono muted"> {n.ipa}</span>}
            </dd>
          </div>
        )}
        {n.turnerRef && (
          <div>
            <dt>Turner index</dt>
            <dd className="muted">{n.turnerRef}</dd>
          </div>
        )}
        <div>
          <dt>Region</dt>
          <dd>
            {n.region}
            {n.period ? ` · ${n.period}` : ""}
          </dd>
        </div>
      </dl>
      {n.tribalIds && n.tribalIds.length > 0 && (
        <div className="wdir-tags">
          {n.tribalIds.map((tid) => {
            const t = tribeById(tid);
            return (
              <button key={tid} type="button" className="wdir-tag" onClick={() => onSelectTribe(tid)}>
                {t?.endonym ?? tid}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}

function TribeCard({
  t,
  onSelectName,
  onSelectHominin,
  onOpenUrl,
}: {
  t: TribalEntry;
  onSelectName: (id: string) => void;
  onSelectHominin: (id: string) => void;
  onOpenUrl?: (url: string, title: string) => void;
}) {
  const linkedNames = namesForTribe(t.id);
  return (
    <article className="wdir-card wdir-card--tribe" id={`tribe-${t.id}`}>
      <header className="wdir-card-head">
        <h3 className="wdir-card-title">{t.endonym}</h3>
        {t.exonyms && t.exonyms.length > 0 && (
          <p className="wdir-exonym muted">Also: {t.exonyms.join(", ")}</p>
        )}
      </header>
      <dl className="wdir-dl">
        <div>
          <dt>Language</dt>
          <dd>
            {t.languageFamily}
            {t.languageBranch ? ` → ${t.languageBranch}` : ""}
            {t.iso639 ? ` (${t.iso639})` : ""}
          </dd>
        </div>
        <div>
          <dt>Original roots</dt>
          <dd>{t.originalHomeland}</dd>
        </div>
        <div>
          <dt>Early locations</dt>
          <dd>{t.earlyLocations.join(" · ")}</dd>
        </div>
      </dl>

      {t.migrations.length > 0 && (
        <section className="wdir-sub">
          <h4 className="wdir-subh">Migrations</h4>
          <ol className="wdir-migration-list">
            {t.migrations.map((m, i) => (
              <li key={i} className="wdir-migration">
                <span className="wdir-migration-era mono">{m.era}</span>
                <span className="wdir-migration-arrow" aria-hidden="true">
                  {m.from} → {m.to}
                </span>
                {m.note && <span className="wdir-migration-note muted">{m.note}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {t.dawRolls.length > 0 && (
        <section className="wdir-sub">
          <h4 className="wdir-subh">Dawes / rolls index</h4>
          <ul className="wdir-roll-list">
            {t.dawRolls.map((r, i) => (
              <li key={i}>
                <strong>{r.label}</strong>
                {r.year && <span className="mono"> ({r.year})</span>}
                {r.agency && <span className="muted"> — {r.agency}</span>}
                {r.note && <p className="wdir-roll-note muted">{r.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="wdir-sub">
        <h4 className="wdir-subh">Branches &amp; active lines</h4>
        <ul className="wdir-branch-list">
          {t.branches.map((b) => (
            <li key={b.id} className={`wdir-branch wdir-branch--${b.status}`}>
              <span className="wdir-branch-label">{b.label}</span>
              <span className="wdir-branch-status">{BRANCH_STATUS_LABEL[b.status] ?? b.status}</span>
              {b.location && <span className="wdir-branch-loc muted">{b.location}</span>}
              {b.eldersNote && <span className="wdir-branch-elders muted">Elders: {b.eldersNote}</span>}
            </li>
          ))}
        </ul>
      </section>

      {t.elderLines && t.elderLines.length > 0 && (
        <section className="wdir-sub">
          <h4 className="wdir-subh">Elder / governance lines</h4>
          <p className="wdir-elder-lines">{t.elderLines.join(" · ")}</p>
        </section>
      )}

      {linkedNames.length > 0 && (
        <section className="wdir-sub">
          <h4 className="wdir-subh">Name directory (spoken)</h4>
          <div className="wdir-tags">
            {linkedNames.map((n) => (
              <button key={n.id} type="button" className="wdir-tag" onClick={() => onSelectName(n.id)}>
                {n.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {t.homininLinks && t.homininLinks.length > 0 && (
        <section className="wdir-sub">
          <h4 className="wdir-subh">Hominin / skull cross-links</h4>
          <div className="wdir-tags">
            {t.homininLinks.map((hid) => {
              const h = homininById(hid);
              return (
                <button key={hid} type="button" className="wdir-tag wdir-tag--hominin" onClick={() => onSelectHominin(hid)}>
                  {h?.commonName ?? hid}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {t.archiveRefs && t.archiveRefs.length > 0 && (
        <div className="wdir-archive">
          {t.archiveRefs.map((a) => (
            <button
              key={a.url}
              type="button"
              className="linkbtn wdir-archive-link"
              onClick={() => onOpenUrl?.(a.url, a.label)}
            >
              {a.label} ↗
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function HomininCard({ h, onSelectTribe }: { h: HomininEntry; onSelectTribe: (id: string) => void }) {
  return (
    <article className="wdir-card wdir-card--hominin" id={`hominin-${h.id}`}>
      <header className="wdir-card-head">
        <h3 className="wdir-card-title">{h.commonName}</h3>
        <p className="wdir-taxon mono muted">{h.taxon}</p>
      </header>
      <dl className="wdir-dl">
        <div>
          <dt>Date range</dt>
          <dd>{h.dateRange}</dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>{h.region}</dd>
        </div>
        {h.skullSet && (
          <div>
            <dt>Skull set</dt>
            <dd>{h.skullSet}</dd>
          </div>
        )}
        <div>
          <dt>Note</dt>
          <dd>{h.note}</dd>
        </div>
      </dl>
      {h.tribalIds && h.tribalIds.length > 0 && (
        <div className="wdir-tags">
          <span className="wdir-tags-label muted">Tribal connections:</span>
          {h.tribalIds.map((tid) => {
            const t = tribeById(tid);
            return (
              <button key={tid} type="button" className="wdir-tag" onClick={() => onSelectTribe(tid)}>
                {t?.endonym ?? tid}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}

export function WorldDirectoryPage({ onOpenUrl: onOpenUrlProp, compact }: Props) {
  const [internalView, setInternalView] = useState<OsintViewRequest | null>(null);
  const onOpenUrl = useCallback(
    (url: string, title: string) => {
      if (onOpenUrlProp) onOpenUrlProp(url, title);
      else setInternalView({ url, title, source: "archive" });
    },
    [onOpenUrlProp]
  );

  const [view, setView] = useState<DirectoryView>("tribes");
  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [familyFilter, setFamilyFilter] = useState("");
  const [focusTribeId, setFocusTribeId] = useState<string | null>(null);
  const [focusNameId, setFocusNameId] = useState<string | null>(null);
  const [focusHomininId, setFocusHomininId] = useState<string | null>(null);

  const regions = useMemo(
    () => [...new Set(TRIBAL_ENTRIES.map((t) => t.macroRegion))].sort(),
    []
  );
  const families = useMemo(
    () => [...new Set(TRIBAL_ENTRIES.map((t) => t.languageFamily))].sort(),
    []
  );

  const q = query.trim().toLowerCase();

  const filteredTribes = useMemo(() => {
    let list = [...TRIBAL_ENTRIES];
    if (regionFilter) list = list.filter((t) => t.macroRegion === regionFilter);
    if (familyFilter) list = list.filter((t) => t.languageFamily === familyFilter);
    if (q) {
      list = list.filter((t) => {
        const hay = [
          t.endonym,
          t.exonyms?.join(" "),
          t.languageFamily,
          t.originalHomeland,
          t.earlyLocations.join(" "),
          t.branches.map((b) => b.label).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    list.sort((a, b) => a.endonym.localeCompare(b.endonym));
    return list;
  }, [q, regionFilter, familyFilter]);

  const filteredNames = useMemo(() => {
    let list = [...NAME_ENTRIES];
    if (q) {
      list = list.filter((n) => {
        const hay = [n.name, n.meaning, n.etymology, n.langLabel, n.region, n.spoken, n.turnerRef]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    if (focusTribeId) list = list.filter((n) => n.tribalIds?.includes(focusTribeId));
    return list;
  }, [q, focusTribeId]);

  const filteredHominins = useMemo(() => {
    let list = [...HOMININ_ENTRIES];
    if (q) {
      list = list.filter((h) => {
        const hay = [h.commonName, h.taxon, h.region, h.skullSet, h.note].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    if (focusTribeId) list = list.filter((h) => h.tribalIds?.includes(focusTribeId));
    return list;
  }, [q, focusTribeId]);

  const goTribe = (id: string) => {
    setView("tribes");
    setFocusTribeId(id);
    setFocusNameId(null);
    setFocusHomininId(null);
    requestAnimationFrame(() => {
      document.getElementById(`tribe-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goName = (id: string) => {
    setView("names");
    setFocusNameId(id);
    requestAnimationFrame(() => {
      document.getElementById(`name-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goHominin = (id: string) => {
    setView("hominins");
    setFocusHomininId(id);
    requestAnimationFrame(() => {
      document.getElementById(`hominin-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const focusBanner = focusTribeId
    ? tribeById(focusTribeId)?.endonym
    : focusNameId
      ? nameById(focusNameId)?.name
      : focusHomininId
        ? homininById(focusHomininId)?.commonName
        : null;

  return (
    <div className={`wdir ${compact ? "wdir--compact" : ""}`}>
      <header className="wdir-header">
        <h2 className="wdir-title">World name directory</h2>
        <p className="wdir-lead muted">
          Etymology index (Turner-style ancient names), tribal sorting with active branches and elder lines, Dawes/rolls
          cross-index, migration legs from original homelands, and hominin skull-set links for language &amp; spoken-name
          support.
        </p>
        <button
          type="button"
          className="linkbtn wdir-turner"
          onClick={() => onOpenUrl(TURNER_ARCHIVE.url, TURNER_ARCHIVE.label)}
        >
          {TURNER_ARCHIVE.label} (Internet Archive) ↗
        </button>
      </header>

      <div className="wdir-stickbar">
        <div className="wdir-tabs" role="tablist" aria-label="Directory views">
          {(
            [
              ["names", "Names & etymology"],
              ["tribes", "Tribes & migrations"],
              ["hominins", "Hominins & skulls"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={`wdir-tab ${view === id ? "wdir-tab--active" : ""}`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="wdir-toolbar">
        <input
          type="search"
          className="inp wdir-search"
          placeholder="Search names, tribes, languages, rolls, skulls…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search world directory"
        />
        {view === "tribes" && (
          <>
            <select
              className="sel wdir-filter"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              aria-label="Filter by macro region"
            >
              <option value="">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className="sel wdir-filter"
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              aria-label="Filter by language family"
            >
              <option value="">All language families</option>
              {families.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </>
        )}
        {focusBanner && (
          <button
            type="button"
            className="linkbtn wdir-clear-focus"
            onClick={() => {
              setFocusTribeId(null);
              setFocusNameId(null);
              setFocusHomininId(null);
            }}
          >
            Clear focus: {focusBanner} ×
          </button>
        )}
        </div>
      </div>

      <div role="tabpanel" className="wdir-panel">
        {view === "names" &&
          filteredNames.map((n) => (
            <div key={n.id} id={`name-${n.id}`} className={focusNameId === n.id ? "wdir-focus" : ""}>
              <NameCard n={n} onSelectTribe={goTribe} />
            </div>
          ))}
        {view === "tribes" &&
          filteredTribes.map((t) => (
            <div key={t.id} className={focusTribeId === t.id ? "wdir-focus" : ""}>
              <TribeCard t={t} onSelectName={goName} onSelectHominin={goHominin} onOpenUrl={onOpenUrl} />
            </div>
          ))}
        {view === "hominins" &&
          filteredHominins.map((h) => (
            <div key={h.id} className={focusHomininId === h.id ? "wdir-focus" : ""}>
              <HomininCard h={h} onSelectTribe={goTribe} />
            </div>
          ))}
        {view === "names" && filteredNames.length === 0 && <p className="muted wdir-empty">No names match.</p>}
        {view === "tribes" && filteredTribes.length === 0 && <p className="muted wdir-empty">No tribes match.</p>}
        {view === "hominins" && filteredHominins.length === 0 && <p className="muted wdir-empty">No hominin records match.</p>}
      </div>

      <OsintInternalViewer request={internalView} onClose={() => setInternalView(null)} />
    </div>
  );
}
