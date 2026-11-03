#!/usr/bin/env node
/**
 * Piilotettujen painotiedostojen uudelleenpiirto (3.11.2026). Korvaa matalaresoluutioiset painokuvat omilla
 * vektoripiirroksilla (scripts/lib/painopiirrokset.mjs) ja Printifyn tekstitasot kuvilla (scripts/lib/tekstitaso-kuvaksi.py),
 * kaikki vähintään 300 DPI:n tarkkuudella painoalueella. Sijainti (x, y, scale, angle) säilyy, koska piirros tehdään
 * alkuperäisen kuvan kuvasuhteeseen. Tämä korvaa myös "käsin Printifyn editorissa" -listan (tekstitasot API:lla kuvina).
 *
 * Kohteet: 14 piilotettua (api/_lib/painolaatu-data.js), Tonnin seteli ja Se oli tonnin seteli (oikean henkilön kuva
 * pois, oma setelimäinen kehys ilman muotokuvaa ja virallisia merkintöjä) sekä Olen eläkkeellä.
 *
 * Ennen päivitystä vanhat print_areas tallennetaan data/painotiedostot-uudelleenpiirto.json:iin (perumista varten).
 * Käyttö: node scripts/painotiedostot-uudelleenpiirto.mjs [--aja] [--vain slug]   (ilman --aja piirtää ja listaa)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { PIIRROKSET } from "./lib/painopiirrokset.mjs";
import { tekstitasot, korvaaTekstitasot } from "./lib/eu-painotalot.mjs";
import { suurimmatPainoalueet, arvioiPainokuva } from "../api/_lib/painotiedosto.js";

const JUURI = new URL("..", import.meta.url).pathname;
const env = { ...process.env };
const envTiedosto = [join(JUURI, ".env.printify.local"), join(JUURI, "../../../.env.printify.local")].find(existsSync);
if (envTiedosto) for (const l of readFileSync(envTiedosto, "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=["']?([^"'\n]*)/);
  if (m && !env[m[1]]) env[m[1]] = m[2];
}
if (!env.PRINTIFY_API_KEY || !env.PRINTIFY_SHOP_ID) { console.error("PRINTIFY_API_KEY tai PRINTIFY_SHOP_ID puuttuu."); process.exit(1); }
const AJA = process.argv.includes("--aja");
const VAIN = process.argv.includes("--vain") ? process.argv[process.argv.indexOf("--vain") + 1] : null;
const SHOP = env.PRINTIFY_SHOP_ID;
const H = { Authorization: `Bearer ${env.PRINTIFY_API_KEY}`, "Content-Type": "application/json" };
async function api(polku, opts = {}) {
  for (let yritys = 0; ; yritys++) {
    try {
      const r = await fetch(`https://api.printify.com/v1/${polku}`, { headers: H, signal: AbortSignal.timeout(600000), ...opts });
      const t = await r.text();
      if (r.status === 429 || r.status >= 500) throw new Error(`Printify ${r.status}`);
      if (!r.ok) throw new Error(`Printify ${r.status} ${polku}: ${t.slice(0, 400)}`);
      return JSON.parse(t);
    } catch (e) {
      if (yritys === 5 || /Printify 4\d\d /.test(e.message)) throw e;
      await new Promise((r) => setTimeout(r, 5000 * (yritys + 1)));
    }
  }
}

// Fontit: repon TTF:t (tools/printify-merkkipaiva) ja puuttuvat Google Fontsista (OFL) kansioon scripts/.fontit (ei gittiin).
const FONTIT = join(JUURI, "scripts/.fontit");
mkdirSync(FONTIT, { recursive: true });
const GOOGLE = { "ABeeZee": "ABeeZee", "Permanent Marker": "Permanent+Marker", "Monoton": "Monoton", "Rammetto One": "Rammetto+One", "Amatic SC": "Amatic+SC:wght@700", "Luckiest Guy": "Luckiest+Guy", "Alfa Slab One": "Alfa+Slab+One", "Archivo Black": "Archivo+Black" };
const fonttiPolku = (nimi) => join(FONTIT, `${nimi.replaceAll(" ", "")}.ttf`);
for (const [nimi, q] of Object.entries(GOOGLE)) {
  if (existsSync(fonttiPolku(nimi))) continue;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${q}`, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
  const url = css.match(/https:\/\/fonts\.gstatic\.com[^)]+/)?.[0];
  if (!url) throw new Error(`fonttia ${nimi} ei löytynyt`);
  writeFileSync(fonttiPolku(nimi), Buffer.from(await (await fetch(url)).arrayBuffer()));
}
const fontFiles = Object.keys(GOOGLE).map(fonttiPolku);

/** Alkuperäinen Printify-kuva -> oma piirros (kuvasuhde = alkuperäisen width/height). */
const KORVAUKSET = {
  "69ab25b20b513d9f00e7eadb": { piirros: "merkki" },                    // Amatimies: tietyömerkki
  "69a93e3b1d1c799f50cdf569": { piirros: "kalju", args: ["#111"] },     // Kalju (olutmerkin logo), musta teksti
  "69a93deda69bd5107c400845": { piirros: "kalju", args: ["#ffffff"] },  // Kalju, valkoinen teksti tummille
  "69a481dbeb9f386a54f1714f": { piirros: "ice" },                       // ICE AATANA (elokuvahahmo)
  "69a495197b2b494b0b5125c0": { piirros: "lasit" },                     // Saatanan tunarit (valokuva henkilöstä)
  "69e4110d9f5fe07c6c9c0a27": { piirros: "slay" },                      // Slay queen (emoji)
  "6a203106a3582d17e970d7c6": { piirros: "suomi" },                     // Suomi Finland
  "69acb3694998ee2d899e1802": { piirros: "seteli" },                    // Tonnin seteli (henkilön kuva)
  "69a7461a7db395fbeef03c46": { piirros: "aurinkolasit" },              // Olen eläkkeellä (emoji)
  "6a2dede5f3fe7ff375134a79": { piirros: "pomo" },                      // Tässä talossa asuu yksi pomo
};

