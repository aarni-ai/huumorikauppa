import { useEffect } from "react";

/**
 * Marks the page as ready for Prerender.io.
 * For static pages (no async data), call with no args.
 * For dynamic pages, pass a condition that becomes true when data is loaded.
 */
export function usePrerenderReady(ready: boolean = true) {
  useEffect(() => {
    if (ready) {
      (window as any).prerenderReady = true;
    }
  }, [ready]);
}
