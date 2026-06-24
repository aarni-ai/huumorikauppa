import { useEffect, useState } from "react";

const STORAGE_KEY = "hk_visitor_city_v1";
const TTL_MS = 1000 * 60 * 60 * 6; // 6 h cache

type Cached = { city: string | null; ts: number };

/**
 * Best-effort visitor city lookup via /api/geo (Vercel geo headers).
 * - Never blocks render: returns null until resolved.
 * - Caches in sessionStorage for the session.
 * - 1.5s timeout; any failure → null (caller falls back to defaults).
 */
export function useVisitorCity(): string | null {
  const [city, setCity] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: Cached = JSON.parse(raw);
      if (Date.now() - parsed.ts < TTL_MS) return parsed.city;
    } catch (_e) {
      /* ignore */
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Cached = JSON.parse(raw);
        if (Date.now() - parsed.ts < TTL_MS) return; // fresh cache
      }
    } catch (_e) { /* ignore */ }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);

    fetch("/api/geo", { signal: ctrl.signal, credentials: "omit" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { city?: string | null } | null) => {
        const c = data?.city || null;
        setCity(c);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ city: c, ts: Date.now() }));
        } catch (_e) { /* ignore */ }
      })
      .catch(() => {
        // Silent fallback — null = caller uses default recs
      })
      .finally(() => clearTimeout(timer));

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  return city;
}
