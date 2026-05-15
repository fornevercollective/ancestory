/** True when the URL path is the manual-QA rulers surface (with or without Vite `base` prefix). */
export function pathnameIsRulersTest(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return p === "/rulers-test" || p.endsWith("/rulers-test");
}

export function appBaseHref(): string {
  const b = import.meta.env.BASE_URL;
  return b.endsWith("/") ? b : `${b}/`;
}

/** Files from `public/` (fetch, img src). Uses Vite `import.meta.env.BASE_URL` (`/` in dev, `/ancestory/` on Pages). */
export function publicUrl(path: string): string {
  const cleanPath = path.replace(/^\//, "");
  const base = import.meta.env.BASE_URL;
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  return `${baseWithSlash}${cleanPath}`;
}

/** Leave `/…/rulers-test` and return to the app root without a full reload. */
export function leaveRulersTestPath(): void {
  window.history.pushState({}, "", appBaseHref());
  window.dispatchEvent(new PopStateEvent("popstate"));
}
