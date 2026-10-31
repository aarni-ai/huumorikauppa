/**
 * Oma logo -paidan kuvat palvelimella (api/painokuva.js): logon tallennus (taulu yrityslogot), esikatselu ja
 * tilauskohtainen painokuva 3461 x 3955 PNG läpinäkyvällä taustalla. Design trimmataan läpinäkyvistä reunoista ja
 * skaalataan asettelun laatikkoon (api/_lib/logopaita.js asettelu); SVG-logo ja teksti piirretään resvg:llä
 * (fontti Anton, SIL Open Font License), kokoaminen sharpilla.
 */
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { sql } from "./db.js";
import { LOGO_RAJAT, PAINOALUE, asettelu, logoDesign, tekstinVari, onLogoId } from "./logopaita.js";

const ANTON_TTF = "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf";
let fontti = null;

/** Fonttitiedoston polku (resvg-js lukee fontit Nodessa tiedostosta; /tmp on kirjoitettava Vercelissä). */
export async function haeFontti() {
  if (fontti) return fontti;
  const r = await fetch(ANTON_TTF);
  if (!r.ok) throw new Error(`fontti ${r.status}`);
  const polku = join(tmpdir(), "anton-v27.ttf");
  await writeFile(polku, Buffer.from(await r.arrayBuffer()));
  fontti = polku;
  return fontti;
}

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ── Logon tarkistus ja tallennus ─────────────────────────────────────────────────────────────────────────────────

