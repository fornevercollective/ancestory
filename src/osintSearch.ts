/** Browser-only OSINT / deep search — launchers + fetch connectors (mueee HistorySearch pattern). */

export type OsintHit = {
  title: string;
  source: string;
  url: string;
  snippet?: string;
  thumbnail?: string;
};

export type OsintLauncher = {
  id: string;
  name: string;
  icon: string;
  category: "wiki" | "social" | "osint" | "archive" | "genealogy" | "tools" | "news";
  buildUrl: (q: string) => string;
};

export type OsintConnector = {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  search: (q: string, signal?: AbortSignal) => Promise<OsintHit[]>;
};

export type ContrailSearchProgress = {
  results: OsintHit[];
  index: number;
  total: number;
  connector: string;
  latestBatch: OsintHit[];
};

const SRC_COLORS: Record<string, string> = {
  wikipedia: "#3b82f6",
  wikidata: "#6366f1",
  grokipedia: "#14b8a6",
  duckduckgo: "#de5833",
  "open-library": "#f97316",
  "internet-archive": "#f59e0b",
  wayback: "#fb7185",
  wikinews: "#0d9488",
  osint: "#10b981",
  social: "#ec4899",
  tools: "#8b5cf6",
};

export function osintSourceColor(source: string): string {
  return SRC_COLORS[source] ?? "#64748b";
}

function enc(q: string): string {
  return encodeURIComponent(q.trim());
}

