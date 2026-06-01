import { corsFetch } from "./osintSearch";

export type OsintViewRequest = {
  url: string;
  title: string;
  source: string;
  snippet?: string;
};

export type OsintInternalPayload = {
  mode: "reader" | "embed";
  title: string;
  sourceUrl: string;
  /** Sanitized HTML for reader mode */
  html?: string;
  /** Plain text fallback */
  text?: string;
  /** iframe src (direct or archive mirror) */
  embedUrl?: string;
  embedMirror?: "direct" | "archive";
  error?: string;
};

function enc(s: string): string {
  return encodeURIComponent(s);
}

export function archiveEmbedUrl(url: string): string {
  return `https://web.archive.org/web/0id_/${encodeURIComponent(url)}`;
}

function sanitizeArticleHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, form, link[rel=stylesheet]").forEach((n) => n.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const n = attr.name.toLowerCase();
      if (n.startsWith("on")) el.removeAttribute(attr.name);
      if (n === "href" && attr.value.trim().toLowerCase().startsWith("javascript:")) {
        el.removeAttribute("href");
      }
    }
  });
  return doc.body.innerHTML;
}

function wikiTitleFromUrl(url: string): { host: string; title: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(".wikipedia.org")) return null;
    const m = u.pathname.match(/\/wiki\/([^#?]+)/);
    if (!m) return null;
    return { host: u.hostname, title: decodeURIComponent(m[1].replace(/_/g, " ")) };
  } catch {
    return null;
  }
}

function wikidataIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("wikidata.org")) return null;
    const m = u.pathname.match(/\/wiki\/(Q\d+)/i);
    return m ? m[1].toUpperCase() : null;
  } catch {
    return null;
  }
}

async function loadWikipedia(url: string, signal?: AbortSignal): Promise<OsintInternalPayload | null> {
  const parsed = wikiTitleFromUrl(url);
  if (!parsed) return null;
  const api =
    `https://${parsed.host}/w/api.php?action=parse&page=${enc(parsed.title)}` +
    `&prop=text|displaytitle&formatversion=2&format=json&origin=*`;
  const r = await corsFetch(api, undefined, signal);
  if (!r.ok) return null;
  const d = (await r.json()) as {
    parse?: { title?: string; text?: string; displaytitle?: string };
  };
  const html = d.parse?.text;
  if (!html) return null;
  return {
    mode: "reader",
    title: d.parse?.displaytitle?.replace(/<[^>]+>/g, "") ?? d.parse?.title ?? parsed.title,
    sourceUrl: url,
    html: sanitizeArticleHtml(html),
  };
}

