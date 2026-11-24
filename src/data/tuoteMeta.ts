/**
 * Tuotesivujen title ja metakuvaus (24.11.2026) tuotteille, joilla Search Consolessa sijoitus on alle 10 ja CTR alle 4 %,
 * eikä käsin kirjoitettua sisältöä (src/data/productContent.ts voittaa, jos sielläkin on). Faktat katalogista: koot,
 * värien määrä ja painatus tilauksesta EU:ssa; ei hintoja (hinnat näkyvät sivulla ja syötteessä). Alle 60 / 155 merkkiä.
 */
export const TUOTE_META: Record<string, { seoTitle: string; metaDescription: string }> = {
  "tonnin-seteli-t-paita": {
    seoTitle: "Tonnin seteli t-paita ja huppari | Huumorikauppa",
    metaDescription: "Tonnin seteli t-paita koot S-5XL, 8 väriä. Sama teksti hupparina. Painetaan tilauksesta EU:ssa. Ilmainen toimitus kahdesta tuotteesta.",
  },
  "ice-aatanat-paita": {
    seoTitle: "ICE AATANA t-paita: hauska lahja | Huumorikauppa",
    metaDescription: "ICE AATANA t-paita koot S-5XL, 8 väriä. Sama teksti hupparina. Painetaan tilauksesta EU:ssa. Ilmainen toimitus kahdesta tuotteesta.",
  },
  "ice-aatanahuppari": {
    seoTitle: "ICE AATANA huppari: hauska lahja | Huumorikauppa",
    metaDescription: "ICE AATANA huppari koot S-5XL, 11 väriä. Sama teksti t-paitana. Painetaan tilauksesta EU:ssa. Ilmainen toimitus kahdesta tuotteesta.",
  },
  "kalju-t-paita": {
    seoTitle: "Kalju t-paita: hauska lahja kaljulle | Huumorikauppa",
    metaDescription: "Kalju t-paita koot S-5XL, 7 väriä. Sama teksti hupparina. Painetaan tilauksesta EU:ssa. Ilmainen toimitus kahdesta tuotteesta.",
  },
  "museokamaa-t-paita": {
    seoTitle: "Museokamaa t-paita: hauska ikälahja | Huumorikauppa",
    metaDescription: "Museokamaa t-paita koot S-5XL, 9 väriä. Hauska lahja synttäreille ja eläkkeelle. Painetaan tilauksesta EU:ssa. Ilmainen toimitus kahdesta tuotteesta.",
  },
};
