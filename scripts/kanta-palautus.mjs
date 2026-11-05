#!/usr/bin/env node
/**
 * Tietokannan palautuksen vahti (5.11.2026, Neonin ilmaiskiintiö loppui). launchd (scripts/kanta-palautus.plist)
 * ajaa 30 minuutin välein. Kun kanta vastaa (cron ?tehtava=kanta-tila) tai omistaja ajaa käsin --pakota
 * ("Neon nostettu"), tehdään kerran:
 *   1. Blob-puskurin tilaukset ja seurantaerät kantaan (?tehtava=puskuri-siirto),
 *   2. .cowork/syote-kansion data /hallinta/syote-kantaan (scripts/data-haku.mjs --laheta-paikalliset PVM),
 *   3. node scripts/mittarit.mjs ja node scripts/tuoteseuranta-raportti.mjs.
 * Tulokset lokiin some/kantapalautusloki.txt. Tila ~/.huumorikauppa-some/kanta-palautus.json: valmiin jälkeen vahti
 * ei enää kysy kannan tilaa (kysely herättäisi Neonin 30 min välein); tunnin valvonta siirtää puskurin jatkossa itse.
 * Uusi katko: poista tilatiedosto. Avaimia ei tulosteta.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const LOKI = join(JUURI, "some", "kantapalautusloki.txt");
const TILA = join(process.env.HOME || "", ".huumorikauppa-some", "kanta-palautus.json");
const POHJA = process.env.KAUPPA_URL || "https://huumorikauppa-five.vercel.app";

const loki = (t) => {
  const rivi = `${new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki", dateStyle: "short", timeStyle: "medium" }).format(new Date())} ${t}`;
  console.log(rivi);
  try { appendFileSync(LOKI, `${rivi}\n`); } catch { /* ei estä */ }
};

function salaisuus() {
  const polku = join(JUURI, ".env.cron.local");
  const m = existsSync(polku) ? readFileSync(polku, "utf8").match(/^CRON_SECRET=(.*)$/m) : null;
  return process.env.CRON_SECRET || (m ? m[1].replace(/^"|"$/g, "") : "");
}

async function cron(tehtava, aikaraja = 120000) {
  const r = await fetch(`${POHJA}/api/cron/tilaukset?tehtava=${tehtava}`, { headers: { Authorization: `Bearer ${salaisuus()}` }, signal: AbortSignal.timeout(aikaraja) });
  return { status: r.status, json: await r.json().catch(() => null) };
}

const aja = (komento, args) => {
  try {
    return execFileSync(komento, args, { cwd: JUURI, encoding: "utf8", timeout: 15 * 60 * 1000, stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (e) {
    return `VIRHE (${e.status ?? "?"}): ${String(e.stderr || e.stdout || e.message).trim().slice(0, 600)}`;
  }
};

async function main() {
  const tila = existsSync(TILA) ? JSON.parse(readFileSync(TILA, "utf8")) : {};
  const pakota = process.argv.includes("--pakota");
  // Valmis: ei enää kyselyitä (jokainen kanta-tila herättäisi Neonin). Tunnin valvonta siirtää puskurin jatkossa itse.
  if (tila.valmis && !pakota) return;
  let k;
  try { k = await cron("kanta-tila", 60000); } catch (e) { loki(`kanta-tila: ${String(e?.message || e).slice(0, 120)}`); return; }
  const kanta = k.json?.kanta === true;
  if (!kanta && !pakota) {
    if (!tila.katkoKirjattu) {
      loki(`kanta ei vastaa; puskurissa tilauksia ${k.json?.puskuri?.tilauksia ?? "?"}, tapahtumaeriä ${k.json?.puskuri?.tapahtumaeria ?? "?"}`);
      writeFileSync(TILA, JSON.stringify({ ...tila, valmis: null, katkoKirjattu: true }));
    }
    return;
  }
  loki(`kanta vastaa${pakota ? " (--pakota)" : ""}: palautustoimet alkavat`);
  const s = await cron("puskuri-siirto", 300000).catch((e) => ({ status: 0, json: { virhe: String(e?.message || e) } }));
  loki(`puskuri kantaan: ${s.status} ${JSON.stringify(s.json).slice(0, 400)}`);
  const kansio = join(JUURI, ".cowork", "syote");
  const paivat = existsSync(kansio) ? [...new Set(readdirSync(kansio).map((f) => f.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1]).filter(Boolean))].sort() : [];
  const lahetetyt = new Set(tila.syotteet || []);
  for (const pv of paivat.filter((p) => !lahetetyt.has(p))) {
    const r = aja(process.execPath, ["scripts/data-haku.mjs", "--laheta-paikalliset", pv]);
    loki(`syöte ${pv}: ${r.split("\n").slice(-6).join(" | ").slice(0, 600)}`);
    if (!r.startsWith("VIRHE")) lahetetyt.add(pv);
  }
  for (const skripti of ["scripts/mittarit.mjs", "scripts/tuoteseuranta-raportti.mjs"]) {
    loki(`${skripti}:\n${aja(process.execPath, [skripti])}`);
  }
  writeFileSync(TILA, JSON.stringify({ valmis: new Date().toISOString(), syotteet: [...lahetetyt] }));
  loki("palautustoimet valmiit");
}

main().catch((e) => { loki(`VIRHE ${String(e?.stack || e).slice(0, 300)}`); process.exit(1); });
