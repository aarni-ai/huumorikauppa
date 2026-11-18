/**
 * Printifyn pending-tilassa odottavat tilaukset (18.11.2026, tilaus #0A0EB579: send_to_production palautti 8502
 * "not allowed to send order to production with status pending"). Printify käsittelee tilauksen vielä; se ei ole
 * virhe. Tilaus odottaa ja yritetään uudelleen 15 minuutin välein enintään 24 tuntia (cron ?tehtava=odottavat), ja
 * omistajalle lähtee hälytys vasta, jos tilaus on yhä jumissa.
 * Lista on Blobissa (puskuri/odottavat.json, salattu): 15 minuutin ajo lukee vain sen eikä herätä tietokantaa.
 */
import { kirjoitaBlob, lueBlob } from "./puskuri.js";

export const ODOTUS_VALI_MIN = 15;
export const ODOTUS_ENINTAAN_H = 24;
const POLKU = "puskuri/odottavat.json";

/** Printify käsittelee tilausta vielä: virhe 8502 tai tila pending. */
export const onPrintifyPending = (virhe, tila) => /\b8502\b|status pending/i.test(String(virhe || "")) || tila === "pending";

export async function odottavat({ lue = lueBlob } = {}) {
  return (await lue(POLKU).catch(() => null))?.tilaukset || [];
}

/** Lisää tilauksen listaan (jos ei jo ole) ja palauttaa odotuksen alkuhetken (ISO). */
export async function lisaaOdottava(id, laji, { lue = lueBlob, kirjoita = kirjoitaBlob, nyt = new Date() } = {}) {
  const lista = await odottavat({ lue });
  const vanha = lista.find((e) => e.id === id);
  if (vanha) return vanha.alkaen;
  await kirjoita(POLKU, { tilaukset: [...lista, { id, laji, alkaen: nyt.toISOString() }] });
  return nyt.toISOString();
}

export async function poistaOdottava(id, { lue = lueBlob, kirjoita = kirjoitaBlob } = {}) {
  const lista = await odottavat({ lue });
  if (!lista.some((e) => e.id === id)) return;
  await kirjoita(POLKU, { tilaukset: lista.filter((e) => e.id !== id) });
}

export const odotusLoppunut = (alkaen, nyt = Date.now()) => nyt - Date.parse(alkaen) >= ODOTUS_ENINTAAN_H * 3600e3;
