import { useEffect, useState } from "react";

/**
 * useIsMobile
 * Returns true when the viewport width is <= breakpoint.
 * Uses matchMedia for efficiency + resize listener as fallback.
 * Keeps behavior in sync with CSS media queries (default 720px to match existing breakpoints).
 */
export function useIsMobile(breakpoint = 720): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const update = (e?: MediaQueryListEvent) => {
      setIsMobile(e ? e.matches : window.innerWidth <= breakpoint);
    };

    // Initial sync (in case of hydration or late mount)
    update();

    // Modern path
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      // Legacy fallback
      const onResize = () => update();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [breakpoint]);

  return isMobile;
}
