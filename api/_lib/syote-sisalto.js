/**
 * Merchant-syötteen hakusisältö (28.10.2026): otsikko, kuvaus, product_type, google_product_category (numeerinen
 * Googlen taksonomia-ID) ja material tuoterivistä. Ajetaan api/product-feed.js:ssä viimeisenä vaiheena
 * (korjaaSyote-vaiheen jälkeen), joten aiemmat vaiheet näkevät yhä kategoriapolut.
 *
 * Otsikko etupainotteisesti sillä, mitä haetaan (Googlen automaattiehdotukset 28.10.2026: "hauska t paita isälle",
 * "lahja eläkeläiselle", "pikkujoululahja", "hauska joulupaita", "40v lahja", "hauska lahja työkaverille"):
 *   "{tuotetyyppi} {kenelle}: {painoteksti}"   esim. "Hauska t-paita isälle: En nuku. Lepuutan silmiä"
 * Otsikko tulee api/_lib/hakuotsikko.js:stä (2.11.2026, jaettu tuotesivun title-tagin kanssa), alle 70 merkkiä.
 * Ei mainostekstiä, ei versaaleja, ei emojeja. Kuvaus 500-1500 merkkiä ilman ajatusviivoja
 * ja ilman toimitus-, hinta- tai palautusmainintoja. Materiaali vain, jos tuotteen oma kuvaus kertoo sen.
 * Tarkistus: scripts/validoi-syote.mjs, testit src/test/syote-sisalto.test.ts.
 */
import { saatavatKoot } from "./syote-korjaukset.js";
import { POHJAT, syoteMateriaali, tuotepohja } from "./materiaali.js";

/** Kaupan kategoria -> Googlen taksonomia-ID (taxonomy-with-ids.en-US.txt, versio 2021-09-21). */
export const GOOGLE_KATEGORIA_ID = {
  "t-paidat": 212, // Apparel & Accessories > Clothing > Shirts & Tops
  hupparit: 212, // vetoketjuton huppari on paita, ei takki (Coats & Jackets 5598)
  pitkahihaiset: 212,
  bodyt: 5411, // ... > Baby & Toddler Clothing > Baby One-Pieces
  mukit: 2169, // Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs
  tarrat: 4054, // ... > Embellishments & Trims > Decorative Stickers
  seinataulut: 500044, // Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork
  peitot: 1985, // Home & Garden > Linens & Bedding > Bedding > Blankets
  pipot: 173, // Apparel & Accessories > Clothing Accessories > Hats
  laukut: 6551, // Apparel & Accessories > Handbags, Wallets & Cases
  koristeet: 3144, // Home & Garden > Decor > Seasonal & Holiday Decorations > Holiday Ornaments
  housut: 204, // Apparel & Accessories > Clothing > Pants
};

/** Syötteessä käytetyt ID:t -> polku (validaattori tarvitsee polun vaatekenttien sääntöihin ilman verkkoa). */
export const GOOGLE_KATEGORIAT = {
  212: "Apparel & Accessories > Clothing > Shirts & Tops",
  5411: "Apparel & Accessories > Clothing > Baby & Toddler Clothing > Baby One-Pieces",
  2169: "Home & Garden > Kitchen & Dining > Tableware > Drinkware > Mugs",
  4054: "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Embellishments & Trims > Decorative Stickers",
  500044: "Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork",
  1985: "Home & Garden > Linens & Bedding > Bedding > Blankets",
  173: "Apparel & Accessories > Clothing Accessories > Hats",
  6551: "Apparel & Accessories > Handbags, Wallets & Cases",
  3144: "Home & Garden > Decor > Seasonal & Holiday Decorations > Holiday Ornaments",
  204: "Apparel & Accessories > Clothing > Pants",
  5598: "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets",
};

