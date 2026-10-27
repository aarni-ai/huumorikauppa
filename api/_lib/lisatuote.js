/**
 * Ilmaisen toimituksen mittarin lisätuote (28.10.2026, KATTEET.md "Ilmaisen toimituksen mittari ja lisätuote").
 * Puhdas moduuli: ostoskori (selain, src/lib/lisatarra.ts) käyttää samaa laskentaa kuin kassa.
 *
 * Kun korin fyysisten tuotteiden summa jää alle ilmaisen toimituksen rajan (vakiot.js), ehdotetaan yhtä lisätuotetta,
 * joka kuroo puuttuvan summan parhaiten umpeen. Ehdokkaat: tarrat (ei personoitavia) ja julisteet (seinataulut, slug
 * päättyy -juliste-poster). Mukit eivät ole koskaan ehdokkaita (piilotettu kategoria tai mukin tunniste).
 *
 * Katevahti: ehdotus tehdään vain, jos koko korin nettokate lisätuotteen kanssa on yli LISATUOTE_MIN_KATE_EUROA.
 * Laskenta kuten kassa (api/_lib/kassa.js): toimitusmaksu alennusta edeltävästä summasta, pakettialennus, kahden
 * tuotteen alennus (korialennus.js, myös sen oma katevahti) ja Printifyn toimitus painotaloittain
 * (kate.js laskeTilauksenNettokate). Tuntematon kulu: ei ehdotusta.
 *
 * Hupparisääntö (src/lib/lisatarra.ts, KATTEET.md "Tarran lisämyynti"): hupparikoriin ei ehdoteta tarraa.
 */
import { laskeTilauksenNettokate } from "./kate.js";
import { rivinHinta } from "./kokohinnat.js";
import { ILMAINEN_TOIMITUS_RAJA, TOIMITUS } from "./vakiot.js";
import { sovellaPaketit, teemaRunko, onPersonoitava } from "./paketit.js";
import { sovellaKorialennus, kalleinVariantti } from "./korialennus.js";
import { onLahjakortti } from "./lahjakortti.js";
import { onPiilotettuTuote } from "./piilotetut.js";

/** Korin nettokatteen alaraja euroina lisätuotteen kanssa (ehdotus vain, jos kate on tätä suurempi). */
export const LISATUOTE_MIN_KATE_EUROA = 0;
/** Kategoriat, joista lisätuote valitaan. */
export const LISATUOTE_KATEGORIAT = ["tarrat", "seinataulut"];
/** Tarraa ei ehdoteta koriin, jossa on jokin näistä (hupparisääntö, KATTEET.md). */
export const TARRA_EI_KATEGORIAT = ["hupparit"];

const pyorista = (x) => Math.round(x * 100) / 100;

/** Teema slugista myös julisteille ja tarroille ("tonnin-seteli-juliste-poster" -> "tonnin-seteli"). */
export function lisatuoteTeema(slug) {
  return teemaRunko(String(slug || "").toLowerCase().replace(/-(juliste-poster|tarra)$/, ""));
}
/** 2 = sama teema, 1 = osittain sama ("se-oli-tonnin-seteli" ja "tonnin-seteli"), 0 = eri. */
const teemaOsuma = (a, b) => (a === b ? 2 : a.endsWith(`-${b}`) || b.endsWith(`-${a}`) ? 1 : 0);

/** Onko tuote mittarin lisätuote-ehdokas (tarra tai juliste, ei mukia, ei personoitava, yksi variantti). */
export function onLisatuoteEhdokas(p) {
  if (!p || p.is_active === false || onPiilotettuTuote(p) || onPersonoitava(p)) return false;
  if (!(Number(p.price) > 0)) return false;
  if (Object.keys(p.variants?.variant_map || {}).length !== 1) return false;
  if (p.category === "tarrat") return true;
  return p.category === "seinataulut" && /-juliste-poster$/.test(String(p.slug || ""));
}

function rivinVariantti(p, color, size) {
  const kartta = p?.variants?.variant_map || {};
  const suora = kartta[`${(color || "").trim()}|${(size || "").trim()}`];
  return typeof suora === "number" ? suora : kalleinVariantti(p);
}

/**
 * Korin nettokate kuten kassa sen laskisi.
 * @param rivit [{ product, quantity, selectedSize?, selectedColor? }] (lahjakortit ohitetaan)
 * @param bySlug Map slug -> tuoterivi (kulut); puuttuva täydennetään rivin tuotteella
 * @param paketit pakettimääritykset (paketit-data.js)
 * Palauttaa { tunnettu, nettokate, summa, toimitus, alennus }.
 */