/** Free deep-search launchers — opens in new tab (no scraping). */
export const OSINT_LAUNCHERS: OsintLauncher[] = [
  { id: "osint-fw", name: "OSINT Framework", icon: "⊞", category: "osint", buildUrl: () => "https://osintframework.com/" },
  {
    id: "osint-fw-q",
    name: "OSINT Framework · DDG",
    icon: "⊞",
    category: "osint",
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(`site:osintframework.com ${q}`)}`,
  },
  {
    id: "socialblade",
    name: "Social Blade",
    icon: "SB",
    category: "social",
    buildUrl: (q) => `https://socialblade.com/search/all?query=${enc(q)}`,
  },
  {
    id: "socialblade-yt",
    name: "Social Blade · YouTube",
    icon: "YT",
    category: "social",
    buildUrl: (q) => `https://socialblade.com/youtube/search?query=${enc(q)}`,
  },
  {
    id: "keycdn-geo",
    name: "KeyCDN Geo",
    icon: "◎",
    category: "tools",
    buildUrl: (q) => `https://tools.keycdn.com/geo?host=${enc(q)}`,
  },
  {
    id: "keycdn-perf",
    name: "KeyCDN Performance",
    icon: "⚡",
    category: "tools",
    buildUrl: (q) => `https://tools.keycdn.com/performance?q=${enc(q)}`,
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    icon: "W",
    category: "wiki",
    buildUrl: (q) => `https://en.wikipedia.org/w/index.php?search=${enc(q)}`,
  },
  {
    id: "wikidata",
    name: "Wikidata",
    icon: "WD",
    category: "wiki",
    buildUrl: (q) =>
      `https://www.wikidata.org/w/index.php?search=${enc(q)}&title=Special:Search&fulltext=1`,
  },
  {
    id: "grokipedia",
    name: "Grokipedia",
    icon: "GK",
    category: "wiki",
    buildUrl: (q) => `https://grokipedia.com/search?q=${enc(q)}`,
  },
  {
    id: "wiktionary",
    name: "Wiktionary",
    icon: "Wt",
    category: "wiki",
    buildUrl: (q) => `https://en.wiktionary.org/w/index.php?search=${enc(q)}`,
  },
  {
    id: "wikisource",
    name: "Wikisource",
    icon: "Ws",
    category: "wiki",
    buildUrl: (q) => `https://en.wikisource.org/w/index.php?search=${enc(q)}`,
  },
  {
    id: "commons",
    name: "Wikimedia Commons",
    icon: "Cm",
    category: "wiki",
    buildUrl: (q) => `https://commons.wikimedia.org/w/index.php?search=${enc(q)}`,
  },
  {
    id: "ddg",
    name: "DuckDuckGo",
    icon: "DD",
    category: "news",
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(q)}`,
  },
  {
    id: "google",
    name: "Google",
    icon: "G",
    category: "news",
    buildUrl: (q) => `https://www.google.com/search?q=${enc(q)}`,
  },
  {
    id: "bing",
    name: "Bing",
    icon: "Bi",
    category: "news",
    buildUrl: (q) => `https://www.bing.com/search?q=${enc(q)}`,
  },
  {
    id: "archive",
    name: "Internet Archive",
    icon: "IA",
    category: "archive",
    buildUrl: (q) => `https://archive.org/search?query=${enc(q)}`,
  },
  {
    id: "wayback",
    name: "Wayback Machine",
    icon: "WB",
    category: "archive",
    buildUrl: (q) => `https://web.archive.org/web/*/${enc(q)}`,
  },
  {
    id: "openlibrary",
    name: "Open Library",
    icon: "OL",
    category: "archive",
    buildUrl: (q) => `https://openlibrary.org/search?q=${enc(q)}`,
  },
  {
    id: "familysearch",
    name: "FamilySearch",
    icon: "FS",
    category: "genealogy",
    buildUrl: (q) => `https://www.familysearch.org/search/record/results?q.givenName=${enc(q)}`,
  },
  {
    id: "wikitree",
    name: "WikiTree",
    icon: "WT",
    category: "genealogy",
    buildUrl: (q) => `https://www.wikitree.com/index.php?title=Special:Search&search=${enc(q)}`,
  },
  {
    id: "findagrave",
    name: "Find a Grave",
    icon: "FG",
    category: "genealogy",
    buildUrl: (q) => `https://www.findagrave.com/memorial/search?firstname=&lastname=${enc(q)}`,
  },
  {
    id: "billiongraves",
    name: "BillionGraves",
    icon: "BG",
    category: "genealogy",
    buildUrl: (q) => `https://billiongraves.com/search/results?given_names=&family_names=${enc(q)}`,
  },
  {
    id: "x-social",
    name: "X / Twitter",
    icon: "X",
    category: "social",
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(`site:twitter.com OR site:x.com ${q}`)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "f",
    category: "social",
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(`site:facebook.com ${q}`)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "in",
    category: "social",
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(`site:linkedin.com/in ${q}`)}`,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "IG",
    category: "social",
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(`site:instagram.com ${q}`)}`,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "Tk",
    category: "social",
    buildUrl: (q) => `https://duckduckgo.com/?q=${enc(`site:tiktok.com ${q}`)}`,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶",
    category: "social",
    buildUrl: (q) => `https://www.youtube.com/results?search_query=${enc(q)}`,
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: "R",
    category: "social",
    buildUrl: (q) => `https://www.reddit.com/search/?q=${enc(q)}`,
  },
  {
    id: "tineye",
    name: "TinEye",
    icon: "👁",
    category: "osint",
    buildUrl: (q) => `https://tineye.com/search?url=${enc(q)}`,
  },
  {
    id: "google-lens",
    name: "Google Images",
    icon: "🖼",
    category: "osint",
    buildUrl: (q) => `https://www.google.com/search?tbm=isch&q=${enc(q)}`,
  },
  {
    id: "yandex-img",
    name: "Yandex Images",
    icon: "Ya",
    category: "osint",
    buildUrl: (q) => `https://yandex.com/images/search?text=${enc(q)}`,
  },
  {
    id: "bellingcat",
    name: "Bellingcat",
    icon: "BC",
    category: "osint",
    buildUrl: (q) => `https://www.bellingcat.com/?s=${enc(q)}`,
  },
  {
    id: "shodan",
    name: "Shodan",
    icon: "Sh",
    category: "tools",
    buildUrl: (q) => `https://www.shodan.io/search?query=${enc(q)}`,
  },
  {
    id: "github",
    name: "GitHub",
    icon: "GH",
    category: "tools",
    buildUrl: (q) => `https://github.com/search?q=${enc(q)}&type=repositories`,
  },
];

function getFetchProxyBase(): string {
  try {
    const w = (window as unknown as { __ANCESTORY_FETCH_PROXY__?: string }).__ANCESTORY_FETCH_PROXY__;
    if (w?.trim()) return w.trim().replace(/\/?$/, "");
    const ls = localStorage.getItem("ancestory-fetch-proxy-url")?.trim();
    if (ls) return ls.replace(/\/?$/, "");
    const legacy = localStorage.getItem("uvspeed-fetch-proxy-url")?.trim();
    if (legacy) return legacy.replace(/\/?$/, "");
  } catch {
    /* ignore */
  }
  return "";
}

