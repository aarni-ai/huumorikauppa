/**
 * Katesääntö (26.10.2026): myynti estetään vain, jos tuotteen nettokate on alle 20 % (KATE_RAJA). Alennukset
 * (pakettialennus, ensitilauksen koodi) sallitaan vain, jos kate alennuksen jälkeen on vähintään 30 %
 * (PAKETTI_KATE_RAJA, ALENNUS_KATE_RAJA). Uusien tuotteiden hinnoittelun tavoite on edelleen 40 % (HINNOITTELU_KATE).
 *
 *   myynti alv 0   = (myyntihinta + asiakkaan toimitusmaksu) / 1,255
 *   nettokate      = myynti alv 0 - Printifyn tuotekulu - Printifyn toimituskulu - Stripe (1,5 % + 0,25 € maksetusta)
 *   kate %         = nettokate / myynti alv 0
 *
 * Laskenta yhden kappaleen tilauksena (pahin tapaus: toimitusmaksu (vakiot.js) rajan alle jäävissä tilauksissa, Printifyn
 * ensimmäisen kappaleen toimituskulu). Printifyn kulut ovat tuoterivillä (variants.costs: variant_id -> sentit,
 * variants.shipping_cents: Suomen toimitus ensimmäiselle kappaleelle), ja ne haetaan Printifystä
 * (scripts/printify-tuonti.mjs --kulut). Tuntematon kulu: tuotetta ei voi ostaa (kassa), mutta se näkyy listassa,
 * kunnes kulut on tuotu.
 */
export const ALV = 0.255;
/** Myynnin raja: alle tämän varianttia ei voi ostaa (kassa) eikä se näy (tuotteet.js). */
export const KATE_RAJA = 0.2;
/** Kategoriakohtainen myynnin raja (27.10.2026: hupparit 10 %, hinta kilpailijoiden tasolla, api/_lib/kokohinnat.js). */
export const KATE_RAJAT = { hupparit: 0.1 };
export const tuotteenKateraja = (tuote) => KATE_RAJAT[tuote?.category] ?? KATE_RAJA;
/** Pakettialennus annetaan vain, jos paketin kate alennuksen jälkeen on vähintään tämä. */
export const PAKETTI_KATE_RAJA = 0.3;
/** Muut alennukset (ensitilauksen koodi): tilauksen kate alennuksen jälkeen vähintään tämä. */
export const ALENNUS_KATE_RAJA = 0.3;
/** Uusien tuotteiden hinnoittelun tavoite (scripts/lib/uudet-tuotteet.mjs), ei myynnin raja. */
export const HINNOITTELU_KATE = 0.4;
export const STRIPE_PROSENTTI = 0.015;
export const STRIPE_KIINTEA = 0.25;
import { ILMAINEN_TOIMITUS_RAJA, TOIMITUS } from "./vakiot.js";
import { rivinHinta } from "./kokohinnat.js";
import { tuotepohja } from "./materiaali.js";

export const TOIMITUSMAKSU = TOIMITUS;
export const ILMAINEN_RAJA = ILMAINEN_TOIMITUS_RAJA;

/**
 * Tuotteen variantin kate. Palauttaa { tunnettu, nettokate, kate, sallittu }.
 * asetukset: { toimitusmaksu, ilmainenRaja, raja } (oletus: api/_lib/vakiot.js, raja tuotteenKateraja); uusien tuotteiden
 * hinnoittelu (scripts/printify-uudet-tuotteet.mjs) laskee suunnitellulla toimitusmaksulla ja rajalla HINNOITTELU_KATE.
 */
