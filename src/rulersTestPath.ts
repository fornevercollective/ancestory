/** True when the URL path is the manual-QA rulers surface (with or without Vite `base` prefix). */
export function pathnameIsRulersTest(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/rulers-test" || p.endsWith("/rulers-test");
}

export function appBaseHref(): string {
  const b = import.meta.env.BASE_URL;
  return b.endsWith("/") ? b : `${b}/`;
}

/** Files from `public/` (fetch, img src) — prefixes Vite `base` for GitHub Pages etc. */
export function publicUrl(path: string): string {
  return `${appBaseHref()}${path.replace(/^\//, "")}`;
}

/** Leave `/…/rulers-test` and return to the app root without a full reload. */
export function leaveRulersTestPath(): void {
  window.history.pushState({}, "", appBaseHref());
  window.dispatchEvent(new PopStateEvent("popstate"));
}