export function corsFetch(url: string, init?: RequestInit, signal?: AbortSignal): Promise<Response> {
  const target = String(url);
  const base = getFetchProxyBase();
  const reqInit = signal ? { ...init, signal } : init;
  if (!base || !/^https?:\/\//i.test(target)) return fetch(target, reqInit);
  return fetch(`${base}?url=${encodeURIComponent(target)}`, reqInit);
}

function linkHit(
  title: string,
  source: string,
  url: string,
  snippet?: string
): OsintHit {
  return { title, source, url, snippet };
}

export const OSINT_CONNECTORS: OsintConnector[] = [
  {
    id: "wikipedia",
    name: "Wikipedia",
    icon: "W",
    enabled: true,
    search: async (q, signal) => {
      const r = await corsFetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${enc(q)}&limit=6&format=json&origin=*`,
        undefined,
        signal
      );
      if (!r.ok) return [];
      const d = (await r.json()) as [unknown, string[], string[], string[]];
      const titles = d[1] ?? [];
      const urls = d[3] ?? [];
      const snippets = d[2] ?? [];
      return titles.map((t, i) => ({
        title: t,
        source: "wikipedia",
        url: urls[i] ?? `https://en.wikipedia.org/wiki/${enc(t)}`,
        snippet: snippets[i],
      }));
    },
  },
  {
    id: "wikidata",
    name: "Wikidata",
    icon: "WD",
    enabled: true,
    search: async (q, signal) => {
      const r = await corsFetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${enc(q)}&language=en&limit=8&format=json&origin=*`,
        undefined,
        signal
      );
      if (!r.ok) return [];
      const d = (await r.json()) as { search?: { id: string; label: string; description?: string }[] };
      return (d.search ?? []).map((e) => ({
        title: e.label,
        source: "wikidata",
        url: `https://www.wikidata.org/wiki/${e.id}`,
        snippet: e.description,
      }));
    },
  },
  {
    id: "grokipedia",
    name: "Grokipedia",
    icon: "GK",
    enabled: true,
    search: async (q, signal) => {
      const searchUrl = `https://grokipedia.com/search?q=${enc(q)}`;
      try {
        const r = await corsFetch(
          `https://grokipedia.com/api/full-text-search?query=${enc(q)}`,
          undefined,
          signal
        );
        if (!r.ok) throw new Error("http");
        const d = (await r.json()) as { results?: { title?: string; slug?: string; snippet?: string }[] };
        const rows = d.results ?? [];
        if (!rows.length) {
          return [linkHit(`Grokipedia — ${q}`, "grokipedia", searchUrl, "Open Grokipedia search")];
        }
        return rows.slice(0, 8).map((row) => {
          const slug = row.slug?.trim();
          return {
            title: row.title ?? q,
            source: "grokipedia",
            url: slug ? `https://grokipedia.com/page/${slug}` : searchUrl,
            snippet: row.snippet,
          };
        });
      } catch {
        return [
          linkHit(
            `Grokipedia — ${q}`,
            "grokipedia",
            searchUrl,
            "JSON blocked by CORS — set localStorage ancestory-fetch-proxy-url (mueee Worker) or open link."
          ),
        ];
      }
    },
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    icon: "DD",
    enabled: true,
    search: async (q) => {
      const eq = enc(q);
      const web = `https://duckduckgo.com/?q=${eq}`;
      try {
        const r = await corsFetch(
          `https://api.duckduckgo.com/?q=${eq}&format=json&no_html=1&no_redirect=1&t=ancestory`
        );
        if (!r.ok) throw new Error("ddg");
        const d = (await r.json()) as {
          Abstract?: string;
          Heading?: string;
          AbstractURL?: string;
          RelatedTopics?: { Text?: string; FirstURL?: string }[];
        };
        const out: OsintHit[] = [];
        if (d.Abstract?.trim()) {
          out.push({
            title: (d.Heading ?? q).slice(0, 200),
            source: "duckduckgo",
            snippet: d.Abstract.slice(0, 280),
            url: d.AbstractURL ?? web,
          });
        }
        for (const rt of (d.RelatedTopics ?? []).slice(0, 8)) {
          if (rt?.Text && rt.FirstURL) {
            out.push({
              title: rt.Text.slice(0, 100),
              source: "duckduckgo",
              snippet: rt.Text.slice(0, 240),
              url: rt.FirstURL,
            });
          }
        }
        if (out.length) return out;
      } catch {
        /* fallback */
      }
      return [linkHit(`DuckDuckGo — ${q}`, "duckduckgo", web, "Web results")];
    },
  },
  {
    id: "open-library",
    name: "Open Library",
    icon: "OL",
    enabled: true,
    search: async (q, signal) => {
      const r = await corsFetch(`https://openlibrary.org/search.json?q=${enc(q)}&limit=6`, undefined, signal);
      if (!r.ok) return [];
      const d = (await r.json()) as { docs?: { title?: string; author_name?: string[]; key?: string }[] };
      return (d.docs ?? []).map((doc) => ({
        title: doc.title ?? q,
        source: "open-library",
        url: doc.key ? `https://openlibrary.org${doc.key}` : `https://openlibrary.org/search?q=${enc(q)}`,
        snippet: doc.author_name?.join(", "),
      }));
    },
  },
  {
    id: "wikinews",
    name: "Wikinews",
    icon: "WN",
    enabled: true,
    search: async (q, signal) => {
      const r = await corsFetch(
        `https://en.wikinews.org/w/api.php?action=query&list=search&srsearch=${enc(q)}&srlimit=6&format=json&origin=*`,
        undefined,
        signal
      );
      if (!r.ok) return [];
      const d = (await r.json()) as { query?: { search?: { title: string; snippet?: string }[] } };
      return (d.query?.search ?? []).map((h) => ({
        title: h.title,
        source: "wikinews",
        url: `https://en.wikinews.org/wiki/${encodeURIComponent(h.title.replace(/ /g, "_"))}`,
        snippet: (h.snippet ?? "").replace(/<[^>]+>/g, ""),
      }));
    },
  },
  {
    id: "internet-archive",
    name: "Internet Archive",
    icon: "IA",
    enabled: true,
    search: async (q, signal) => {
      const r = await corsFetch(
        `https://archive.org/advancedsearch.php?q=${enc(q)}&fl[]=identifier,title,description&rows=6&output=json`,
        undefined,
        signal
      );
      if (!r.ok) {
        return [
          linkHit(`Internet Archive — ${q}`, "internet-archive", `https://archive.org/search?query=${enc(q)}`),
        ];
      }
      const d = (await r.json()) as { response?: { docs?: { identifier?: string; title?: string; description?: string }[] } };
      const docs = d.response?.docs ?? [];
      if (!docs.length) {
        return [
          linkHit(`Internet Archive — ${q}`, "internet-archive", `https://archive.org/search?query=${enc(q)}`),
        ];
      }
      return docs.map((doc) => ({
        title: doc.title ?? doc.identifier ?? q,
        source: "internet-archive",
        url: doc.identifier ? `https://archive.org/details/${doc.identifier}` : `https://archive.org/search?query=${enc(q)}`,
        snippet: typeof doc.description === "string" ? doc.description.slice(0, 200) : undefined,
      }));
    },
  },
  {
    id: "wayback",
    name: "Wayback",
    icon: "WB",
    enabled: true,
    search: async (q) => [
      linkHit(
        `Wayback — ${q}`,
        "wayback",
        `https://web.archive.org/web/*/${enc(q)}`,
        "Calendar search for archived snapshots"
      ),
    ],
  },
];

