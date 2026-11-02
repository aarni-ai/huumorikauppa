/** Korin lisämyynnin seuranta selaimessa (api/_lib/lisamyynti.js): koostemäärät, ei tunnisteita. Botit ohitetaan. */
export type LisamyyntiTapahtuma = "suositukset_naytetty" | "suositus_lisatty" | "toinen_paita_naytetty" | "toinen_paita_lisatty";

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));
const onTesti = () => typeof window !== "undefined" && (window as unknown as { __suppiloTesti?: boolean }).__suppiloTesti === true;

export function kirjaaLisamyynti(tapahtuma: LisamyyntiTapahtuma): void {
  if (typeof window === "undefined" || typeof fetch !== "function" || onBotti()) return;
  fetch("/api/sahkoposti", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ action: "lisamyynti", tapahtuma, ...(onTesti() ? { testi: true } : {}) }),
  }).catch(() => undefined);
}