/** SVG:n turvallisuus ja koko: ei skriptejä, upotettuja HTML-osia, entiteettejä eikä ulkoisia viittauksia. */
export function tarkistaSvg(teksti) {
  const s = String(teksti || "");
  if (!/<svg[\s>]/i.test(s)) return "Tiedosto ei ole SVG-kuva.";
  if (/<script|<foreignObject|<!ENTITY|<iframe|\son[a-z]+\s*=|javascript:/i.test(s)) return "SVG-tiedostossa on sisältöä, jota ei voi käyttää. Tallenna logo uudelleen tavallisena SVG:nä tai PNG:nä.";
  if (/(?:xlink:)?href\s*=\s*["'](?!#|data:image\/(?:png|jpeg);base64,)/i.test(s)) return "SVG-tiedostossa on ulkoinen kuvaviittaus. Upota kuvat tai tallenna logo PNG:nä.";
  return null;
}

/** SVG -> PNG (leveys px). Tekstit vaativat fontin: logon tekstit kannattaa muuntaa poluiksi ennen tallennusta. */
function svgPng(svg, leveys) {
  return new Resvg(svg, { fitTo: { mode: "width", value: leveys }, background: "rgba(0,0,0,0)", font: { loadSystemFonts: false } }).render().asPng();
}

/**
 * Tarkistaa ladatun logon ja tallentaa sen: { tyyppi: "png" | "svg", data: base64 } -> { ok, id, leveys, korkeus,
 * lapinakyva, huomio } tai { ok: false, virhe }. Sama tiedosto saa saman id:n (sha-256).
 */
export async function tallennaLogo({ tyyppi, data }) {
  const puskuri = Buffer.from(String(data || ""), "base64");
  if (!puskuri.length) return { ok: false, virhe: "Valitse logotiedosto." };
  let leveys, korkeus, lapinakyva = true;
  const huomiot = [];
  if (tyyppi === "png") {
    if (puskuri.length > LOGO_RAJAT.pngTavua) return { ok: false, virhe: "PNG-tiedosto on yli 3 Mt. Pienennä kuvaa tai käytä SVG:tä." };
    const m = await sharp(puskuri).metadata().catch(() => null);
    if (!m || m.format !== "png") return { ok: false, virhe: "Tiedosto ei ole PNG-kuva." };
    ({ width: leveys, height: korkeus } = m);
    const pidempi = Math.max(leveys, korkeus);
    if (pidempi < LOGO_RAJAT.minPx) return { ok: false, virhe: `Logon tarkkuus on ${leveys} x ${korkeus} px, ja painoon tarvitaan vähintään ${LOGO_RAJAT.minPx} px. Lataa suurempi PNG tai SVG.` };
    if (pidempi > LOGO_RAJAT.maxPx) return { ok: false, virhe: `Logo on liian suuri (${leveys} x ${korkeus} px). Enintään ${LOGO_RAJAT.maxPx} px.` };
    if (pidempi < LOGO_RAJAT.suositusPx) huomiot.push(`Tarkkuus ${leveys} x ${korkeus} px riittää logolle, joka painetaan designin alle tai noin 15 cm leveäksi.`);
    lapinakyva = !!m.hasAlpha;
    if (!lapinakyva) huomiot.push("Logossa ei ole läpinäkyvää taustaa, joten tausta painetaan paitaan. Läpinäkyvä PNG tai SVG näyttää paremmalta.");
  } else if (tyyppi === "svg") {
    if (puskuri.length > LOGO_RAJAT.svgTavua) return { ok: false, virhe: "SVG-tiedosto on yli 1 Mt." };
    const teksti = puskuri.toString("utf8");
    const virhe = tarkistaSvg(teksti);
    if (virhe) return { ok: false, virhe };
    try {
      const png = svgPng(teksti, 1200);
      const m = await sharp(png).trim().toBuffer({ resolveWithObject: true }).catch(() => null);
      if (!m) return { ok: false, virhe: "SVG-logo on tyhjä. Tarkista tiedosto." };
      ({ width: leveys, height: korkeus } = m.info);
    } catch {
      return { ok: false, virhe: "SVG-tiedostoa ei voitu lukea." };
    }
    if (/<text[\s>]/i.test(teksti)) huomiot.push("SVG:ssä on tekstiä fonttina. Tarkista esikatselusta, että teksti näkyy, tai muunna tekstit poluiksi.");
  } else {
    return { ok: false, virhe: "Logon pitää olla PNG- tai SVG-tiedosto." };
  }
  const tiiviste = createHash("sha256").update(puskuri).digest("hex");
  await varmistaTaulu();
  const [rivi] = await sql()`insert into yrityslogot (tyyppi, data, leveys, korkeus, lapinakyva, tiiviste)
    values (${tyyppi}, ${puskuri}, ${leveys}, ${korkeus}, ${lapinakyva}, ${tiiviste})
    on conflict (tiiviste) do update set tiiviste = excluded.tiiviste returning id`;
  return { ok: true, id: rivi.id, leveys, korkeus, lapinakyva, huomio: huomiot.join(" ") || null };
}

let taulu = false;
async function varmistaTaulu() {
  if (taulu) return;
  await sql()`create table if not exists yrityslogot (id uuid primary key default gen_random_uuid(), tyyppi text not null,
    data bytea not null, leveys integer, korkeus integer, lapinakyva boolean, tiiviste text not null unique,
    created_at timestamptz not null default now())`;
  taulu = true;
}

/** Logo tietokannasta: { tyyppi, data: Buffer } tai null. */
export async function haeLogo(id) {
  if (!onLogoId(id)) return null;
  await varmistaTaulu();
  const [r] = await sql()`select tyyppi, data from yrityslogot where id = ${id}`;
  return r ? { tyyppi: r.tyyppi, data: Buffer.from(r.data) } : null;
}

/** Puuttuvat logot (kassa tarkistaa ennen maksua). */
export async function puuttuvatLogot(idt) {
  const uniikit = [...new Set(idt.filter(onLogoId))];
  if (!uniikit.length) return [];
  await varmistaTaulu();
  const loydetyt = new Set((await sql()`select id from yrityslogot where id = any(${uniikit}::uuid[])`).map((r) => r.id));
  return uniikit.filter((id) => !loydetyt.has(id));
}

// ── Painokuva ────────────────────────────────────────────────────────────────────────────────────────────────────

const designVarasto = new Map();
/** Designin lähdekuva (Printifyn kuvavarasto), trimmattuna; pidetään muistissa funktion elinajan (enintään 6). */
async function designKuva(slug) {
  if (designVarasto.has(slug)) return designVarasto.get(slug);
  const d = logoDesign(slug);
  if (!d) throw new Error(`tuntematon design ${slug}`);
  const r = await fetch(d.src, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`design ${slug}: ${r.status}`);
  const kuva = await sharp(Buffer.from(await r.arrayBuffer())).trim().png().toBuffer();
  if (designVarasto.size >= 6) designVarasto.delete(designVarasto.keys().next().value);
  designVarasto.set(slug, kuva);
  return kuva;
}

async function logoKuva(id) {
  const l = await haeLogo(id);
  if (!l) throw new Error(`logo ${id} puuttuu`);
  const png = l.tyyppi === "svg" ? svgPng(l.data.toString("utf8"), 3000) : l.data;
  return sharp(png).trim().png().toBuffer();
}

async function tekstiKuva(rivit, vari) {
  const koko = 400, rivikorkeus = 480;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="6000" height="${rivikorkeus * rivit.length + 200}">` +
    rivit.map((r, i) => `<text x="3000" y="${100 + koko + i * rivikorkeus}" font-family="Anton" font-size="${koko}" fill="${tekstinVari(vari)}" text-anchor="middle">${xml(r)}</text>`).join("") + `</svg>`;
  const png = new Resvg(svg, { background: "rgba(0,0,0,0)", font: { fontFiles: [await haeFontti()], loadSystemFonts: false, defaultFontFamily: "Anton" } }).render().asPng();
  return sharp(png).trim().png().toBuffer();
}

/** Skaalaa laatikkoon (kuvasuhde säilyy, myös suurennus). */
const sovita = (kuva, laatikko) => sharp(kuva).resize({ width: laatikko.w, height: laatikko.h, fit: "inside" }).png().toBuffer({ resolveWithObject: true });

/**
 * Painokuva PNG:nä: { logo, rivit, design } (tarkistettu, api/_lib/logopaita.js) ja paidan väri (tekstin väri).
 * leveys < 3461 palauttaa pienennetyn esikatselun.
 */
export async function logoPainokuva(valinta, vari, { leveys = PAINOALUE.leveys } = {}) {
  const a = asettelu(valinta);
  const osat = [];
  if (valinta.design) osat.push(await sovita(await designKuva(valinta.design), a.design));
  if (valinta.logo) osat.push(await sovita(await logoKuva(valinta.logo), a.logo));
  if (valinta.rivit?.length) osat.push(await sovita(await tekstiKuva(valinta.rivit, vari), a.teksti));
  let y = a.ylin;
  const kerrokset = osat.map(({ data, info }) => {
    const k = { input: data, left: Math.round((PAINOALUE.leveys - info.width) / 2), top: y };
    y += info.height + a.vali;
    return k;
  });
  let kuva = await sharp({ create: { width: PAINOALUE.leveys, height: PAINOALUE.korkeus, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(kerrokset).png().toBuffer();
  if (leveys < PAINOALUE.leveys) kuva = await sharp(kuva).resize({ width: leveys }).png().toBuffer();
  return kuva;
}
