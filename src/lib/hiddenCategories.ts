/**
 * Myynnistä piilotetut kategoriat (21.10.2026: mukit pois myynnistä).
 * Yksi lähde: tuotelistat, tuote- ja kategoriasivut, ostoskori, navigaatio, sivukartta ja Merchant-syöte
 * käyttävät tätä. Mukisivut ohjautuvat 301:llä /kaikki-tuotteet (vercel.json). Palautus: poista kategoria listalta
 * ja vercel.json:n mukiohjaukset.
 */
export const PIILOTETUT_KATEGORIAT: readonly string[] = ["mukit"];

export const onPiilotettu = (category: string | undefined | null): boolean =>
  !!category && PIILOTETUT_KATEGORIAT.includes(category);