export function laskeKate(tuote, varianttiId = null, { toimitusmaksu: maksu = TOIMITUSMAKSU, ilmainenRaja = ILMAINEN_RAJA, raja = tuotteenKateraja(tuote) } = {}) {
  const kulut = tuote?.variants?.costs || {};
  const toimitus = tuote?.variants?.shipping_cents;
  const kartta = Object.entries(tuote?.variants?.variant_map || {});
  const id = varianttiId ?? kartta[0]?.[1];
  // Hinta variantin koon mukaan (api/_lib/kokohinnat.js), muuten tuoterivin hinta.
  const avain = kartta.find(([, v]) => Number(v) === Number(id))?.[0];
  const hinta = Number(rivinHinta(tuote, avain ? avain.split("|")[1] : null));
  const kulu = kulut[String(id)];
  if (!Number.isFinite(hinta) || typeof kulu !== "number" || typeof toimitus !== "number") {
    return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  }
  const toimitusmaksu = hinta >= ilmainenRaja ? 0 : maksu;
  const maksettu = hinta + toimitusmaksu;
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const nettokate = myyntiAlv0 - kulu / 100 - toimitus / 100 - stripe;
  const kate = nettokate / myyntiAlv0;
  return { tunnettu: true, nettokate: Math.round(nettokate * 100) / 100, kate: Math.round(kate * 1000) / 1000, sallittu: kate >= raja };
}

/**
 * Tuotteen saatavien varianttien heikoin kate (unavailable_variants ohitetaan; tuotteet.js lisää sinne alle rajan
 * jäävät variantit, jolloin tuote näkyy muilla koilla).
 */
export function heikoinKate(tuote) {
  let pois = tuote?.unavailable_variants;
  if (typeof pois === "string") {
    try { pois = JSON.parse(pois); } catch { pois = []; }
  }
  const poissa = new Set(Array.isArray(pois) ? pois : []);
  const idt = Object.entries(tuote?.variants?.variant_map || {}).filter(([a]) => !poissa.has(a)).map(([, id]) => id);
  const tulokset = idt.map((id) => laskeKate(tuote, id)).filter((k) => k.tunnettu);
  if (!tulokset.length) return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  return tulokset.reduce((a, b) => (b.kate < a.kate ? b : a));
}

/**
 * Paketin (useampi tuote yhdessä tilauksessa, pakettialennus) kate samalla kaavalla. Pahin tapaus: paketti on
 * tilauksen ainoa sisältö, toimitusmaksu peritään alennusta edeltävän summan mukaan (kuten kassa), ja Printifyn
 * toimituskulu lasketaan jokaiselle tuotteelle ensimmäisen kappaleen hinnalla (lisäkappaleen hintaa ei tunneta).
 * @param osat [{ tuote, varianttiId }]
 * @param alennusProsentti esim. 10
 * Palauttaa { tunnettu, nettokate, kate, sallittu }; sallittu = kate >= PAKETTI_KATE_RAJA (30 %).
 * Tuntematon kulu: tunnettu false, sallittu null.
 */
export function laskePaketinKate(osat, alennusProsentti = 0) {
  if (!Array.isArray(osat) || osat.length === 0) return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  let hinnat = 0;
  let kulut = 0;
  for (const { tuote, varianttiId } of osat) {
    const kartta = Object.entries(tuote?.variants?.variant_map || {});
    const id = varianttiId ?? kartta[0]?.[1];
    const avain = kartta.find(([, v]) => Number(v) === Number(id))?.[0];
    const hinta = Number(rivinHinta(tuote, avain ? avain.split("|")[1] : null));
    const kulu = (tuote?.variants?.costs || {})[String(id)];
    const toimitus = tuote?.variants?.shipping_cents;
    if (!Number.isFinite(hinta) || typeof kulu !== "number" || typeof toimitus !== "number") {
      return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
    }
    hinnat += hinta;
    kulut += (kulu + toimitus) / 100;
  }
  const toimitusmaksu = hinnat >= ILMAINEN_RAJA ? 0 : TOIMITUSMAKSU;
  const maksettu = hinnat * (1 - alennusProsentti / 100) + toimitusmaksu;
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const nettokate = myyntiAlv0 - kulut - stripe;
  const kate = nettokate / myyntiAlv0;
  return { tunnettu: true, nettokate: Math.round(nettokate * 100) / 100, kate: Math.round(kate * 1000) / 1000, sallittu: kate >= PAKETTI_KATE_RAJA };
}

