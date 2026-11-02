#!/usr/bin/env node
/**
 * Personoitujen lahjojen testitilaus tuotantoa vasten (2.11.2026). Kutsuu reittiä
 * /api/cron/tilaukset?tehtava=personointitesti CRON_SECRETillä (paikallinen .env.cron.local, ei tulosteta), joka:
 *   1. laskee kassan tilauksen (laskeTilaus) personoidulle t-paidalle ja hupparille testiosoitteella,
 *   2. muodostaa Printify-tilausrungon (lennosta luotavat tuotteet, bp 145 / pp 30 ja bp 77 / pp 402),
 *   3. hakee jokaisen rivin painokuvan (/api/painokuva) ja tarkistaa, että se on PNG painoalueen mitoissa,
 *   4. luo Printifyyn yhden tilauksen nimellä "TESTI Personointi (perutaan)" ja perii sen samassa ajossa
 *      (api/_lib/printify.js testitilaus; perumatta jäänyt tilaus hälyttää omistajalle ja perutaan viimeistään
 *      päivittäisessä yhteenvedossa, siivoaTestitilaukset).
 * Tilausta ei lähetetä tuotantoon eikä siitä veloiteta.
 *
 * Ajo (vasta kun koodi on julkaistu):
 *   node scripts/personoitu-testi.mjs                 t-paita (Maailman paras isä) ja huppari (Naimisissa)
 *   node scripts/personoitu-testi.mjs --kuiva         ilman Printify-tilausta: laskenta, runko ja painokuvat
 *   node scripts/personoitu-testi.mjs --malli golfari --nimi Kari [--tuotteet huppari] [--vari Valkoinen] [--koko XL]
 *   KAUPPA=https://<esikatselu>.vercel.app node scripts/personoitu-testi.mjs --kuiva
 * Poistumiskoodi 0 = kaikki kunnossa (kuivassa ajossa painokuvat kunnossa; muuten tilaus luotiin ja peruttiin).
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const JUURI = new URL("..", import.meta.url).pathname;
const tiedosto = join(JUURI, ".env.cron.local");
let salaisuus = process.env.CRON_SECRET || "";
if (!salaisuus && existsSync(tiedosto)) {
  salaisuus = (readFileSync(tiedosto, "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
}
if (!salaisuus) { console.error("CRON_SECRET puuttuu (.env.cron.local)."); process.exit(1); }

const arvo = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : undefined);
const q = new URLSearchParams({ tehtava: "personointitesti" });
for (const k of ["tuotteet", "malli", "nimi", "nimi2", "vuosi", "ika", "vari", "koko"]) if (arvo(`--${k}`)) q.set(k, arvo(`--${k}`));
if (process.argv.includes("--kuiva")) q.set("kuiva", "1");

// Suoraan uuteen projektiin: huumorikauppa.fi:n välitys katkaisee pyynnön 25 sekunnissa, testi kestää pidempään.
const kauppa = (process.env.KAUPPA || "https://huumorikauppa-five.vercel.app").replace(/\/$/, "");
const r = await fetch(`${kauppa}/api/cron/tilaukset?${q}`, { headers: { authorization: `Bearer ${salaisuus}` }, signal: AbortSignal.timeout(90000) });
const j = await r.json().catch(() => ({}));
if (!r.ok) { console.error(`Reitti vastasi ${r.status}: ${j.virhe || j.error || ""}`); process.exit(1); }
if (process.argv.includes("--json")) { console.log(JSON.stringify(j, null, 2)); process.exit(j.ok ? 0 : 1); }

const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;
console.log(`Kassa: yhteensä ${eur(j.laskettu?.total ?? 0)} (toimitus ${eur(j.laskettu?.shipping ?? 0)})`);
for (const rivi of j.laskettu?.rivit || []) console.log(`  ${rivi.tuote} ${rivi.vari} ${rivi.koko} ${eur(rivi.hinta)}: "${rivi.teksti}" (variantti ${rivi.variantti})`);
for (const l of j.rivit || []) console.log(`  Printify-rivi: bp ${l.blueprint_id}, pp ${l.print_provider_id}, variantti ${l.variant_id}, ${l.quantity} kpl`);
for (const k of j.kuvat || []) console.log(`${k.ok ? "OK   " : "VIRHE"} painokuva ${k.tuote}: HTTP ${k.status ?? "-"}, ${k.tyyppi ?? k.virhe ?? "-"}, ${k.mitat ? `${k.mitat.leveys} x ${k.mitat.korkeus}` : "ei PNG"}`);
if (j.printify) {
  const p = j.printify;
  console.log(`${p.luotu ? "OK   " : "VIRHE"} Printify-tilaus ${p.id ?? "-"} "${p.nimi ?? "-"}", tila ennen peruutusta ${p.tila ?? "-"}${p.virhe ? `, virhe: ${p.virhe}` : ""}`);
  if (p.kulut) console.log(`  Printifyn kulut: tuotteet ${eur(p.kulut.tuote)}, toimitus ${eur(p.kulut.toimitus)}`);
  console.log(`${p.peruttu ? "OK   " : "VIRHE"} peruutus: tila nyt ${p.tilaJalkeen ?? "-"}${p.peruttu ? "" : " (peru Printifyn hallinnassa: Orders > Cancel)"}`);
} else {
  console.log(j.kuiva ? "Kuiva ajo: Printify-tilausta ei luotu." : "Printify-tilausta ei luotu (painokuvassa virhe tai Printify-avain puuttuu).");
}
process.exit(j.ok ? 0 : 1);
