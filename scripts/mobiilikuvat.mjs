#!/usr/bin/env node
/**
 * Mobiilin ensivaikutelma (3.11.2026): mitä kävijä näkee ensimmäisen 3 sekunnin aikana. Kuvakaappaukset ja mittaukset
 * laskeutumis- ja tuotesivuista iPhonella ja Androidilla (Chromiumin laite-emulointi), myös hitaalla 4G:llä
 * (Lighthousen "Slow 4G": 150 ms, 1,6 Mbit/s alas, 750 kbit/s ylös, prosessori 4x hitaampi).
 *
 * Jokaisesta ajosta: kuva 3 s kohdalla ja latauksen jälkeen (ensimmäinen näkymä), FCP, LCP, milloin H1 ja hinta
 * näkyvät ensimmäisessä näkymässä, ja näkyykö tuotekuva ilman vieritystä. Laskurit ohittavat ajon
 * (__suppiloTesti, navigator.webdriver).
 *
 * Ajo: PLAYWRIGHT=/polku/node_modules/playwright/index.mjs node scripts/mobiilikuvat.mjs <kansio> [polku ...]
 *      KAUPPA=https://huumorikauppa-xxx.vercel.app vertaa esikatseluversiota.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pw = await import(process.env.PLAYWRIGHT || "playwright");
const KAUPPA = process.env.KAUPPA || "https://huumorikauppa.fi";
const KANSIO = process.argv[2] || "mobiilikuvat";
const OLETUSPOLUT = [
  // Laskeutumissivut: oman laskurin suurimmat osiot ja Search Consolen eniten näytetyt sivut
  "/", "/blogi/mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea", "/blogi/hauska-lahja-kaverille", "/blogi/hauskat-lahjat-tyokavereille-opas",
  "/lahjat/60-vuotiaalle-miehelle", "/lahjat/50-vuotiaalle-miehelle", "/hauska-isanpaivalahja", "/isanpaivalahja", "/joululahjat", "/kaikki-tuotteet",
  // Tuotesivut: myydyimmät ja somevideoiden tuotteet
  "/tuote/tonnin-seteli-t-paita", "/tuote/tonnin-seteli-huppari", "/tuote/kuka-koski-termostaattiin-huppari-isalle",
  "/tuote/sammuta-valot-sahko-maksaa-t-paita-isalle", "/tuote/en-nuku-lepuutan-silmia-t-paita-isalle",
  "/tuote/pikkujoulut-muistan-osittain-t-paita-pikkujouluihin", "/tuote/passissa-14-tuntia-hirvi-naki-minut-t-paita-metsastajalle",
  "/tuote/isa-tietaa-oikotien-aina-t-paita-isalle", "/tuote/kiltti-enimmakseen-t-paita-jouluun", "/tuote/maailman-paras-aiti-huppari",
];
const polut = process.argv.length > 3 ? process.argv.slice(3) : OLETUSPOLUT;
const PROFIILIT = [
  { nimi: "iphone", laite: "iPhone 14", verkko: null },
  { nimi: "android", laite: "Pixel 7", verkko: null },
  { nimi: "android-hidas4g", laite: "Pixel 7", verkko: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 }, cpu: 4 },
];

mkdirSync(KANSIO, { recursive: true });
const selain = await pw.chromium.launch();
const tulokset = [];

async function aja(polku, p) {
  {
    const konteksti = await selain.newContext({ ...pw.devices[p.laite], locale: "fi-FI" });
    await konteksti.addInitScript(() => {
      window.__suppiloTesti = true;
      window.__mitat = { lcp: 0, h1: 0, hinta: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__mitat.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      const nakyy = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.height > 0 && r.top < innerHeight && r.bottom > 0 && getComputedStyle(el).visibility !== "hidden"; };
      const tarkkaile = () => {
        const m = window.__mitat;
        if (!m.h1 && nakyy(document.querySelector("h1"))) m.h1 = performance.now();
        if (!m.hinta) {
          const hinta = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && /\d+,\d{2}\s?€/.test(e.textContent || "") && nakyy(e));
          if (hinta) m.hinta = performance.now();
        }
        if (!m.h1 || !m.hinta) requestAnimationFrame(tarkkaile);
      };
      requestAnimationFrame(tarkkaile);
    });
    const sivu = await konteksti.newPage();
    if (p.verkko) {
      const cdp = await konteksti.newCDPSession(sivu);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", { offline: false, ...p.verkko });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpu });
    }
    const nimi = `${polku === "/" ? "etusivu" : polku.replace(/^\//, "").replace(/\//g, "_")}-${p.nimi}`;
    const alku = Date.now();
    sivu.goto(`${KAUPPA}${polku}`, { waitUntil: "load", timeout: 60000 }).catch(() => undefined);
    await sivu.waitForTimeout(3000 - (Date.now() - alku));
    await sivu.screenshot({ path: join(KANSIO, `${nimi}-3s.png`), timeout: 4000 }).catch(() => undefined);
    await sivu.waitForLoadState("load", { timeout: 12000 }).catch(() => undefined);
    await sivu.waitForTimeout(1500);
    await sivu.screenshot({ path: join(KANSIO, `${nimi}-valmis.png`), timeout: 15000 }).catch(() => undefined);
    const m = await sivu.evaluate(() => {
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0;
      const nav = performance.getEntriesByType("navigation")[0];
      const kuva = [...document.querySelectorAll("main img")].find((i) => { const r = i.getBoundingClientRect(); return r.width > 150 && r.top < innerHeight; });
      const h1 = document.querySelector("h1")?.textContent?.trim().slice(0, 90) || "";
      const tuotteita = [...document.querySelectorAll("a[href^='/tuote/']")].filter((a) => a.getBoundingClientRect().top < innerHeight).length;
      return { fcp: Math.round(fcp), lcp: Math.round(window.__mitat.lcp), h1Nakyy: Math.round(window.__mitat.h1), hintaNakyy: Math.round(window.__mitat.hinta), load: Math.round(nav?.loadEventEnd || 0), kuvaEnsinakymassa: Boolean(kuva), tuotelinkkejaEnsinakymassa: tuotteita, h1 };
    });
    tulokset.push({ polku, profiili: p.nimi, ...m });
    console.log(`${p.nimi.padEnd(16)} ${polku.padEnd(62)} FCP ${m.fcp} LCP ${m.lcp} H1 ${m.h1Nakyy || "-"} hinta ${m.hintaNakyy || "-"} kuva ${m.kuvaEnsinakymassa ? "kyllä" : "ei"} tuotteita ${m.tuotelinkkejaEnsinakymassa}`);
    await konteksti.close();
  }
}
const jono = polut.flatMap((polku) => PROFIILIT.map((p) => [polku, p]));
await Promise.all(Array.from({ length: 4 }, async () => { while (jono.length) { const [polku, p] = jono.shift(); await aja(polku, p).catch((e) => console.log(`virhe ${p.nimi} ${polku}: ${e.message.split("\n")[0]}`)); } }));
await selain.close();
writeFileSync(join(KANSIO, "mitat.json"), JSON.stringify(tulokset, null, 1));