/** Paketin heikoin kate kaikilla varianttiyhdistelmillä (näyttö: alennus luvataan vain, jos jokainen yhdistelmä täyttää säännön). */
export function paketinHeikoinKate(tuotteet, alennusProsentti = 0) {
  const listat = tuotteet.map((t) => {
    const idt = Object.values(t?.variants?.variant_map || {});
    return idt.length ? idt : [null];
  });
  let heikoin = null;
  const kayLapi = (i, valitut) => {
    if (i === tuotteet.length) {
      const k = laskePaketinKate(valitut, alennusProsentti);
      if (!k.tunnettu) heikoin = { tunnettu: false, nettokate: null, kate: null, sallittu: null };
      else if (heikoin?.tunnettu !== false && (!heikoin || k.kate < heikoin.kate)) heikoin = k;
      return;
    }
    for (const id of listat[i]) {
      if (heikoin?.tunnettu === false) return;
      kayLapi(i + 1, [...valitut, { tuote: tuotteet[i], varianttiId: id }]);
    }
  };
  kayLapi(0, []);
  return heikoin || { tunnettu: false, nettokate: null, kate: null, sallittu: null };
}

/**
 * Koko tilauksen kate alennusten jälkeen (ensitilauksen koodi). Sama kaava: maksettu = rivien maksettavat hinnat +
 * toimitusmaksu, kulut = Printifyn tuotekulu + Suomen toimituskulu jokaiselle kappaleelle (lisäkappaleen halvempaa
 * toimitusta ei tunneta, joten arvio on varovainen).
 * @param osat [{ tuote, varianttiId, maara, yksikkohinta }] yksikkohinta euroina alennuksen jälkeen
 * @param toimitusmaksu asiakkaan maksama toimitus euroina
 * Palauttaa { tunnettu, nettokate, kate, sallittu } (sallittu = kate >= raja, oletus ALENNUS_KATE_RAJA).
 */
export function laskeTilauksenKate(osat, toimitusmaksu = 0, raja = ALENNUS_KATE_RAJA) {
  if (!Array.isArray(osat) || osat.length === 0) return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
  let maksettu = toimitusmaksu;
  let kulut = 0;
  for (const { tuote, varianttiId, maara = 1, yksikkohinta } of osat) {
    const id = varianttiId ?? Object.values(tuote?.variants?.variant_map || {})[0];
    const kulu = (tuote?.variants?.costs || {})[String(id)];
    const toimitus = tuote?.variants?.shipping_cents;
    if (typeof kulu !== "number" || typeof toimitus !== "number" || !Number.isFinite(Number(yksikkohinta))) {
      return { tunnettu: false, nettokate: null, kate: null, sallittu: null };
    }
    maksettu += Number(yksikkohinta) * maara;
    kulut += ((kulu + toimitus) / 100) * maara;
  }
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const nettokate = myyntiAlv0 - kulut - stripe;
  const kate = myyntiAlv0 > 0 ? nettokate / myyntiAlv0 : -1;
  return { tunnettu: true, nettokate: Math.round(nettokate * 100) / 100, kate: Math.round(kate * 1000) / 1000, sallittu: kate >= raja };
}

/**
 * Printifyn toimituskulu tilaukselle (sentit). Printify veloittaa painotaloittain: kunkin painotalon kalleimman
 * ensimmäisen kappaleen hinta (variants.shipping_cents) ja muille saman painotalon kappaleille lisäkappaleen hinta
 * (variants.shipping_additional_cents). Tuote, jolta puuttuu painotalo (variants.print_provider_id) tai lisäkappaleen
 * hinta, lasketaan varovaisesti: jokainen kappale ensimmäisen kappaleen hinnalla omana lähetyksenään.
 * @param osat [{ tuote, maara }]
 * Palauttaa sentit tai null, jos jonkin tuotteen toimituskulua ei tunneta.
 */
