#!/usr/bin/env node
/**
 * Coworkin syöte koneelle (5.11.2026): /hallinta/syote-sivulle liitetyt tekstit ja CSV:t tuotannon tietokannasta
 * (cron ?tehtava=syote, CRON_SECRET tiedostosta .env.cron.local, ei tulosteta).
 *
 * Ajo:
 *   node scripts/syote-lue.mjs                         5 uusinta merkintää (otsikko, aika, alku)
 *   node scripts/syote-lue.mjs --otsikko "search"      otsikon osan mukaan (kirjainkoosta riippumatta)
 *   node scripts/syote-lue.mjs --id 12 --koko          yksi merkintä kokonaan
 *   node scripts/syote-lue.mjs --maara 20              useampi
 *   node scripts/syote-lue.mjs --tallenna              tallentaa sisällöt kansioon .cowork/syote/ (ei repoon)
 *   node scripts/syote-lue.mjs --analyysi              Search Console: hakulausekkeet sijainnilla 5-30 ja sijainnit
 *                                                      viikoittain; Merchant: paljon näyttöjä, vähän klikkejä
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { jasennaCsv, hakuKohteet, sijaintiSeuranta, merchantKohteet } from "../api/_lib/hallintasyote.js";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);
const lippu = (n) => process.argv.includes(n);

const tiedosto = join(JUURI, ".env.cron.local");
const salaisuus = process.env.CRON_SECRET || (existsSync(tiedosto) ? (readFileSync(tiedosto, "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] || "").trim().replace(/^"|"$/g, "") : "");
if (!salaisuus) { console.error("CRON_SECRET puuttuu (.env.cron.local)."); process.exit(1); }
const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";

async function hae(params) {
  const u = new URL(`${kauppa}/api/cron/tilaukset`);
  u.searchParams.set("tehtava", "syote");
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, String(v));
  for (let yritys = 1; ; yritys++) {
    try {
      const r = await fetch(u, { headers: { authorization: `Bearer ${salaisuus}` }, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`Reitti vastasi ${r.status}`);
      return (await r.json()).merkinnat;
    } catch (e) {
      if (yritys === 4) { console.error(`Yhteys epäonnistui: ${e?.message || e}`); process.exit(1); }
      await new Promise((ok) => setTimeout(ok, 5000 * yritys));
    }
  }
}

const hki = (d) => new Date(d).toLocaleString("fi-FI", { timeZone: "Europe/Helsinki", dateStyle: "short", timeStyle: "short" });
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

if (lippu("--analyysi")) {
  const haku = await hae({ otsikko: arg("--otsikko") || "search console", maara: 12 });
  const hakuKyselyt = haku.filter((m) => !/sivut/i.test(m.otsikko));
  if (!hakuKyselyt.length) console.log("Search Console: ei merkintöjä (Cowork liittää otsikolla \"Search Console 28 pv\").");
  else {
    const uusin = hakuKyselyt[0];
    const a = hakuKohteet(jasennaCsv(uusin.sisalto));
    console.log(`Search Console #${uusin.id} ${uusin.otsikko} (${hki(uusin.luotu)}): ${a.virhe || `${a.kohteet.length} hakulauseketta sijainnilla 5-30`}`);
    for (const k of a.kohteet.slice(0, 40)) console.log(`  ${String(k.sijainti).padStart(5)}  ${String(k.nayttot).padStart(6)} näyttöä ${String(k.klikit).padStart(4)} klikkiä  ${k.kysely || k.sivu}`);
    const seuranta = sijaintiSeuranta(hakuKyselyt);
    const kohteet = new Set(a.kohteet.map((k) => k.kysely || k.sivu));
    const muuttuneet = Object.entries(seuranta).filter(([k, v]) => kohteet.has(k) && v.length > 1);
    if (muuttuneet.length) {
      console.log("Sijainti viikoittain (vanhin -> uusin):");
      for (const [k, v] of muuttuneet.slice(0, 40)) console.log(`  ${k}: ${v.map((x) => `${x.pvm.slice(5)} ${x.sijainti}`).join(" -> ")}`);
    }
  }
  const merchant = await hae({ otsikko: "merchant", maara: 1 });
  if (!merchant.length) console.log("Merchant: ei merkintöjä (Cowork liittää otsikolla \"Merchant klikit\").");
  else {
    const m = merchantKohteet(jasennaCsv(merchant[0].sisalto), { minNaytot: Number(arg("--min-naytot")) || 100 });
    console.log(`Merchant #${merchant[0].id} ${merchant[0].otsikko} (${hki(merchant[0].luotu)}): ${m.virhe || `${m.kohteet.length} tuotetta, joilla paljon näyttöjä ja klikkausprosentti alle puolet keskiarvosta ${(100 * (m.keskiarvo || 0)).toFixed(2)} %`}`);
    for (const t of m.kohteet.slice(0, 40)) console.log(`  ${String(t.nayttot).padStart(6)} näyttöä ${String(t.klikit).padStart(4)} klikkiä ${(100 * t.ctr).toFixed(2).padStart(6)} %  ${t.tuote || ""} ${t.id ? `(${t.id})` : ""}`);
  }
  process.exit(0);
}

const merkinnat = await hae({ id: arg("--id"), otsikko: arg("--otsikko"), maara: arg("--maara") || 5 });
if (!merkinnat.length) { console.log("Ei merkintöjä."); process.exit(0); }
for (const m of merkinnat) {
  const rivit = m.sisalto.split(/\r?\n/);
  console.log(`#${m.id}  ${m.otsikko}  ${hki(m.luotu)}  ${m.muoto}, ${m.rivit} riviä`);
  console.log((lippu("--koko") ? rivit : rivit.slice(0, 8)).map((r) => `  ${r}`).join("\n"));
  if (!lippu("--koko") && rivit.length > 8) console.log(`  ... (${rivit.length - 8} riviä lisää, --id ${m.id} --koko)`);
  if (lippu("--tallenna")) {
    const kansio = join(JUURI, ".cowork", "syote");
    mkdirSync(kansio, { recursive: true, mode: 0o700 });
    const f = join(kansio, `${m.id}-${slug(m.otsikko)}.${m.muoto.startsWith("csv") ? "csv" : "txt"}`);
    writeFileSync(f, m.sisalto);
    console.log(`  Tallennettu ${f}`);
  }
  console.log("");
}
