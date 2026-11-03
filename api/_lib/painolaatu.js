/**
 * Painolaadun takia myynnistä piilotetut tuotteet (3.11.2026, Teron Tonnin seteli -reklamaatio). Painotiedoston
 * tehollinen resoluutio painoalueella jää alle 150 DPI:n, eikä painokoon pienennys riitä (api/_lib/painotiedosto.js
 * resoluutioSijoitus). Printify-tuotteita ei poisteta. Palautus: uusi vähintään 150 DPI:n painotiedosto Printifyyn ja
 * node scripts/painotiedostot-tarkistus.mjs, joka kirjoittaa listan uudelleen (api/_lib/painolaatu-data.js).
 * Sama lista palvelimella (api/_lib/piilotetut.js) ja selaimessa (src/lib/hiddenCategories.ts).
 */
import { PAINOLAATU_PIILOTETUT } from "./painolaatu-data.js";

const PIILOTETUT = new Map(Object.entries(PAINOLAATU_PIILOTETUT));

/** Tuote piilotetaan painotiedoston resoluution takia. */
export const onPainolaatuPiilotettu = (slug) => PIILOTETUT.has(String(slug || ""));

/** Tehollinen resoluutio (DPI), jonka takia tuote piilotettiin, tai null. */
export const painolaatuDpi = (slug) => PIILOTETUT.get(String(slug || "")) ?? null;
