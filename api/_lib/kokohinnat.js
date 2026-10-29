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

/**
 * Hinnoittelu 29.10.2026 (KATTEET.md "Hinnoittelu 29.10.2026"): tavoite keskikate vähintään 10 € tilausta kohden ja
 * vähintään 7 € jokaisessa tavallisessa tilauksessa kaikkien kulujen jälkeen. Kilpailijat 29.10.2026:
 * Hauskatpaidat.fi t-paita 25 €, premium/oma printti 30 €, huppari 45-69 € (yleensä 50-55 €); Stuntman t-paita
 * 19,90-22,90 €, huppari 38,90-44,90 € (erikoismallit 50-59 €).
 * - T-paidat, joilla on suora kilpailijavertailu (SUORA_VERTAILU: samat meemit ja aiheet kilpailijalla 25 €): 24,90 €,
 *   3XL-5XL 28,90 €. Black Friday koskee vain näitä (kappalehinta 24,90 €).
 * - Muut t-paidat (harrastus- ja ammattisarjat, joulu-, ikävuosi-, kaupunki- ja muut uniikit designit): 27,90 €,
 *   3XL-5XL 29,90 €.
 * - Hupparit 52,90 €, 3XL+ 59,90 €. Julisteet 24,90 €. Keraaminen koriste 22,90 €.
 * 3XL+ -hinnat tarkistettiin tuotannon kuluilla (?tehtava=katetaulu): 27,90 €:lla 4XL jäi 6,25 €:oon ja hupparin 3XL
 * 57,90 €:lla 6,55 €:oon, joten 3XL+ nostettiin niin, että jokaisen variantin kate on vähintään 7 €.
 */
export const SUORA_VERTAILU = /saatanan.?tunarit|tonnin.?seteli|^i\s*(love|❤️?|♥)\s*my\s*(girl|boy)friend|alkoholiongelmaa|maailman.?paras.?(äiti|aiti)|^kalju\s*\||amatimies|^100.?%?.?eläkeläinen\s*\||^eläkeläinen\s*\||^olen eläkkeellä\s*\|/i;

export const TPAITA_HINNAT = { suora: 24.9, suoraIso: 28.9, uniikki: 27.9, uniikkiIso: 29.9 };

/** Kategoriat, joilla on koon mukainen hinta: { perus, iso } (iso = 3XL ja isommat). */
export const KOKOHINNAT = {
  hupparit: { perus: 52.9, iso: 59.9 },
};

/** Kiinteät kategoriahinnat (kaikki koot). */
export const KATEGORIAHINNAT = {
  seinataulut: 24.9,
  koristeet: 22.9,
};

/** Onko t-paidalla suora kilpailijavertailu (24,90 €). Personoitu paita hinnoitellaan erikseen (api/_lib/personoitu.js). */
export const onSuoraVertailu = (tuote) => tuote?.category === "t-paidat" && SUORA_VERTAILU.test(String(tuote?.name || "").trim());

/**
 * Tuotteen perushinta (listat, pienin koko): kategorian perushinta tai tuoterivin hinta.
 * @param {any} tuote
 * @returns {number}
 */
export function perusHinta(tuote) {
  return hinnoitteleRivi(tuote).price;
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
  if (!tuote || tuote.variants?.personoitu) return tuote;
  const kiintea = KATEGORIAHINNAT[tuote.category];
  if (kiintea) return { ...tuote, price: kiintea };
  const t = tuote.category === "t-paidat" && Number(tuote.price) > 0
    ? (onSuoraVertailu(tuote) ? { perus: TPAITA_HINNAT.suora, iso: TPAITA_HINNAT.suoraIso } : { perus: TPAITA_HINNAT.uniikki, iso: TPAITA_HINNAT.uniikkiIso })
    : null;
  const k = t || KOKOHINNAT[tuote?.category];
  if (!k) return tuote;
  const koot = new Set([
    ...(Array.isArray(tuote?.variants?.sizes) ? tuote.variants.sizes : []),
    ...Object.keys(tuote?.variants?.variant_map || {}).map((a) => a.split("|")[1]),
  ]);
  const size_prices = {};
  for (const koko of koot) if (koko && ISOT_KOOT.test(koko) && k.iso !== k.perus) size_prices[koko] = k.iso;
  return { ...tuote, price: k.perus, variants: { ...(tuote.variants || {}), size_prices } };
}