const KOHTEET = {
  "amatimies-huppari": "69ab27e0d9d11928ed085814", "amatimies-t-paita": "69ab26cad959867b0506f526",
  "ice-aatanahuppari": "69a485977ab6ca0074091988", "ice-aatanat-paita": "69a48d1394ca9fbf1d0216e2",
  "kalju-huppari": "69a941dff144caf1210545dd", "kalju-t-paita": "69a9400c62ee189316052dcc",
  "saatanan-tunarit-huppari": "6ae0ab7ab7c2757e960191b8", "saatanan-tunarit-t-paita": "69a495c5e2c6888b040e01b2",
  "slay-queen-huppari": "6ae0aaacc03126692306fad4", "slay-queen-t-paita": "6ae0aac75f138b16e30c0d4c",
  "suomi-finland-huppari": "6a20322fd250819b4c0d77fd", "suomi-finland-t-paita": "6a203133c0275c207f06c370",
  "tassa-talossa-asuu-yksi-pomo-huppari": "6a2deeb5050ad4a8a1121475", "tassa-talossa-asuu-yksi-pomo-t-paita": "6a2dee07be63d55ae20b3473",
  "tonnin-seteli-huppari": "69acb50bd9d11928ed08a235", "tonnin-seteli-t-paita": "69acb40b5ef4eca23b039dd6",
  "se-oli-tonnin-seteli-huppari": "69acb70811b15c29da02127a", "se-oli-tonnin-seteli-t-paita": "69acb60d581a48c85001b2e4",
  "olen-elakkeella-huppari": "69a7ef7eb824e8c75004d232", "olen-elakkeella-t-paita": "69a7474cdfcf29443f0f8be0",
};

const KUVAT = join(JUURI, "scripts/.painopiirrokset");
mkdirSync(KUVAT, { recursive: true });
const lokiPolku = join(JUURI, "data/painotiedostot-uudelleenpiirto.json");
const loki = existsSync(lokiPolku) ? JSON.parse(readFileSync(lokiPolku, "utf8")) : { lataukset: {}, tuotteet: {} };

async function lataa(avain, polku) {
  if (loki.lataukset[avain]) return loki.lataukset[avain];
  if (!AJA) return `(lataamatta ${avain})`;
  const j = await api("uploads/images.json", { method: "POST", body: JSON.stringify({ file_name: `huumorikauppa-${avain}.png`, contents: readFileSync(polku).toString("base64") }) });
  loki.lataukset[avain] = j.id;
  writeFileSync(lokiPolku, `${JSON.stringify(loki, null, 2)}\n`);
  return j.id;
}

