#!/usr/bin/env node
/**
 * Somevideoiden julkaisu koneelta (5.11.2026): Instagram Reels ja TikTok Huumorikauppa-Chrome-profiilin kopiolla.
 * Cowork ei saa videotiedostoja selaimen kautta palveluihin (CSP, CORS, verkon esto), joten julkaisu tehdään tällä
 * koneella Playwrightilla (playwright-core, channel "chrome"). Coworkin some-ajot tekevät vain vuorovaikutuksen ja tilastot.
 *
 * Profiili: kansio, jonka Preferences-tiedoston profile.name on "Huumorikauppa" (5.11.2026 "Profile 8"). Muihin
 * profiileihin ei kosketa. Profiili kopioidaan ennen jokaista ajoa kansioon ~/.huumorikauppa-some/chrome (välimuistit pois),
 * jotta käynnissä oleva Chrome ei lukitse sitä. Kopio käyttää macOS:n avainnippua (ei mock-keychainia), jotta evästeet
 * aukeavat. Kirjautumisia, salasanoja tai koodeja skripti ei syötä.
 *
 * Valinta: some/julkaisut.json järjestyksessä ensimmäinen video, jonka päivä on tänään tai aiemmin, jonka tiedosto on
 * kansiossa some/videot ja jota ei ole tiedostossa some/julkaistut.csv kyseiselle kanavalle. Enintään yksi video per
 * palvelu per ajo.
 *
 * Selain näyttää palveluille olevansa automaation ohjaama (Playwrightin oletus); tunnistusta ei piiloteta.
 *
 * Turvat: tili tarkistetaan ennen julkaisua (Instagram huumorikauppa_fi, TikTok @huumorikauppa). Jos tili on väärä,
 * kirjautuminen puuttuu tai sivulla on CAPTCHA tai tarkistus, palvelu ohitetaan ja syy kirjataan (some/julkaisuloki.txt).
 * Tahti on rauhallinen: satunnaiset tauot ja kirjoitus merkki kerrallaan.
 *
 * Tilastot: julkaisuista, joista on kulunut vähintään 7 päivää ja joilta rivi puuttuu some/tilastot.csv:stä, luetaan
 * näkyvät luvut (enintään yksi per palvelu per ajo). Jos lukuja ei saa luettua, se kirjataan lokiin.
 *
 * Ajo:
 *   node scripts/some-julkaisu.mjs                       Instagram, seuraava video (TikTok 12.11. alkaen puhelimesta)
 *   node scripts/some-julkaisu.mjs --palvelu instagram   vain Instagram (tai tiktok)
 *   node scripts/some-julkaisu.mjs --nro 01              tietty video (testi); ei ohita julkaistut.csv-tarkistusta
 *   node scripts/some-julkaisu.mjs --kuiva               kaikki vaiheet paitsi viimeinen julkaisupainike
 *   node scripts/some-julkaisu.mjs --tilastot            vain 7 päivän tilastot
 *   node scripts/some-julkaisu.mjs --ajastettu          launchd: ajaa vain ikkunassa 11.30-17.59 (aamu) tai 18.30-23.29
 *                                                        (ilta) Suomen aikaa ja kerran ikkunaa kohden
 * Ajastus: scripts/some-julkaisu.plist (launchd joka tunti :30, koska koneen aikavyöhyke voi poiketa Suomen ajasta;
 * skripti päättää ikkunan Helsingin ajan mukaan). Viimeinen ajopäivä 24.12.2026.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOME = join(JUURI, "some");
const VIDEOT = join(SOME, "videot");
const JULKAISTUT = join(SOME, "julkaistut.csv");
const TILASTOT = join(SOME, "tilastot.csv");
const LOKI = join(SOME, "julkaisuloki.txt");
const KUVAT = join(SOME, "kuvakaappaukset");
const AUTOMAATIO = join(homedir(), ".huumorikauppa-some");
const KOPIO = join(AUTOMAATIO, "chrome");
const CHROME = join(homedir(), "Library/Application Support/Google/Chrome");
const PROFIILIN_NIMI = "Huumorikauppa";
const VIIMEINEN_PAIVA = "2026-12-24";
export const TILIT = { instagram: "huumorikauppa_fi", tiktok: "huumorikauppa" };

const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const lippu = (n) => process.argv.includes(n);
const kuiva = lippu("--kuiva");
const vainTilastot = lippu("--tilastot");
const ajastettu = lippu("--ajastettu");
const pakotettu = arg("--nro");
// 12.11.2026: TikTok julkaistaan puhelimesta (/hallinta/some "Tämän päivän TikTok"): koneelta julkaistut videot saivat
// 0-1 näyttöä. Automaattinen ajo julkaisee vain Instagramiin; --palvelu tiktok toimii yhä käsiajona.
const palvelut = arg("--palvelu") ? [arg("--palvelu")] : ["instagram"];

const hki = (d = new Date(), o = {}) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki", ...o }).format(d);
const tanaan = () => hki();
const aika = () => hki(new Date(), { dateStyle: "short", timeStyle: "medium" });
const loki = (...x) => { const r = `${aika()} ${x.join(" ")}`; console.log(r); appendFileSync(LOKI, r + "\n"); };
const satunnainen = (a, b) => a + Math.random() * (b - a);
const tauko = (p, a = 1200, b = 3200) => p.waitForTimeout(Math.round(satunnainen(a, b)));

// ── Tiedostot ─────────────────────────────────────────────────────────────────────────────────────────────────────
const CSV_OTSIKKO = "nro,kanava,julkaistu,aika,tiedosto,url,tila";
export function lueJulkaistut(tiedosto = JULKAISTUT) {
  if (!existsSync(tiedosto)) return [];
  const [, ...rivit] = readFileSync(tiedosto, "utf8").trim().split(/\r?\n/);
  return rivit.filter(Boolean).map((r) => { const [nro, kanava, julkaistu, klo, tied, url, tila] = r.split(","); return { nro, kanava, julkaistu, aika: klo, tiedosto: tied, url, tila }; });
}
function kirjaaJulkaisu(r) {
  if (!existsSync(JULKAISTUT)) writeFileSync(JULKAISTUT, CSV_OTSIKKO + "\n");
  appendFileSync(JULKAISTUT, [r.nro, r.kanava, r.julkaistu, r.aika, r.tiedosto, r.url || "", r.tila || "julkaistu"].join(",") + "\n");
}

/** Seuraava julkaistava: listajärjestys, päivä <= tänään, tiedosto olemassa, ei julkaistu kanavalle. */
export function seuraava(lista, julkaistut, kanava, { paiva = tanaan(), videot = new Set(), nro = null } = {}) {
  const tehty = new Set(julkaistut.filter((r) => r.kanava === kanava).map((r) => r.nro));
  for (const j of lista) {
    if (nro ? j.nro !== nro : j.paiva > paiva) continue;
    if (tehty.has(j.nro) || !videot.has(`${j.nimi}.mp4`)) continue;
    return j;
  }
  return null;
}

