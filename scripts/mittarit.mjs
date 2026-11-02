#!/usr/bin/env node
/**
 * Tavoitemittarin luvut koneelle (2.11.2026) ilman Vercelin suojattuja muuttujia: kutsuu tuotannon reittiä
 * /api/cron/tilaukset?tehtava=mittarit CRON_SECRETillä (paikallinen .env.cron.local, ei tulosteta) ja tulostaa
 * koosteen. Reitti palauttaa vain summat ja lukumäärät (api/_lib/mittarit.js mittariKooste).
 *
 * Ajo: node scripts/mittarit.mjs [--json]
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

// Suoraan uuteen projektiin: huumorikauppa.fi:n välitys (vanhan projektin middleware) katkaisee pyynnön 25 sekunnissa.
const kauppa = process.env.KAUPPA || "https://huumorikauppa-five.vercel.app";
const r = await fetch(`${kauppa}/api/cron/tilaukset?tehtava=mittarit`, { headers: { authorization: `Bearer ${salaisuus}` } });
if (!r.ok) { console.error(`Mittarireitti vastasi ${r.status}.`); process.exit(1); }
const m = await r.json();
if (process.argv.includes("--json")) { console.log(JSON.stringify(m, null, 2)); process.exit(0); }

const eur = (x) => (x == null ? "-" : `${Number(x).toFixed(2).replace(".", ",")} €`);
const lu = (x) => (x == null ? "-" : String(x).replace(".", ","));
const t = m.tavoite;
const l = m.liikenneKk;
console.log([
  `Mittari ${m.paiva} (${m.kuukausi})`,
  `Kate tässä kuussa ${eur(t.kate)} / ${eur(t.tavoite)} (${lu(t.prosentti)} %), ennuste ${eur(t.ennuste)}`,
  `Tilaukset: kuu ${m.kk.tilauksia} (myynti ${eur(m.kk.myynti)}, keskiostos ${eur(m.kk.keskiostos)}), 30 pv ${m.p30.tilauksia} (kate ${eur(m.p30.kate)})`,
  `Edellinen kuu ${m.edellinen.kuukausi}: ${m.edellinen.tilauksia} tilausta, kate ${eur(m.edellinen.kate)}`,
  `Käynnit: kuu ${m.kaynnit.kk}, 30 pv ${m.kaynnit.p30}; konversio laskelmassa ${lu(m.konversio.laskelmassa)} % (oma ${lu(m.konversio.oma)} %)`,
  `Liikenne kuu: hakukoneet ${l.hakukoneet}, lahjasivut ${l.lahjasivut}, blogi ${l.blogi}, yritysten alasivut ${l.yritysAlat}, media ${l.media}, kumppanisivut ${l.kumppanisivut}`,
  `Uutiskirje: ${m.uutiskirje ? `${m.uutiskirje.yhteensa} tilaajaa (7 pv +${m.uutiskirje.p7}, 28 pv +${m.uutiskirje.p28})` : "-"}`,
  `Tarjouspyynnöt: kuu ${m.tarjoukset.kk} (arvo ${eur(m.tarjoukset.arvoKk)}), 30 pv ${m.tarjoukset.p30}`,
  m.suppilo14 ? `Suppilo ${m.suppilo14.alku ?? "14 pv"} alkaen (data luotettavaa ${m.suppilo14.luotettavaAlkaen ?? "-"} alkaen): käynnit ${m.suppilo14.kaynnit}, tuotesivut ${m.suppilo14.tuotesivu}, koriin ${m.suppilo14.kori}, kassalle ${m.suppilo14.kassa}, maksuun ${m.suppilo14.maksu}, ostot ${m.suppilo14.ostot}` : "Suppilo: -",
  m.lisamyynti14 ? `Korin lisämyynti ${m.lisamyynti14.alku}–${m.lisamyynti14.loppu}: suositukset näytetty ${m.lisamyynti14.suositukset_naytetty}, lisätty ${m.lisamyynti14.suositus_lisatty}; toinen paita näytetty ${m.lisamyynti14.toinen_paita_naytetty}, lisätty ${m.lisamyynti14.toinen_paita_lisatty}` : "Korin lisämyynti: -",
  `Kumppanit kuu: ${m.kumppanit.tilauksia} tilausta, myynti ${eur(m.kumppanit.myynti)}, provisio ${eur(m.kumppanit.provisio)}`,
  `Tarve: ${lu(t.tilauksiaPaivassa)} tilausta ja ${lu(t.kayntejaPaivassa)} käyntiä päivässä`,
].join("\n"));
