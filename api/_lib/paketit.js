/**
 * Paketit (t-paita + huppari samalla teemalla). Puhdas moduuli: kassa (palvelin), pakettisivut ja ostoskori (selain)
 * sekä generointiskripti (scripts/generoi-paketit.mjs) käyttävät samaa logiikkaa.
 *
 * Pakettialennus annetaan palvelimella (api/_lib/kassa.js) vain, kun paketin molemmat tuotteet ovat korissa, mitään
 * alennuskoodia ei käytetä ja paketin nettokate alennuksen jälkeen on vähintään 30 % (api/_lib/kate.js PAKETTI_KATE_RAJA). Jos Printifyn
 * kuluja ei tunneta, alennusta ei anneta.
 */
import { laskePaketinKate, paketinHeikoinKate, PAKETTI_KATE_RAJA } from "./kate.js";
import { onPiilotettu } from "./piilotetut.js";

/** Oletusalennus, jos kuluja ei tunneta generoitaessa. Kassa antaa alennuksen silti vain 30 %:n katteella. */
export const PAKETTI_ALENNUS_PROSENTTI = 10;
/** Sallitut pakettialennukset (suurin ensin): generointi valitsee suurimman, jolla paketin kate pysyy >= 30 %. */
export const PAKETTI_ALENNUKSET = [10, 9, 8, 7, 6, 5];
/** Teemat, joiden paketti on aina mukana ja ensimmäisenä (myydyimmät). */
export const KIINNITETYT_TEEMAT = ["tonnin-seteli"];

/** Tuotetyypin päätteet slugissa (pisin ensin). */
const PAATTEET = [
  "hauska-t-paita", "hauska-huppari", "hauska-kahvimuki", "kahvimuki", "t-paita", "huppari", "muki", "pipo", "lippis",
];

/** Teeman runko: slug ilman tuotetyypin päätettä ("oispa-kaljaa-t-paita" -> "oispa-kaljaa"). */
export function teemaRunko(slug) {
  const s = String(slug || "").toLowerCase();
  for (const p of PAATTEET) {
    if (s.endsWith(`-${p}`)) return s.slice(0, -(p.length + 1));
  }
  return s;
}

/** Nimen runko: "Oispa kaljaa | T-Paita" -> "Oispa kaljaa". */
export function nimiRunko(nimi) {
  return String(nimi || "").split("|")[0].replace(/\s*[\u2013\u2014]\s*/g, ", ").replace(/^,\s*|,\s*$/g, "").trim();
}

/** Onko tuote personoitava (oma teksti tai kuva): ei pakettiin eikä suosituksiin. Sama sääntö kuin src/lib/customProduct.ts. */
export function onPersonoitava(tuote) {
  const t = `${tuote?.name || ""} ${tuote?.description || ""}`.toLowerCase();
  return ["oma teksti", "omalla tekstillä", "oma kuva", "omalla kuvalla", "custom text", "custom design", "personoi", "personoitava"].some((x) => t.includes(x));
}

const PARIT = [["t-paidat", "hupparit"], ["t-paidat", "pipot"], ["hupparit", "pipot"]];
const TYYPPINIMI = { "t-paidat": "T-paita", hupparit: "Huppari", pipot: "Pipo" };

/**
 * Muodostaa paketit tuotelistasta: saman teemarungon tuotteet eri kategorioista (t-paita + huppari tai paita + pipo).
 * Järjestys: kiinnitetyt teemat (KIINNITETYT_TEEMAT) ensin, sitten suositut (is_featured) ja lahjaideat, sitten pari,
 * joka on ollut myynnissä pisimpään (parin uudemman tuotteen luontipäivä), lopuksi slug. Palauttaa enintään n.
 */
export function muodostaPaketit(tuotteet, n = 20, alennus = PAKETTI_ALENNUS_PROSENTTI, { kiinnitetyt = KIINNITETYT_TEEMAT } = {}) {
  const ryhmat = new Map();
  for (const p of tuotteet) {
    if (p.is_active === false || onPiilotettu(p.category) || onPersonoitava(p)) continue;
    // Tuotetyyppi slugista ja kategoriasta: vääriin kategorioihin tallennetut (esim. "-muki" t-paidoissa) ohitetaan.
    const runko = teemaRunko(p.slug);
    if (runko === p.slug) continue;
    const tyyppi = p.slug.slice(runko.length + 1);
    const odotettu = { "t-paidat": /t-paita$/, hupparit: /huppari$/, pipot: /(pipo|lippis)$/ }[p.category];
    if (!odotettu || !odotettu.test(tyyppi)) continue;
    if (!ryhmat.has(runko)) ryhmat.set(runko, new Map());
    const r = ryhmat.get(runko);
    if (!r.has(p.category)) r.set(p.category, p);
  }
  const paketit = [];
  for (const [runko, kategoriat] of ryhmat) {
    for (const [a, b] of PARIT) {
      const pa = kategoriat.get(a);
      const pb = kategoriat.get(b);
      if (!pa || !pb) continue;
      const pisteet = (kiinnitetyt.includes(runko) ? 100 : 0) +
        (pa.is_featured ? 2 : 0) + (pb.is_featured ? 2 : 0) + (pa.is_gift_idea ? 1 : 0) + (pb.is_gift_idea ? 1 : 0);
      const vanhin = [pa.created_at, pb.created_at].filter(Boolean).sort()[1] || "";
      paketit.push({
        slug: `${runko}-${TYYPPINIMI[a].toLowerCase()}-ja-${TYYPPINIMI[b].toLowerCase()}`,
        nimi: `${nimiRunko(pa.name)}: ${TYYPPINIMI[a]} ja ${TYYPPINIMI[b].toLowerCase()}`,
        teema: runko,
        tuotteet: [pa.slug, pb.slug],
        alennus_prosentti: alennus,
        _pisteet: pisteet,
        _vanhin: vanhin,
      });
    }
  }
  paketit.sort((x, y) => y._pisteet - x._pisteet || x._vanhin.localeCompare(y._vanhin) || x.slug.localeCompare(y.slug));
  return paketit.slice(0, n).map(({ _pisteet, _vanhin, ...p }) => p);
}

