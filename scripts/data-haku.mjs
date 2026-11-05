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
 * Otsikot: "Search Console 28 pv" (hakulausekkeet), "Search Console sivut 28 pv", "Merchant klikit" (tuotteet 28 pv),
 * "Instagram tilastot", "TikTok tilastot".
 *
 * Ajo:
 *   node scripts/data-haku.mjs                      kaikki lähteet
 *   node scripts/data-haku.mjs --vain merchant      yksi lähde (search, merchant, instagram, tiktok)
 *   node scripts/data-haku.mjs --kuiva              ei tallennusta (tulostaa rivimäärät ja alun)
 *   node scripts/data-haku.mjs --ajastettu          launchd: vain maanantaina klo 8 jälkeen Suomen aikaa, kerran viikossa
 * Ajastus: scripts/data-haku.plist (launchd joka tunti :05; skripti päättää Helsingin ajan mukaan, koska koneen
 * aikavyöhyke poikkeaa). Asennus: bash scripts/data-haku-asennus.sh
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
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
async function tallenna(otsikko, sisalto) {
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
  const muunna = (r) => [r[0], enLuku(r[1]), enLuku(r[2]), enLuku(r[3]), enLuku(r[4])];
  const tulos = [];
  tulos.push(["Search Console 28 pv", csv(["Kysely", "Klikkaukset", "Näyttökerrat", "CTR", "Sijainti"], kyselyt.map(muunna)), kyselyt.length]);
  if (sivut?.length) tulos.push(["Search Console sivut 28 pv", csv(["Sivu", "Klikkaukset", "Näyttökerrat", "CTR", "Sijainti"], sivut.map(muunna)), sivut.length]);
  return { tulos, huom: sivut?.length ? "" : "sivutaulukkoa ei saatu" };
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

async function main() {
  const tilaF = join(AUTOMAATIO, "datahaku.json");
  const tehdyt = existsSync(tilaF) ? JSON.parse(readFileSync(tilaF, "utf8")) : {};
  const viikko = ajoviikko();
  if (lippu("--ajastettu") && (!viikko || tehdyt[viikko])) return 0;
  const vain = arg("--vain");
  if (vain && !LAHTEET.includes(vain)) { console.error(`--vain: ${LAHTEET.join(", ")}`); return 1; }
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
  return virheita ? 2 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(await main());
