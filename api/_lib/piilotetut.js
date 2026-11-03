import { onKaksoiskappaleTaiTestikopio } from "./kaksoiskappaleet.js";
import { onPainolaatuPiilotettu } from "./painolaatu.js";
/** Myynnistä piilotetut kategoriat palvelimella. Sama lista kuin src/lib/hiddenCategories.ts (testi vertaa). */
export const PIILOTETUT_KATEGORIAT = ["mukit"];
export const onPiilotettu = (kategoria) => !!kategoria && PIILOTETUT_KATEGORIAT.includes(kategoria);

/** Muki nimen, osoitteen tai koon perusteella (sama kuin src/lib/hiddenCategories.ts onPiilotettuTuote). */
export const MUKI_TUNNISTE = /\bmuki\b|kahvimuki|-muki$/i;
export function onPiilotettuTuote(p) {
  if (onPiilotettu(p?.category)) return true;
  // Synkronoinnin kaksoiskappaleet ja Printify-testikopiot (api/_lib/kaksoiskappaleet.js).
  if (onKaksoiskappaleTaiTestikopio(p?.slug)) return true;
  // Painotiedosto alle 150 DPI (api/_lib/painolaatu.js, 3.11.2026).
  if (onPainolaatuPiilotettu(p?.slug)) return true;
  if (MUKI_TUNNISTE.test(`${p?.slug ?? ""} ${p?.name ?? ""}`)) return true;
  const koot = p?.variants?.sizes;
  return Array.isArray(koot) && koot.some((k) => typeof k === "string" && /^\d+oz$/i.test(k));
}
