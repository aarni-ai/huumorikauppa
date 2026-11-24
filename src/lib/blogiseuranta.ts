/**
 * Blogien konversioseuranta selaimessa (api/_lib/blogiseuranta.js, 24.11.2026): blogin näyttö, tuoteklikki, koriin
 * lisäys ja kassalle siirtyminen blogikäynnin aikana. Koostemäärät, ei tunnisteita. Botit ohitetaan.
 * Blogikäynti muistetaan välilehden ajan (sessionStorage), jotta korin ja kassan tapahtumat liittyvät blogiin.
 */
import { aitousLuokka } from "./aitous";

export type BlogiTapahtuma = "naytto" | "tuote" | "kori" | "kassa";
const AVAIN = "hk_blogi";
const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));

export function kirjaaBlogi(tapahtuma: BlogiTapahtuma, blogi?: string): void {
  if (typeof window === "undefined" || typeof fetch !== "function" || onBotti()) return;
  let slug = blogi;
  try {
    if (blogi) sessionStorage.setItem(AVAIN, blogi);
    else slug = sessionStorage.getItem(AVAIN) || undefined;
  } catch { /* yksityinen tila */ }
  if (!slug) return;
  fetch("/api/sahkoposti", {
    method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
    body: JSON.stringify({ action: "blogi", blogi: slug, tapahtuma, aitous: aitousLuokka() }),
  }).catch(() => undefined);
}

/** Kassa: kirjataan vain, jos välilehdellä on ollut blogikäynti. */
export const kirjaaBlogiKassa = () => kirjaaBlogi("kassa");
