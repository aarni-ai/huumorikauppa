#!/usr/bin/env node
/**
 * Joulun viimeiset tilauspäivät tuotetyypeittäin Printifyn toteutuneista tilauksista.
 *
 * Ajo (vain lukevia GET-kutsuja, ei tilauksia):
 *   PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... node scripts/joulu-aikataulu.mjs
 * Ilman ympäristömuuttujia avain luetaan tiedostosta .env.printify.local (gitignoroitu).
 *
 * Laskenta:
 *   1. Kaikki kaupan tilaukset (GET /v1/shops/{shop}/orders.json, sivutettuna), peruutetut pois.
 *   2. Jokaiselle tilausriville: tulostaja (print_provider_id), sen maa (julkinen katalogi
 *      /v1/catalog/print_providers/{id}.json; id:t 417 ja 274 puuttuvat katalogista, joten maa
 *      otetaan tilausrivin metadata.country-kentästä) ja aikaleimat:
 *        käsittely  = created_at -> sent_to_production_at
 *        tuotanto   = sent_to_production_at -> rivin fulfilled_at (lähetyshetki)
 *        kuljetus   = lähetyshetki -> shipments[].delivered_at
 *      Kesken oleva kuljetus (ei delivered_at) lasketaan alarajaksi: jo kulunut aika.
 *      Kestot ovat arkipäiviä (ma-pe; mittauksessa pyhiä EI vähennetä, jotta kesto ei lyhene).
 *      Printify Choice (99) reitittää tilauksen omaan verkostoonsa: rivin print_provider_id on
 *      todellinen painotalo. Havainto kirjataan tuotteen tulostajalle (product_id); jos tuotetta
 *      ei enää ole ja painotalo puuttuu julkisesta katalogista (417, 274), se on Choice-reititys.
 *   3. Tuotetyypin tulostajat kaupan Printify-tuotteista (GET /v1/shops/{shop}/products.json):
 *      blueprintin nimi -> tuotetyyppi, print_provider_id -> tulostaja.
 *   4. Tuotetyypin pahin tapaus = kaikkien sen tulostajien pahin tuotanto + pahin kuljetus
 *      (eri tilauksista yhdistettynä) + 2 arkipäivän puskuri. Käsittely (tilaus -> tuotantoon)
 *      tulostetaan tiedoksi; normaalisti se on 0-2 arkipäivää ja mahtuu puskuriin. Viimeinen
 *      tilauspäivä on myöhäisin arkipäivä, josta tämä arkipäivämäärä (Suomen arkipäivät,
 *      pyhät pois) ehtii perille 23.12.2026.
 *   5. Data on ohut, jos jollakin tyypin tulostajalla ei ole yhtään toimitettua tilausta tai
 *      toimitettuja havaintoja on alle 3. Silloin käytetään sivuston nykyistä joulun enimmäispäivää (campaignSchedule.ts).
 *   6. Lopullinen päivä = min(datan päivä, joulun enimmäispäivä). Havainnot ovat joulusesongin
 *      ulkopuolelta, ja enimmäispäivä perustuu Printifyn joulusesongin cutoffeihin
 *      (seo/toimitusajat.md), joten myöhäisempää päivää ei luvata.
 *
 * Tuloste ei sisällä henkilötietoja (ei nimiä, osoitteita eikä tilausnumeroita).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.printify.com/v1";
const TARGET = "2026-12-23";
const BUFFER_BD = 2;
const SITE_WIDE = "2026-11-20";
const MIN_DELIVERED = 3;
const CHOICE_ID = 99;

/** Suomen pyhät marras-joulukuussa 2026 ja muut 2026 arkipyhät (laskennan takarajaa varten). */
export const FI_HOLIDAYS_2026 = new Set([
  "2026-01-01", "2026-01-06", "2026-04-03", "2026-04-06", "2026-05-01", "2026-05-14",
  "2026-06-19", "2026-06-20", "2026-10-31", "2026-12-06", "2026-12-24", "2026-12-25", "2026-12-26",
]);

const isoDay = (d) => d.toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
};
const weekday = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay();
const isWeekend = (iso) => weekday(iso) === 0 || weekday(iso) === 6;
export const isFiBusinessDay = (iso) => !isWeekend(iso) && !FI_HOLIDAYS_2026.has(iso);

/** Arkipäivät (ma-pe) välillä (alku, loppu]: pelkkä päivämäärä, kellonaika ei vaikuta. */
export function weekdaysBetween(startIso, endIso) {
  let n = 0;
  for (let d = addDays(startIso, 1); d <= endIso; d = addDays(d, 1)) if (!isWeekend(d)) n++;
  return n;
}