const TYYPIT = {
  "t-paidat": { nimi: "Hauska t-paita", joulu: "Hauska joulupaita", ryhma: "Vaatteet > T-paidat > Hauskat t-paidat", sana: "t-paita" },
  hupparit: { nimi: "Hauska huppari", joulu: "Hauska jouluhuppari", ryhma: "Vaatteet > Hupparit > Hauskat hupparit", sana: "huppari" },
  pitkahihaiset: { nimi: "Hauska pitkähihainen paita", ryhma: "Vaatteet > Pitkähihaiset > Hauskat pitkähihaiset", sana: "paita" },
  bodyt: { nimi: "Hauska vauvan body", ryhma: "Vauvat > Bodyt > Hauskat bodyt", sana: "body" },
  mukit: { nimi: "Hauska muki", ryhma: "Keittiö > Mukit > Hauskat mukit", sana: "muki" },
  tarrat: { nimi: "Hauska tarra", ryhma: "Tarrat > Hauskat tarrat", sana: "tarra" },
  seinataulut: { nimi: "Hauska juliste", joulu: "Hauska joulujuliste", ryhma: "Sisustus > Julisteet > Hauskat julisteet", sana: "juliste" },
  peitot: { nimi: "Hauska viltti", ryhma: "Sisustus > Viltit > Hauskat viltit", sana: "viltti" },
  pipot: { nimi: "Hauska pipo", ryhma: "Asusteet > Pipot > Hauskat pipot", sana: "pipo" },
  laukut: { nimi: "Hauska kangaskassi", ryhma: "Asusteet > Laukut > Hauskat laukut", sana: "kassi" },
  koristeet: { nimi: "Hauska joulukoriste", ryhma: "Sisustus > Joulukoristeet > Hauskat joulukoristeet", sana: "koriste" },
  housut: { nimi: "Hauskat housut", ryhma: "Vaatteet > Housut > Hauskat housut", sana: "housut" },
};
const OLETUSTYYPPI = { nimi: "Hauska lahja", ryhma: "Lahjat > Hauskat lahjat", sana: "tuote" };
const VAATE = new Set(["t-paidat", "hupparit", "pitkahihaiset", "bodyt", "pipot", "housut"]);

import { aihe, puraNimi, siistiTeksti, hakuotsikko } from "./hakuotsikko.js";

export { aihe, puraNimi, siistiTeksti };

const tyyppi = (p) => TYYPIT[p?.category] || OLETUSTYYPPI;

/**
 * Otsikko (2.11.2026): hakulause ja painoteksti, esim. "Hauska t-paita isälle: En nuku. Lepuutan silmiä". Logiikka on
 * jaetussa api/_lib/hakuotsikko.js:ssä (sama kuin tuotesivun title), alle 70 merkkiä.
 */
export const syoteOtsikko = hakuotsikko;

/**
 * Materiaali Printifyn pohjatuotteesta ja väreistä (api/_lib/materiaali.js), muuten tuotteen omasta kuvauksesta
 * (ei arvata): "puuvilla", "puuvilla/polyesteri", "paperi" tai null. Värikohtaisesti vaihteleva jää pois.
 */
export function materiaali(p) {
  const pohjasta = syoteMateriaali(p?.slug);
  if (pohjasta) return pohjasta;
  const pohja = tuotepohja(p?.slug);
  if (pohja && POHJAT[pohja.b]?.luokat) return null;
  const d = String(p?.description || "");
  if (/50\s?%\s?puuvillaa\s*(?:\/|ja)\s*50\s?%\s?polyester|50\/50\s*puuvilla-polyester/i.test(d)) return "puuvilla/polyesteri";
  if (/100\s?%\s?(?:luomu)?puuvillaa/i.test(d)) return "puuvilla";
  if (p?.category === "seinataulut" && /\bpaperi/i.test(d)) return "paperi";
  return null;
}

const PROMO_LAUSE = /ilmai|toimitu|toimitet|€|\beur\b|hinta|hintaan|palautu|alennu|tarjou|\bale\b|kampanja|osta nyt|tilaa nyt|USA:n/i;

/** Tuoterivin oma kuvaus siistittynä: ominaisuus-/hoito-osio pois, mainoslauseet pois, ei ajatusviivoja. */
export function siistiKuvaus(desc) {
  let d = String(desc || "")
    .split(/Tuotteen ominaisuudet|Hoito-ohjeet/)[0]
    .replace(/\s*#[\p{L}_]+:[^\s<]+/gu, "")
    .replace(/([\p{Ll}0-9)])([.!?])(\p{Lu})/gu, "$1$2 $3")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  const lauseet = d.match(/[^.!?]+(?:[.!?]+|$)/g) || [];
  return lauseet.map((l) => l.trim()).filter((l) => l && !PROMO_LAUSE.test(l) && !/^Hauska tuote Huumorikaupasta/i.test(l)).join(" ").replace(/,\s*,/g, ",").trim();
}