export function korinNettokate(rivit, bySlug, paketit = []) {
  const fyysiset = (rivit || []).filter((i) => !onLahjakortti(i));
  if (fyysiset.length === 0) return { tunnettu: false, nettokate: null, summa: 0, toimitus: 0, alennus: 0 };
  const kartta = new Map(bySlug);
  for (const i of fyysiset) if (!kartta.has(i.product.slug)) kartta.set(i.product.slug, i.product);
  const kassaRivit = fyysiset.map((i) => {
    const p = kartta.get(i.product.slug);
    return {
      slug: p.slug,
      quantity: i.quantity,
      unit_cents: Math.round(Number(rivinHinta(p, i.selectedSize)) * 100),
      variant_id: rivinVariantti(p, i.selectedColor, i.selectedSize),
    };
  });
  if (kassaRivit.some((r) => r.variant_id === null || r.variant_id === undefined || !Number.isFinite(r.unit_cents))) {
    return { tunnettu: false, nettokate: null, summa: 0, toimitus: 0, alennus: 0 };
  }
  const summa = kassaRivit.reduce((s, r) => s + r.unit_cents * r.quantity, 0) / 100;
  const toimitus = summa >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUS;
  const p = sovellaPaketit(kassaRivit, kartta, paketit);
  const k = sovellaKorialennus(p.rivit, kartta, toimitus);
  const osat = k.rivit.map((r) => ({ tuote: kartta.get(r.slug), varianttiId: r.variant_id, maara: r.quantity, yksikkohinta: r.unit_cents / 100 }));
  const kate = laskeTilauksenNettokate(osat, toimitus);
  return { tunnettu: kate.tunnettu, nettokate: kate.nettokate, summa: pyorista(summa), toimitus, alennus: pyorista(p.alennus + k.alennus) };
}

/**
 * Mittarin lisätuote. Palauttaa { product, suoraan: { size, color }, puuttuu, puuttuuJalkeen, ilmainenJalkeen,
 * nettokateEnnen, nettokateJalkeen } tai null.
 * Järjestys: ensin ehdokkaat, joilla raja ylittyy (pienin ylitys), sitten lähimmäs rajaa vievät; tasatilanteessa
 * sama teema kuin korissa, suurempi nettokate ja slug.
 * @param rivit korin rivit [{ product, quantity, selectedSize?, selectedColor? }]
 * @param tuotteet myynnissä olevat tuotteet
 * @param asetukset { paketit, minKateEuroa, suodatin } (suodatin(p): lisäehto ehdokkaalle, esim. selaimen pikalisäys)
 */
export function valitseMittarinLisatuote(rivit, tuotteet, { paketit = [], minKateEuroa = LISATUOTE_MIN_KATE_EUROA, suodatin = null } = {}) {
  const fyysiset = (rivit || []).filter((i) => !onLahjakortti(i));
  if (fyysiset.length === 0) return null;
  const bySlug = new Map((tuotteet || []).map((p) => [p.slug, p]));
  const ennen = korinNettokate(fyysiset, bySlug, paketit);
  if (!ennen.tunnettu || ennen.summa >= ILMAINEN_TOIMITUS_RAJA) return null;
  const puuttuu = pyorista(ILMAINEN_TOIMITUS_RAJA - ennen.summa);
  const korissa = new Set(fyysiset.map((i) => i.product.slug));
  const kategoriat = new Set(fyysiset.map((i) => i.product.category));
  const teemat = fyysiset.map((i) => lisatuoteTeema(i.product.slug));
  const tarraKielletty = kategoriat.has("tarrat") || TARRA_EI_KATEGORIAT.some((k) => kategoriat.has(k));

  const tulokset = [];
  for (const p of tuotteet || []) {
    if (korissa.has(p.slug) || !onLisatuoteEhdokas(p) || (suodatin && !suodatin(p))) continue;
    if (p.category === "tarrat" && tarraKielletty) continue;
    const [avain] = Object.keys(p.variants.variant_map);
    const [color, size] = avain.split("|");
    const suoraan = { color: color || undefined, size: size || undefined };
    const jalkeen = korinNettokate([...fyysiset, { product: p, quantity: 1, selectedColor: suoraan.color, selectedSize: suoraan.size }], bySlug, paketit);
    if (!jalkeen.tunnettu || !(jalkeen.nettokate > minKateEuroa)) continue;
    const hinta = Number(p.price);
    tulokset.push({
      product: p,
      suoraan,
      puuttuu,
      puuttuuJalkeen: pyorista(Math.max(0, puuttuu - hinta)),
      ilmainenJalkeen: jalkeen.summa >= ILMAINEN_TOIMITUS_RAJA,
      nettokateEnnen: ennen.nettokate,
      nettokateJalkeen: jalkeen.nettokate,
      // Rajan ylittävä ensin (pienin ylitys), muuten jäljelle jäävä summa.
      ero: hinta >= puuttuu ? hinta - puuttuu : 1000 + (puuttuu - hinta),
      samaTeema: Math.max(0, ...teemat.map((t) => teemaOsuma(t, lisatuoteTeema(p.slug)))),
    });
  }
  tulokset.sort(
    (a, b) =>
      a.ero - b.ero ||
      b.samaTeema - a.samaTeema ||
      b.nettokateJalkeen - a.nettokateJalkeen ||
      String(a.product.slug).localeCompare(String(b.product.slug)),
  );
  if (!tulokset.length) return null;
  const { ero: _ero, samaTeema: _st, ...paras } = tulokset[0];
  return paras;
}
