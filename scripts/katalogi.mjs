#!/usr/bin/env node
/**
 * Staattinen tuotekatalogi (5.11.2026): data/products-snapshot.json, data/arviot.json ja data/hintahistoria.json. Kauppa lukee tuotteet,
 * kategoriat, tuotesivut, Merchant-syötteen ja sivukartan vain näistä tiedostoista (api/_lib/tuotteet.js), joten
 * tietokannan katko tai Neonin kiintiö ei kaada kauppaa eikä kävijä herätä tietokantaa.
 *
 * Vaiheet:
 *   1. Pohja: --lahde TIEDOSTO (products-taulun rivit JSON-taulukkona), tai tietokannan products-taulu ja julkaistut
 *      arviot cron-reitin kautta (?tehtava=katalogi-vienti, .env.cron.local), jos kanta vastaa; muuten nykyinen katalogi.
 *   2. --kuvat ID,ID --versio V: tuotekuvat Printifyn mockupeista (sama kuin cron ?tehtava=tuotekuvat).
 *   3. Saatavuus Printifyn API:sta kaikille myynnissä oleville (api/_lib/saatavuus.js ajaSaatavuus muistivarastolla).
 *      --ei-saatavuutta ohittaa, --saatavuus-slugit a,b rajaa tarkistuksen näihin.
 *   4. Kirjoitetaan vain, jos sisältö muuttui. Tulostaa MUUTTUI tai EI MUUTOSTA.
 *   --julkaise: muutos commitoidaan (vain katalogitiedostot), pushataan ja julkaistaan scripts/julkaise-uusi.sh:lla.
 *   --kuiva: ei kirjoiteta mitään.
 *
 * Ajastus: scripts/katalogi.plist (launchd tunnin välein :04, --ajastettu --julkaise: kerran päivässä klo 7 jälkeen
 * Suomen aikaa). Julkaisu vain, jos työpuussa ei ole muita seurattuja muutoksia (ei keskeneräistä koodia tuotantoon).
 * Avaimia ei tulosteta: Printify-avain luetaan .env.printify.local-tiedostosta, CRON_SECRET .env.cron.local-tiedostosta.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const KATALOGI = join(JUURI, "data", "products-snapshot.json");
const ARVIOT = join(JUURI, "data", "arviot.json");
const HISTORIA = join(JUURI, "data", "hintahistoria.json");
const LOKI = join(JUURI, "some", "katalogiloki.txt");
const POHJA = process.env.KAUPPA_URL || "https://huumorikauppa-five.vercel.app";

const arg = (nimi) => {
  const i = process.argv.indexOf(nimi);
  return i >= 0 ? process.argv[i + 1] : null;
};
const lippu = (nimi) => process.argv.includes(nimi);

function lataaEnv(tiedosto) {
  const polku = join(JUURI, tiedosto);
  if (!existsSync(polku)) return;
  for (const rivi of readFileSync(polku, "utf8").split("\n")) {
    const m = rivi.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const loki = (teksti) => {
  const rivi = `${new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki", dateStyle: "short", timeStyle: "medium" }).format(new Date())} ${teksti}`;
  console.log(rivi);
  try { appendFileSync(LOKI, `${rivi}\n`); } catch { /* loki ei estä ajoa */ }
};

/** Vakaa järjestys ja muoto, jotta sama sisältö tuottaa saman tiedoston (muutos = oikea muutos). */
export function normalisoi(rivit) {
  return [...rivit]
    .map((r) => ({ ...r, price: Number(r.price) }))
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")) || String(a.slug).localeCompare(String(b.slug)));
}

export const tiiviste = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex");

