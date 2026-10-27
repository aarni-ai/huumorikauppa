#!/usr/bin/env node
/**
 * Siirtää EU:n ulkopuolella painettavat Printify-tuotteet EU-painotaloille (omistajan päätös 21.10.2026).
 * Oletuksena KUIVA-AJO: hakee vain tiedot ja tulostaa suunnitelman, ei kirjoita mitään.
 *
 *   PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... [DATABASE_URL=...] npx tsx scripts/printify-eu-painotalot.mjs [valinnat]
 *
 *   --toteuta                   luo uudet tuotteet Printifyyn, kirjaa data/eu-siirto-<pvm>.json ja (jos DATABASE_URL)
 *                               päivittää products-rivin: printify_product_id, variants (variant_map, värit, koot,
 *                               kuvat, costs, shipping_cents) ja images. Nimi, slug, hinta, näkyvyys ja kuvaus säilyvät.
 *   --julkaise                  julkaise uudet tuotteet Printifyssä (POST publish.json). Oletuksena ei: oma tausta
 *                               tilaa product_id + variant_id -tunnuksilla, julkaisua ei tarvita.
 *   --poista-vanhat-julkaisusta vanhat tuotteet POST unpublish.json (niitä EI koskaan poisteta).
 *   --raja N                    käsittele enintään N siirrettävää tuotetta (koeajo).
 *   --vain <printify-id>[,...]  käsittele vain nämä tuotteet.
 *   --tekstitasot-kuviksi       Printifyn editorin tekstitasot (API ei luo niitä) piirretään PNG-kuviksi
 *                               (scripts/lib/tekstitaso-kuvaksi.py, Pillow, fontit tools/printify-merkkipaiva/renderer/
 *                               fonts) ja ladataan Printifyyn (POST /uploads/images.json, vain --toteuta). Kuva rajataan
 *                               tekstin musteeseen, joten x, y ja scale säilyvät. Kuiva-ajo piirtää kuvat --kuvakansioon.
 *   --kuvakansio <polku>        minne tekstikuvat piirretään (oletus käyttöjärjestelmän tmp).
 *   --pudota-paikat neck[,...]  nämä painopaikat jätetään pois uudesta tuotteesta (esim. Printify Choicen kaulaetiketti,
 *                               jonka Textildruck laskuttaa erikseen) eikä tuotetta ohiteta säännön ohitaPaikat takia.
 *   --paivita-kanta             ei siirrä mitään: päivittää kaikkien jo kirjattujen siirtojen (data/eu-siirto-*.json)
 *                               kantarivit (printify_product_id = vanhaId) EU-kopioon kuten --toteuta. Tarvitsee
 *                               DATABASE_URL:n. Idempotentti: jo päivitetyt ohitetaan ilman Printify-hakuja.
 *
 * Säännöt ja puhdas logiikka: scripts/lib/eu-painotalot.mjs. Kategoria: buildProductRow (printify-sync.ts),
 * varalla vanhan blueprintin nimi. Jo siirretyt (data/eu-siirto-*.json) ohitetaan, joten ajon voi toistaa.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  onEU, painotalonMaa, valitseSaanto, valitsePainotalo, valitseBlueprint, tuotteenKoko, yhdistaVariantit,
  uudetPrintAreat, uusiTuoteRunko, suomenToimitus, tekstitasot, korvaaTekstitasot, pudotaPaikat, TEKSTITASO_FONTIT,
} from "./lib/eu-painotalot.mjs";
import { lueEuSiirrot, paivitaSiirrotKantaan, postgresKanta, siirraRivitEuKopioon } from "./lib/eu-kanta.mjs";

globalThis.Deno ??= { env: { get: (k) => process.env[k] } };
const { buildProductRow } = await import("../supabase/functions/_shared/printify-sync.ts");

const argv = process.argv.slice(2);
const lippu = (n) => argv.includes(n);
const arvo = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const toteuta = lippu("--toteuta");
const julkaise = lippu("--julkaise");
const poistaVanhatJulkaisusta = lippu("--poista-vanhat-julkaisusta");
const raja = arvo("--raja") ? Number(arvo("--raja")) : Infinity;
const vain = arvo("--vain") ? new Set(arvo("--vain").split(",").map((s) => s.trim()).filter(Boolean)) : null;
const tekstitKuviksi = lippu("--tekstitasot-kuviksi");
const pudotettavatPaikat = (arvo("--pudota-paikat") || "").split(",").map((s) => s.trim()).filter(Boolean);
const kuvakansio = arvo("--kuvakansio") || path.join(os.tmpdir(), "huumorikauppa-tekstitasot");
const paivitaKannat = lippu("--paivita-kanta");

const API = "https://api.printify.com/v1";
const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY || !SHOP) { console.error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID tarvitaan."); process.exit(1); }

const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataKansio = path.join(juuri, "data");
const odota = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- HTTP: 429/5xx uusitaan porrastetusti ----------
async function api(polku, { method = "GET", body } = {}) {
  for (let yritys = 1; ; yritys++) {
    let res;
    try {
      res = await fetch(`${API}${polku}`, {
        method,
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "User-Agent": "huumorikauppa-eu-siirto" },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000),
      });
    } catch (e) {
      // Verkkovirhe: GET uusitaan; POST ei, ettei Printifyyn synny kaksoiskappaletta.
      if (method !== "GET" || yritys >= 6) throw e;
      console.warn(`  verkkovirhe ${method} ${polku} (${e.cause?.code || e.name}), uusi yritys (${yritys}/5)`);
      await odota(2000 * yritys);
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && yritys < 6) {
      const ra = Number(res.headers.get("retry-after"));
      const ms = ra > 0 ? ra * 1000 : Math.min(60000, 2000 * 2 ** (yritys - 1));
      console.warn(`  HTTP ${res.status} ${method} ${polku}, uusi yritys ${ms / 1000} s päästä (${yritys}/5)`);
      await odota(ms);
      continue;
    }
    const teksti = await res.text();
    if (!res.ok) throw new Error(`Printify ${method} ${polku}: HTTP ${res.status} ${teksti.slice(0, 300)}`);
    return teksti ? JSON.parse(teksti) : null;
  }
}

const vm = new Map();
const muisti = (avain, f) => { if (!vm.has(avain)) vm.set(avain, f()); return vm.get(avain); };
const painotalo = (id) => muisti(`pp/${id}`, () => api(`/catalog/print_providers/${id}.json`));
const painotalot = () => muisti("pp", () => api(`/catalog/print_providers.json`));
const blueprintit = () => muisti("bp", () => api(`/catalog/blueprints.json`));
const blueprint = (id) => muisti(`bp/${id}`, () => api(`/catalog/blueprints/${id}.json`).catch(() => null));
const katalogiVariantit = (bp, pp) => muisti(`v/${bp}/${pp}`, async () => {
  const j = await api(`/catalog/blueprints/${bp}/print_providers/${pp}/variants.json`);
  return Array.isArray(j) ? j : j?.variants || [];
});
const toimitus = (bp, pp) => muisti(`s/${bp}/${pp}`, () => api(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`).then(suomenToimitus).catch(() => null));

/** Kohdepainotalon tarjoamat blueprintit: painotalon katalogitiedoista, varalla blueprints.json + tarkistus. */
async function painotalonBlueprintit(pp, saanto) {
  const tiedot = await painotalo(pp.id);
  if (Array.isArray(tiedot?.blueprints) && tiedot.blueprints.length) return tiedot.blueprints;
  return muisti(`ppbp/${pp.id}/${saanto.kategoria}`, async () => {
    const osat = (saanto.blueprint.sisaltaa || []).map((s) => s.toLowerCase());
    if (!osat.length) return []; // ilman hakusanoja ei käydä koko katalogia läpi
    const kaikki = await blueprintit();
    const ehdokkaat = kaikki.filter((b) => osat.every((o) => `${b.title} ${b.brand} ${b.model}`.toLowerCase().includes(o)));
    const tulos = [];
    for (const b of ehdokkaat) {
      const tarjoajat = await api(`/catalog/blueprints/${b.id}/print_providers.json`);
      if ((tarjoajat || []).some((t) => Number(t.id) === Number(pp.id))) tulos.push(b);
    }
    return tulos;
  });
}

