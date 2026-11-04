#!/usr/bin/env node
/**
 * Sähköpostin valmiustila (4.11.2026) Coworkille ja Claudelle: nimipalvelimet (vanha aria/huxley vai uusi annabel/vick),
 * Resendin DNS-tietueet julkisesta DNS:stä, DMARC, Resendin domainin tila, lähetysreitti (resend/gmail) ja viikon
 * tilausvahvistukset. Kutsuu tuotannon reittiä /api/cron/tilaukset?tehtava=sahkopostitila CRON_SECRETillä
 * (.env.cron.local, ei tulosteta). Sama tila on päivän yhteenvetoviestissä.
 *
 * Ajo:
 *   node scripts/sahkoposti-tila.mjs            tila
 *   node scripts/sahkoposti-tila.mjs --testi    lisäksi TESTI-viesti jokaisesta viestityypistä omistajalle
 *                                               (vain kun Resend on vahvistettu)
 *   node scripts/sahkoposti-tila.mjs --json
 * Poistumiskoodi 0 = valmis, 2 = jotain puuttuu, 1 = virhe.
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

const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";
const testi = process.argv.includes("--testi");
let r;
for (let yritys = 1; yritys <= 4; yritys++) {
  try {
    r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=sahkopostitila${testi ? "&testi=1" : ""}`, { headers: { authorization: `Bearer ${salaisuus}` }, signal: AbortSignal.timeout(60000) });
    break;
  } catch (e) {
    if (yritys === 4) { console.error(`Yhteys epäonnistui: ${e?.message || e}`); process.exit(1); }
    await new Promise((ok) => setTimeout(ok, 5000 * yritys));
  }
}
if (!r.ok) { console.error(`Reitti vastasi ${r.status}.`); process.exit(1); }
const t = await r.json();
if (process.argv.includes("--json")) { console.log(JSON.stringify(t, null, 2)); process.exit(t.valmis ? 0 : 2); }

const k = (x) => (x ? "ok" : "PUUTTUU");
const v = t.vahvistukset;
console.log([
  `Sähköposti: ${t.valmis ? "VALMIS (Resend)" : "ei vielä valmis"}`,
  `Nimipalvelimet: ${t.dns.nimipalvelimet.join(", ") || "ei vastausta"}${t.dns.uusiCloudflare ? " (uusi Cloudflare)" : t.dns.vanhaCloudflare ? " (vanha Cloudflare)" : ""}`,
  `DNS: resend._domainkey ${k(t.dns.dkim)}, send MX ${k(t.dns.sendMx)}, send SPF ${k(t.dns.sendSpf)}, DMARC ${t.dns.dmarc ? (t.dns.dmarcLovable ? "on, mutta raportit lovable.dev:iin" : "ok") : "PUUTTUU"}`,
  `Resend: ${t.resend.status || t.resend.virhe || "tuntematon"}${t.resend.tietueet?.length ? ` (${t.resend.tietueet.map((x) => `${x.nimi} ${x.tyyppi} ${x.tila}`).join(", ")})` : ""}`,
  `Reitti: ${t.reitti}, markkinointiviestit ${t.markkinointi ? "päällä" : "odottavat"}, oma tilausvahvistus ${t.omaVahvistus ? "päällä" : "ei (Stripen kuitti)"}`,
  `Tilausvahvistukset 7 pv: ${v ? `${v.vahvistettu}/${v.maksettu} maksetusta${v.virheet ? `, virheitä ${v.virheet}` : ""}` : "-"}`,
  ...(t.puuttuu.length ? ["Puuttuu:", ...t.puuttuu.map((x) => `- ${x}`)] : []),
  ...(t.testit ? ["Testiviestit:", ...(Array.isArray(t.testit) ? t.testit.map((x) => `- ${x.tyyppi}: ${x.ok ? `lähti (${x.reitti})` : `EI (${x.virhe})`}`) : [`- ei lähetetty: ${t.testit.syy}`])] : []),
].join("\n"));
process.exit(t.valmis ? 0 : 2);