const luettelo = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ja ${xs[xs.length - 1]}`);

/** Kuvaus 500-1500 merkkiä: painoteksti, tuotetyyppi, oma kuvaus, lahjalause, koot/värit/materiaali, valmistus. */
export function syoteKuvaus(p) {
  const a = aihe(p);
  const t = tyyppi(p);
  const teksti = siistiTeksti(a.teksti) || siistiTeksti(p.name);
  const otsikkoNimi = (a.joulu && t.joulu ? t.joulu : t.nimi).replace(/^Hauska(t)?/, a.personoitava ? "Personoitava" : "Hauska$1");
  const osat = [];
  osat.push(`${otsikkoNimi}${a.kenelle ? ` ${a.kenelle}` : ""}, jossa on painatuksena teksti "${teksti.replace(/"/g, "")}".`);
  // Oma kuvaus ilman alun painotekstin toistoa (painoteksti on jo edellisessä lauseessa).
  let oma = siistiKuvaus(p.description);
  const alku = teksti.replace(/[.!?]+$/, "").toLowerCase();
  if (alku && oma.toLowerCase().startsWith(alku)) oma = oma.slice(alku.length).replace(/^[.!?,:;\s]+/, "");
  oma = oma.charAt(0).toUpperCase() + oma.slice(1);
  if (oma && oma.length > 20) osat.push(oma.length > 700 ? `${oma.slice(0, 700).replace(/[^.!?]*$/, "").trim() || oma.slice(0, 700)}` : oma);
  osat.push(a.lause);
  if (VAATE.has(p.category)) {
    const koot = saatavatKoot(p.slug, p.variants);
    const varit = (Array.isArray(p.variants?.colors) ? p.variants.colors : []).map((v) => String(v).toLowerCase());
    const mat = materiaali(p);
    const malli = p.category === "bodyt" ? "Vauvan body" : "Unisex-malli, joka sopii sekä miehille että naisille";
    osat.push(`${malli}${mat ? `, materiaali ${mat === "puuvilla" ? "puuvilla" : "puuvilla ja polyesteri"}` : ""}.`);
    if (koot.length) osat.push(`Saatavilla koot ${luettelo(koot)}.`);
    if (varit.length) osat.push(varit.length > 8 ? `Värivaihtoehtoja on ${varit.length}, esimerkiksi ${luettelo(varit.slice(0, 6))}.` : `Värit: ${luettelo(varit)}.`);
  }
  osat.push(`Jokainen ${t.sana} painetaan tilauksesta Euroopassa ja toimitetaan Suomeen.`);
  osat.push(`Huumorikauppa.fi on suomalainen verkkokauppa, jonka hauskat t-paidat, hupparit ja julisteet on tehty suomalaisella huumorilla.`);
  let d = osat.join(" ");
  if (d.length < 500 && VAATE.has(p.category)) d += " Pese nurin käännettynä enintään 30 asteessa, niin painatus pysyy pitkään hyvänä.";
  if (d.length < 500) d += ` Valitse ${t.sana} lahjaksi tai itsellesi, kun haluat tuoda arkeen hymyn ja hyvän puheenaiheen.`;
  if (d.length < 500) d += ` Tuote valmistetaan vasta tilauksen jälkeen, joten turhaa varastoa ei synny.`;
  if (d.length < 500) d += ` Tuotekuvat näyttävät, miltä painatus näyttää valmiissa tuotteessa.`;
  d = d.replace(/[–—]/g, ",").replace(/\s+/g, " ").trim();
  if (d.length > 1500) d = d.slice(0, 1500).replace(/[^.!?]*$/, "").trim();
  return d;
}

export function tuotetyyppi(p) {
  return `${tyyppi(p).ryhma} > ${aihe(p).taso}`;
}

const enc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Asettaa kentän (korvaa olemassa olevan tai lisää ennen </item>). */
function aseta(item, nimi, arvo) {
  if (arvo == null || arvo === "") return item;
  const rivi = `<g:${nimi}>${enc(arvo)}</g:${nimi}>`;
  const re = new RegExp(`<g:${nimi}>[^<]*</g:${nimi}>`);
  return re.test(item) ? item.replace(re, () => rivi) : item.replace(/\s*<\/item>$/, () => `\n      ${rivi}\n    </item>`);
}

/** Yhden <item>-lohkon hakusisältö tuoterivistä. Ilman riviä lohko palautetaan sellaisenaan. */
export function sisallotaItem(item, p) {
  if (!p) return item;
  let out = item;
  out = aseta(out, "title", syoteOtsikko(p));
  out = aseta(out, "description", syoteKuvaus(p));
  out = aseta(out, "product_type", tuotetyyppi(p));
  const id = GOOGLE_KATEGORIA_ID[p.category];
  if (id) out = aseta(out, "google_product_category", String(id));
  const mat = materiaali(p);
  if (mat) out = aseta(out, "material", mat);
  return out;
}

/** @param tuotteet Map tuote-id -> tuoterivi (name, slug, category, description, variants) */
export function sisallotaSyote(xml, tuotteet = new Map()) {
  return xml.replace(/<item>[\s\S]*?<\/item>/g, (item) => {
    const id = (item.match(/<g:id>([^<]*)<\/g:id>/) || [])[1];
    return sisallotaItem(item, tuotteet.get(id) || null);
  });
}
