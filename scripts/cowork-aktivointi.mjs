#!/usr/bin/env node
/**
 * Coworkin hallintapääsy ilman sähköpostia (4.11.2026): luo kertakäyttöisen 48 tunnin aktivointilinkin (avaa kaikki
 * /hallinta-sivut, eväste 90 pv) ja kirjoittaa sen tiedostoon ~/huumorikauppa/.cowork/aktivointi.txt (oikeudet 600).
 * Kansio .cowork on .gitignoressa ja .vercelignoressa. Linkkiä ei tulosteta.
 *
 * Ajo:
 *   node scripts/cowork-aktivointi.mjs                 uusi linkki heti
 *   node scripts/cowork-aktivointi.mjs --jos-tarvitaan uusi linkki vain, kun eväste on vanhenemassa (yli 80 pv
 *                                                      viimeisestä aktivoinnista) eikä tiedostossa ole voimassa olevaa
 *                                                      linkkiä. Ajetaan joka aamu (launchd, scripts/cowork-aktivointi.plist).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";

const JUURI = new URL("..", import.meta.url).pathname;
const KANSIO = join(JUURI, ".cowork");
const TIEDOSTO = join(KANSIO, "aktivointi.txt");
let salaisuus = process.env.CRON_SECRET || "";
const env = join(JUURI, ".env.cron.local");
if (!salaisuus && existsSync(env)) salaisuus = (readFileSync(env, "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
if (!salaisuus) { console.error("CRON_SECRET puuttuu (.env.cron.local)."); process.exit(1); }
const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";

async function hae(tehtava) {
  for (let yritys = 1; ; yritys++) {
    try {
      const r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=${tehtava}`, { headers: { authorization: `Bearer ${salaisuus}` }, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (yritys >= 4) throw e;
      await new Promise((ok) => setTimeout(ok, 10000 * yritys));
    }
  }
}

const hki = (d) => new Date(d).toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" });
if (process.argv.includes("--jos-tarvitaan")) {
  const tila = await hae("aktivointi-tila");
  const voimassa = existsSync(TIEDOSTO) && (() => {
    const m = readFileSync(TIEDOSTO, "utf8").match(/^VANHENEE_ISO=(.+)$/m);
    return m && new Date(m[1]).getTime() > Date.now();
  })();
  if (!tila.tarvitaan || voimassa) {
    console.log(`Ei uutta linkkiä: ${tila.tarvitaan ? "tiedostossa on voimassa oleva linkki" : `eväste voimassa${tila.vanhenee ? ` ${hki(tila.vanhenee)} asti` : ""}`}.`);
    process.exit(0);
  }
}
const { linkki, vanhenee } = await hae("aktivointilinkki-viesti&palauta=1");
if (!linkki) { console.error("Linkkiä ei saatu."); process.exit(1); }
mkdirSync(KANSIO, { recursive: true, mode: 0o700 });
writeFileSync(TIEDOSTO, [
  "Huumorikaupan hallinnan aktivointilinkki Coworkille",
  "",
  linkki,
  "",
  `Voimassa ${hki(vanhenee)} asti (48 h), toimii kerran.`,
  "Avaa linkki Coworkin Chromessa (profiili \"Huumorikauppa\"). Se avaa kaikki hallintasivut 90 päiväksi:",
  "/hallinta/mittarit, /hallinta/some, /hallinta/tarjoukset ja /hallinta/kumppanit.",
  "Älä jaa linkkiä. Uusi linkki tulee tähän tiedostoon automaattisesti, kun eväste on vanhenemassa.",
  "",
  `VANHENEE_ISO=${new Date(vanhenee).toISOString()}`,
  "",
].join("\n"), { mode: 0o600 });
chmodSync(TIEDOSTO, 0o600);
console.log(`Uusi aktivointilinkki kirjoitettu tiedostoon .cowork/aktivointi.txt, voimassa ${hki(vanhenee)} asti.`);
