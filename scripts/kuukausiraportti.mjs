#!/usr/bin/env node
/**
 * Kuukauden myyntiraportti kirjanpitoon (api/_lib/kirjanpito.js) tiedostoiksi:
 *   node scripts/kuukausiraportti.mjs [ALKU LOPPU]      esim. 2026-10-27 2026-10-31
 * Ilman päiviä edellinen kuukausi. Tallentaa myös Printifyn veloitukset ja Stripen saldotapahtumat (CSV, 4.11.2026).
 * Printifyn viralliset PDF-laskut ladataan Printifyn hallinnasta (My account > Billing), koska rajapinta ei anna niitä. Raportti lasketaan tuotannossa (Neon ja Stripe, cron ?tehtava=kuukausiraportti),
 * koska tietokannan avaimet eivät ole koneella. Tallentaa kirjanpito/YYYY-MM/<nimi>.csv ja .pdf (.gitignore).
 * Vaatii .env.cron.local (CRON_SECRET).
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const juuri = join(dirname(fileURLToPath(import.meta.url)), "..");
const salaisuus = readFileSync(join(juuri, ".env.cron.local"), "utf8").trim().split("=").slice(1).join("=");
const [alku, loppu] = process.argv.slice(2);
const pohja = process.env.KAUPPA_API || "https://huumorikauppa-five.vercel.app";
const url = `${pohja}/api/cron/tilaukset?tehtava=kuukausiraportti&tiedostot=1${alku ? `&alku=${alku}&loppu=${loppu}` : ""}`;
const r = await fetch(url, { headers: { Authorization: `Bearer ${salaisuus}` }, signal: AbortSignal.timeout(120000) });
const j = await r.json();
if (!j.ok) { console.error("Virhe:", j); process.exit(1); }
const kansio = join(juuri, "kirjanpito", j.alku.slice(0, 7));
mkdirSync(kansio, { recursive: true });
writeFileSync(join(kansio, `${j.nimi}.csv`), j.csv, "utf8");
writeFileSync(join(kansio, `${j.nimi}.pdf`), Buffer.from(j.pdf, "base64"));
for (const l of j.liitteet || []) writeFileSync(join(kansio, l.nimi), l.csv, "utf8");
console.log(`Tallennettu ${kansio}/${j.nimi}.csv ja .pdf${(j.liitteet || []).length ? ` sekä ${j.liitteet.map((l) => l.nimi).join(", ")}` : ""}`);
if (j.muut?.length) console.log(`Muut erät: ${j.muut.map((m) => `${m.selite} ${m.summa} €`).join("; ")}`);
console.log(JSON.stringify(j.yhteenveto, null, 2));