/**
 * Paketin alennus kuluista: suurin PAKETTI_ALENNUKSET-arvo, jolla paketin heikoin kate (kaikki varianttiyhdistelmät)
 * on vähintään PAKETTI_KATE_RAJA. Palauttaa { alennus, kate } tai { alennus: null, kate, syy }, jos mikään ei riitä tai
 * kuluja ei tunneta.
 */
export function valitsePakettialennus(tuotteetParissa, alennukset = PAKETTI_ALENNUKSET) {
  for (const a of alennukset) {
    const k = paketinHeikoinKate(tuotteetParissa, a);
    if (!k.tunnettu) return { alennus: null, kate: null, syy: "Printifyn kulut tuntemattomat" };
    if (k.sallittu) return { alennus: a, kate: k.kate };
  }
  const pienin = Math.min(...alennukset);
  const k = paketinHeikoinKate(tuotteetParissa, pienin);
  return {
    alennus: null, kate: k.kate,
    syy: `kate ${pienin} %:n alennuksella ${(k.kate * 100).toFixed(1).replace(".", ",")} %, raja ${Math.round(PAKETTI_KATE_RAJA * 100)} %`,
  };
}

/**
 * Pakettialennus kassariveille. Rivit: [{ slug, quantity, unit_price, variant_id, ... }] (vain fyysiset tuotteet).
 * Jakaa rivit niin, että paketteihin kuuluvat kappaleet ovat omina riveinään (paketti, paketti_alennus_prosentti,
 * unit_cents alennettu). Pari muodostetaan vain, jos sen kate alennuksen jälkeen on vähintään 30 %.
 * Palauttaa uudet rivit (alkuperäiset ennallaan) ja annetun alennuksen euroina.
 * @param rivit kassan rivit (unit_cents sentteinä)
 * @param tuotteetSlugilla Map slug -> tuoterivi (kulut)
 * @param paketit pakettimääritykset
 */
export function sovellaPaketit(rivit, tuotteetSlugilla, paketit) {
  // Kappaleet: { rivi, paketti }
  const vapaat = rivit.map((r) => r.quantity);
  const varatut = rivit.map(() => new Map()); // rivi-indeksi -> Map(pakettiSlug -> kpl)
  let alennusSentteina = 0;
  for (const paketti of paketit || []) {
    const [sa, sb] = paketti.tuotteet;
    const pros = Number(paketti.alennus_prosentti) || 0;
    if (paketti.kaytossa === false || pros <= 0 || pros >= 50) continue;
    const ta = tuotteetSlugilla.get(sa);
    const tb = tuotteetSlugilla.get(sb);
    if (!ta || !tb) continue;
    for (let i = 0; i < rivit.length; i++) {
      if (rivit[i].slug !== sa) continue;
      for (let j = 0; j < rivit.length; j++) {
        if (rivit[j].slug !== sb) continue;
        const kate = laskePaketinKate([{ tuote: ta, varianttiId: rivit[i].variant_id }, { tuote: tb, varianttiId: rivit[j].variant_id }], pros);
        if (!kate.tunnettu || !kate.sallittu) continue;
        const parit = Math.min(vapaat[i], vapaat[j]);
        if (parit <= 0) continue;
        vapaat[i] -= parit;
        vapaat[j] -= parit;
        for (const k of [i, j]) {
          const m = varatut[k];
          m.set(paketti.slug, { kpl: (m.get(paketti.slug)?.kpl || 0) + parit, pros });
        }
      }
    }
  }
  const uudet = [];
  rivit.forEach((r, i) => {
    for (const [slug, { kpl, pros }] of varatut[i]) {
      const alennettu = Math.round(r.unit_cents * (1 - pros / 100));
      alennusSentteina += (r.unit_cents - alennettu) * kpl;
      uudet.push({ ...r, quantity: kpl, unit_cents: alennettu, paketti: slug, paketti_alennus_prosentti: pros });
    }
    if (vapaat[i] > 0) uudet.push({ ...r, quantity: vapaat[i] });
  });
  return { rivit: uudet, alennus: alennusSentteina / 100 };
}
