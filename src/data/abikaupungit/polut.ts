/**
 * Abipaitojen kaupunkisivujen slugit (/abipaidat/<slug>) kevyenä listana. Järjestys on sama kuin sivukartassa
 * (api/sitemap.js) ja sisällössä (testattu src/test/abikaupungit.test.ts).
 */
export const ABIKAUPUNKI_SLUGIT = [
  "helsinki",
  "espoo",
  "tampere",
  "vantaa",
  "oulu",
  "turku",
  "jyvaskyla",
  "kuopio",
  "lahti",
  "pori",
  "joensuu",
  "lappeenranta",
  "hameenlinna",
  "vaasa",
  "seinajoki",
  "rovaniemi",
  "mikkeli",
  "kotka",
  "salo",
  "porvoo",
] as const;

export const ABIKAUPUNKI_POLKU = (slug: string) => `/abipaidat/${slug}`;