/** Säännön kohde (painotalo + blueprint) tai { syy }. */
async function ratkaiseKohde(saanto, vanha, vanhaBp) {
  const pv = valitsePainotalo(await painotalot(), saanto.painotalo);
  if (!pv.ok) return { syy: pv.syy };
  const maa = painotalonMaa(await painotalo(pv.painotalo.id));
  if (!onEU(maa)) return { syy: `kohdepainotalo ${pv.painotalo.title} ei ole EU:ssa (${maa ?? "maa puuttuu"})` };
  if (saanto.blueprint.sama && !saanto.blueprint.sisaltaa?.length) {
    // Vain sama blueprint kelpaa: tarkista suoraan, tarjoaako kohdepainotalo sitä.
    const tarjoajat = await api(`/catalog/blueprints/${vanha.blueprint_id}/print_providers.json`).catch(() => []);
    if ((tarjoajat || []).some((t) => Number(t.id) === Number(pv.painotalo.id)) && vanhaBp) {
      return { painotalo: pv.painotalo, maa, blueprint: vanhaBp, peruste: "sama blueprint" };
    }
  }
  const lista = await painotalonBlueprintit(pv.painotalo, saanto);
  const bv = valitseBlueprint(lista, saanto, { blueprint_id: vanha.blueprint_id, blueprintTitle: vanhaBp?.title, koko: tuotteenKoko(vanha.variants) });
  if (!bv.ok) return { syy: `${pv.painotalo.title}: ${bv.syy}` };
  return { painotalo: pv.painotalo, maa, blueprint: bv.blueprint, peruste: bv.peruste };
}