/**
 * Printifyn Suomen toimitus pohjatuotteen ja painotalon mukaan (sentit, GET catalog/blueprints/<b>/print_providers/<p>/
 * shipping.json, 29.10.2026). Täydentää tuoterivit, joilta puuttuu print_provider_id tai shipping_additional_cents
 * (304/391 t-paitaa 29.10.2026): muuten jokainen kappale laskettaisiin omana lähetyksenään.
 */
export const PRINTIFY_TOIMITUS_FI = {
  "145/30": { eka: 849, lisa: 119 },
  "6/30": { eka: 849, lisa: 119 },
  "77/26": { eka: 1089, lisa: 239 },
  "77/402": { eka: 1089, lisa: 239 },
  "443/30": { eka: 929, lisa: 199 },
  "476/30": { eka: 559, lisa: 10 },
  "531/59": { eka: 949, lisa: 199 },
};

export function printifyToimitusSentit(osat) {
  const ryhmat = new Map();
  let erikseen = 0;
  for (const { tuote, maara = 1 } of osat) {
    const v = tuote?.variants || {};
    const eka = v.shipping_cents;
    if (typeof eka !== "number") return null;
    const pohja = tuotepohja(tuote?.slug);
    const taulu = pohja ? PRINTIFY_TOIMITUS_FI[`${pohja.b}/${pohja.p}`] : undefined;
    const lisa = typeof v.shipping_additional_cents === "number" ? v.shipping_additional_cents : taulu?.lisa;
    const pp = v.print_provider_id ?? (taulu ? pohja.p : undefined);
    if (typeof lisa !== "number" || pp === undefined || pp === null) {
      erikseen += eka * maara;
      continue;
    }
    if (!ryhmat.has(pp)) ryhmat.set(pp, []);
    for (let i = 0; i < maara; i++) ryhmat.get(pp).push({ eka, lisa });
  }
  let summa = erikseen;
  for (const kappaleet of ryhmat.values()) {
    kappaleet.sort((a, b) => b.eka - a.eka);
    summa += kappaleet[0].eka + kappaleet.slice(1).reduce((s, k) => s + k.lisa, 0);
  }
  return summa;
}

/**
 * Tilauksen nettokate alennusten jälkeen todellisella Printify-toimituksella (painotaloittain ensimmäinen ja
 * lisäkappale, printifyToimitusSentit). Korialennuksen katevahti (api/_lib/korialennus.js).
 * @param osat [{ tuote, varianttiId, maara, yksikkohinta }] yksikkohinta euroina alennuksen jälkeen
 * @param toimitusmaksu asiakkaan maksama toimitus euroina
 * Palauttaa { tunnettu, nettokate, kate }.
 */
export function laskeTilauksenNettokate(osat, toimitusmaksu = 0) {
  if (!Array.isArray(osat) || osat.length === 0) return { tunnettu: false, nettokate: null, kate: null };
  let maksettu = toimitusmaksu;
  let tuotekulut = 0;
  for (const { tuote, varianttiId, maara = 1, yksikkohinta } of osat) {
    const id = varianttiId ?? Object.values(tuote?.variants?.variant_map || {})[0];
    const kulu = (tuote?.variants?.costs || {})[String(id)];
    if (typeof kulu !== "number" || !Number.isFinite(Number(yksikkohinta))) return { tunnettu: false, nettokate: null, kate: null };
    maksettu += Number(yksikkohinta) * maara;
    tuotekulut += kulu * maara;
  }
  const toimitus = printifyToimitusSentit(osat);
  if (toimitus === null) return { tunnettu: false, nettokate: null, kate: null };
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const nettokate = myyntiAlv0 - (tuotekulut + toimitus) / 100 - stripe;
  return {
    tunnettu: true,
    nettokate: Math.round(nettokate * 100) / 100,
    kate: myyntiAlv0 > 0 ? Math.round((nettokate / myyntiAlv0) * 1000) / 1000 : -1,
  };
}