async function loadWikidata(url: string, signal?: AbortSignal): Promise<OsintInternalPayload | null> {
  const id = wikidataIdFromUrl(url);
  if (!id) return null;
  const r = await corsFetch(
    `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`,
    undefined,
    signal
  );
  if (!r.ok) return null;
  const d = (await r.json()) as {
    entities?: Record<string, { labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }>; claims?: Record<string, unknown> }>;
  };
  const ent = d.entities?.[id];
  if (!ent) return null;
  const label = ent.labels?.en?.value ?? id;
  const desc = ent.descriptions?.en?.value ?? "";
  const claimKeys = Object.keys(ent.claims ?? {}).slice(0, 40);
  const rows = claimKeys
    .map((k) => `<tr><td class="mono">${k}</td><td><pre>${JSON.stringify((ent.claims as Record<string, unknown>)[k], null, 0).slice(0, 400)}</pre></td></tr>`)
    .join("");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<p>${esc(desc)}</p><table class="osint-wd-table"><tbody>${rows}</tbody></table>`;
  return {
    mode: "reader",
    title: label,
    sourceUrl: url,
    html: sanitizeArticleHtml(html),
  };
}

/**
 * Extracts genealogy-relevant structured data from a Wikidata entity.
 * This is the core of "scooping up history".
 */
export type WikidataGenealogyExtract = {
  label?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  burialPlace?: string;
  occupations?: string[];
  sex?: string;
  rawClaimsSample?: Record<string, unknown>;
};

export async function extractWikidataGenealogy(
  urlOrId: string,
  signal?: AbortSignal
): Promise<WikidataGenealogyExtract | null> {
  const id = wikidataIdFromUrl(urlOrId) ?? (urlOrId.match(/^Q\d+$/i) ? urlOrId.toUpperCase() : null);
  if (!id) return null;

  const r = await corsFetch(
    `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`,
    undefined,
    signal
  );
  if (!r.ok) return null;

  const d = (await r.json()) as any;
  const ent = d.entities?.[id];
  if (!ent) return null;

  const getClaimValue = (prop: string): any => {
    const claims = ent.claims?.[prop];
    if (!claims?.[0]?.mainsnak?.datavalue?.value) return null;
    const v = claims[0].mainsnak.datavalue.value;
    if (typeof v === "string") return v;
    if (v.time) return v.time; // P569/P570 style
    if (v.id) return v.id;     // reference to another item
    if (v.text) return v.text;
    return v;
  };

  const getLabel = (prop: string): string | undefined => {
    const val = getClaimValue(prop);
    // For place-like props we only have Q-ids here; real labels would need another call.
    // For MVP we return the raw value or Q-id and let the UI show it.
    return val ? String(val) : undefined;
  };

  const occuClaims = ent.claims?.P106 || [];
  const occupations = occuClaims
    .map((c: any) => c?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean)
    .slice(0, 6);

  return {
    label: ent.labels?.en?.value,
    birthDate: getLabel("P569"),
    deathDate: getLabel("P570"),
    birthPlace: getLabel("P19"),
    deathPlace: getLabel("P20"),
    burialPlace: getLabel("P119"),
    occupations,
    sex: getLabel("P21"),
    rawClaimsSample: Object.fromEntries(
      Object.entries(ent.claims || {}).slice(0, 15)
    ),
  };
}

/** Very lightweight Wikipedia infobox extractor for common genealogy fields. */
export async function extractWikipediaInfobox(
  url: string,
  signal?: AbortSignal
): Promise<Partial<WikidataGenealogyExtract> | null> {
  try {
    const parsed = wikiTitleFromUrl(url);
    if (!parsed) return null;

    const api =
      `https://${parsed.host}/w/api.php?action=parse&page=${encodeURIComponent(parsed.title)}` +
      `&prop=wikitext&formatversion=2&format=json&origin=*`;

    const r = await corsFetch(api, undefined, signal);
    if (!r.ok) return null;

    const d = (await r.json()) as { parse?: { wikitext?: string } };
    const wikitext = d.parse?.wikitext || "";

    // Naive infobox scraping (good enough for many genealogy pages)
    const get = (field: string) => {
      const re = new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\n|]+)`, "i");
      const m = wikitext.match(re);
      return m ? m[1].trim().replace(/\[\[|\]\]/g, "") : undefined;
    };

    return {
      label: parsed.title,
      birthDate: get("birth_date") || get("born"),
      deathDate: get("death_date") || get("died"),
      birthPlace: get("birth_place"),
      deathPlace: get("death_place"),
    } as any; // extra notes allowed downstream
  } catch {
    return null;
  }
}

/** Basic Find a Grave memorial page extractor (birth/death + cemetery). */
export async function extractFindAGrave(
  url: string,
  signal?: AbortSignal
): Promise<Partial<WikidataGenealogyExtract> | null> {
  try {
    const r = await corsFetch(url, undefined, signal);
    if (!r.ok) return null;
    const html = await r.text();

    const get = (re: RegExp) => {
      const m = html.match(re);
      return m ? m[1].replace(/<[^>]+>/g, "").trim() : undefined;
    };

    return {
      label: get(/<h1[^>]*>([^<]+)<\/h1>/i) || "Find a Grave memorial",
      birthDate: get(/Born[^<]*<[^>]*>([^<]+)<\/[^>]*>/i) || get(/b\.\s*(\d{4})/i),
      deathDate: get(/Died[^<]*<[^>]*>([^<]+)<\/[^>]*>/i) || get(/d\.\s*(\d{4})/i),
      birthPlace: get(/Born[^<]*in\s+([^<]+)/i),
      deathPlace: get(/Died[^<]*in\s+([^<]+)/i),
      burp: get(/Burial[^<]*<[^>]*>([^<]+)<\/[^>]*>/i) || get(/Cemetery[^<]*>([^<]+)</i),
    } as any;
  } catch {
    return null;
  }
}

async function loadOpenLibraryWork(url: string, signal?: AbortSignal): Promise<OsintInternalPayload | null> {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("openlibrary.org")) return null;
    const m = u.pathname.match(/\/(works|authors|books)\/(OL\d+\w)/i);
    if (!m) return null;
    const r = await corsFetch(`https://openlibrary.org${u.pathname}.json`, undefined, signal);
    if (!r.ok) return null;
    const d = (await r.json()) as Record<string, unknown>;
    const title = String(d.title ?? d.name ?? m[2]);
    const text = JSON.stringify(d, null, 2).slice(0, 12000);
    return {
      mode: "reader",
      title,
      sourceUrl: url,
      text,
      html: `<pre class="osint-json-pre">${text.replace(/</g, "&lt;")}</pre>`,
    };
  } catch {
    return null;
  }
}

