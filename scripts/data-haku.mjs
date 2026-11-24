#!/usr/bin/env node
/**
 * Datan haku koneelta (5.11.2026): Coworkin Chrome-laajennus irtoaa toistuvasti, joten kone lukee Search Consolen,
 * Merchant Centerin sekä Instagramin ja TikTokin julkaisujen tilastot itse samalla Huumorikauppa-profiilin kopiolla kuin
 * scripts/some-julkaisu.mjs, ja tallentaa ne /hallinta/syote-tietokantaan samoilla otsikoilla kuin Cowork
 * (api/_lib/hallintasyote.js EHDOTUKSET). Analyysi: node scripts/syote-lue.mjs --analyysi.
 *
 * Vain lukee: sivuja avataan ja taulukoita luetaan, mitään ei muuteta, ladata eikä lähetetä palveluihin. Kirjautumisia,
 * salasanoja tai koodeja ei syötetä. Jos sivulla on CAPTCHA, tarkistus tai kirjautuminen puuttuu, kyseinen lähde
 * ohitetaan heti ja syy kirjataan (some/datahakuloki.txt); muita lähteitä jatketaan, koska palvelut ovat erillisiä.
 *
 * Otsikot: "Search Console 28 pv" (hakulausekkeet), "Search Console sivut 28 pv", "Search Console 7 pv" (kokonaisluvut),
 * "Merchant klikit" (tuotteet 28 pv), "Instagram tilastot", "TikTok tilastot" ja "Viikkovertailu" (24.11.2026):
 * Search Consolen klikkaukset viikko viikolta (edellisen maanantain tilannekuvasta) ja koriin lisäysten osuus tuotesivun
 * kävijöistä 7 päivältä (tuotesivu_seuranta: Blob-puskuri ?tehtava=puskuri-luvut ja tietokanta ?tehtava=tuoteseuranta).
 *
 * Ajo:
 *   node scripts/data-haku.mjs                      kaikki lähteet
 *   node scripts/data-haku.mjs --vain merchant      yksi lähde (search, merchant, instagram, tiktok, vertailu)
 *   node scripts/data-haku.mjs --kuiva              ei tallennusta (tulostaa rivimäärät ja alun)
 *   node scripts/data-haku.mjs --laheta-paikalliset 2026-11-05   paikalliset kopiot kantaan (jos tallennus epäonnistui)
 *   node scripts/data-haku.mjs --ajastettu          launchd: vain maanantaina klo 8 jälkeen Suomen aikaa, kerran viikossa
 * Ajastus: scripts/data-haku.plist (launchd joka tunti :05; skripti päättää Helsingin ajan mukaan, koska koneen
 * aikavyöhyke poikkeaa). Asennus: bash scripts/data-haku-asennus.sh
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, rmSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { etsiProfiili, paivitaKopio, kaynnista, esteet, lueJulkaistut, TILIT } from "./some-julkaisu.mjs";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOKI = join(JUURI, "some", "datahakuloki.txt");
const AUTOMAATIO = join(homedir(), ".huumorikauppa-some");
const SC = "https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Ahuumorikauppa.fi&num_of_days=28&metrics=CLICKS%2CIMPRESSIONS%2CCTR%2CPOSITION";
const MC_TILI = "5759809345";
const LAHTEET = ["search", "merchant", "instagram", "tiktok"];
/** Ilman selainta: viikkovertailu ajetaan lähteiden jälkeen (myös --vain vertailu). */
const VERTAILU = "vertailu";

const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const lippu = (n) => process.argv.includes(n);
const hki = (d = new Date(), o = {}) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki", ...o }).format(d);
const loki = (...x) => { const r = `${hki(new Date(), { dateStyle: "short", timeStyle: "medium" })} ${x.join(" ")}`; console.log(r); appendFileSync(LOKI, r + "\n"); };

