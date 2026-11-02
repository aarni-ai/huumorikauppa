#!/usr/bin/env node
/**
 * Ryhmätilauksen koko polku tuotantoa vasten (2.11.2026), ajetaan julkaisun jälkeen. Kutsuu reittiä
 * /api/cron/tilaukset?tehtava=ryhmatilaustesti CRON_SECRETillä (paikallinen .env.cron.local, ei tulosteta), joka
 * (api/_lib/ryhmatilaus-db.js ryhmatilausTesti):
 *   1. luo testiryhmän (testi = true: ei laskuriin, ei orders-tauluun) ja lisää kaksi jäsentä jäsenlinkin kautta,
 *   2. luo jäsenten maksuistunnot (Stripen testitilassa, jos Vercelissä on STRIPE_TEST_SECRET_KEY, muuten simuloitu) ja
 *      merkitsee maksut samalla käsittelijällä kuin Stripe-webhook; kun molemmat ovat maksaneet, ryhmä lukittuu itse,
 *   3. muodostaa tilausrivit ja Printify-rungon (bp 145 / pp 30, front ja back) ja hakee jokaisen painokuvan
 *      (/api/painokuva, PNG 3461 x 3955),
 *   4. luo Printifyyn yhden tilauksen nimellä "TESTI Ryhmätilaus (perutaan)" ja perii sen samassa ajossa
 *      (api/_lib/printify.js testitilaus; perumatta jäänyt hälyttää omistajalle) ja vertaa Printifyn rivikulua
 *      selkäpainatuksen arvioon (api/_lib/ryhmatilaus.js RYHMA_SELKA_KULU_SENTIT),
 *   5. poistaa testiryhmän ja sen rivit.
 * Tilausta ei lähetetä tuotantoon eikä siitä veloiteta.
 *
 * Ajo:
 *   node scripts/ryhmatilaus-testi.mjs              koko polku ja Printify-testitilaus
 *   node scripts/ryhmatilaus-testi.mjs --kuiva      ilman Printify-tilausta (ryhmä, maksut, lukitus, painokuvat, siivous)
 *   node scripts/ryhmatilaus-testi.mjs --logo <id>  etupuolella ladattu logo (yrityslogot-taulun id)
 *   KAUPPA=https://<esikatselu>.vercel.app node scripts/ryhmatilaus-testi.mjs --kuiva
 * Poistumiskoodi 0 = kaikki vaiheet kunnossa.
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
const q = new URLSearchParams({ tehtava: "ryhmatilaustesti" });
if (process.argv.includes("--kuiva")) q.set("kuiva", "1");
if (arvo("--logo")) q.set("logo", arvo("--logo"));

// Suoraan uuteen projektiin: huumorikauppa.fi:n välitys katkaisee pyynnön 25 sekunnissa, testi kestää pidempään.
const kauppa = (process.env.KAUPPA || "https://huumorikauppa-five.vercel.app").replace(/\/$/, "");
const r = await fetch(`${kauppa}/api/cron/tilaukset?${q}`, { headers: { authorization: `Bearer ${salaisuus}` }, signal: AbortSignal.timeout(90000) });
const j = await r.json().catch(() => ({}));
if (!r.ok) { console.error(`Reitti vastasi ${r.status}: ${j.virhe || j.error || ""}`); process.exit(1); }
if (process.argv.includes("--json")) { console.log(JSON.stringify(j, null, 2)); process.exit(j.ok ? 0 : 1); }

const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;
for (const v of j.vaiheet || []) {
  const lisa = v.kuvat ? v.kuvat.map((k) => `${k.paikka} ${k.variantti}: ${k.status ?? "-"} ${k.mitat ? `${k.mitat.leveys} x ${k.mitat.korkeus}` : k.virhe || "ei PNG"}`).join("; ")
    : v.hinnat ? `${v.kpl} paitaa, hinnat ${v.hinnat.map(eur).join(", ")}, kate ${eur(v.kate)}`
      : v.virhe || (v.stripeTestitila !== undefined ? `Stripe-testitila ${v.stripeTestitila ? "kyllä" : "ei (simuloitu)"}, automaattinen lukitus ${v.automaattinenLukitus ? "kyllä" : "ei"}` : "");
  console.log(`${v.ok ? "OK   " : "VIRHE"} ${v.vaihe}${lisa ? `: ${lisa}` : ""}`);
}
for (const l of j.rivit || []) console.log(`  Printify-rivi: bp ${l.blueprint_id}, pp ${l.print_provider_id}, variantti ${l.variant_id}, ${l.quantity} kpl, painoalueet ${l.paikat.join(" + ")}`);
if (j.printify) {
  const p = j.printify;
  console.log(`${p.luotu ? "OK   " : "VIRHE"} Printify-tilaus ${p.id ?? "-"} "${p.nimi ?? "-"}", tila ennen peruutusta ${p.tila ?? "-"}${p.virhe ? `, virhe: ${p.virhe}` : ""}`);
  for (const s of p.selka || []) console.log(`${s.arvioRiittaa ? "OK   " : "HUOM "} kulu variantille ${s.variantti}: Printify ${eur(s.todellinen)}, arvio (etu + selkä) ${eur(s.arvio ?? 0)}`);
  console.log(`${p.peruttu ? "OK   " : "VIRHE"} peruutus: tila nyt ${p.tilaJalkeen ?? "-"}${p.peruttu ? "" : " (peru Printifyn hallinnassa: Orders > Cancel)"}`);
} else {
  console.log(j.kuiva ? "Kuiva ajo: Printify-tilausta ei luotu." : "Printify-tilausta ei luotu (painokuvassa virhe).");
}
process.exit(j.ok ? 0 : 1);
