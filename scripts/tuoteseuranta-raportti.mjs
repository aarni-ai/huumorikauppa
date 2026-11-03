#!/usr/bin/env node
/**
 * Tuotesivun seurannan raportti koneelle (3.11.2026): sama laskenta kuin päivän yhteenvedossa klo 7
 * (api/_lib/tuoteseuranta.js koostaTuoteseuranta ja tuoteseurantaRivit). Kutsuu tuotannon reittiä
 * /api/cron/tilaukset?tehtava=tuoteseuranta CRON_SECRETillä (.env.cron.local, ei tulosteta).
 *
 * Ajo: node scripts/tuoteseuranta-raportti.mjs [alkaen YYYY-MM-DD] [loppu YYYY-MM-DD]   (oletus eilen)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { laskeutumisRivit } from "../api/_lib/laskeutumiset.js";
import { tuoteseurantaRivit } from "../api/_lib/tuoteseuranta.js";
import { aitousRivit } from "../api/_lib/botit.js";

const JUURI = new URL("..", import.meta.url).pathname;
const tiedosto = join(JUURI, ".env.cron.local");
let salaisuus = process.env.CRON_SECRET || "";
if (!salaisuus && existsSync(tiedosto)) salaisuus = (readFileSync(tiedosto, "utf8").match(/^CRON_SECRET=(.*)$/m)?.[1] || "").trim().replace(/^"|"$/g, "");
if (!salaisuus) { console.error("CRON_SECRET puuttuu (.env.cron.local)."); process.exit(1); }
const hki = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(d);
const eilen = hki(new Date(Date.now() - 864e5));
const [alkaen = eilen, loppu = alkaen] = process.argv.slice(2);
const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";
const r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=tuoteseuranta&alkaen=${alkaen}&loppu=${loppu}`, { headers: { authorization: `Bearer ${salaisuus}` } });
if (!r.ok) { console.error(`Reitti vastasi ${r.status}.`); process.exit(1); }
const data = await r.json();
// Bottisuodatus (3.11.2026): luvut ovat aitoja käyntejä; botit syittäin erikseen.
if (data.aitous) console.log([...aitousRivit(data.aitous), ""].join("\n"));
console.log(tuoteseurantaRivit(data).join("\n"));
// Laskeutumiset (3.11.2026): lähde, laite, selain, laskeutumissivu ja A/B, poistui alle 10 s.
if (data.laskeutumiset) console.log(["", ...laskeutumisRivit(data.laskeutumiset)].join("\n"));
