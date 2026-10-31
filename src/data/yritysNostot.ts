/**
 * Yritystilauksen nosto (src/components/YritysNosto.tsx) 30.10.2026:
 * - blogit: Search Consolen 28 päivän klikkaukset (29.9.-27.10.), kolme suurinta
 * - tuotteet: Printifyn toteutuneet tilaukset (ilman perutuita ja myynnistä poistettuja mukeja), viisi suurinta
 */
export const YRITYS_NOSTO_BLOGIT = [
  "lahja-miehelle-30v-40v-50v-60v",
  "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea",
  "lahja-naiselle-30v-40v-50v-60v",
] as const;

export const YRITYS_NOSTO_TUOTTEET = [
  "tonnin-seteli-t-paita",
  "saatanan-tunarit-t-paita",
  "tonnin-seteli-huppari",
  "maailman-paras-aiti-huppari",
  "amatimies-huppari",
] as const;

export const onYritysNostoBlogi = (slug: string): boolean => (YRITYS_NOSTO_BLOGIT as readonly string[]).includes(slug);
export const onYritysNostoTuote = (slug: string): boolean => (YRITYS_NOSTO_TUOTTEET as readonly string[]).includes(slug);
