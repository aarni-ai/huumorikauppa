#!/usr/bin/env node
/**
 * Taikalinkin testi (2.11.2026) oikealla selaimella tuotantoa vasten. Luo testilinkin (cron ?tehtava=
 * aktivointilinkki-viesti&testi=1), avaa sen Playwrightilla eikä tulosta sitä. Tarkistaa: avaus aktivoi ja antaa
 * evästeet (hk_hallinta_* ja hk_oma, 90 pv), /hallinta/mittarit aukeaa, tunniste poistuu osoiteriviltä, toinen avaus
 * (uusi selain) ei toimi ja pelkkä GET ilman JavaScriptiä (linkkiskanneri) ei kuluta linkkiä.
 *
 * Ajo: PLAYWRIGHT=/polku/node_modules/playwright/index.mjs node scripts/aktivointilinkki-testi.mjs
 */
import { readFileSync } from "node:fs";
const pw = await import(process.env.PLAYWRIGHT || "playwright");
const { chromium } = pw.default ?? pw;
const salaisuus = (readFileSync(new URL("../.env.cron.local", import.meta.url), "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
const SUORA = "https://huumorikauppa-five.vercel.app";
const KAUPPA = process.env.KAUPPA || "https://huumorikauppa.fi";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const r = await fetch(`${SUORA}/api/cron/tilaukset?tehtava=aktivointilinkki-viesti&testi=1`, { headers: { authorization: `Bearer ${salaisuus}` } });
const { linkki } = await r.json();
if (!linkki) { console.error("linkin luonti epäonnistui", r.status); process.exit(1); }
const testiLinkki = linkki.replace(/^https:\/\/[^/]+/, KAUPPA);
const tulos = [];
const ok = (nimi, ehto) => tulos.push(`${ehto ? "OK " : "VIRHE"} ${nimi}`);

// 1. Linkkiskanneri: GET ilman JavaScriptiä ei kuluta linkkiä.
const skanneri = await fetch(testiLinkki, { headers: { "user-agent": UA } });
ok("skannerin GET ei aktivoi (ei Set-Cookie)", !String(skanneri.headers.get("set-cookie") || "").includes("hk_hallinta_"));

const selain = await chromium.launch();
async function avaa() {
  const ctx = await selain.newContext({ userAgent: UA, locale: "fi-FI" });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const s = await ctx.newPage();
  await s.goto(testiLinkki, { waitUntil: "load" });
  await s.getByText(/Aktivoitu\.|vanhentunut tai jo käytetty/).first().waitFor({ timeout: 20000 });
  return { ctx, s };
}
// 2. Ensimmäinen avaus aktivoi.
const a = await avaa();
ok("avaus aktivoi", await a.s.getByText("Aktivoitu.").isVisible());
ok("tunniste poistui osoiteriviltä", !a.s.url().includes("t="));
const evasteet = await a.ctx.cookies(KAUPPA);
const nimet = evasteet.map((c) => c.name);
ok("evästeet hk_hallinta_mittarit, _some, _tarjoukset ja hk_oma", ["hk_hallinta_mittarit", "hk_hallinta_some", "hk_hallinta_tarjoukset", "hk_oma"].every((n) => nimet.includes(n)));
const ika = Math.round((evasteet.find((c) => c.name === "hk_oma").expires * 1000 - Date.now()) / 864e5);
ok(`eväste voimassa 90 pv (${ika})`, ika >= 89 && ika <= 90);
await a.s.goto(`${KAUPPA}/hallinta/mittarit`, { waitUntil: "load" });
await a.s.waitForTimeout(4000);
ok("/hallinta/mittarit aukeaa", !(await a.s.getByText("Ei pääsyä").isVisible().catch(() => false)));
// 3. Toinen avaus toisessa selaimessa ei toimi.
const b = await avaa();
ok("toinen avaus hylätään", await b.s.getByText(/vanhentunut tai jo käytetty/).isVisible());
ok("toinen selain ei saanut evästettä", !(await b.ctx.cookies(KAUPPA)).some((c) => c.name.startsWith("hk_hallinta_")));
await selain.close();
console.log(tulos.join("\n"));
process.exit(tulos.every((t) => t.startsWith("OK")) ? 0 : 1);
