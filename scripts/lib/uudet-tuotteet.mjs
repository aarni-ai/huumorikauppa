/**
 * Uusien tekstituotteiden luonti Printifyyn EU-painotaloille: puhdas logiikka ja luontivirta. CLI:
 * scripts/printify-uudet-tuotteet.mjs, testit src/test/uudet-tuotteet.test.ts.
 *
 * - Listat: data/uudet-tuotteet/*.json ({ nimi, enimmaishinta, oletukset, tuotteet: [...] }), parseLista.
 * - Kohde: blueprint nimellä katalogista, painotalo EU-maasta (eu-painotalot.mjs), variantit pyydetyistä väreistä ja
 *   koista, ratkaiseKohde.
 * - Hinta: pienin x,90 €, jolla nettokate >= 40 % (api/_lib/kate.js) suunnitellulla toimitusmaksulla, ei koskaan alle
 *   kategorian pohjahinnan (printify-sync.ts KATEGORIAN_POHJAHINNAT), hinnoittele.
 * - Idempotenssi: data/uudet-tuotteet/luotu-<pvm>.json, avain = tyyppi + teksti.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  SIIRTOSAANNOT, normalisoi, vaihtoehto, variantinOsat, valitsePainotalo, onEU, painotalonMaa, blueprintTeksti, suomenToimitus,
} from "./eu-painotalot.mjs";
import { laskeKate, KATE_RAJA } from "../../api/_lib/kate.js";
import { onPiilotettuTuote } from "../../api/_lib/piilotetut.js";
import { KATEGORIAN_POHJAHINNAT, buildProductRow } from "../../supabase/functions/_shared/printify-sync.ts";

/** Suunniteltu toimitusmaksu (oletus). Kauppa perii nyt 6,90 € ja ilmainen toimitus alkaa 79 €:sta (api/_lib/vakiot.js). */
export const SUUNNITELTU_TOIMITUSMAKSU = 5.9;
export const SUUNNITELTU_ILMAINEN_RAJA = 60;
export { KATEGORIAN_POHJAHINNAT, KATE_RAJA };

const saanto = (kategoria) => SIIRTOSAANNOT.find((s) => s.kategoria === kategoria && !s.lahdePainotalo) || SIIRTOSAANNOT.find((s) => s.kategoria === kategoria);

/**
 * Tuotetyypit. blueprint.nimi = tarkka katalogin nimi (varalla osamerkkijono), blueprint.sisaltaa = kaikkien osien
 * on löydyttävä "title brand model" -tekstistä (kuten eu-painotalot.mjs). suositut = painotalot nimellä
 * suosituimmasta alkaen (paidat ja koristeet samat kuin EU-siirron säännöissä). asettelu = tekstin osuus
 * painoalueesta (ylä = lohkon yläreuna, null = keskitetty). oletusAlue = painoalue, jos katalogi ei kerro kokoa.
 */
export const TUOTETYYPIT = {
  "t-paita": {
    nimi: "T-paita", kategoria: "t-paidat", tagi: "T-paita",
    blueprint: { sisaltaa: saanto("t-paidat")?.blueprint?.sisaltaa || ["gildan", "64000"] },
    suositut: [saanto("t-paidat")?.painotalo || "OPT OnDemand"],
    oletusVarit: ["Black"], oletusKoot: ["S", "M", "L", "XL", "2XL"],
    asettelu: { leveys: 0.62, korkeus: 0.3, yla: 0.08 }, oletusAlue: { width: 3600, height: 4800 },
  },
  huppari: {
    nimi: "Huppari", kategoria: "hupparit", tagi: "Huppari",
    blueprint: { sisaltaa: ["gildan", "18500"] },
    suositut: ["Textildruck Europa", "OPT OnDemand"],
    oletusVarit: ["Black"], oletusKoot: ["S", "M", "L", "XL", "2XL"],
    asettelu: { leveys: 0.6, korkeus: 0.3, yla: 0.06 }, oletusAlue: { width: 3600, height: 3600 },
  },
  tarra: {
    nimi: "Tarra", kategoria: "tarrat", tagi: "Tarra",
    blueprint: { nimi: "Kiss-Cut Stickers" },
    suositut: [],
    oletusVarit: [], oletusKoot: ["3x3", "4x4"], tekstivari: "#111111",
    asettelu: { leveys: 0.88, korkeus: 0.8, yla: null }, oletusAlue: { width: 1200, height: 1200 },
  },
  koriste: {
    nimi: "Joulukoriste", kategoria: "koristeet", tagi: "Koriste",
    blueprint: { sisaltaa: saanto("koristeet")?.blueprint?.sisaltaa || ["ceramic ornament"] },
    suositut: [saanto("koristeet")?.painotalo || "Harrier"],
    oletusVarit: [], oletusKoot: ["Circle|Round"], tekstivari: "#111111",
    asettelu: { leveys: 0.64, korkeus: 0.5, yla: null }, oletusAlue: { width: 1200, height: 1200 },
  },
};