/** Myöhäisin Suomen arkipäivä D, jolta D + n Suomen arkipäivää <= target. */
export function latestOrderDate(n, target = TARGET) {
  let d = target;
  while (!isFiBusinessDay(d)) d = addDays(d, -1);
  for (let left = n; left > 0; ) {
    d = addDays(d, -1);
    if (isFiBusinessDay(d)) left--;
  }
  while (!isFiBusinessDay(d)) d = addDays(d, -1);
  return d;
}

/** Printifyn aikaleima "2026-10-26 07:40:48+00:00" -> Helsingin päivämäärä (ISO). */
function helsinkiDate(ts) {
  if (!ts) return null;
  const d = new Date(ts.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(d);
}

/** Blueprintin nimi -> sivuston tuotekategoria. */
export function typeFromBlueprint(title) {
  const t = title.toLowerCase();
  if (/mug|cup/.test(t)) return "mukit";
  if (/hood|zip/.test(t)) return "hupparit";
  if (/long sleeve/.test(t)) return "pitkahihaiset";
  if (/bodysuit|onesie/.test(t)) return "bodyt";
  if (/ornament/.test(t)) return "koristeet";
  if (/blanket/.test(t)) return "peitot";
  if (/poster|canvas|print|frame/.test(t)) return "seinataulut";
  if (/sticker/.test(t)) return "tarrat";
  if (/beanie|knit/.test(t)) return "pipot";
  if (/sweatshirt|crewneck/.test(t)) return "muut";
  if (/tee|t-shirt|shirt/.test(t)) return "t-paidat";
  return "muut";
}

function loadEnv() {
  if (process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID) return;
  const file = path.join(ROOT, ".env.printify.local");
  if (!fs.existsSync(file)) throw new Error("PRINTIFY_API_KEY/PRINTIFY_SHOP_ID puuttuu");
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function main() {
  loadEnv();
  const key = process.env.PRINTIFY_API_KEY;
  const shop = process.env.PRINTIFY_SHOP_ID;
  const get = async (p) => {
    for (let i = 0; ; i++) {
      let res;
      try {
        res = await fetch(`${API}${p}`, { headers: { Authorization: `Bearer ${key}`, "User-Agent": "huumorikauppa-joulu" } });
      } catch (e) {
        if (i >= 5) throw e;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
        continue;
      }
      if (res.status === 404) return null;
      if ((res.status === 429 || res.status >= 500) && i < 5) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
        continue;
      }
      if (!res.ok) throw new Error(`Printify ${res.status}: ${p.split("?")[0]}`);
      await new Promise((r) => setTimeout(r, 150));
      return res.json();
    }
  };
  const paginate = async (base, limit) => {
    const out = [];
    for (let page = 1; ; page++) {
      const d = await get(`${base}?limit=${limit}&page=${page}`);
      out.push(...(d?.data ?? []));
      if (!d || page >= d.last_page) break;
    }
    return out;
  };

  const providerCache = new Map();
  const providerName = async (id, fallbackCountry) => {
    if (!providerCache.has(id)) {
      const p = await get(`/catalog/print_providers/${id}.json`);
      providerCache.set(id, p ? { name: p.title, country: p.location?.country ?? null } : null);
    }
    const p = providerCache.get(id);
    return p ? `${p.name} (${p.country ?? fallbackCountry ?? "?"})` : `id ${id} (${fallbackCountry ?? "?"}, ei julkisessa katalogissa)`;
  };

  const blueprintCache = new Map();
  const blueprintType = async (id) => {
    if (!blueprintCache.has(id)) {
      const b = await get(`/catalog/blueprints/${id}.json`);
      blueprintCache.set(id, typeFromBlueprint(b?.title ?? ""));
    }
    return blueprintCache.get(id);
  };

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());

  // Tuotetyypin tulostajat kaupan Printify-tuotteista. Printify Choice (99) on reititys: tilausrivin
  // print_provider_id on todellinen painotalo (esim. 417), joten havainto kirjataan tuotteen
  // tulostajalle (product_id -> print_provider_id).
  const products = await paginate(`/shops/${shop}/products.json`, 50);
  const productProvider = new Map(products.map((p) => [p.id, p.print_provider_id]));
  const typeProviders = new Map();
  for (const p of products) {
    if (p.visible === false) continue;
    const type = await blueprintType(p.blueprint_id);
    if (!typeProviders.has(type)) typeProviders.set(type, new Map());
    const m = typeProviders.get(type);
    m.set(p.print_provider_id, (m.get(p.print_provider_id) ?? 0) + 1);
  }

  const orders = (await paginate(`/shops/${shop}/orders.json`, 10)).filter((o) => o.status !== "canceled");

  /** provider id -> havainnot */
  const obs = new Map();
  const ensure = (id) => {
    if (!obs.has(id)) obs.set(id, { lines: 0, handling: [], production: [], transit: [], transitOpen: [], country: null, types: new Set(), routed: new Map() });
    return obs.get(id);
  };
  for (const o of orders) {
    const created = helsinkiDate(o.created_at);
    const sent = helsinkiDate(o.sent_to_production_at);
    const delivered = (o.shipments ?? []).map((s) => helsinkiDate(s.delivered_at)).filter(Boolean).sort().at(-1) ?? null;
    for (const li of o.line_items ?? []) {
      if (li.status === "canceled") continue;
      // Tuote voi olla jo poistettu listalta. Julkisesta katalogista puuttuva painotalo (417, 274)
      // on Printify Choicen oma verkosto, joten rivi kirjataan Printify Choicelle (99).
      if (!providerCache.has(li.print_provider_id)) await providerName(li.print_provider_id);
      const listed =
        productProvider.get(li.product_id) ?? (providerCache.get(li.print_provider_id) ? li.print_provider_id : CHOICE_ID);
      const r = ensure(listed);
      if (listed !== li.print_provider_id) r.routed.set(li.print_provider_id, li.metadata?.country ?? null);
      r.lines++;
      r.country ??= li.metadata?.country ?? null;
      r.types.add(await blueprintType(li.blueprint_id));
      const lineSent = helsinkiDate(li.sent_to_production_at) ?? sent;
      const shipped = helsinkiDate(li.fulfilled_at) ?? (o.shipments ?? []).map((s) => helsinkiDate(s.shipped_at)).filter(Boolean).sort()[0] ?? null;
      if (created && lineSent) r.handling.push(weekdaysBetween(created, lineSent));
      if (lineSent && shipped) r.production.push(weekdaysBetween(lineSent, shipped));
      else if (lineSent && !shipped) r.production.push(weekdaysBetween(lineSent, today)); // kesken: alaraja
      if (shipped && delivered) r.transit.push(weekdaysBetween(shipped, delivered));
      else if (shipped && !delivered) r.transitOpen.push(weekdaysBetween(shipped, today));
    }
  }

  const max = (a) => (a.length ? Math.max(...a) : null);
  console.log(`Tilauksia (ei peruutettuja): ${orders.length}. Laskettu ${today}. Kohde: perillä ${TARGET}, puskuri ${BUFFER_BD} arkipäivää.\n`);
  console.log("TULOSTAJAT (arkipäivinä, pahin havainto; kuljetus kesken = jo kulunut aika, alaraja)");
  console.log("tulostaja | rivejä | käsittely max | tuotanto max | kuljetus max (toimitettuja) | kesken max");
  for (const [id, r] of [...obs.entries()].sort((a, b) => b[1].lines - a[1].lines)) {
    console.log(
      `${await providerName(id, r.country)}${r.routed.size ? ` -> ${(await Promise.all([...r.routed].map(([x, c]) => providerName(x, c)))).join(", ")}` : ""} [${[...r.types].join("/")}] | ${r.lines} | ${max(r.handling) ?? "-"} | ${max(r.production) ?? "-"} | ${max(r.transit) ?? "-"} (${r.transit.length}) | ${max(r.transitOpen) ?? "-"}`,
    );
  }

  console.log("\nTUOTETYYPIT (tulostajat kaupan näkyvistä Printify-tuotteista)");
  console.log("tyyppi | tulostajat (tuotteita) | pahin tuotanto+kuljetus+puskuri | datan päivä | lopullinen");
  const result = {};
  for (const [type, provs] of [...typeProviders.entries()].sort()) {
    const ids = [...provs.keys()];
    const rows = ids.map((id) => obs.get(id)).filter(Boolean);
    const delivered = rows.reduce((n, r) => n + r.transit.length, 0);
    const missing = ids.filter((id) => !(obs.get(id)?.transit.length));
    const thin = missing.length > 0 || delivered < MIN_DELIVERED;
    let dataDate = null;
    let total = null;
    if (rows.some((r) => r.transit.length)) {
      const p = Math.max(0, ...rows.flatMap((r) => r.production));
      const t = Math.max(0, ...rows.flatMap((r) => [...r.transit, ...r.transitOpen]));
      total = `${p}+${t}+${BUFFER_BD}=${p + t + BUFFER_BD}`;
      dataDate = latestOrderDate(p + t + BUFFER_BD);
    }
    const final = !thin && dataDate < SITE_WIDE ? dataDate : SITE_WIDE;
    result[type] = final;
    const provText = (await Promise.all(ids.map(async (id) => `${await providerName(id, obs.get(id)?.country)} ${provs.get(id)}`))).join(", ");
    console.log(
      `${type} | ${provText} | ${total ?? "-"}${thin ? ` (data ohut: toimitettuja ${delivered}, ilman toimitusdataa ${missing.join(",") || "-"})` : ""} | ${dataDate ?? "-"} | ${final}`,
    );
  }
  console.log("\nLopulliset päivät (src/data/jouluAikataulu.ts):", JSON.stringify(result));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