// ---------- Kauppa ----------
async function kaikkiTuotteet() {
  const kaikki = [];
  for (let sivu = 1; ; sivu++) {
    const j = await api(`/shops/${SHOP}/products.json?page=${sivu}&limit=50`);
    const tuotteet = Array.isArray(j) ? j : j?.data || [];
    kaikki.push(...tuotteet);
    if (!tuotteet.length || tuotteet.length < 50 || (j?.last_page && sivu >= j.last_page)) break;
  }
  return kaikki;
}

function joSiirretyt() {
  const ids = new Set();
  if (!existsSync(dataKansio)) return ids;
  for (const f of readdirSync(dataKansio).filter((f) => /^eu-siirto-.*\.json$/.test(f))) {
    try { for (const r of JSON.parse(readFileSync(path.join(dataKansio, f), "utf8")).siirrot || []) ids.add(String(r.vanhaId)); } catch { /* rikkinäinen kirjaus ohitetaan */ }
  }
  return ids;
}

const pvm = new Date().toISOString().slice(0, 10);
const kirjausPolku = path.join(dataKansio, `eu-siirto-${pvm}.json`);
const kirjaus = !paivitaKannat && existsSync(kirjausPolku) ? JSON.parse(readFileSync(kirjausPolku, "utf8")) : { paiva: pvm, siirrot: [] };
const tallennaKirjaus = () => { mkdirSync(dataKansio, { recursive: true }); writeFileSync(kirjausPolku, JSON.stringify(kirjaus, null, 2) + "\n"); };

let sql = null;
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if ((toteuta || paivitaKannat) && dbUrl) {
  const { default: postgres } = await import("postgres");
  sql = postgres(dbUrl, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl) ? false : "require", max: 1, prepare: false });
}

async function paivitaKanta(vanhaId, uusi) {
  const shippingCents = await toimitus(uusi.blueprint_id, uusi.print_provider_id);
  const r = await siirraRivitEuKopioon(postgresKanta(sql), vanhaId, uusi, { buildProductRow, shippingCents });
  if (r.tila === "ei-rivia") return "ei riviä kannassa";
  if (r.tila === "ei-tunnistettu") return "buildProductRow ei tunnistanut uutta tuotetta, kantaa ei päivitetty";
  return `päivitetty ${r.slugit.join(", ")}${r.poistetut.length ? `, poistettu kaksoisrivi ${r.poistetut.join(", ")}` : ""}`;
}