// ---------- Tekstit ----------

export const VIIVA = /[–—]/; // en- ja em-viiva
/** Samat väitteet kuin src/lib/productCopy.ts FALSE_CLAIM_SENTENCE: kauppa poistaa ne kuvauksista. */
export const VAARA_VAITE = /painettu eu:ssa|painettu suomessa|painetaan suomessa|yli 60 €|\bmuki|mukissa|kahvimuki/i;

export const euroa = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;
export const prosenttia = (x) => `${(x * 100).toFixed(1).replace(".", ",")} %`;

/** "19,90" | "19.90" | 19.9 -> 19.9; tyhjä -> null; muu -> NaN. */
export function lukuEuroina(x) {
  if (x === null || x === undefined || x === "") return null;
  const n = typeof x === "number" ? x : Number(String(x).replace(",", ".").replace(/\s|€/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : NaN;
}

/** Painorivit otsikkotekstiksi: pienillä, iso alkukirjain lauseen alussa, ei loppupistettä. */
export function otsikkoTeksti(rivit) {
  const t = rivit.map((r) => r.trim()).join(" ").replace(/\s+/g, " ").toLocaleLowerCase("fi");
  return t.replace(/(^|[.!?]\s+)(\p{L})/gu, (_, a, b) => a + b.toLocaleUpperCase("fi")).replace(/[.]+$/, "");
}

export function slugiksi(s) {
  return String(s).toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

/** {avain}-paikat arvoilla; tuntematon paikka on virhe. */
export function taytaPohja(pohja, arvot) {
  const puuttuvat = [];
  const tulos = String(pohja).replace(/\{(\w+)\}/g, (m, k) => {
    if (!(k in arvot)) { puuttuvat.push(k); return m; }
    return arvot[k];
  });
  if (puuttuvat.length) throw new Error(`tuntematon paikka pohjassa: {${puuttuvat.join("}, {")}}`);
  return tulos.replace(/\s+/g, " ").trim();
}

export const idempotenssiAvain = (tyyppi, rivit) => `${tyyppi}|${normalisoi(rivit.join(" "))}`;

/** Kaupan kategoria tuotteelle samalla logiikalla kuin tuonti (buildProductRow). */
export function kaupanKategoria({ title, tags, description }) {
  return buildProductRow({ id: "x", title, tags, description, variants: [] }, [])?.category ?? null;
}

/**
 * Lista JSONista. Kelpaa { nimi, enimmaishinta, oletukset, tuotteet: [...] } tai pelkkä taulukko.
 * Tuotteen kentät: rivit (painoteksti), tyyppi (t-paita | huppari | tarra | koriste), varit, koot, hinta (ohitus),
 * tagit, kategoria (teema, lisätään tagiksi), otsikko- ja kuvauspohja ({teksti}, {tuote}, {tuote_pienella}, {kategoria}),
 * otsikkoteksti (valinnainen, korvaa riveistä tehdyn). Palauttaa { nimi, enimmaishinta, tuotteet, virheet }.
 */
export function parseLista(json, { tiedosto = "lista" } = {}) {
  const lista = Array.isArray(json) ? { tuotteet: json } : json || {};
  const virheet = [];
  const enimmaishinta = lukuEuroina(lista.enimmaishinta);
  if (Number.isNaN(enimmaishinta)) virheet.push(`${tiedosto}: enimmaishinta ei ole luku`);
  if (!Array.isArray(lista.tuotteet)) return { nimi: lista.nimi || tiedosto, enimmaishinta: null, tuotteet: [], virheet: [...virheet, `${tiedosto}: tuotteet puuttuu`] };
  const oletukset = lista.oletukset || {};
  const tuotteet = [];
  const avaimet = new Set();
  lista.tuotteet.forEach((raaka, i) => {
    const e = { ...oletukset, ...raaka };
    const nimi = `${tiedosto} #${i + 1}`;
    const omat = [];
    const rivit = Array.isArray(e.rivit) ? e.rivit.map((r) => String(r ?? "").trim()).filter(Boolean) : [];
    if (!rivit.length) omat.push("rivit puuttuu");
    if (rivit.length > 6) omat.push("enintään 6 riviä");
    if (rivit.some((r) => r.length > 40)) omat.push("rivi yli 40 merkkiä");
    const tyyppi = TUOTETYYPIT[e.tyyppi];
    if (!tyyppi) omat.push(`tuntematon tyyppi "${e.tyyppi}" (t-paita, huppari, tarra, koriste)`);
    const hinta = lukuEuroina(e.hinta);
    if (Number.isNaN(hinta)) omat.push(`hinta "${e.hinta}" ei ole luku`);
    const listaksi = (x) => (Array.isArray(x) ? x : x ? [x] : []).map((s) => String(s).trim()).filter(Boolean);
    const varit = e.varit === undefined ? tyyppi?.oletusVarit || [] : listaksi(e.varit);
    const koot = e.koot === undefined ? tyyppi?.oletusKoot || [] : listaksi(e.koot);
    const kategoria = String(e.kategoria || "").trim();
    let otsikko = "", kuvaus = "";
    if (tyyppi && rivit.length) {
      const arvot = { teksti: String(e.otsikkoteksti || otsikkoTeksti(rivit)), tuote: tyyppi.nimi, tuote_pienella: tyyppi.nimi.toLocaleLowerCase("fi"), kategoria };
      try {
        if (!String(e.otsikko || "{teksti} | {tuote}").includes("{teksti}")) omat.push("otsikkopohjasta puuttuu {teksti}");
        otsikko = taytaPohja(e.otsikko || "{teksti} | {tuote}", arvot);
        kuvaus = taytaPohja(e.kuvaus || "{teksti}. Hauska {tuote} Huumorikaupasta.", arvot);
      } catch (err) { omat.push(err.message); }
    }
    const tagit = [...new Set([tyyppi?.tagi, kategoria, ...listaksi(e.tagit)].filter(Boolean))].slice(0, 13);
    for (const [kentta, arvo] of [["rivit", rivit.join(" ")], ["otsikko", otsikko], ["kuvaus", kuvaus], ["tagit", tagit.join(" ")]]) {
      if (VIIVA.test(arvo)) omat.push(`${kentta}: ajatusviiva (en- tai em-viiva) ei sallittu`);
    }
    if (VAARA_VAITE.test(kuvaus)) omat.push("kuvauksessa väite, jonka kauppa poistaa (painopaikka, 60 €, muki)");
    if (otsikko.length > 140) omat.push("otsikko yli 140 merkkiä");
    if (tyyppi && otsikko) {
      const k = kaupanKategoria({ title: otsikko, tags: tagit, description: kuvaus });
      if (k !== tyyppi.kategoria) omat.push(`kauppa luokittelisi otsikon "${otsikko}" kategoriaan ${k ?? "ei mitään"}, ei ${tyyppi.kategoria}`);
      if (onPiilotettuTuote({ name: otsikko, slug: slugiksi(otsikko), category: k })) omat.push("otsikko osuu piilotettuun kategoriaan (muki)");
    }
    const avain = tyyppi && rivit.length ? idempotenssiAvain(e.tyyppi, rivit) : null;
    if (avain && avaimet.has(avain)) omat.push("sama teksti ja tyyppi on listassa jo aiemmin");
    if (omat.length) { virheet.push(...omat.map((v) => `${nimi} (${rivit.join(" / ") || "?"}): ${v}`)); return; }
    avaimet.add(avain);
    tuotteet.push({ avain, rivit, teksti: rivit.join(" / "), tyyppi: e.tyyppi, varit, koot, hinta, tagit, kategoria, otsikko, kuvaus, lista: lista.nimi || tiedosto });
  });
  return { nimi: lista.nimi || tiedosto, enimmaishinta: enimmaishinta ?? null, tuotteet, virheet };
}

// ---------- Hinta ----------

/** Pienin x,90-hinta (sentteinä), joka on vähintään euroa. */
export function ylosX90(euroa) {
  const c = Math.round(euroa * 100);
  return Math.max(90, Math.ceil((c - 90) / 100) * 100 + 90);
}

function kate(hintaSentit, kuluSentit, toimitusSentit, asetukset) {
  const tuote = { price: hintaSentit / 100, variants: { costs: { v: kuluSentit }, shipping_cents: toimitusSentit } };
  return laskeKate(tuote, "v", asetukset);
}

/**
 * Hinta yhdelle tuotteelle (kaikki variantit samaan hintaan, kuten kaupan products.price). kulut = { variantId: sentit }
 * (suurin kulu ratkaisee), toimitusSentit = Printifyn Suomen toimitus ensimmäiselle kappaleelle.
 * Pienin x,90, jolla kate >= 40 % (laskettuna yhden kappaleen tilauksena toimitusmaksulla, ilmainen rajasta alkaen),
 * vähintään kategorian pohjahinta. ohitushinta käytetään, jos se täyttää molemmat; muuten varoitus ja laskettu hinta.
 * enimmaishinta: yli menevä ei ole toteutettavissa (hintaa ei koskaan lasketa katerajan alle).
 */
export function hinnoittele({
  kulut, toimitusSentit, kategoria, toimitusmaksu = SUUNNITELTU_TOIMITUSMAKSU, ilmainenRaja = SUUNNITELTU_ILMAINEN_RAJA,
  enimmaishinta = null, ohitushinta = null, pohjahinnat = KATEGORIAN_POHJAHINNAT,
}) {
  const arvot = Object.values(kulut || {}).filter((c) => typeof c === "number" && c >= 0);
  if (!arvot.length || typeof toimitusSentit !== "number") return { ok: false, syy: "kulut tai toimitus tuntemattomat" };
  const kulu = Math.max(...arvot);
  const pohja = pohjahinnat[kategoria] ?? 0;
  const asetukset = { toimitusmaksu, ilmainenRaja };
  const kelpaa = (c) => c >= Math.round(pohja * 100) && kate(c, kulu, toimitusSentit, asetukset).sallittu;
  let hinta = null;
  for (let c = ylosX90(pohja); c <= 99990; c += 100) if (kelpaa(c)) { hinta = c; break; }
  if (hinta == null) return { ok: false, syy: "40 %:n katetta ei saavuteta alle 999,90 €:n" };
  let peruste = hinta === ylosX90(pohja) ? "kategorian pohjahinta" : `${Math.round(KATE_RAJA * 100)} %:n kate`;
  let varoitus = null;
  if (ohitushinta != null) {
    const o = Math.round(ohitushinta * 100);
    if (kelpaa(o)) { hinta = o; peruste = "listan hinta"; }
    else varoitus = `listan hinta ${euroa(ohitushinta)} on alle ${o < Math.round(pohja * 100) ? "kategorian pohjahinnan" : "katerajan"}, käytetään ${euroa(hinta / 100)}`;
  }
  const k = kate(hinta, kulu, toimitusSentit, asetukset);
  const nyt = kate(hinta, kulu, toimitusSentit, {});
  const tulos = {
    ok: true, hinta: hinta / 100, hintaSentit: hinta, pohja, kulu, toimitusSentit, peruste, varoitus,
    kate: k.kate, nettokate: k.nettokate, kateNyt: nyt.kate, nettokateNyt: nyt.nettokate,
  };
  if (enimmaishinta != null && hinta > Math.round(enimmaishinta * 100)) {
    return {
      ...tulos, ok: false, eiToteutettavissa: true,
      syy: pohja > enimmaishinta
        ? `kategorian ${kategoria} pohjahinta ${euroa(pohja)} on yli listan enimmäishinnan ${euroa(enimmaishinta)}`
        : `40 %:n kate vaatii ${euroa(hinta / 100)}, yli listan enimmäishinnan ${euroa(enimmaishinta)}`,
    };
  }
  return tulos;
}

// ---------- Variantit ----------

/** Vaihtoehdon vertailumuoto: eu-painotalot.vaihtoehto + mitat (3" × 3" -> 3x3). */
export function normArvo(s) {
  const t = vaihtoehto(s).replace(/[″"'”]/g, "").trim();
  const m = t.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)$/);
  return m ? `${m[1]}x${m[2]}` : t;
}

const VAALEAT = ["white", "natural", "ivory", "cream", "sand", "ash", "sport grey", "athletic heather", "light", "pink", "yellow",
  "daisy", "silver", "beige", "ice grey", "heather grey", "mint", "baby blue", "sky", "lavender", "peach", "banana", "cornsilk", "oatmeal", "bone"];
export const onVaaleaVari = (vari) => { const v = normalisoi(vari); return !!v && VAALEAT.some((x) => v.includes(x)); };

/** Variantin väri: options.color, muuten nimen ensimmäinen osa, joka ei ole koko. */
export function variantinVari(v) {
  if (v?.options && typeof v.options === "object" && !Array.isArray(v.options) && v.options.color) return String(v.options.color);
  const osat = String(v?.title ?? "").split("/").map((s) => s.trim());
  return osat.find((o) => !/^(\d|xs|s|m|l|xl|\dxl|xxl|xxxl|one size)/i.test(o)) || null;
}

/**
 * Pyydetyt värit ja koot katalogin varianteista. Tyhjä lista = ei rajausta. Palauttaa { valitut, puuttuvatVarit,
 * puuttuvatKoot }.
 */
export function valitseVariantit(variantit, { varit = [], koot = [] } = {}) {
  // "Circle|Round" = kumpi tahansa kirjoitusasu.
  const vaihtoehdot = (x) => String(x).split("|").map(normArvo);
  const loydetytV = new Set(), loydetytK = new Set();
  const valitut = [];
  for (const v of variantit || []) {
    const osat = new Set(variantinOsat(v).map(normArvo));
    const vari = varit.find((x) => vaihtoehdot(x).some((a) => osat.has(a)));
    const koko = koot.find((x) => vaihtoehdot(x).some((a) => osat.has(a)));
    if ((varit.length && !vari) || (koot.length && !koko)) continue;
    if (vari) loydetytV.add(vari);
    if (koko) loydetytK.add(koko);
    valitut.push(v);
  }
  return {
    valitut,
    puuttuvatVarit: varit.filter((x) => !loydetytV.has(x)),
    puuttuvatKoot: koot.filter((x) => !loydetytK.has(x)),
  };
}

/** Painoalue (front, muuten ensimmäinen) ja suurin koko valituista varianteista. */
export function painoalue(valitut, oletus = { width: 3600, height: 4800 }) {
  const kaikki = valitut.flatMap((v) => v.placeholders || []);
  const position = kaikki.some((p) => p.position === "front") ? "front" : kaikki[0]?.position || "front";
  const samat = kaikki.filter((p) => p.position === position && p.width && p.height);
  if (!samat.length) return { position, width: oletus.width, height: oletus.height, katalogista: false };
  return { position, width: Math.max(...samat.map((p) => p.width)), height: Math.max(...samat.map((p) => p.height)), katalogista: true };
}

/** Variantit tekstivärin mukaan ryhmiin: tummat tuotteet valkoisella, vaaleat mustalla tekstillä. */
export function tekstivariRyhmat(valitut, kiintea = null) {
  const ryhmat = new Map();
  for (const v of valitut) {
    const vari = kiintea || (onVaaleaVari(variantinVari(v)) ? "#111111" : "#FFFFFF");
    if (!ryhmat.has(vari)) ryhmat.set(vari, { vari, variantIds: [], tuotevarit: new Set() });
    const r = ryhmat.get(vari);
    r.variantIds.push(Number(v.id));
    const tv = variantinVari(v);
    if (tv) r.tuotevarit.add(tv);
  }
  return [...ryhmat.values()].map((r) => ({ ...r, tuotevarit: [...r.tuotevarit] }));
}

export function printAreat(ryhmat, kuvaIdt, position) {
  return ryhmat.map((r) => ({
    variant_ids: r.variantIds,
    placeholders: [{ position, images: [{ id: kuvaIdt[r.vari], x: 0.5, y: 0.5, scale: 1, angle: 0 }] }],
  }));
}

export function tuoteRunko(tuote, kohde, hintaSentit, print_areas) {
  return {
    title: tuote.otsikko,
    description: tuote.kuvaus,
    tags: tuote.tagit,
    blueprint_id: Number(kohde.blueprint.id),
    print_provider_id: Number(kohde.painotalo.id),
    variants: kohde.valinta.valitut.map((v) => ({ id: Number(v.id), price: hintaSentit, is_enabled: true })),
    print_areas,
  };
}

// ---------- Kulut ----------

/** Kuluarvio sentteinä varianteittain: opitut (oikeat) kulut ensin, sitten tyypin arvio (oletus + koko). */
export function arvioiKulut(valitut, { opitut = {}, arvio = null } = {}) {
  const kulut = {};
  let arvioitu = false;
  for (const v of valitut) {
    if (typeof opitut[String(v.id)] === "number") { kulut[String(v.id)] = opitut[String(v.id)]; continue; }
    if (!arvio) continue;
    const osat = variantinOsat(v).map(normArvo);
    const koko = Object.keys(arvio.koot || {}).find((k) => osat.includes(normArvo(k)));
    kulut[String(v.id)] = koko ? arvio.koot[koko] : arvio.oletus;
    arvioitu = true;
  }
  return { kulut, arvioitu };
}

// ---------- Katalogi ----------

/** Katalogi tiedostosta (esimerkki tai välimuisti). Sama muoto kuin LiveKatalogi.vienti(). */
export class TiedostoKatalogi {
  constructor(data, lahde) { this.d = data || {}; this.lahde = lahde; }
  async blueprintit() { return this.d.blueprints || []; }
  async blueprintinPainotalot(bp) { return (this.d.blueprint_providers || {})[String(bp)] || []; }
  async painotalo(id) { return (this.d.print_providers || []).find((p) => Number(p.id) === Number(id)) || null; }
  async variantit(bp, pp) { return (this.d.variants || {})[`${bp}/${pp}`] || []; }
  async toimitus(bp, pp) { return (this.d.shipping || {})[`${bp}/${pp}`] || null; }
  kuluarvio(tyyppi) { return (this.d.kuluarviot || {})[tyyppi] || null; }
  opitutKulut(bp, pp) { return (this.d.kulut || {})[`${bp}/${pp}`] || {}; }
}

/** Printifyn katalogi (vain GET), muistaa vastaukset ja vie ne välimuistitiedostoon. */
export class LiveKatalogi {
  constructor(api, { arviot = {}, opitut = {} } = {}) {
    this.api = api; this.m = new Map(); this.arviot = arviot; this.lahde = "Printify (live)";
    this.d = { haettu: new Date().toISOString(), blueprints: null, blueprint_providers: {}, print_providers: [], variants: {}, shipping: {}, kulut: { ...opitut } };
  }
  muisti(avain, f) { if (!this.m.has(avain)) this.m.set(avain, f()); return this.m.get(avain); }
  async blueprintit() {
    return this.muisti("bp", async () => { const j = await this.api("/catalog/blueprints.json"); this.d.blueprints = Array.isArray(j) ? j : j?.data || []; return this.d.blueprints; });
  }
  async blueprintinPainotalot(bp) {
    return this.muisti(`bpp/${bp}`, async () => { const j = await this.api(`/catalog/blueprints/${bp}/print_providers.json`); return (this.d.blueprint_providers[String(bp)] = Array.isArray(j) ? j : j?.data || []); });
  }
  async painotalo(id) {
    return this.muisti(`pp/${id}`, async () => {
      const j = await this.api(`/catalog/print_providers/${id}.json`).catch(() => null);
      if (j) this.d.print_providers.push({ id: j.id, title: j.title, location: j.location ? { country: j.location.country } : undefined });
      return j;
    });
  }
  async variantit(bp, pp) {
    return this.muisti(`v/${bp}/${pp}`, async () => { const j = await this.api(`/catalog/blueprints/${bp}/print_providers/${pp}/variants.json`); return (this.d.variants[`${bp}/${pp}`] = Array.isArray(j) ? j : j?.variants || []); });
  }
  async toimitus(bp, pp) {
    return this.muisti(`s/${bp}/${pp}`, async () => (this.d.shipping[`${bp}/${pp}`] = await this.api(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`).catch(() => null)));
  }
  kuluarvio(tyyppi) { return this.arviot[tyyppi] || null; }
  opitutKulut(bp, pp) { return this.d.kulut[`${bp}/${pp}`] || {}; }
  vienti() { return this.d; }
}

/** Blueprint-ehdokkaat tyypin säännöllä (tarkka nimi ensin). */
export function blueprintEhdokkaat(blueprintit, saanto) {
  const lista = blueprintit || [];
  if (saanto.nimi) {
    const n = normalisoi(saanto.nimi);
    const tarkat = lista.filter((b) => normalisoi(b.title) === n);
    return tarkat.length ? tarkat : lista.filter((b) => normalisoi(b.title).includes(n));
  }
  const osat = (saanto.sisaltaa || []).map(normalisoi);
  return osat.length ? lista.filter((b) => osat.every((o) => blueprintTeksti(b).includes(o))) : [];
}

/**
 * Kohde (blueprint + EU-painotalo + variantit + Suomen toimitus). ohitus = { blueprint, painotalo } (id tai nimi).
 * Järjestys: vähiten puuttuvia värejä/kokoja, suositeltu painotalo, halvin toimitus Suomeen, pienin id.
 */
export async function ratkaiseKohde(tyyppiAvain, katalogi, { varit = [], koot = [] } = {}, ohitus = {}) {
  const tyyppi = TUOTETYYPIT[tyyppiAvain];
  const kaikki = await katalogi.blueprintit();
  const bpt = ohitus.blueprint
    ? kaikki.filter((b) => String(b.id) === String(ohitus.blueprint))
    : blueprintEhdokkaat(kaikki, tyyppi.blueprint).slice(0, 6);
  if (!bpt.length) return { ok: false, syy: `blueprintia ei löydy (${ohitus.blueprint ? `id ${ohitus.blueprint}` : tyyppi.blueprint.nimi || tyyppi.blueprint.sisaltaa.join(", ")})` };
  const ehdokkaat = [], hylatyt = [];
  for (const bp of bpt) {
    let tarjoajat = await katalogi.blueprintinPainotalot(bp.id);
    if (ohitus.painotalo) {
      const id = /^\d+$/.test(String(ohitus.painotalo)) ? String(ohitus.painotalo) : null;
      if (id) tarjoajat = tarjoajat.filter((t) => String(t.id) === id);
      else { const v = valitsePainotalo(tarjoajat, ohitus.painotalo); tarjoajat = v.ok ? [v.painotalo] : []; }
    }
    for (const t of tarjoajat) {
      const tiedot = await katalogi.painotalo(t.id);
      const maa = painotalonMaa(tiedot) || painotalonMaa(t);
      if (!onEU(maa)) { hylatyt.push(`${t.title} (${maa ?? "maa?"})`); continue; }
      const valinta = valitseVariantit(await katalogi.variantit(bp.id, t.id), { varit, koot });
      if (!valinta.valitut.length) { hylatyt.push(`${t.title} (${maa}): ei pyydettyjä värejä/kokoja`); continue; }
      const toimitusSentit = suomenToimitus(await katalogi.toimitus(bp.id, t.id));
      if (toimitusSentit == null) { hylatyt.push(`${t.title} (${maa}): ei toimitusta Suomeen`); continue; }
      const n = normalisoi(t.title);
      const suosi = tyyppi.suositut.findIndex((s) => n.includes(normalisoi(s)));
      ehdokkaat.push({ blueprint: bp, painotalo: { id: t.id, title: t.title }, maa, valinta, toimitusSentit, suosi: suosi < 0 ? 99 : suosi });
    }
  }
  if (!ehdokkaat.length) return { ok: false, syy: `ei EU-painotaloa, joka tekee pyydetyt variantit${hylatyt.length ? ` (hylätty: ${hylatyt.slice(0, 8).join(", ")})` : ""}` };
  const puuttuu = (e) => e.valinta.puuttuvatVarit.length + e.valinta.puuttuvatKoot.length;
  ehdokkaat.sort((a, b) => puuttuu(a) - puuttuu(b) || a.suosi - b.suosi || a.toimitusSentit - b.toimitusSentit || Number(a.painotalo.id) - Number(b.painotalo.id));
  const valittu = ehdokkaat[0];
  const peruste = ohitus.painotalo || ohitus.blueprint ? "komentorivin valinta" : valittu.suosi < 99 ? `suositeltu painotalo (${tyyppi.suositut[valittu.suosi]})` : "halvin toimitus Suomeen EU-painotaloista";
  return { ok: true, ...valittu, peruste, muut: ehdokkaat.slice(1).map((e) => `${e.painotalo.title} (${e.maa}) bp ${e.blueprint.id}`), hylatyt };
}

// ---------- Kirjaukset (idempotenssi) ----------

export const KIRJAUS = /^luotu-\d{4}-\d{2}-\d{2}\.json$/;

export function lueKirjaukset(kansio) {
  if (!existsSync(kansio)) return [];
  const rivit = [];
  for (const f of readdirSync(kansio).filter((f) => KIRJAUS.test(f)).sort()) {
    try { rivit.push(...(JSON.parse(readFileSync(path.join(kansio, f), "utf8")).tuotteet || [])); } catch { /* rikkinäinen kirjaus ohitetaan */ }
  }
  return rivit;
}

/** Jo luodut avaimet: Printifyssä olevat tuotteet (myös yli enimmäishinnan jääneet, niitä ei luoda uudelleen). */
export const joLuodut = (kirjaukset) => new Set((kirjaukset || []).filter((r) => r.printify_id).map((r) => r.avain));

// ---------- Printify-HTTP ----------

/** fetch-pohjainen kutsu: 429/5xx uusitaan porrastetusti. fetchImpl ja odota vaihdettavissa testeissä. */
export function teeApi({ key, fetchImpl = globalThis.fetch, odota = (ms) => new Promise((r) => setTimeout(r, ms)), pohja = "https://api.printify.com/v1" }) {
  return async function api(polku, { method = "GET", body } = {}) {
    for (let yritys = 1; ; yritys++) {
      const res = await fetchImpl(`${pohja}${polku}`, {
        method,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "User-Agent": "huumorikauppa-uudet-tuotteet" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if ((res.status === 429 || res.status >= 500) && yritys < 6) {
        const ra = Number(res.headers?.get?.("retry-after"));
        await odota(ra > 0 ? ra * 1000 : Math.min(60000, 2000 * 2 ** (yritys - 1)));
        continue;
      }
      const teksti = await res.text();
      if (!res.ok) throw new Error(`Printify ${method} ${polku}: HTTP ${res.status} ${teksti.slice(0, 300)}`);
      return teksti ? JSON.parse(teksti) : null;
    }
  };
}

// ---------- Yhden tuotteen käsittely ----------

/**
 * Käsittelee yhden listan tuotteen. ctx = {
 *   katalogi, enimmaishinta, toimitusmaksu, ilmainenRaja, ohitukset: { [tyyppi]: { blueprint, painotalo } },
 *   renderoi: async (rivit, { width, height, vari, asettelu }, polku) => void, kuvaKansio, luoKuvat (bool),
 *   toteuta (bool), api, shopId, lueTiedosto (polku -> Buffer) }
 * Palauttaa raporttirivin { tila: "suunniteltu" | "luotu" | "yli-enimmaishinnan" | "ohitettu", ... }.
 */
export async function kasitteleTuote(tuote, ctx) {
  const tyyppi = TUOTETYYPIT[tuote.tyyppi];
  const r = { avain: tuote.avain, teksti: tuote.teksti, tyyppi: tuote.tyyppi, lista: tuote.lista, otsikko: tuote.otsikko };
  const kohde = await ratkaiseKohde(tuote.tyyppi, ctx.katalogi, tuote, ctx.ohitukset?.[tuote.tyyppi] || {});
  if (!kohde.ok) return { ...r, tila: "ohitettu", syy: kohde.syy };
  Object.assign(r, {
    painotalo: `${kohde.painotalo.title} (${kohde.maa})`, print_provider_id: Number(kohde.painotalo.id),
    blueprint: `${kohde.blueprint.title}${kohde.blueprint.brand ? ` ${kohde.blueprint.brand}` : ""}${kohde.blueprint.model ? ` ${kohde.blueprint.model}` : ""}`,
    blueprint_id: Number(kohde.blueprint.id), peruste: kohde.peruste, muut: kohde.muut,
    variantit: kohde.valinta.valitut.length, puuttuvatVarit: kohde.valinta.puuttuvatVarit, puuttuvatKoot: kohde.valinta.puuttuvatKoot,
    toimitusSentit: kohde.toimitusSentit,
  });
  const { kulut, arvioitu } = arvioiKulut(kohde.valinta.valitut, {
    opitut: ctx.katalogi.opitutKulut(kohde.blueprint.id, kohde.painotalo.id), arvio: ctx.katalogi.kuluarvio(tuote.tyyppi),
  });
  const hintaArgs = { toimitusSentit: kohde.toimitusSentit, kategoria: tyyppi.kategoria, toimitusmaksu: ctx.toimitusmaksu, ilmainenRaja: ctx.ilmainenRaja, enimmaishinta: ctx.enimmaishinta, ohitushinta: tuote.hinta };
  const h = hinnoittele({ ...hintaArgs, kulut });
  r.kulutArvio = arvioitu;
  r.kulut = Object.values(kulut);
  r.hinnoittelu = h;
  if (!h.ok) return { ...r, tila: "ohitettu", syy: h.eiToteutettavissa ? `ei toteutettavissa: ${h.syy}` : h.syy };

  const alue = painoalue(kohde.valinta.valitut, tyyppi.oletusAlue);
  const ryhmat = tekstivariRyhmat(kohde.valinta.valitut, tyyppi.tekstivari);
  r.painoalue = alue;
  r.kuvat = ryhmat.map((g) => ({
    polku: path.join(ctx.kuvaKansio, `${slugiksi(tuote.rivit.join(" "))}-${tuote.tyyppi}-${g.vari === "#FFFFFF" ? "valkoinen" : "musta"}-teksti.png`),
    vari: g.vari, tuotevarit: g.tuotevarit,
  }));
  if (ctx.luoKuvat || ctx.toteuta) {
    for (const k of r.kuvat) await ctx.renderoi(tuote.rivit, { width: alue.width, height: alue.height, vari: k.vari, asettelu: tyyppi.asettelu }, k.polku);
  }
  if (!ctx.toteuta) return { ...r, tila: "suunniteltu" };

  // Toteutus: kuvat, tuote, oikeat kulut, hinnan tarkistus.
  const kuvaIdt = {};
  for (const k of r.kuvat) {
    const j = await ctx.api("/uploads/images.json", { method: "POST", body: { file_name: path.basename(k.polku), contents: ctx.lueTiedosto(k.polku).toString("base64") } });
    if (!j?.id) throw new Error(`kuvan lataus epäonnistui: ${k.polku}`);
    kuvaIdt[k.vari] = j.id;
    k.printify_kuva = j.id;
  }
  const runko = tuoteRunko(tuote, kohde, h.hintaSentit, printAreat(ryhmat, kuvaIdt, alue.position));
  const luotu = await ctx.api(`/shops/${ctx.shopId}/products.json`, { method: "POST", body: runko });
  if (!luotu?.id) throw new Error("tuotteen luonti ei palauttanut id:tä");
  r.printify_id = String(luotu.id);
  const tiedot = await ctx.api(`/shops/${ctx.shopId}/products/${luotu.id}.json`);
  const oikeat = Object.fromEntries((tiedot?.variants || []).filter((v) => v.is_enabled && typeof v.cost === "number").map((v) => [String(v.id), v.cost]));
  r.oikeatKulut = oikeat;
  const lopullinen = Object.keys(oikeat).length ? hinnoittele({ ...hintaArgs, kulut: oikeat }) : h;
  r.hinnoittelu = lopullinen;
  r.kulutArvio = !Object.keys(oikeat).length;
  // Hinta päivitetään, jos oikeat kulut vaativat eri hinnan (ei koskaan katerajan alle; yli enimmäishinnan jäävä raportoidaan).
  const uusiSentit = lopullinen.hintaSentit;
  if (uusiSentit && uusiSentit !== h.hintaSentit) {
    await ctx.api(`/shops/${ctx.shopId}/products/${luotu.id}.json`, {
      method: "PUT", body: { variants: runko.variants.map((v) => ({ id: v.id, price: uusiSentit, is_enabled: true })) },
    });
    r.hintaPaivitetty = { arvio: h.hinta, oikea: uusiSentit / 100 };
  }
  r.hinta = (uusiSentit || h.hintaSentit) / 100;
  r.tuote = tiedot;
  if (lopullinen.eiToteutettavissa) return { ...r, tila: "yli-enimmaishinnan", syy: lopullinen.syy };
  return { ...r, tila: "luotu" };
}

/** Kirjausrivi luotu-<pvm>.json-tiedostoon (ei koko Printify-vastausta). */
export function kirjausRivi(r, aika = new Date().toISOString()) {
  return {
    avain: r.avain, teksti: r.teksti, tyyppi: r.tyyppi, lista: r.lista, otsikko: r.otsikko, tila: r.tila,
    printify_id: r.printify_id, blueprint_id: r.blueprint_id, print_provider_id: r.print_provider_id, painotalo: r.painotalo,
    hinta: r.hinta, kate: r.hinnoittelu?.kate ?? null, kateNyt: r.hinnoittelu?.kateNyt ?? null, syy: r.syy ?? null,
    kuvat: (r.kuvat || []).map((k) => ({ tiedosto: path.basename(k.polku), printify_kuva: k.printify_kuva ?? null })),
    tuotu: false, luotu: aika,
  };
}
