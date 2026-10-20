/** Myynnistä piilotetut kategoriat palvelimella. Sama lista kuin src/lib/hiddenCategories.ts (testi vertaa). */
export const PIILOTETUT_KATEGORIAT = ["mukit"];
export const onPiilotettu = (kategoria) => !!kategoria && PIILOTETUT_KATEGORIAT.includes(kategoria);