// ── Luvut ja CSV (testit src/test/data-haku.test.ts) ───────────────────────────────────────────────────────────────
/** Englanninkielinen muotoilu (Search Console, TikTok): "1,234" -> 1234, "27.1%" -> 27.1, "1.2K" -> 1200. */
export function enLuku(s) {
  const m = String(s ?? "").replace(/[\s%]/g, "").replace(/,/g, "").match(/^(-?[\d.]+)([KkMm])?$/);
  if (!m) return null;
  const n = Number(m[1]) * ({ k: 1e3, m: 1e6 }[String(m[2] || "").toLowerCase()] || 1);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
/** Suomenkielinen muotoilu (Merchant Center): "1,35 t." -> 1350, "1 234" -> 1234, "1,0 %" -> 1, "<20" -> null. */
export function fiLuku(s) {
  const m = String(s ?? "").replace(/[\s  %]/g, "").replace(",", ".").match(/^(-?[\d.]+)(t\.?|milj\.?)?$/i);
  if (!m) return null;
  const n = Number(m[1]) * (/^t/i.test(m[2] || "") ? 1e3 : /^milj/i.test(m[2] || "") ? 1e6 : 1);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}
const kentta = (x) => { const s = x == null ? "" : String(x); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const csv = (otsikko, rivit) => [otsikko, ...rivit].map((r) => r.map(kentta).join(",")).join("\n");

// ── Tallennus ─────────────────────────────────────────────────────────────────────────────────────────────────────
function salaisuus() {
  const f = join(JUURI, ".env.cron.local");
  return process.env.CRON_SECRET || (existsSync(f) ? (readFileSync(f, "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] || "").trim().replace(/^"|"$/g, "") : "");
}
/** Paikallinen kopio aina (.cowork/syote/, ei repoon): analyysi onnistuu myös, kun tietokanta ei vastaa. */
function paikallinen(otsikko, sisalto) {
  const kansio = join(JUURI, ".cowork", "syote");
  mkdirSync(kansio, { recursive: true, mode: 0o700 });
  const nimi = otsikko.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const f = join(kansio, `${hki()}-${nimi}.csv`);
  writeFileSync(f, sisalto);
  return f;
}

async function tallenna(otsikko, sisalto) {
  if (!arg("--laheta-paikalliset")) paikallinen(otsikko, sisalto);
  if (lippu("--kuiva")) { console.log(`[kuiva] ${otsikko}:\n${sisalto.split("\n").slice(0, 4).join("\n")}`); return { ok: true, kuiva: true }; }
  const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";
  for (let yritys = 1; ; yritys++) {
    try {
      const r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=syote-tallenna`, { method: "POST", signal: AbortSignal.timeout(60000),
        headers: { authorization: `Bearer ${salaisuus()}`, "content-type": "application/json" }, body: JSON.stringify({ otsikko, sisalto }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) return j;
      if (r.status === 400) return j;
      throw new Error(`tallennus ${r.status}`);
    } catch (e) {
      if (yritys === 4) return { ok: false, virhe: String(e?.message || e) };
      await new Promise((ok) => setTimeout(ok, 5000 * yritys));
    }
  }
}

async function este(p, lahde) {
  if (/accounts\.google\.com|\/signin|ServiceLogin/.test(p.url())) return "kirjautuminen puuttuu";
  return esteet(p, lahde);
}

// ── Lähteet ───────────────────────────────────────────────────────────────────────────────────────────────────────
async function scTaulukko(p, otsake) {
  return p.evaluate((otsake) => {
    const t = [...document.querySelectorAll("table")].find((x) => new RegExp(otsake, "i").test(x.rows[0]?.innerText || ""));
    if (!t) return null;
    return [...t.rows].slice(1).map((r) => [...r.cells].map((c) => c.innerText.trim())).filter((r) => r.length >= 5);
  }, otsake);
}

async function searchConsole(p) {
  await p.goto(SC, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(10000);
  const e = await este(p, "search console");
  if (e) return { este: e };
  if (!/Total clicks|Klikkaukset yhteensä/i.test(await p.locator("body").innerText())) return { virhe: "suorituskykyraportti ei auennut (oikeudet?)" };
  const kyselyt = await scTaulukko(p, "Top queries|Suosituimmat kyselyt");
  if (!kyselyt?.length) return { virhe: "kyselytaulukkoa ei löytynyt" };
  await p.getByRole("tab", { name: /^(PAGES|SIVUT)$/i }).first().click();
  await p.waitForTimeout(7000);
  const sivut = await scTaulukko(p, "Top pages|Suosituimmat sivut");
  const muunna = (r) => [r[0].split(/\s+(?:Copy URL|Kopioi URL)/)[0].trim(), enLuku(r[1]), enLuku(r[2]), enLuku(r[3]), enLuku(r[4])];
  const tulos = [];
  tulos.push(["Search Console 28 pv", csv(["Kysely", "Klikkaukset", "Näyttökerrat", "CTR", "Sijainti"], kyselyt.map(muunna)), kyselyt.length]);
  if (sivut?.length) tulos.push(["Search Console sivut 28 pv", csv(["Sivu", "Klikkaukset", "Näyttökerrat", "CTR", "Sijainti"], sivut.map(muunna)), sivut.length]);
  // Kokonaisluvut 7 päivältä viikkovertailuun (24.11.2026): yhteenvetokortit "Total clicks" ja "Total impressions".
  let huom7 = "";
  try {
    await p.goto(SC.replace("num_of_days=28", "num_of_days=7"), { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(8000);
    const yht = scYhteensa(await p.locator("body").innerText());
    if (yht.klikkaukset != null) tulos.push(["Search Console 7 pv", csv(["Jakso", "Klikkaukset", "Näyttökerrat"], [["7 pv", yht.klikkaukset, yht.nayttokerrat]]), 1]);
    else huom7 = "7 päivän kokonaislukuja ei saatu";
  } catch (e) { huom7 = `7 pv: ${String(e?.message || e).split("\n")[0].slice(0, 120)}`; }
  return { tulos, huom: [sivut?.length ? "" : "sivutaulukkoa ei saatu", huom7].filter(Boolean).join("; ") };
}

/** Suorituskykyraportin yhteenvetokortit: "Total clicks\n1.2K" (myös suomeksi). */
export function scYhteensa(teksti) {
  const luku = (re) => { const m = String(teksti).match(re); return m ? enLuku(m[1]) : null; };
  return {
    klikkaukset: luku(/(?:Total clicks|Klikkaukset yhteensä)\s*\n?\s*([\d.,]+[KkMm]?)/),
    nayttokerrat: luku(/(?:Total impressions|Näyttökerrat yhteensä)\s*\n?\s*([\d.,]+[KkMm]?)/),
  };
}

// ── Viikkovertailu (24.11.2026) ─────────────────────────────────────────────────────────────────────────────────────
const SYOTE = join(JUURI, ".cowork", "syote");
const lisaaPv = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Uusin paikallinen tilannekuva (.cowork/syote/<pvm>-<nimi>.csv) annetulta päivältä tai ennen sitä: { pvm, rivit }. */
export function tilannekuva(nimi, enintaan, kansio = SYOTE) {
  if (!existsSync(kansio)) return null;
  const pvmt = readdirSync(kansio).map((f) => f.match(new RegExp(`^(\\d{4}-\\d{2}-\\d{2})-${nimi}\\.csv$`))?.[1]).filter((d) => d && d <= enintaan).sort();
  const pvm = pvmt.at(-1);
  if (!pvm) return null;
  const [, ...rivit] = readFileSync(join(kansio, `${pvm}-${nimi}.csv`), "utf8").trim().split("\n").map(jasennaRivi);
  return { pvm, rivit };
}
function jasennaRivi(rivi) {
  const out = []; let k = "", lainaus = false;
  for (let i = 0; i < rivi.length; i++) {
    const c = rivi[i];
    if (lainaus) { if (c === '"' && rivi[i + 1] === '"') { k += '"'; i++; } else if (c === '"') lainaus = false; else k += c; }
    else if (c === '"') lainaus = true; else if (c === ",") { out.push(k); k = ""; } else k += c;
  }
  out.push(k);
  return out;
}
const summa = (rivit, sarake = 1) => rivit.reduce((s, r) => s + (Number(r[sarake]) || 0), 0);

/** Tuotesivun katselut ja koriin lisäykset väliltä alku..loppu: Blob-puskurin rivit ja tietokannan kooste yhteensä. */
export function tuoteKoriValilta(blobRivit, alku, loppu, kanta = null) {
  let naytto = 0, kori = 0;
  for (const r of blobRivit || []) {
    const [paiva, tapahtuma] = r.v || [];
    if (!(paiva >= alku && paiva <= loppu)) continue;
    if (tapahtuma === "naytto") naytto += r.n;
    if (tapahtuma === "kori") kori += r.n;
  }
  if (kanta) { naytto += kanta.naytto || 0; kori += kanta.kori || 0; }
  return { naytto, kori };
}

const prosentti = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const muutos = (t, e) => (t == null || e == null ? ["", ""] : [Math.round((t - e) * 10) / 10, e ? Math.round(((t - e) / e) * 1000) / 10 : ""]);

/**
 * Vertailun CSV: Mittari, Tämä viikko, Edellinen viikko, Muutos, Muutos %, Huom. Puuttuva luku jää tyhjäksi, ja syy
 * kerrotaan Huom-sarakkeessa (ei arvata).
 */
export function viikkovertailuCsv({ sc7, sc7Ed, sc28, sc28Ed, tuote, tuoteEd, jaksot }) {
  const rivi = (mittari, t, e, huom = "") => [mittari, t ?? "", e ?? "", ...muutos(t, e), huom];
  const pvmHuom = (a, b) => [a ? `tämä ${a}` : "tämä puuttuu", b ? `edellinen ${b}` : "edellinen puuttuu"].join(", ");
  return csv(["Mittari", "Tämä viikko", "Edellinen viikko", "Muutos", "Muutos %", "Huom"], [
    rivi("Search Console klikkaukset 7 pv", sc7?.klikkaukset, sc7Ed?.klikkaukset, pvmHuom(sc7?.pvm, sc7Ed?.pvm)),
    rivi("Search Console näyttökerrat 7 pv", sc7?.nayttokerrat, sc7Ed?.nayttokerrat, pvmHuom(sc7?.pvm, sc7Ed?.pvm)),
    rivi("Search Console klikkaukset 28 pv (sivut yhteensä)", sc28?.klikkaukset, sc28Ed?.klikkaukset, pvmHuom(sc28?.pvm, sc28Ed?.pvm)),
    rivi("Tuotesivun kävijät 7 pv", tuote?.naytto, tuoteEd?.naytto, jaksot ? `${jaksot.tama} / ${jaksot.edellinen}` : ""),
    rivi("Koriin lisäykset 7 pv", tuote?.kori, tuoteEd?.kori),
    rivi("Koriin lisäysten osuus tuotesivun kävijöistä %", tuote ? prosentti(tuote.kori, tuote.naytto) : null, tuoteEd ? prosentti(tuoteEd.kori, tuoteEd.naytto) : null, "kori / naytto"),
  ]);
}

async function cronJson(tehtava, aikaraja = 120000) {
  const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";
  const r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=${tehtava}`, { headers: { authorization: `Bearer ${salaisuus()}` }, signal: AbortSignal.timeout(aikaraja) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(`${tehtava.split("&")[0]} ${r.status}`);
  return j;
}

/** Viikkovertailu syötteeseen: Search Consolen tilannekuvat ja tuotesivun seuranta. */
async function viikkovertailu(nyt = new Date()) {
  const tanaan = hki(nyt);
  const sc7Kuva = (enintaan) => { const k = tilannekuva("search-console-7-pv", enintaan); return k ? { pvm: k.pvm, klikkaukset: Number(k.rivit[0]?.[1]) || 0, nayttokerrat: Number(k.rivit[0]?.[2]) || 0 } : null; };
  const sc28Kuva = (enintaan) => { const k = tilannekuva("search-console-sivut-28-pv", enintaan); return k ? { pvm: k.pvm, klikkaukset: summa(k.rivit) } : null; };
  const sc7 = sc7Kuva(tanaan), sc28 = sc28Kuva(tanaan);
  // Edellinen tilannekuva vähintään 6 päivää vanhempi kuin tämän viikon kuva.
  const sc7Ed = sc7 ? sc7Kuva(lisaaPv(sc7.pvm, -6)) : null;
  const sc28Ed = sc28 ? sc28Kuva(lisaaPv(sc28.pvm, -6)) : null;
  const jaksot = { tama: `${lisaaPv(tanaan, -7)}..${lisaaPv(tanaan, -1)}`, edellinen: `${lisaaPv(tanaan, -14)}..${lisaaPv(tanaan, -8)}` };
  const huom = [];
  let blob = null;
  try { blob = (await cronJson("puskuri-luvut")).taulut?.tuotesivu_seuranta || []; } catch (e) { huom.push(`Blob: ${e.message}`); }
  const kannasta = async (alku, loppu) => {
    try {
      const j = await cronJson(`tuoteseuranta&alkaen=${alku}&loppu=${loppu}`, 60000);
      return { naytto: j.nayttoja || 0, kori: j.suppilo?.find((v) => v.avain === "kori")?.n ?? 0 };
    } catch (e) { huom.push(`tietokanta ${alku}: ${e.message}`); return null; }
  };
  const [ta, tl] = jaksot.tama.split(".."), [ea, el] = jaksot.edellinen.split("..");
  const kantaT = await kannasta(ta, tl), kantaE = await kannasta(ea, el);
  const tuote = blob || kantaT ? tuoteKoriValilta(blob, ta, tl, kantaT) : null;
  const tuoteEd = blob || kantaE ? tuoteKoriValilta(blob, ea, el, kantaE) : null;
  return { sisalto: viikkovertailuCsv({ sc7, sc7Ed, sc28, sc28Ed, tuote, tuoteEd, jaksot }), huom: huom.join("; ") };
}

async function merchant(p) {
  await p.goto(`https://merchants.google.com/mc/reporting/performance/products?a=${MC_TILI}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(12000);
  const e = await este(p, "merchant");
  if (e) return { este: e };
  if (!/Huumorikauppa/.test(await p.locator("body").innerText()) || !p.url().includes(MC_TILI)) return { virhe: "väärä tai puuttuva Merchant-tili" };
  await p.getByText("Näytä kaikki tuotteet").first().click();
  await p.waitForTimeout(10000);
  // Järjestys impressioiden mukaan (laskeva), jotta paljon näytetyt tuotteet tulevat ensin.
  await p.locator("[role=columnheader]").filter({ hasText: /^Impressiot/ }).first().click();
  await p.waitForTimeout(5000);
  // Taulukko piirtää vain näkyvät rivit: sivu vieritetään läpi ja rivit kerätään matkalla (avain koko rivi).
  const lue = async () => {
    const nahdyt = new Map();
    let sivutus = "";
    await p.mouse.move(700, 500);
    for (let i = 0, samoja = 0; i < 30 && samoja < 3; i++) {
      const r = merchantRivit(await p.locator("body").innerText());
      sivutus = r.sivutus;
      const ennen = nahdyt.size;
      for (const x of r.rivit) nahdyt.set(x.join("|"), x);
      samoja = nahdyt.size === ennen ? samoja + 1 : 0;
      await p.mouse.wheel(0, 500);
      await p.waitForTimeout(700);
    }
    await p.evaluate(() => window.scrollTo(0, 0));
    return { rivit: [...nahdyt.values()], sivutus };
  };
  const kaikki = [];
  let tieto = "";
  for (let sivu = 1; sivu <= 25; sivu++) {
    const { rivit, sivutus } = await lue();
    if (!rivit.length) return { virhe: "tuotetaulukkoa ei löytynyt" };
    if (sivutus === tieto) break;
    tieto = sivutus;
    kaikki.push(...rivit);
    // Lopetus: viimeinen sivu tai sivun kaikilla alle 20 impressiota (järjestys impressioiden mukaan).
    if (rivit.every((r) => fiLuku(r[1]) == null)) break;
    const m = sivutus.match(/(\d[\d\s]*)\s*[–-]\s*(\d[\d\s]*)\s*\/\s*(\d[\d\s]*)/);
    if (m && Number(m[2].replace(/\s/g, "")) >= Number(m[3].replace(/\s/g, ""))) break;
    await p.locator("material-button.next").last().click();
    await p.waitForTimeout(5000);
  }
  // Sarakkeet: Otsikko, Impressiot, Klikkaukset, Klikkausprosentti, Ostokset, Ostajien prosenttiosuus. Sama otsikko voi
  // olla monella tuotetunnuksella (värit, EU-kopiot): summataan otsikoittain. "<20" impressiota lasketaan nollana.
  const summat = new Map();
  for (const r of kaikki) {
    const x = summat.get(r[0]) || { klikit: 0, nayttot: 0, ostot: 0, tunnuksia: 0 };
    x.klikit += fiLuku(r[2]) || 0; x.nayttot += fiLuku(r[1]) || 0; x.ostot += fiLuku(r[4]) || 0; x.tunnuksia++;
    summat.set(r[0], x);
  }
  const rivit = [...summat].map(([o, x]) => [o, x.klikit, x.nayttot || "", x.nayttot ? Math.round((1000 * x.klikit) / x.nayttot) / 10 : "", x.ostot, x.tunnuksia])
    .sort((a, b) => (Number(b[2]) || 0) - (Number(a[2]) || 0));
  return { tulos: [["Merchant klikit", csv(["Otsikko", "Klikkaukset", "Impressiot", "Klikkausprosentti", "Ostokset", "Tuotetunnuksia"], rivit), rivit.length]], huom: tieto };
}

/** Merchantin "kaikki tuotteet" -raportin teksti -> rivit [otsikko, impressiot, klikit, ctr, ostokset, ostajat %]. */
export function merchantRivit(teksti) {
  const alku = teksti.lastIndexOf("Ostajien prosenttiosuus");
  const loppu = teksti.indexOf("Näytettävät rivit", alku);
  if (alku < 0 || loppu < 0) return { rivit: [], sivutus: "" };
  const r = teksti.slice(alku, loppu).split("\n").map((x) => x.trim()).filter((x) => x && x !== "help_outline").slice(1);
  const rivit = [];
  for (let i = 0; i + 5 < r.length; ) {
    if (/%$/.test(r[i + 3]) && /%$/.test(r[i + 5])) { rivit.push(r.slice(i, i + 6)); i += 6; } else i++;
  }
  return { rivit, sivutus: teksti.slice(loppu, loppu + 120).replace(/\s+/g, " ") };
}

async function instagram(p) {
  await p.goto(`https://www.instagram.com/${TILIT.instagram}/reels/`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(9000);
  const e = await este(p, "instagram");
  if (e) return { este: e };
  const kelat = await p.evaluate(() => [...document.querySelectorAll('a[href*="/reel/"]')].map((a) => [a.getAttribute("href"), a.innerText.trim().split("\n")[0]]));
  if (!kelat.length) return { virhe: "keloja ei löytynyt profiilista" };
  const julkaistut = lueJulkaistut().filter((r) => r.kanava === "instagram");
  const rivit = kelat.map(([href, katselut]) => {
    const id = href.match(/reel\/([^/]+)/)?.[1];
    const j = julkaistut.find((r) => r.url?.includes(id));
    return [`https://www.instagram.com/reel/${id}/`, j?.nro || "", j?.julkaistu || "", enLuku(katselut) ?? fiLuku(katselut)];
  });
  return { tulos: [["Instagram tilastot", csv(["Julkaisu", "Nro", "Julkaistu", "Katselut"], rivit), rivit.length]] };
}

async function tiktok(p) {
  await p.goto("https://www.tiktok.com/tiktokstudio/content", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(12000);
  const e = await este(p, "tiktok");
  if (e) return { este: e };
  const tili = await p.evaluate(async () => { try { const r = await fetch("/passport/web/account/info/", { credentials: "include" }); return (await r.json())?.data?.username || null; } catch { return null; } });
  if (tili !== TILIT.tiktok) return { este: `väärä tai puuttuva tili (${tili || "ei kirjautunut"})` };
  const rivit = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/video/"]')].map((a) => a.getAttribute("href")))].map((href) => {
    let el = document.querySelector(`a[href="${href}"]`);
    for (let i = 0; i < 12 && el; i++, el = el.parentElement) {
      const r = el.innerText.split("\n").map((x) => x.trim()).filter(Boolean);
      const k = r.findIndex((x) => /^(Kaikki|Vain minä|Ystävät|Everyone|Only me|Friends)$/.test(x));
      if (k >= 1 && r.length >= k + 4) return { href, kuvateksti: r.slice(0, k - 1).filter((x) => !/^\d{1,2}:\d{2}$/.test(x)).join(" "), aika: r[k - 1], nakyvyys: r[k], luvut: r.slice(k + 1, k + 4) };
    }
    return { href, kuvateksti: "", aika: "", nakyvyys: "", luvut: [] };
  }));
  if (!rivit.length) return { virhe: "julkaisulistaa ei löytynyt" };
  const julkaistut = lueJulkaistut().filter((r) => r.kanava === "tiktok");
  const taulu = rivit.map((r) => {
    const id = r.href.match(/video\/(\d+)/)?.[1];
    const j = julkaistut.find((x) => x.url?.includes(id));
    return [`https://www.tiktok.com/@huumorikauppa/video/${id}`, j?.nro || "", r.aika, r.nakyvyys, enLuku(r.luvut[0]), enLuku(r.luvut[1]), enLuku(r.luvut[2]), r.kuvateksti.slice(0, 80)];
  });
  return { tulos: [["TikTok tilastot", csv(["Julkaisu", "Nro", "Julkaistu", "Näkyvyys", "Näyttökerrat", "Tykkäykset", "Kommentit", "Kuvateksti"], taulu), taulu.length]] };
}

/** Ajastettu ajo: maanantai klo 8 jälkeen Suomen aikaa, kerran viikossa (viikon maanantain päivämäärä avaimena). */
export function ajoviikko(nyt = new Date()) {
  const viikonpaiva = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Helsinki", weekday: "short" }).format(nyt);
  const tunti = Number(hki(nyt, { hour: "2-digit", hourCycle: "h23" }));
  return viikonpaiva === "Mon" && tunti >= 8 ? hki(nyt) : null;
}

/** --laheta-paikalliset PVM: päivän paikalliset kopiot (.cowork/syote/PVM-*.csv) kantaan, kun tietokanta taas vastaa. */
async function lahetaPaikalliset(pvm) {
  const kansio = join(JUURI, ".cowork", "syote");
  const nimet = { "search-console-28-pv": "Search Console 28 pv", "search-console-sivut-28-pv": "Search Console sivut 28 pv",
    "merchant-klikit": "Merchant klikit", "instagram-tilastot": "Instagram tilastot", "tiktok-tilastot": "TikTok tilastot",
    "search-console-7-pv": "Search Console 7 pv", "viikkovertailu": "Viikkovertailu" };
  let virheita = 0;
  for (const f of readdirSync(kansio).filter((x) => x.startsWith(`${pvm}-`) && x.endsWith(".csv"))) {
    const otsikko = nimet[f.slice(pvm.length + 1, -4)];
    if (!otsikko) continue;
    const r = await tallenna(otsikko, readFileSync(join(kansio, f), "utf8"));
    if (r.ok) loki("paikallinen", `tallennettu "${otsikko}" (${f})`, r.id ? `#${r.id}` : "");
    else { virheita++; loki("paikallinen", `tallennus epäonnistui "${otsikko}":`, r.virhe || ""); }
  }
  return virheita ? 2 : 0;
}

async function main() {
  if (arg("--laheta-paikalliset")) return lahetaPaikalliset(arg("--laheta-paikalliset"));
  const tilaF = join(AUTOMAATIO, "datahaku.json");
  const tehdyt = existsSync(tilaF) ? JSON.parse(readFileSync(tilaF, "utf8")) : {};
  const viikko = ajoviikko();
  if (lippu("--ajastettu") && (!viikko || tehdyt[viikko])) return 0;
  const vain = arg("--vain");
  if (vain && ![...LAHTEET, VERTAILU].includes(vain)) { console.error(`--vain: ${[...LAHTEET, VERTAILU].join(", ")}`); return 1; }
  if (vain === VERTAILU) return ajaVertailu();
  mkdirSync(AUTOMAATIO, { recursive: true });
  // Sama lukko kuin somejulkaisulla: kumpikin käyttää samaa profiilin kopiota.
  const lukko = join(AUTOMAATIO, "ajo.lukko");
  for (let i = 0; existsSync(lukko) && Date.now() - statSync(lukko).mtimeMs < 3 * 3600e3; i++) {
    if (i === 20) { loki("Somejulkaisu on yhä kesken, datahaku lopetetaan"); return 1; }
    await new Promise((ok) => setTimeout(ok, 60000));
  }
  writeFileSync(lukko, String(process.pid));
  if (lippu("--ajastettu")) { tehdyt[viikko] = hki(new Date(), { dateStyle: "short", timeStyle: "short" }); writeFileSync(tilaF, JSON.stringify(tehdyt, null, 1)); }
  let ctx, virheita = 0;
  try {
    const kansio = etsiProfiili();
    paivitaKopio(kansio);
    ctx = await kaynnista(kansio);
    const p = ctx.pages()[0] || (await ctx.newPage());
    const ajot = { search: searchConsole, merchant, instagram, tiktok };
    for (const lahde of vain ? [vain] : LAHTEET) {
      let r;
      try { r = await ajot[lahde](p); } catch (e) { r = { virhe: String(e?.message || e).split("\n")[0].slice(0, 200) }; }
      if (r.este) { virheita++; loki(lahde, "LOPETETTU:", r.este, "(ei ratkaista, ei kirjauduta)"); continue; }
      if (r.virhe) { virheita++; loki(lahde, "VIRHE:", r.virhe); continue; }
      for (const [otsikko, sisalto, n] of r.tulos) {
        const t = await tallenna(otsikko, sisalto);
        if (t.ok) loki(lahde, `tallennettu "${otsikko}"`, `${n} riviä`, t.id ? `#${t.id}` : "");
        else { virheita++; loki(lahde, `tallennus epäonnistui "${otsikko}":`, t.virhe || ""); }
      }
      if (r.huom) loki(lahde, "huom:", r.huom);
      await p.waitForTimeout(4000 + Math.random() * 4000);
    }
  } catch (e) {
    virheita++;
    loki("VIRHE", String(e?.message || e).split("\n")[0]);
  } finally {
    await ctx?.close().catch(() => {});
    rmSync(lukko, { force: true });
  }
  // Viikkovertailu lähteiden jälkeen (käyttää juuri tallennettuja tilannekuvia), ilman selainta.
  if (!vain) virheita += await ajaVertailu();
  return virheita ? 2 : 0;
}

async function ajaVertailu() {
  try {
    const v = await viikkovertailu();
    const t = await tallenna("Viikkovertailu", v.sisalto);
    loki(VERTAILU, t.ok ? 'tallennettu "Viikkovertailu"' : `paikallinen kopio, tallennus kantaan epäonnistui: ${t.virhe || ""}`, v.huom ? `huom: ${v.huom}` : "");
    return 0;
  } catch (e) {
    loki(VERTAILU, "VIRHE:", String(e?.message || e).split("\n")[0]);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(await main());