const tuotteet = {};
const katalogi = new Map();
const tarve = new Map(); // korvattavan kuvan id -> suurin tarvittava leveys (px, 300 DPI)
for (const [slug, id] of Object.entries(KOHTEET)) {
  if (VAIN && slug !== VAIN) continue;
  const p = await api(`shops/${SHOP}/products/${id}.json`);
  const k = `${p.blueprint_id}/${p.print_provider_id}`;
  if (!katalogi.has(k)) katalogi.set(k, (await api(`catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/variants.json?show-out-of-stock=1`)).variants);
  const paikat = suurimmatPainoalueet(katalogi.get(k));
  // Uusinta-ajo: lähtökohtana alkuperäiset painoalueet (tekstitasot ja alkuperäiset kuvat), ei jo päivitetyt.
  if (loki.tuotteet[slug]?.vanhat) p.print_areas = loki.tuotteet[slug].vanhat;
  tuotteet[slug] = { p, paikat };
  for (const a of p.print_areas) for (const ph of a.placeholders) for (const kuva of ph.images || []) {
    if (!KORVAUKSET[kuva.id]) continue;
    const alue = paikat[ph.position];
    const leveys = Math.ceil(Number(kuva.scale) * alue.width);
    tarve.set(kuva.id, { leveys: Math.max(tarve.get(kuva.id)?.leveys || 0, leveys), w: kuva.width, h: kuva.height });
  }
}