/** Muistivarasto api/_lib/saatavuus.js ajaSaatavuus-funktiolle: tarkistaa kaikki Printify-rivit kerralla. */
export function muistiVarasto(rivit) {
  const kv = new Map();
  const tarkistettu = new Set();
  const mukana = (p, idt) => p.printify_product_id && (p.is_active !== false || idt.includes(String(p.id))) && !tarkistettu.has(p.id);
  return {
    tarkistettavat: async (idt, raja) => rivit.filter((p) => mukana(p, idt)).slice(0, raja),
    jaljella: async (idt) => rivit.filter((p) => mukana(p, idt)).length,
    tallenna: async (id, { unavailable, is_active }) => {
      const p = rivit.find((x) => x.id === id);
      if (p) { p.unavailable_variants = unavailable; p.is_active = is_active; p.availability_checked_at = new Date().toISOString(); }
      tarkistettu.add(id);
    },
    merkitseTarkistetuksi: async (id) => { tarkistettu.add(id); },
    tapahtuma: async () => {},
    lueKv: async (k) => kv.get(k) ?? null,
    kirjoitaKv: async (k, v) => { kv.set(k, v); },
  };
}

async function kannasta() {
  lataaEnv(".env.cron.local");
  if (!process.env.CRON_SECRET) return null;
  try {
    const r = await fetch(`${POHJA}/api/cron/tilaukset?tehtava=katalogi-vienti`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }, signal: AbortSignal.timeout(90000),
    });
    if (!r.ok) return { virhe: `HTTP ${r.status}` };
    const j = await r.json();
    return Array.isArray(j.tuotteet) && j.tuotteet.length ? j : { virhe: "tyhjä vastaus" };
  } catch (e) {
    return { virhe: String(e?.message || e).slice(0, 120) };
  }
}

const TILA = join(process.env.HOME || "", ".huumorikauppa-some", "katalogi.json");
const hkiPaiva = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(d);
const hkiTunti = (d = new Date()) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Helsinki", hour: "2-digit", hourCycle: "h23" }).format(d));

/** Työpuun seuratut muutokset katalogitiedostojen ja somekansion ulkopuolella: julkaisu ei saa viedä keskeneräistä. */
function keskeneraiset() {
  const rivit = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: JUURI, encoding: "utf8" }).split("\n").filter(Boolean);
  return rivit.map((r) => r.slice(3)).filter((p) => !/^(data\/(products-snapshot|arviot|hintahistoria)\.json|some\/)/.test(p));
}

