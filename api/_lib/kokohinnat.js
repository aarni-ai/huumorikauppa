/**
 * Koon mukaiset hinnat (27.10.2026, oma tausta). Ei riippuvuuksia: selain (ProductPage, ostoskori) ja palvelin
 * (tuotteet.js, kassa.js, kate.js) käyttävät samoja.
 *
 * Hupparit: päätetty hinta S-2XL 52,90 € ja 3XL+ 59,90 €, mutta korkeintaan kilpailijoiden korkein vertailukelpoinen
 * hinta (painettu huppari, tarkistettu 27.10.2026): S-2XL Meemirotta 49,99 €, 3XL+ Stuntman 55,00 € (Speed Kings
 * -sarja). Molemmat jäävät alle päätöksen, joten käytössä kilpailijahinta. Katesääntö hupparille 10 %
 * (api/_lib/kate.js KATE_RAJAT). Laskelma: KATTEET.md, "Hupparien hinta 27.10.2026".
 */
export const ISOT_KOOT = /^(3|4|5|6)XL$/i;

/** Kategoriat, joilla on koon mukainen hinta: { perus, iso } (iso = 3XL ja isommat). */
export const KOKOHINNAT = {
  hupparit: { perus: 49.99, iso: 55.0 },
};

/**
 * Tuotteen perushinta (listat, pienin koko): kategorian perushinta tai tuoterivin hinta.
 * @param {any} tuote
 * @returns {number}
 */
export function perusHinta(tuote) {
  const k = KOKOHINNAT[tuote?.category];
  return k ? k.perus : Number(tuote?.price);
}

/**
 * Koon hinta: tuoterivin variants.size_prices (hinnoitteleRivi, tuotteet.js), muuten tuoterivin hinta.
 * @param {any} tuote
 * @param {string | null | undefined} koko
 * @returns {number}
 */
export function rivinHinta(tuote, koko) {
  const oma = koko ? tuote?.variants?.size_prices?.[koko] : undefined;
  return typeof oma === "number" ? oma : Number(tuote?.price);
}

/**
 * Tuoterivi kokohinnoilla: price = perushinta, variants.size_prices = { koko: hinta } niille koille, joiden hinta
 * poikkeaa perushinnasta. Muut kategoriat sellaisenaan.
 */
export function hinnoitteleRivi(tuote) {
  const k = KOKOHINNAT[tuote?.category];
  if (!k) return tuote;
  const koot = new Set([
    ...(Array.isArray(tuote?.variants?.sizes) ? tuote.variants.sizes : []),
    ...Object.keys(tuote?.variants?.variant_map || {}).map((a) => a.split("|")[1]),
  ]);
  const size_prices = {};
  for (const koko of koot) if (koko && ISOT_KOOT.test(koko)) size_prices[koko] = k.iso;
  return { ...tuote, price: k.perus, variants: { ...(tuote.variants || {}), size_prices } };
}