const CYCLE_MS_KEY = "ancestory-osint-cycle-ms";
const CYCLE_ON_KEY = "ancestory-osint-cycle-on";

export function readOsintCycleMs(): number {
  try {
    const n = Number(localStorage.getItem(CYCLE_MS_KEY));
    if (Number.isFinite(n) && n >= 2000 && n <= 15000) return n;
  } catch {
    /* ignore */
  }
  return 4000;
}

export function writeOsintCycleMs(ms: number) {
  localStorage.setItem(CYCLE_MS_KEY, String(Math.max(2000, Math.min(15000, ms))));
}

export function readOsintCycleOn(): boolean {
  try {
    const v = localStorage.getItem(CYCLE_ON_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

export function writeOsintCycleOn(on: boolean) {
  localStorage.setItem(CYCLE_ON_KEY, on ? "1" : "0");
}

/** Sequential connector pass (kbatch contrail / map geocode style) — results grow in order. */
export async function searchOsintContrail(
  query: string,
  onProgress: (p: ContrailSearchProgress) => void,
  signal?: AbortSignal
): Promise<OsintHit[]> {
  const q = query.trim();
  if (!q) return [];
  const enabled = OSINT_CONNECTORS.filter((c) => c.enabled);
  const all: OsintHit[] = [];
  for (let i = 0; i < enabled.length; i++) {
    if (signal?.aborted) break;
    const conn = enabled[i];
    let batch: OsintHit[] = [];
    try {
      batch = await conn.search(q, signal);
    } catch {
      batch = [];
    }
    for (const h of batch) all.push(h);
    onProgress({
      results: all.slice(),
      index: i,
      total: enabled.length,
      connector: conn.name,
      latestBatch: batch,
    });
  }
  return all;
}

export function buildOsintLauncherUrl(id: string, query: string): string | null {
  const launcher = OSINT_LAUNCHERS.find((l) => l.id === id);
  if (!launcher) return null;
  const raw = query.trim();
  if (!raw && launcher.id !== "osint-fw") return null;
  return launcher.buildUrl(raw || " ");
}

export function launcherMeta(id: string): OsintLauncher | undefined {
  return OSINT_LAUNCHERS.find((l) => l.id === id);
}