async function loadInternetArchive(url: string, signal?: AbortSignal): Promise<OsintInternalPayload | null> {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("archive.org")) return null;
    const m = u.pathname.match(/\/details\/([^/]+)/);
    if (!m) return null;
    const id = m[1];
    const r = await corsFetch(`https://archive.org/metadata/${id}`, undefined, signal);
    if (!r.ok) return null;
    const d = (await r.json()) as { metadata?: { title?: string; description?: string } };
    const title = d.metadata?.title ?? id;
    const desc = d.metadata?.description ?? "";
    return {
      mode: "reader",
      title,
      sourceUrl: url,
      html: sanitizeArticleHtml(`<p>${String(desc).slice(0, 8000)}</p>`),
      embedUrl: `https://archive.org/embed/${id}`,
      embedMirror: "direct",
    };
  } catch {
    return null;
  }
}

function readerFromSnippet(req: OsintViewRequest): OsintInternalPayload {
  const body = req.snippet
    ? `<p class="osint-snippet-lead">${req.snippet.replace(/</g, "&lt;")}</p>`
    : "<p class=\"muted\">No preview text — try Embed view or Archive mirror.</p>";
  return {
    mode: "reader",
    title: req.title,
    sourceUrl: req.url,
    html: sanitizeArticleHtml(`${body}<p class="muted"><a href="${req.url.replace(/"/g, "&quot;")}" rel="noopener">Source</a></p>`),
    embedUrl: req.url,
    embedMirror: "direct",
  };
}

/** Load displayable content without leaving the app. */
export async function loadOsintInternalContent(
  req: OsintViewRequest,
  signal?: AbortSignal
): Promise<OsintInternalPayload> {
  const tryLoaders = [
    () => loadWikipedia(req.url, signal),
    () => loadWikidata(req.url, signal),
    () => loadOpenLibraryWork(req.url, signal),
    () => loadInternetArchive(req.url, signal),
  ];

  for (const fn of tryLoaders) {
    if (signal?.aborted) break;
    try {
      const got = await fn();
      if (got) {
        return {
          ...got,
          embedUrl: got.embedUrl ?? req.url,
          embedMirror: got.embedMirror ?? "direct",
        };
      }
    } catch {
      /* next */
    }
  }

  if (signal?.aborted) {
    return { mode: "embed", title: req.title, sourceUrl: req.url, error: "Cancelled" };
  }

  const snippetReader = readerFromSnippet(req);
  return {
    ...snippetReader,
    mode: "embed",
    embedUrl: req.url,
    embedMirror: "direct",
  };
}