async function main() {
  // launchd (scripts/katalogi.plist) käynnistää tunnin välein :04: ajo kerran päivässä klo 7 jälkeen Suomen aikaa, samaan
  // aikaan kuin valvonnan ajot (UTC parittomat tunnit :00-:05), jolloin kannan vienti ei herätä Neonia erikseen.
  if (lippu("--ajastettu")) {
    const tila = existsSync(TILA) ? JSON.parse(readFileSync(TILA, "utf8")) : {};
    if (hkiTunti() < 7 || tila.viimeisin === hkiPaiva()) return;
    writeFileSync(TILA, JSON.stringify({ ...tila, viimeisin: hkiPaiva() }));
  }
  const kuiva = lippu("--kuiva");
  const vanha = JSON.parse(readFileSync(KATALOGI, "utf8"));
  const vanhatArviot = existsSync(ARVIOT) ? JSON.parse(readFileSync(ARVIOT, "utf8")) : {};
  let rivit;
  let arviot = vanhatArviot;
  const vanhaHistoria = existsSync(HISTORIA) ? JSON.parse(readFileSync(HISTORIA, "utf8")) : {};
  let historia = vanhaHistoria;
  const lahde = arg("--lahde");
  if (lahde) {
    rivit = JSON.parse(readFileSync(lahde, "utf8"));
    loki(`pohja: ${lahde} (${rivit.length} riviä)`);
  } else if (!lippu("--ei-kantaa")) {
    const k = await kannasta();
    if (k && !k.virhe) {
      rivit = k.tuotteet;
      if (k.arviot && typeof k.arviot === "object") arviot = k.arviot;
      if (k.hintahistoria && typeof k.hintahistoria === "object") historia = k.hintahistoria;
      loki(`pohja: tietokanta (${rivit.length} riviä, arvioita ${Object.values(arviot).flat().length})`);
    } else {
      rivit = structuredClone(vanha);
      loki(`pohja: nykyinen katalogi (${rivit.length} riviä), tietokanta ei vastannut: ${k?.virhe || "CRON_SECRET puuttuu"}`);
    }
  } else {
    rivit = structuredClone(vanha);
  }

  lataaEnv(".env.printify.local");
  const P = await import("../api/_lib/printify.js");
  const S = await import("../api/_lib/saatavuus.js");

  const kuvat = (arg("--kuvat") || "").split(",").filter((x) => /^[0-9a-f]{24}$/.test(x));
  if (kuvat.length) {
    const { buildProductRow } = await import("../api/_lib/printify-sync.generated.js");
    const versio = /^[a-z0-9-]{1,20}$/.test(arg("--versio") || "") ? arg("--versio") : null;
    const vaihda = (u) => (versio && typeof u === "string" && !/[?&]v=/.test(u) ? `${u}${u.includes("?") ? "&" : "?"}v=${versio}` : u);
    for (const id of kuvat) {
      const h = await P.haeTuote(id, { aikaraja: 15000 });
      const uusi = h.ok ? buildProductRow(h.data, []) : null;
      if (!uusi?.images?.length) { loki(`kuvat ${id}: ${h.ok ? "ei kuvia" : "ei Printifyssä"}`); continue; }
      for (const p of rivit.filter((x) => String(x.printify_product_id) === id)) {
        p.images = uusi.images.map(vaihda);
        if (uusi.variants?.variant_images) {
          p.variants = { ...(p.variants || {}), variant_images: Object.fromEntries(Object.entries(uusi.variants.variant_images).map(([k, v]) => [k, Array.isArray(v) ? v.map(vaihda) : vaihda(v)])) };
        }
      }
    }
    loki(`kuvat päivitetty ${kuvat.length} Printify-tuotteelle`);
  }

  if (!lippu("--ei-saatavuutta") && P.onPrintify()) {
    const kurista = S.teeKuristin();
    // --saatavuus-slugit a,b: vain nämä (esim. juuri lisätyt rivit); muut pysyvät ennallaan.
    const vain = new Set((arg("--saatavuus-slugit") || "").split(",").filter(Boolean));
    const tarkistettavat = vain.size ? rivit.filter((p) => vain.has(p.slug)) : rivit;
    const r = await S.ajaSaatavuus(muistiVarasto(tarkistettavat), {
      haeTuote: kurista((id) => P.haeTuote(id, { aikaraja: 15000 })),
      haeKatalogi: kurista(P.haeKatalogiVariantit),
      budjettiMs: 60 * 60 * 1000,
      raja: 5000,
    });
    loki(`saatavuus: tarkistettu ${r.tarkistettu}, muuttui ${r.muutoksia}, virheitä ${r.virheita}`);
    for (const rivi of S.muutosRivit(r.muutokset).slice(0, 30)) loki(`  ${rivi}`);
  }

  const uusi = normalisoi(rivit);
  const muuttui = tiiviste(uusi) !== tiiviste(normalisoi(vanha)) || tiiviste(arviot) !== tiiviste(vanhatArviot)
    || tiiviste(historia) !== tiiviste(vanhaHistoria);
  loki(muuttui ? `MUUTTUI (${vanha.length} -> ${uusi.length} riviä)` : "EI MUUTOSTA");
  if (!muuttui || kuiva) return;
  writeFileSync(KATALOGI, JSON.stringify(uusi));
  writeFileSync(ARVIOT, `${JSON.stringify(arviot, null, 1)}\n`);
  writeFileSync(HISTORIA, `${JSON.stringify(historia)}\n`);
  if (!lippu("--julkaise")) return;
  const kesken = keskeneraiset();
  if (kesken.length) {
    loki(`julkaisu odottaa: työpuussa muita muutoksia (${kesken.slice(0, 5).join(", ")}); katalogi kirjoitettu, commit ja julkaisu käsin`);
    return;
  }
  const git = (...a) => execFileSync("git", a, { cwd: JUURI, stdio: "inherit" });
  git("add", "data/products-snapshot.json", "data/arviot.json", "data/hintahistoria.json");
  git("commit", "-m", "Katalogi päivitetty (scripts/katalogi.mjs)\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>");
  git("push", "origin", "HEAD:oma-tausta", "HEAD:main");
  execFileSync("bash", ["scripts/julkaise-uusi.sh"], { cwd: JUURI, stdio: "inherit" });
  loki("julkaistu");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { loki(`VIRHE ${String(e?.stack || e).slice(0, 400)}`); process.exit(1); });
}
