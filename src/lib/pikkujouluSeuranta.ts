/**
 * Pikkujoulupakettien seuranta (api/_lib/pikkujoulu-seuranta.js): sivu, paketin valinta ja tarjouspyyntö kerran
 * sivulatausta kohden (paketti: kerran pakettia kohden). Vain koostemäärä, ei evästeitä eikä tunnisteita.
 * Lähetys odottaa luokitusta (src/lib/aitous.ts lahetaKunLuokiteltu); palvelin kirjaa vain aidot käynnit.
 */
import { lahetaKunLuokiteltu } from "./aitous";

export type PikkujouluTapahtuma = "sivu" | "paketti" | "tarjous";

const kirjatut = new Set<string>();

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));

export function kirjaaPikkujoulu(tapahtuma: PikkujouluTapahtuma, paketti = ""): void {
  if (typeof window === "undefined" || typeof fetch !== "function" || onBotti()) return;
  const avain = `${tapahtuma}:${paketti}`;
  if (kirjatut.has(avain)) return;
  kirjatut.add(avain);
  lahetaKunLuokiteltu((aitous) => {
    fetch("/api/sahkoposti", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ action: "pikkujoulu", tapahtuma, paketti, aitous }),
    }).catch(() => undefined);
  });
}

/** Testeille. */
export function _nollaaPikkujouluSeuranta(): void {
  kirjatut.clear();
}