// ---------- --paivita-kanta: jo kirjatut siirrot kantaan (ei luo mitään Printifyyn) ----------
if (paivitaKannat) {
  if (!sql) { console.error("--paivita-kanta tarvitsee DATABASE_URL:n."); process.exit(1); }
  const siirrot = lueEuSiirrot(dataKansio);
  console.log(`Kirjattuja siirtoja ${siirrot.vanhaan.size} (${siirrot.tiedostot.join(", ") || "ei kirjauksia"}).`);
  const t = await paivitaSiirrotKantaan({
    kanta: postgresKanta(sql), siirrot, buildProductRow, toimitus, loki: console.log,
    haeTuote: (id) => api(`/shops/${SHOP}/products/${id}.json`).catch((e) => (/HTTP 404/.test(e.message) ? null : Promise.reject(e))),
  });
  console.log(`Kanta: päivitetty ${t.paivitetty} riviä, jo EU-kopiossa ${t.jo}, ei riviä kannassa ${t.eiRivia}, virheitä ${t.virheet.length}` +
    `${t.poistetut.length ? `, poistettu kaksoisrivejä ${t.poistetut.length}` : ""}.`);
  await sql.end();
  process.exit(t.virheet.length ? 1 : 0);
}

// ---------- Ajo ----------
console.log(`EU-painotalosiirto ${toteuta ? "(TOTEUTUS)" : "(kuiva-ajo, ei kirjoita mitään)"}`);
const siirretyt = joSiirretyt();
let tuotteet = await kaikkiTuotteet();
if (vain) tuotteet = tuotteet.filter((p) => vain.has(String(p.id)));
console.log(`Kaupassa ${tuotteet.length} tuotetta.`);

const yhteenveto = {}; // kategoria -> { siirretaan, ohitetaan }
const laske = (k, kentta) => { yhteenveto[k] ??= { siirretaan: 0, ohitetaan: 0 }; yhteenveto[k][kentta]++; };
let euSsa = 0, jo = 0, kasitelty = 0;

