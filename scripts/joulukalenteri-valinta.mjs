#!/usr/bin/env node
/**
 * Joulukalenterin luukkujen valinta (4.11.2026): kirjoittaa api/_lib/joulukalenteri-data.js (24 luukkua: päivä, slug,
 * luukun hinta). Säännöt: scripts/lib/joulukalenteri-valinta.mjs.
 *
 * Tuotanto (oletus): suosio reitiltä /api/cron/tilaukset?tehtava=suosituimmat-tuotteet (maksetut tilausrivit 90 pv
 * painotettuna ja aidot tuotesivun katselut, vain slugit ja lukumäärät) CRON_SECRETillä (paikallinen .env.cron.local,
 * ei tulosteta), myytävät tuotteet kuluineen julkisesta /api/products-reitistä.
 *
 * --paikallinen: ilman verkkoa. Suosio = etusivun suosituimpien järjestys (api/_lib/top50.generated.js, kuten
 * src/components/EtusivunSuosituimmat.tsx), tuotteet = tuotannon tuotekuva 3.11.2026 (src/test/fixtures/kate-kaikki-2026-11-03.json).
 * --kuiva: tulostaa valinnan, ei kirjoita tiedostoa.
 *
 * Ajo: node scripts/joulukalenteri-valinta.mjs [--paikallinen] [--kuiva]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { valitseLuukut, dataTiedosto } from "./lib/joulukalenteri-valinta.mjs";
import { valmisteleRivi } from "../api/_lib/tuotteet.js";

const JUURI = new URL("..", import.meta.url).pathname;
const paikallinen = process.argv.includes("--paikallinen");
const kuiva = process.argv.includes("--kuiva");
const hki = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());

let jarjestys;
let tuotteet;
let lahde;
if (paikallinen) {
  const TOP50 = (await import("../api/_lib/top50.generated.js")).default;
  jarjestys = [...TOP50];
  tuotteet = JSON.parse(readFileSync(join(JUURI, "src/test/fixtures/kate-kaikki-2026-11-03.json"), "utf8")).tuotteet;
  lahde = "etusivun suosituimmat (top50.generated.js) ja tuotannon tuotekuva 3.11.2026";
} else {
  const tiedosto = join(JUURI, ".env.cron.local");
  let salaisuus = process.env.CRON_SECRET || "";
  if (!salaisuus && existsSync(tiedosto)) {
    salaisuus = (readFileSync(tiedosto, "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
  }
  if (!salaisuus) { console.error("CRON_SECRET puuttuu (.env.cron.local)."); process.exit(1); }
  // Suoraan uuteen projektiin (kuten scripts/mittarit.mjs): välitys katkaisee pitkät pyynnöt.
  const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";
  const r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=suosituimmat-tuotteet`, { headers: { authorization: `Bearer ${salaisuus}` } });
  if (!r.ok) { console.error(`Suosioreitti vastasi ${r.status}.`); process.exit(1); }
  const suosio = await r.json();
  jarjestys = suosio.tuotteet.map((t) => t.slug);
  const t = await fetch(`${kauppa}/api/products`);
  if (!t.ok) { console.error(`/api/products vastasi ${t.status}.`); process.exit(1); }
  tuotteet = await t.json();
  lahde = `tuotanto: ${suosio.paivia} pv tilaukset (paino ${suosio.osto_paino}) ja aidot katselut, ${suosio.tuotteet.length} tuotetta`;
}

const luukut = valitseLuukut(jarjestys, tuotteet.map(valmisteleRivi));
const eur = (x) => x.toFixed(2).replace(".", ",");
for (const l of luukut) {
  console.log(`${String(l.paiva).padStart(2)}.12. ${l.kategoria.padEnd(9)} ${eur(l.normaali)} -> ${eur(l.hinta)} €  kate vähintään ${eur(l.heikoinKate)} €  ${l.joulu ? "[joulu] " : ""}${l.nimi}`);
}
if (!kuiva) {
  writeFileSync(join(JUURI, "api/_lib/joulukalenteri-data.js"), dataTiedosto(luukut, { lahde, paiva: hki }));
  console.log("Kirjoitettu api/_lib/joulukalenteri-data.js");
}