/** Kuvateksti ja hashtagit erikseen (hashtagit valitaan ehdotuslistasta). */
export function osiin(kuvateksti, tagit = []) {
  const kaikki = tagit.length ? tagit : (kuvateksti.match(/#[\p{L}\p{N}_]+/gu) || []);
  const teksti = kuvateksti.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\s+/g, " ").trim();
  return { teksti, tagit: kaikki.map((t) => t.replace(/^#/, "")) };
}

// ── Profiili ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function etsiProfiili(chrome = CHROME, nimi = PROFIILIN_NIMI) {
  const osumat = [];
  for (const k of readdirSync(chrome)) {
    const f = join(chrome, k, "Preferences");
    if (!existsSync(f)) continue;
    try { if (JSON.parse(readFileSync(f, "utf8"))?.profile?.name === nimi) osumat.push(k); } catch { /* ohitetaan */ }
  }
  if (osumat.length !== 1) throw new Error(`Profiilia "${nimi}" ei löytynyt yksiselitteisesti (${osumat.join(", ") || "ei yhtään"})`);
  return osumat[0];
}

export function paivitaKopio(kansio) {
  mkdirSync(KOPIO, { recursive: true });
  for (const f of readdirSync(KOPIO)) if (f.startsWith("Singleton")) rmSync(join(KOPIO, f), { force: true });
  // Istuntotiedostot (Sessions*) pois: käynnissä oleva Chrome vaihtaa niitä kesken kopioinnin (rsync 23/24, 5.11.2026).
  const komento = ["-a", "--delete", ...["Cache", "Code Cache", "GPUCache", "DawnCache", "DawnGraphiteCache", "DawnWebGPUCache",
    "Service Worker/CacheStorage", "Service Worker/ScriptCache", "Singleton*", "Sessions", "Sessions_Encrypted"].flatMap((e) => ["--exclude", e]),
  `${join(CHROME, kansio)}/`, `${join(KOPIO, kansio)}/`];
  for (let yritys = 1; ; yritys++) {
    try { execFileSync("rsync", komento, { stdio: ["ignore", "ignore", "pipe"] }); return; } catch (e) {
      // 24 = tiedosto katosi kesken (kopio silti käyttökelpoinen); 23 = osa jäi kopioimatta, yritetään uudelleen.
      if (e.status === 24) return;
      if (e.status !== 23 || yritys === 3) throw new Error(`Profiilin kopiointi epäonnistui (rsync ${e.status}): ${String(e.stderr || "").split("\n")[0].slice(0, 160)}`);
      execFileSync("sleep", ["2"]);
    }
  }
}

// ── Selain ────────────────────────────────────────────────────────────────────────────────────────────────────────
export async function kaynnista(kansio) {
  const { chromium } = await import("playwright-core");
  return chromium.launchPersistentContext(KOPIO, {
    channel: "chrome", headless: false, viewport: { width: 1280, height: 900 }, locale: "fi-FI",
    args: [`--profile-directory=${kansio}`],
    ignoreDefaultArgs: ["--use-mock-keychain", "--password-store=basic"],
  });
}

async function kuva(p, nimi) {
  mkdirSync(KUVAT, { recursive: true });
  const f = join(KUVAT, `${hki(new Date(), { dateStyle: "short" })}-${new Date().toISOString().slice(11, 19).replace(/:/g, "")}-${nimi}.png`);
  await p.screenshot({ path: f }).catch(() => {});
  return f;
}

const CAPTCHA = /captcha|drag the slider|vedä liukusäädin|fit the puzzle|verify to continue|vahvista, että olet ihminen|confirm it's you|we suspect automated|epäilemme automaattista/i;
export async function esteet(p, kanava) {
  const url = p.url();
  if (/\/accounts\/login|\/login(\?|\/|$)/.test(url)) return "kirjautuminen puuttuu";
  if (/\/challenge\/|\/checkpoint\//.test(url)) return "tarkistus (challenge)";
  if (await p.locator('#captcha-verify-container, #captcha_container, .captcha_verify_container, iframe[src*="captcha"], [class*="captcha" i]').first().isVisible().catch(() => false)) return "CAPTCHA";
  const teksti = await p.locator("body").innerText().catch(() => "");
  if (CAPTCHA.test(teksti.slice(0, 5000))) return `CAPTCHA tai tarkistus (${kanava})`;
  return null;
}

/** Kirjoitus ihmismäisesti. Hashtagit: kirjoitetaan #tagi ja valitaan sama tagi ehdotuslistasta. */
async function kirjoita(p, teksti) {
  for (const m of teksti) await p.keyboard.type(m, { delay: Math.round(satunnainen(45, 140)) });
}
async function hashtag(p, tagi) {
  await kirjoita(p, `#${tagi}`);
  await p.waitForTimeout(Math.round(satunnainen(1800, 3000)));
  // Ehdotus: yksi ehdotusrivi kuvatekstikentän ulkopuolella. Rivillä on täsmälleen yksi tagi (ensimmäinen rivi #tagi)
  // ja julkaisumäärä (numero), jolloin koko lista ja esikatselun kuvateksti eivät kelpaa. Pienin osuma valitaan.
  const piste = await p.evaluate((tg) => {
    const haku = `#${tg.toLowerCase()}`;
    let paras = null;
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest('[contenteditable="true"]') || !el.innerText) continue;
      const rivit = el.innerText.split("\n").map((x) => x.trim()).filter(Boolean);
      if (rivit[0]?.toLowerCase() !== haku || rivit.filter((x) => x.startsWith("#")).length !== 1 || !rivit.slice(1).some((x) => /\d/.test(x))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 20 || r.height < 10 || r.bottom < 0 || r.top > innerHeight) continue;
      const ala = r.width * r.height;
      if (!paras || ala < paras.ala) paras = { x: r.left + Math.min(r.width / 2, 120), y: r.top + r.height / 2, ala };
    }
    return paras;
  }, tagi);
  if (piste) { await p.mouse.click(piste.x, piste.y); await tauko(p, 700, 1500); return "ehdotus"; }
  await kirjoita(p, " ");
  return "kirjoitettu";
}

// ── Instagram ─────────────────────────────────────────────────────────────────────────────────────────────────────
async function instagramTili(p) {
  await p.goto("https://www.instagram.com/accounts/edit/", { waitUntil: "domcontentloaded" });
  await tauko(p, 4000, 6500);
  const este = await esteet(p, "instagram");
  if (este) return { este };
  // 7.11.2026: 5.11. klo 18.30 sivu oli vielä latausruudussa (Instagram-logo), ja tarkistus tulkitsi sen vääräksi
  // tiliksi. Odotetaan sisältöä enintään 30 s ennen päätöstä.
  let teksti = "";
  for (let i = 0; i < 10; i++) {
    teksti = await p.locator("main, body").first().innerText().catch(() => "");
    if (teksti.includes(TILIT.instagram) || teksti.trim().length > 200) break;
    await p.waitForTimeout(3000);
  }
  return teksti.includes(TILIT.instagram) ? { ok: true } : { este: `väärä tili (odotettu ${TILIT.instagram})` };
}

async function julkaiseInstagram(p, j) {
  const t = await instagramTili(p);
  if (!t.ok) return { este: t.este, kuva: await kuva(p, "ig-este") };
  await p.goto("https://www.instagram.com/", { waitUntil: "domcontentloaded" });
  await tauko(p, 3500, 6000);
  await p.locator('svg[aria-label="Uusi julkaisu"], svg[aria-label="New post"]').first().click();
  await tauko(p);
  const alavalikko = p.getByRole("link", { name: /^Julkaise$|^Julkaisu$|^Post$/ }).or(p.getByText(/^Julkaise$|^Julkaisu$|^Post$/, { exact: true })).first();
  if (await alavalikko.isVisible().catch(() => false)) { await alavalikko.click(); await tauko(p); }
  await p.locator('input[type="file"]').first().setInputFiles(join(VIDEOT, `${j.nimi}.mp4`));
  await tauko(p, 3000, 5000);
  const ok = p.getByRole("button", { name: /^OK$/ });
  if (await ok.isVisible().catch(() => false)) { await ok.click(); await tauko(p); }
  // Rajaus: alkuperäinen kuvasuhde (9:16).
  const rajaus = p.locator('svg[aria-label="Valitse rajaus"], svg[aria-label="Select crop"]').first();
  if (await rajaus.isVisible().catch(() => false)) {
    await rajaus.click(); await tauko(p, 800, 1600);
    const alkup = p.getByText(/^Alkuperäinen$|^Original$/).first();
    if (await alkup.isVisible().catch(() => false)) { await alkup.click(); await tauko(p, 800, 1600); }
  }
  for (let i = 0; i < 2; i++) {
    await p.getByRole("button", { name: /^Seuraava$|^Next$/ }).or(p.locator('div[role="button"]:text-is("Seuraava"), div[role="button"]:text-is("Next")')).first().click();
    await tauko(p, 2500, 4500);
  }
  const { teksti, tagit } = osiin(j.kuvateksti, j.tagit);
  const kentta = p.locator('div[role="textbox"][contenteditable="true"]').first();
  await kentta.click();
  await tauko(p, 800, 1500);
  await kirjoita(p, `${teksti} `);
  const tavat = [];
  for (const tg of tagit) tavat.push(await hashtag(p, tg));
  await tauko(p, 1500, 3000);
  const ennen = await kuva(p, "ig-ennen-jakoa");
  if (kuiva) return { kuiva: true, kuva: ennen, tavat };
  await p.getByRole("button", { name: /^Jaa$|^Share$/ }).or(p.locator('div[role="button"]:text-is("Jaa"), div[role="button"]:text-is("Share")')).first().click();
  const valmis = p.getByText(/Kelasi (on )?jaett|Julkaisusi (on )?jaett|Your reel has been shared|Your post has been shared/).first();
  await valmis.waitFor({ timeout: 300000 });
  await tauko(p, 2000, 3500);
  const jalkeen = await kuva(p, "ig-jaettu");
  // Uusin kela profiilista.
  await p.goto(`https://www.instagram.com/${TILIT.instagram}/reels/`, { waitUntil: "domcontentloaded" });
  await tauko(p, 4000, 6000);
  const href = await p.locator('a[href*="/reel/"]').first().getAttribute("href").catch(() => null);
  return { ok: true, url: href ? `https://www.instagram.com${href.replace(new RegExp(`^/${TILIT.instagram}`), "")}` : "", kuva: jalkeen, tavat };
}

// ── TikTok ────────────────────────────────────────────────────────────────────────────────────────────────────────
async function tiktokTili(p) {
  await p.goto("https://www.tiktok.com/tiktokstudio/upload?from=creator_center", { waitUntil: "domcontentloaded" });
  await tauko(p, 5000, 8000);
  const este = await esteet(p, "tiktok");
  if (este) return { este };
  const tili = await p.evaluate(async () => {
    const r = await fetch("/passport/web/account/info/", { credentials: "include" }).catch(() => null);
    const j = r && r.ok ? await r.json().catch(() => null) : null;
    return j?.data?.username || null;
  });
  if (!tili) return { este: "tilin nimeä ei saatu (kirjautuminen?)" };
  return tili === TILIT.tiktok ? { ok: true } : { este: `väärä tili @${tili} (odotettu @${TILIT.tiktok})` };
}

/** TikTokin ponnahdusikkunat: ohjevihjeet suljetaan, asetusmuutoksia (esim. sisällön automaattiset tarkistukset) ei hyväksytä. */
async function suljeTiktokIkkunat(p) {
  for (let k = 0; k < 3; k++) {
    let suljettu = false;
    const asetus = p.locator('div[role="dialog"], [class*="modal" i]').filter({ hasText: /Otetaanko|Turn on|automaattiset tarkistukset|automatic content checks/i });
    if (await asetus.first().isVisible().catch(() => false)) {
      await asetus.first().getByRole("button", { name: /^Peruuta$|^Cancel$|^Ei nyt$|^Not now$/ }).first().click().catch(() => {});
      suljettu = true;
    }
    for (const nimi of [/^Selvä$/, /^Got it$/, /^OK$/]) {
      const b = p.getByRole("button", { name: nimi });
      if (await b.first().isVisible().catch(() => false)) { await b.first().click().catch(() => {}); suljettu = true; }
    }
    if (!suljettu) return;
    await tauko(p, 800, 1600);
  }
}

async function julkaiseTiktok(p, j) {
  const t = await tiktokTili(p);
  if (!t.ok) return { este: t.este, kuva: await kuva(p, "tt-este") };
  await p.locator('input[type="file"]').first().setInputFiles(join(VIDEOT, `${j.nimi}.mp4`));
  // Lataus valmis, kun kuvatekstikenttä ja julkaisupainike ovat käytössä.
  const kentta = p.locator('div.public-DraftEditor-content[contenteditable="true"], div[contenteditable="true"]').first();
  await kentta.waitFor({ timeout: 180000 });
  await p.locator('button[data-e2e="post_video_button"]:not([disabled]), button:has-text("Julkaise"):not([disabled]), button:has-text("Post"):not([disabled])').first().waitFor({ timeout: 300000 });
  await tauko(p, 2500, 4500);
  await suljeTiktokIkkunat(p);
  const este = await esteet(p, "tiktok");
  if (este) return { este, kuva: await kuva(p, "tt-este") };
  await kentta.click();
  await p.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await p.keyboard.press("Backspace");
  await tauko(p, 800, 1500);
  const { teksti, tagit } = osiin(j.kuvateksti, j.tagit);
  await kirjoita(p, `${teksti} `);
  const tavat = [];
  for (const tg of tagit) tavat.push(await hashtag(p, tg));
  await tauko(p, 1500, 3000);
  await suljeTiktokIkkunat(p);
  const ennen = await kuva(p, "tt-ennen-julkaisua");
  if (kuiva) return { kuiva: true, kuva: ennen, tavat };
  await p.locator('button[data-e2e="post_video_button"], button:has-text("Julkaise"), button:has-text("Post")').first().click();
  await tauko(p, 3000, 5000);
  // Mahdollinen sisältötarkistuksen vahvistus.
  const heti = p.getByRole("button", { name: /Julkaise nyt|Post now/ });
  if (await heti.isVisible().catch(() => false)) { await heti.click(); await tauko(p, 3000, 5000); }
  await Promise.race([
    p.waitForURL(/tiktokstudio\/content|\/manage/, { timeout: 300000 }),
    p.getByText(/Videosi on julkaistu|julkaistaan|Your video has been uploaded|Your video is being uploaded|has been posted/i).first().waitFor({ timeout: 300000 }),
  ]);
  await tauko(p, 4000, 7000);
  const jalkeen = await kuva(p, "tt-julkaistu");
  // Uuden videon osoite sisältölistalta: rivi, jonka teksti alkaa kuvatekstin alulla.
  if (!/tiktokstudio\/content/.test(p.url())) { await p.goto("https://www.tiktok.com/tiktokstudio/content", { waitUntil: "domcontentloaded" }); await tauko(p, 5000, 8000); }
  const alku = teksti.slice(0, 25);
  const url = await p.evaluate((a) => {
    for (const l of document.querySelectorAll('a[href*="/video/"]')) {
      let el = l;
      for (let i = 0; i < 6 && el; i++, el = el.parentElement) if ((el.innerText || "").includes(a)) return l.href;
    }
    return "";
  }, alku).catch(() => "");
  return { ok: true, url, kuva: jalkeen, tavat };
}

// ── Tilastot (7 pv) ───────────────────────────────────────────────────────────────────────────────────────────────
const TILASTO_OTSIKKO = "nro,kanava,julkaistu,katselut,keskikatseluaika_s,katsottu_loppuun_pct,tykkaykset,kommentit,jaot,tallennukset,profiilikaynnit,linkkiklikit";
const luku = (s) => { if (!s) return ""; const m = String(s).replace(/\s/g, "").replace(",", ".").match(/^([\d.]+)(k|t|m|milj)?/i); if (!m) return ""; const k = { k: 1e3, t: 1e3, m: 1e6, milj: 1e6 }[String(m[2] || "").toLowerCase()] || 1; return String(Math.round(Number(m[1]) * k)); };
function poimi(teksti, nimet) {
  for (const n of nimet) {
    const m = teksti.match(new RegExp(`${n}\\s*\\n?\\s*([\\d][\\d\\s.,]*\\s?(?:k|t|m|milj)?)`, "i")) || teksti.match(new RegExp(`([\\d][\\d\\s.,]*\\s?(?:k|t|m|milj)?)\\s*\\n?\\s*${n}`, "i"));
    if (m) return luku(m[1]);
  }
  return "";
}

async function tilastot(p, kanava, julkaistut) {
  const olemassa = existsSync(TILASTOT) ? readFileSync(TILASTOT, "utf8") : "";
  const raja = hki(new Date(Date.now() - 7 * 864e5));
  const kohde = julkaistut.find((r) => r.kanava === kanava && r.tila === "julkaistu" && r.julkaistu <= raja && r.url
    && !olemassa.split("\n").some((x) => x.startsWith(`${r.nro},${kanava},`)));
  if (!kohde) return null;
  try {
    const id = kanava === "tiktok" ? kohde.url.match(/video\/(\d+)/)?.[1] : null;
    await p.goto(id ? `https://www.tiktok.com/tiktokstudio/analytics/${id}` : kohde.url, { waitUntil: "domcontentloaded" });
    await tauko(p, 4000, 7000);
    if (await esteet(p, kanava)) return { virhe: "este tilastosivulla" };
    if (kanava === "instagram") {
      const b = p.getByRole("button", { name: /Näytä tilastot|View insights/ }).or(p.getByText(/Näytä tilastot|View insights/)).first();
      if (await b.isVisible().catch(() => false)) { await b.click(); await tauko(p, 3000, 5000); }
    }
    const t = await p.locator("body").innerText();
    const r = {
      katselut: poimi(t, ["Videon katselukerrat", "Näyttökerrat", "Toistot", "Katselukerrat", "Katselut", "Plays", "Video views", "Views"]),
      keskikatseluaika_s: poimi(t, ["Keskimääräinen katseluaika", "Average watch time"]), katsottu_loppuun_pct: poimi(t, ["Katsottu kokonaan", "Watched full video"]),
      tykkaykset: poimi(t, ["Tykkäykset", "tykkäystä", "Likes"]), kommentit: poimi(t, ["Kommentit", "kommenttia", "Comments"]),
      jaot: poimi(t, ["Jaot", "Jakoja", "Shares"]), tallennukset: poimi(t, ["Tallennukset", "Saves"]),
      profiilikaynnit: poimi(t, ["Profiilikäynnit", "Profile visits"]), linkkiklikit: "",
    };
    await kuva(p, `${kanava === "instagram" ? "ig" : "tt"}-tilastot-${kohde.nro}`);
    if (!r.katselut && !r.tykkaykset) return { virhe: `lukuja ei saatu sivulta (${kohde.nro})` };
    if (!existsSync(TILASTOT)) writeFileSync(TILASTOT, TILASTO_OTSIKKO + "\n");
    appendFileSync(TILASTOT, [kohde.nro, kanava, kohde.julkaistu, r.katselut, r.keskikatseluaika_s, r.katsottu_loppuun_pct, r.tykkaykset, r.kommentit, r.jaot, r.tallennukset, r.profiilikaynnit, r.linkkiklikit].join(",") + "\n");
    return { ok: true, nro: kohde.nro, ...r };
  } catch (e) {
    return { virhe: String(e?.message || e).slice(0, 160) };
  }
}

/** Ajoikkuna Helsingin ajassa: "VVVV-KK-PP aamu" (11.30-17.59) tai "... ilta" (18.30-23.29), muuten null. */
export function ajoikkuna(nyt = new Date()) {
  const [h, m] = hki(nyt, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).split(":").map(Number);
  const min = h * 60 + m;
  if (min >= 11 * 60 + 30 && min < 18 * 60) return `${hki(nyt)} aamu`;
  if (min >= 18 * 60 + 30 && min < 23 * 60 + 30) return `${hki(nyt)} ilta`;
  return null;
}

// ── Pääohjelma ────────────────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  if (tanaan() > VIIMEINEN_PAIVA && !pakotettu) { loki("Ajastus päättynyt", VIIMEINEN_PAIVA); return 0; }
  const ikkuna = ajoikkuna();
  const tilaF = join(AUTOMAATIO, "ajot.json");
  const tehdyt = existsSync(tilaF) ? JSON.parse(readFileSync(tilaF, "utf8")) : {};
  if (ajastettu) {
    if (!ikkuna) return 0;
    if (tehdyt[ikkuna]) return 0;
  }
  const lukko = join(AUTOMAATIO, "ajo.lukko");
  mkdirSync(AUTOMAATIO, { recursive: true });
  if (existsSync(lukko) && Date.now() - statSync(lukko).mtimeMs < 3 * 3600e3) { loki("Edellinen ajo on kesken, lopetetaan"); return 1; }
  writeFileSync(lukko, String(process.pid));
  let ctx;
  let virheita = 0;
  try {
    const kansio = etsiProfiili();
    paivitaKopio(kansio);
    const lista = JSON.parse(readFileSync(join(SOME, "julkaisut.json"), "utf8"));
    const videot = new Set(readdirSync(VIDEOT));
    const puuttuvat = lista.filter((j) => j.paiva <= tanaan() && !videot.has(`${j.nimi}.mp4`)).map((j) => j.nro);
    if (puuttuvat.length) loki("HUOM: videotiedosto puuttuu kansiosta some/videot, ohitetaan:", puuttuvat.join(" "), "(node scripts/some-videot.mjs --vain NRO)");
    if (ajastettu) { tehdyt[ikkuna] = aika(); writeFileSync(tilaF, JSON.stringify(tehdyt, null, 1)); }
    ctx = await kaynnista(kansio);
    const p = ctx.pages()[0] || (await ctx.newPage());
    for (const kanava of palvelut) {
      const julkaistut = lueJulkaistut();
      if (!vainTilastot) {
        const j = seuraava(lista, julkaistut, kanava, { videot, nro: pakotettu });
        if (!j) loki(kanava, "ei julkaistavaa videota");
        else {
          loki(kanava, `aloitetaan video ${j.nro} (${j.nimi})${kuiva ? " kuivana" : ""}`);
          let r;
          try { r = kanava === "instagram" ? await julkaiseInstagram(p, j) : await julkaiseTiktok(p, j); }
          catch (e) { r = { virhe: String(e?.message || e).split("\n")[0].slice(0, 200), kuva: await kuva(p, `${kanava}-virhe`) }; }
          if (r.ok) {
            kirjaaJulkaisu({ nro: j.nro, kanava, julkaistu: tanaan(), aika: hki(new Date(), { timeStyle: "short" }), tiedosto: `${j.nimi}.mp4`, url: r.url });
            loki(kanava, `JULKAISTU ${j.nro}`, r.url || "", `hashtagit: ${r.tavat.join("/")}`, `kuva ${r.kuva}`);
          } else if (r.kuiva) loki(kanava, `kuiva ajo valmis ${j.nro}`, `hashtagit: ${r.tavat.join("/")}`, `kuva ${r.kuva}`);
          else { virheita++; loki(kanava, `EI JULKAISTU ${j.nro}:`, r.este || r.virhe, r.kuva ? `kuva ${r.kuva}` : ""); if (r.este) continue; }
          await tauko(p, 20000, 45000);
        }
      }
      const ts = await tilastot(p, kanava, lueJulkaistut());
      if (ts?.ok) loki(kanava, `tilastot ${ts.nro}: katselut ${ts.katselut}, tykkäykset ${ts.tykkaykset}, kommentit ${ts.kommentit}`);
      else if (ts?.virhe) loki(kanava, "tilastot:", ts.virhe);
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