for (const lista of tuotteet) {
  const maa = painotalonMaa(await painotalo(lista.print_provider_id).catch(() => null));
  if (onEU(maa)) { euSsa++; continue; }
  if (siirretyt.has(String(lista.id))) { jo++; continue; }
  if (kasitelty >= raja) break;
  kasitelty++;

  const vanha = await api(`/shops/${SHOP}/products/${lista.id}.json`);
  const vanhaPp = await painotalo(vanha.print_provider_id);
  const vanhaBp = await blueprint(vanha.blueprint_id);
  const kategoria = buildProductRow(vanha, [])?.category || buildProductRow({ title: vanhaBp?.title || "" }, [])?.category || "tuntematon";
  console.log(`\n${vanha.title}  [${vanha.id}]  ${kategoria}`);
  console.log(`  nyt: ${vanhaPp?.title ?? vanha.print_provider_id} (${maa ?? "?"}), blueprint ${vanhaBp?.title ?? vanha.blueprint_id} (${vanha.blueprint_id})`);
  const ohita = (syy) => { console.log(`  OHITETAAN: ${syy}`); laske(kategoria, "ohitetaan"); };

  const saanto = valitseSaanto(kategoria, vanhaPp?.title);
  if (!saanto) { ohita(`ei siirtosääntöä (kategoria ${kategoria}, painotalo ${vanhaPp?.title ?? "?"})`); continue; }
  const kaytossaPaikka = (alueet, pos) => (alueet || []).some((a) => (a.placeholders || []).some((ph) => ph.position === pos && (ph.images || []).length));
  // --pudota-paikat: painopaikka jätetään pois (kirjataan pudotetutPaikat-kenttään) eikä tuotetta ohiteta sen takia.
  const pudotetutOmat = pudotettavatPaikat.filter((pos) => kaytossaPaikka(vanha.print_areas, pos));
  let alueet = pudotetutOmat.length ? pudotaPaikat(vanha.print_areas, pudotetutOmat) : vanha.print_areas || [];
  if (pudotetutOmat.length) console.log(`  pudotetaan painopaikat (--pudota-paikat): ${pudotetutOmat.join(", ")}`);
  const paikat = (saanto.ohitaPaikat || []).filter((pos) => kaytossaPaikka(alueet, pos));
  if (paikat.length) { ohita(`painopaikka ${paikat.join(", ")}: kohdepainotalolla lisäkulu, kate heikkenisi (sääntö ohitaPaikat)`); continue; }
  const kohde = await ratkaiseKohde(saanto, vanha, vanhaBp);
  if (kohde.syy) { ohita(kohde.syy); continue; }

  const uudet = await katalogiVariantit(kohde.blueprint.id, kohde.painotalo.id);
  const { yhdistetyt, pudotetut } = yhdistaVariantit(vanha.variants, uudet);

  // Printifyn editorin tekstitasoja (layerType "text") ei voi luoda API:lla: luonti päättyy virheeseen "Provided images
  // do not exist" (26.10.2026 kokeiltu myös tekstikentillä). --tekstitasot-kuviksi piirtää ne kuviksi; muuten ohitetaan.
  let tekstit;
  try { tekstit = tekstitasot(alueet); } catch (e) { ohita(e.message); continue; }
  const tekstikuvat = [];
  if (tekstit.length) {
    if (!tekstitKuviksi) { ohita("tekstitaso (Printifyn editorin teksti), API ei tue: --tekstitasot-kuviksi tai siirrä käsin Printifyssä"); continue; }
    const puuttuvat = tekstit.filter((t) => !TEKSTITASO_FONTIT[t.fontti]);
    if (puuttuvat.length) { ohita(`tekstitason fonttia ei ole repossa: ${[...new Set(puuttuvat.map((t) => t.fontti))].join(", ")}`); continue; }
    mkdirSync(kuvakansio, { recursive: true });
    for (const [i, t] of tekstit.entries()) {
      // Kuvan leveys painoalueen tarkkuudella: scale * kohdevariantin painopaikan leveys (px).
      const pw = Math.max(...uudet.flatMap((u) => (u.placeholders || []).filter((p) => t.paikat.includes(p.position)).map((p) => Number(p.width) || 0)), 0) || 3600;
      const leveysPx = Math.min(6000, Math.max(600, Math.ceil(t.scaleMax * pw)));
      const polku = path.join(kuvakansio, `${vanha.id}-${i + 1}.png`);
      execFileSync(process.env.PYTHON || "python3", [path.join(juuri, "scripts/lib/tekstitaso-kuvaksi.py"),
        "--font", path.join(juuri, "tools/printify-merkkipaiva/renderer/fonts", TEKSTITASO_FONTIT[t.fontti]),
        "--text", t.teksti, "--color", t.vari, "--box-width", String(t.leveys), "--box-height", String(t.korkeus),
        "--align", t.tasaus, "--width-px", String(leveysPx), "--out", polku], { stdio: ["ignore", "ignore", "inherit"] });
      tekstikuvat.push({ ...t, polku, leveysPx });
      console.log(`  tekstitaso -> kuva: "${t.teksti.replace(/\n/g, " / ")}" ${t.fontti} ${t.vari} (${leveysPx} px) ${polku}`);
    }
  }
  const kuvaIdt = new Map(tekstikuvat.map((t, i) => [t.avain, `kuiva-${i + 1}`]));
  let { print_areas, pudotetutPaikat } = uudetPrintAreat(korvaaTekstitasot(alueet, kuvaIdt), yhdistetyt, uudet);
  pudotetutPaikat = [...new Set([...pudotetutOmat, ...pudotetutPaikat])];
  console.log(`  ->  ${kohde.painotalo.title} (${kohde.maa}), blueprint ${kohde.blueprint.title}${kohde.blueprint.model ? ` ${kohde.blueprint.model}` : ""} (${kohde.blueprint.id}), peruste: ${kohde.peruste}`);
  const pudKaytossa = pudotetut.filter((p) => p.is_enabled);
  console.log(`  variantit: ${yhdistetyt.length} yhdistetty${yhdistetyt.some((y) => y.ainoa) ? " (ainoa variantti)" : ""}, ${pudKaytossa.length} käytössä olevaa pudotetaan${pudotetut.length - pudKaytossa.length ? `, ${pudotetut.length - pudKaytossa.length} pois käytöstä olevaa pudotetaan` : ""}`);
  if (pudKaytossa.length) console.log(`    pudotetaan: ${pudKaytossa.map((p) => p.title).join(", ")}`);
  const puuttuvatPaikat = pudotetutPaikat.filter((p) => !pudotetutOmat.includes(p));
  if (puuttuvatPaikat.length) console.log(`    painopaikat joita kohteella ei ole: ${puuttuvatPaikat.join(", ")}`);
  if (!yhdistetyt.some((y) => y.is_enabled)) { ohita("yksikään käytössä oleva variantti ei vastaa kohdeblueprintia"); continue; }
  if (!print_areas.length) { ohita("painokuvia ei voitu siirtää (ei yhteisiä painopaikkoja)"); continue; }
  laske(kategoria, "siirretaan");
  if (!toteuta) continue;

  if (tekstikuvat.length) {
    try {
      for (const t of tekstikuvat) {
        const j = await api("/uploads/images.json", { method: "POST", body: { file_name: `${vanha.id}-${path.basename(t.polku)}`, contents: readFileSync(t.polku).toString("base64") } });
        t.kuvaId = j.id;
        kuvaIdt.set(t.avain, j.id);
      }
    } catch (e) { ohita(`tekstikuvan lataus epäonnistui: ${String(e.message).slice(0, 200)}`); continue; }
    ({ print_areas } = uudetPrintAreat(korvaaTekstitasot(alueet, kuvaIdt), yhdistetyt, uudet));
  }

  const runko = uusiTuoteRunko(vanha, kohde.blueprint.id, kohde.painotalo.id, yhdistetyt, print_areas);
  let luotu;
  try {
    luotu = await api(`/shops/${SHOP}/products.json`, { method: "POST", body: runko });
  } catch (e) {
    // Esim. "Provided images do not exist": vanhan tuotteen kuva on poistettu Printifystä. Ohitetaan tuote, ajo jatkuu.
    ohita(`luonti epäonnistui: ${String(e.message).slice(0, 200)}`);
    continue;
  }
  console.log(`  LUOTU ${luotu.id}`);
  const rivi = {
    vanhaId: vanha.id, uusiId: luotu.id, title: vanha.title, kategoria,
    vanha: { painotalo: vanhaPp?.title, maa, blueprint_id: vanha.blueprint_id, print_provider_id: vanha.print_provider_id },
    uusi: { painotalo: kohde.painotalo.title, maa: kohde.maa, blueprint_id: kohde.blueprint.id, print_provider_id: kohde.painotalo.id },
    yhdistetyt: yhdistetyt.map(({ vanhaId, uusiId, title }) => ({ vanhaId, uusiId, title })),
    pudotetut, pudotetutPaikat, julkaistu: false, vanhaPoistettuJulkaisusta: false, kanta: null,
  };
  if (tekstikuvat.length) {
    rivi.tekstitasotKuviksi = tekstikuvat.map((t) => ({ teksti: t.teksti, fontti: t.fontti, vari: t.vari, kuvaId: t.kuvaId, leveysPx: t.leveysPx }));
  }
  kirjaus.siirrot.push(rivi);
  tallennaKirjaus();
  if (julkaise) {
    await api(`/shops/${SHOP}/products/${luotu.id}/publish.json`, { method: "POST", body: { title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true } });
    rivi.julkaistu = true;
  }
  if (poistaVanhatJulkaisusta) {
    await api(`/shops/${SHOP}/products/${vanha.id}/unpublish.json`, { method: "POST" });
    rivi.vanhaPoistettuJulkaisusta = true;
  }
  const uusi = await api(`/shops/${SHOP}/products/${luotu.id}.json`);
  const halvat = (uusi.variants || []).filter((v) => v.is_enabled && v.cost != null && v.price <= v.cost);
  if (halvat.length) console.log(`  VAROITUS: hinta <= kulu ${halvat.length} variantilla (${halvat.map((v) => v.title).join(", ")})`);
  if (sql) { rivi.kanta = await paivitaKanta(vanha.id, uusi); console.log(`  kanta: ${rivi.kanta}`); }
  tallennaKirjaus();
  await odota(1500); // tuotteen luonti on hidas ja rajoitettu, pidetään väliä
}

console.log(`\nYhteenveto: EU:ssa jo ${euSsa}, aiemmin siirretty ${jo}, käsitelty ${kasitelty}${kasitelty >= raja ? ` (raja ${raja})` : ""}.`);
for (const [k, v] of Object.entries(yhteenveto).sort()) console.log(`  ${k.padEnd(14)} siirretään ${v.siirretaan}, ohitetaan ${v.ohitetaan}`);
if (toteuta) console.log(`Kirjaus: ${path.relative(juuri, kirjausPolku)}`);
if (sql) await sql.end();