// Piirrokset 300 DPI:n leveyteen (vähintään 1 200 px)
const kuvaId = new Map();
for (const [id, t] of tarve) {
  const { piirros, args = [] } = KORVAUKSET[id];
  const leveys = Math.min(9000, Math.max(1200, t.leveys));
  const polku = join(KUVAT, `${piirros}${args.length ? "-" + args.join("-").replace("#", "") : ""}-${leveys}.png`);
  const svg = PIIRROKSET[piirros](t.w, t.h, ...args);
  writeFileSync(polku, new Resvg(svg, { fitTo: { mode: "width", value: leveys }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Archivo Black" } }).render().asPng());
  console.log(`piirros ${piirros} ${leveys} px -> ${polku.replace(JUURI, "")}`);
  kuvaId.set(id, await lataa(`${id}-${leveys}`, polku));
}

/**
 * Kontrasti: tuotteet, joiden yksi painoalue kattaa myös tummat värit mustalla tekstillä. Tummat värit erotetaan omaksi
 * painoalueekseen, jossa tekstitasot ovat valkoisia (saman kuvan sijainti säilyy).
 */
const FONTTI_VAIHTO = { "saatanan-tunarit-t-paita": "Alfa Slab One" };
const TUMMAT_ERIKSEEN = { "saatanan-tunarit-t-paita": ["Dark Heather"] };
function erotaTummat(p, varit) {
  const tumma = new Set(p.variants.filter((v) => varit.some((c) => v.title.includes(c))).map((v) => v.id));
  return p.print_areas.flatMap((a) => {
    const t = a.variant_ids.filter((id) => tumma.has(id));
    if (!t.length || t.length === a.variant_ids.length) return [a];
    const valkoinen = { variant_ids: t, placeholders: a.placeholders.map((ph) => ({ ...ph, images: (ph.images || []).map((k) => (k.layerType === "text" ? { ...k, font_color: "#ffffff" } : k)) })) };
    return [{ ...a, variant_ids: a.variant_ids.filter((id) => !tumma.has(id)) }, valkoinen];
  });
}

let paivitetty = 0;
for (const [slug, { p, paikat }] of Object.entries(tuotteet)) {
  if (TUMMAT_ERIKSEEN[slug]) p.print_areas = erotaTummat(p, TUMMAT_ERIKSEEN[slug]);
  // Luettavuus: Monoton (ohut neonviiva) näkyy painettuna harmaana kaikilla pohjilla. Sama paksu slab-fontti kuin
  // saman mallin hupparissa.
  if (FONTTI_VAIHTO[slug]) for (const a of p.print_areas) for (const ph of a.placeholders) for (const k of ph.images || []) if (k.layerType === "text") k.font_family = FONTTI_VAIHTO[slug];
  // Tekstitasot kuviksi (leveys 300 DPI:llä suurimman käytetyn skaalan mukaan)
  const tekstit = new Map();
  for (const t of tekstitasot(p.print_areas)) {
    const alueLeveys = Math.max(...t.paikat.map((pos) => paikat[pos]?.width || 0));
    const leveys = Math.min(9000, Math.max(1200, Math.ceil(t.scaleMax * alueLeveys)));
    const fontti = fonttiPolku(t.fontti);
    if (!existsSync(fontti)) throw new Error(`${slug}: fontti ${t.fontti} puuttuu`);
    const nimi = `teksti-${createHash("sha1").update(t.avain).digest("hex").slice(0, 12)}-${leveys}`;
    const polku = join(KUVAT, `${nimi}.png`);
    execFileSync("python3", [join(JUURI, "scripts/lib/tekstitaso-kuvaksi.py"), "--font", fontti, "--text", t.teksti, "--color", t.vari, "--box-width", String(t.leveys), "--box-height", String(t.korkeus), "--align", t.tasaus, "--width-px", String(leveys), "--out", polku]);
    tekstit.set(t.avain, await lataa(nimi, polku));
    console.log(`  ${slug}: teksti "${t.teksti.replaceAll("\n", " / ")}" (${t.fontti}, ${t.vari}) ${leveys} px`);
  }
  let areat = korvaaTekstitasot(p.print_areas, tekstit);
  // Korvattavat kuvat, ja niskan text_layer.svg (kuvaa ei ole Printifyn kirjastossa, API hylkää sen) pois
  const poistetut = [];
  areat = areat.map((a) => ({
    variant_ids: a.variant_ids,
    placeholders: a.placeholders.map((ph) => ({
      position: ph.position,
      images: (ph.images || []).filter((k) => {
        if (k.layerType === "image" && !k.src && String(k.name || "").startsWith("text_layer")) { poistetut.push(`${ph.position}: text_layer.svg`); return false; }
        if (k.type === "text/plain") { poistetut.push(`${ph.position}: ${k.name}`); return false; }
        return true;
      }).map((k) => {
        const uusi = kuvaId.get(k.id);
        return { id: uusi || k.id, x: k.x, y: k.y, scale: k.scale, angle: k.angle ?? 0 };
      }),
    })).filter((ph) => ph.images.length > 0),
  }));
  // Tarkistus: jokainen kuva vähintään 150 DPI (uudet 300 DPI) ja kaikki matalat korvattu
  for (const a of p.print_areas) for (const ph of a.placeholders) for (const k of ph.images || []) {
    if (!k.src || !k.width || /svg/i.test(k.type || "") || kuvaId.has(k.id)) continue;
    const dpi = arvioiPainokuva(k, paikat[ph.position]).dpi;
    if (dpi < 150) throw new Error(`${slug}: kuva ${k.name} jää ${dpi} DPI:hin ilman korvausta`);
  }
  console.log(`${AJA ? "päivitetään" : "päivitettäisiin"}${p.is_locked ? " (lukittu)" : ""}: ${slug} (${areat.length} painoaluetta, pois ${poistetut.length ? poistetut.join(", ") : "-"})`);
  if (!AJA) continue;
  if (p.is_locked) await api(`shops/${SHOP}/products/${p.id}/publishing_failed.json`, { method: "POST", body: JSON.stringify({ reason: "Painotiedoston uudelleenpiirto" }) });
  if (!loki.tuotteet[slug]) loki.tuotteet[slug] = { printify: p.id, vanhat: p.print_areas.map((a) => ({ variant_ids: a.variant_ids, placeholders: a.placeholders.map((ph) => ({ position: ph.position, images: (ph.images || []).map(({ src, svg, ...k }) => k) })) })) };
  await api(`shops/${SHOP}/products/${p.id}.json`, { method: "PUT", body: JSON.stringify({ print_areas: areat }) });
  loki.tuotteet[slug].paivitetty = new Date().toISOString();
  loki.tuotteet[slug].poistetut = poistetut;
  writeFileSync(lokiPolku, `${JSON.stringify(loki, null, 2)}\n`);
  paivitetty++;
}
console.log(AJA ? `Päivitetty ${paivitetty} tuotetta.` : "Piirretty. Aja --aja ladataksesi ja päivittääksesi.");
