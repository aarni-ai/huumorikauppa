#!/usr/bin/env node
/**
 * Printify-saatavuus: mitkä tuotteiden koko/väri-yhdistelmät tuotteen print provider pystyy valmistamaan.
 *
 * Kirjoittaa:
 *   src/data/printify-saatavuus.json   (kauppa: tuotesivun valitsimet, piilotus, JSON-LD; src/lib/variantAvailability.ts)
 *   api/_lib/printify-saatavuus.js     (Merchant-syöte ja sivukartta: kokonaan valmistamattomat slugit)
 *
 * Ajo:
 *   PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *     node scripts/printify-saatavuus.mjs [--kuiva] [--lahde <url>/api/products] [--vain-kartta] [--pakota]
 *
 *   --kuiva        ei kirjoiteta tiedostoja, vain raportti
 *   --lahde URL    tuotelista omasta backendistä (JSON-taulukko tai { products | data: [...] }) Supabasen sijaan
 *   --vain-kartta  ei Printify-kutsuja: vain variant_map-aukot (yhdistelmä puuttuu kartasta = ei tilattavissa)
 *   --pakota       kirjoita, vaikka turvaraja (yli 25 % tuotteista kokonaan valmistamattomia) ylittyy
 *
 * Yhdistelmä on valmistamaton, kun
 *   1. avain "Väri|Koko" puuttuu tuotteen variants.variant_map:sta (kassa ei löydä Printify-varianttia; kauppa
 *      päättelee tämän itse, joten JSONiin näitä ei kirjoiteta, vain summary.ei_kartassa ja kokonaan-lista), tai
 *   2. Printify-tuotteen (GET /v1/shops/{shop}/products/{id}.json) variantti puuttuu, is_enabled = false tai
 *      is_available = false (ensisijainen signaali), tai
 *   3. variantti puuttuu print providerin katalogista (GET /v1/catalog/blueprints/{bp}/print_providers/{pp}/
 *      variants.json?show-out-of-stock=1) tai katalogi merkitsee sen saatavuudeltaan pois (toissijainen signaali).
 * Printify-tuote, jota ei löydy (404), merkitään kokonaan valmistamattomaksi.
 *
 * Mitään ei poisteta Printifystä. "Copy of" -alkuiset Printify-tuotteet vain listataan raporttiin.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUT = path.join(ROOT, "src/data/printify-saatavuus.json");
const JS_OUT = path.join(ROOT, "api/_lib/printify-saatavuus.js");
const PRINTIFY_API = "https://api.printify.com/v1";
const TURVARAJA = 0.25;

const sleepDefault = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Printify-asiakas: noin 5 pyyntöä sekunnissa (Printify sallii 600/min), uusinta 429:llä ja 5xx:llä.
 * Palauttaa { status, data } (data null, jos ei JSONia). 404 palautetaan kutsujalle, muut virheet heitetään.
 */
export function createPrintifyClient({ apiKey, fetchImpl = fetch, sleep = sleepDefault, minIntervalMs = 200, maxRetries = 5 }) {
  let seuraava = 0;
  return async function printifyGet(pathAndQuery) {
    for (let yritys = 0; ; yritys++) {
      const nyt = Date.now();
      if (nyt < seuraava) await sleep(seuraava - nyt);
      seuraava = Math.max(nyt, seuraava) + minIntervalMs;
      const res = await fetchImpl(`${PRINTIFY_API}${pathAndQuery}`, {
        headers: { Authorization: `Bearer ${apiKey}`, "User-Agent": "huumorikauppa-saatavuus" },
      });
      if (res.status === 429 || res.status >= 500) {
        if (yritys >= maxRetries) throw new Error(`Printify ${res.status}: ${pathAndQuery}`);
        const retryAfter = Number(res.headers?.get?.("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** yritys);
        continue;
      }
      if (res.status === 404) return { status: 404, data: null };
      if (!res.ok) throw new Error(`Printify ${res.status}: ${pathAndQuery}`);
      return { status: res.status, data: await res.json() };
    }
  };
}

/** Kaikki kaupan Printify-tuotteet sivuittain (limit 50). */
export async function listShopProducts(printifyGet, shopId) {
  const out = [];
  for (let page = 1; page < 1000; page++) {
    const { data } = await printifyGet(`/shops/${shopId}/products.json?limit=50&page=${page}`);
    const rivit = Array.isArray(data?.data) ? data.data : [];
    out.push(...rivit);
    const last = Number(data?.last_page ?? page);
    if (rivit.length === 0 || page >= last) break;
  }
  return out;
}

/** Tuotteen yhdistelmät samassa muodossa kuin kauppa muodostaa ne: värit × koot, puuttuva puoli tyhjänä. */
export function variantCombos(variants) {
  const colors = Array.isArray(variants?.colors) && variants.colors.length > 0 ? variants.colors : [""];
  const sizes = Array.isArray(variants?.sizes) && variants.sizes.length > 0 ? variants.sizes : [""];
  const out = [];
  for (const c of [...new Set(colors)]) for (const s of [...new Set(sizes)]) out.push(`${c}|${s}`);
  return out;
}

const SAATAVUUS_POIS = new Set(["out-of-stock", "out_of_stock", "discontinued", "unavailable", "disabled"]);

/** Katalogivariantti, jota provider ei juuri nyt valmista (kenttä vaihtelee providereittain). */
export function catalogVariantUnavailable(v) {
  if (!v) return true;
  if (v.is_available === false || v.available === false) return true;
  if (typeof v.status === "string" && SAATAVUUS_POIS.has(v.status.toLowerCase())) return true;
  if (typeof v.stock_status === "string" && SAATAVUUS_POIS.has(v.stock_status.toLowerCase())) return true;
  return false;
}

/**
 * Yhden tuotteen valmistamattomat avaimet.
 * printifyProduct: tuotteen Printify-objekti tai null (ei Printify-tarkistusta, esim. --vain-kartta).
 * catalog: Map(variantId -> katalogivariantti) tai null (katalogia ei saatu).
 * Palauttaa { unavailable: string[], syyt: { [key]: syy } }.
 */
export function computeUnavailable(row, printifyProduct, catalog) {
  const variantMap = row?.variants?.variant_map ?? {};
  const pv = new Map((printifyProduct?.variants ?? []).map((v) => [Number(v.id), v]));
  const unavailable = [];
  const syyt = {};
  for (const key of variantCombos(row?.variants)) {
    const id = variantMap[key];
    let syy = null;
    if (typeof id !== "number") syy = "ei_kartassa";
    else if (printifyProduct) {
      const v = pv.get(id);
      if (!v) syy = "ei_printify_tuotteessa";
      else if (v.is_enabled === false) syy = "ei_kaytossa";
      else if (v.is_available === false) syy = "ei_saatavilla";
      else if (catalog && !catalog.has(id)) syy = "ei_katalogissa";
      else if (catalog && catalogVariantUnavailable(catalog.get(id))) syy = "katalogi_ei_saatavilla";
    }
    if (syy) {
      unavailable.push(key);
      syyt[key] = syy;
    }
  }
  return { unavailable, syyt };
}

const normalisoi = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9åäö]+/g, " ").trim();

/**
 * Kaupan rivi -> Printify-tuote, kun rivillä ei ole printify_product_id:tä. Variantti-id:t ovat katalogin id:itä ja
 * siksi yhteisiä saman blueprintin tuotteille: ehdokkaat ovat tuotteet, joissa on kaikki rivin variant_map-id:t,
 * ja niistä valitaan nimeltään sama. Yksiselitteinen osuma vain, jos ehdokas on yksi tai nimi ratkaisee.
 */
export function mapRowToShopProduct(row, shopProducts) {
  const ids = Object.values(row?.variants?.variant_map ?? {}).filter((x) => typeof x === "number");
  if (ids.length === 0) return null;
  const ehdokkaat = shopProducts.filter((p) => {
    const omat = new Set((p.variants ?? []).map((v) => Number(v.id)));
    return ids.every((id) => omat.has(id));
  });
  if (ehdokkaat.length === 1) return ehdokkaat[0];
  const nimi = normalisoi(row?.name);
  const nimella = ehdokkaat.filter((p) => normalisoi(p.title) === nimi);
  return nimella.length === 1 ? nimella[0] : null;
}

/** "Copy of" -alkuiset Printify-tuotteet raporttiin (ei poisteta). */
export function copyOfProducts(shopProducts, linkedIds) {
  return shopProducts
    .filter((p) => /^copy of /i.test(String(p.title ?? "")))
    .map((p) => ({
      title: p.title,
      id: p.id,
      visible: p.visible !== false,
      published: !!(p.external && (p.external.id || p.external.handle)),
      linked: linkedIds.has(String(p.id)),
    }));
}

/** Tuotelista: Supabase anon REST (sivuittain) tai --lahde-osoite. Vain aktiiviset rivit. */
export async function fetchShopRows({ lahde, supabaseUrl, supabaseKey, fetchImpl = fetch }) {
  let rows = [];
  if (lahde) {
    const res = await fetchImpl(lahde);
    if (!res.ok) throw new Error(`Tuotelista ${res.status}: ${lahde}`);
    const data = await res.json();
    rows = Array.isArray(data) ? data : data?.products ?? data?.data ?? [];
  } else {
    if (!supabaseUrl || !supabaseKey) throw new Error("VITE_SUPABASE_URL ja VITE_SUPABASE_PUBLISHABLE_KEY puuttuvat (tai anna --lahde).");
    const base = supabaseUrl.replace(/\/$/, "");
    const select = "slug,name,category,is_active,printify_product_id,variants";
    for (let offset = 0; ; offset += 1000) {
      const res = await fetchImpl(`${base}/rest/v1/products?select=${select}&order=slug.asc&limit=1000&offset=${offset}`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (!res.ok) throw new Error(`Supabase ${res.status}`);
      const sivu = await res.json();
      rows.push(...sivu);
      if (sivu.length < 1000) break;
    }
  }
  return rows.filter((r) => r && r.slug && r.is_active !== false);
}

/**
 * Koko ajo ilman tiedostojen kirjoitusta. Palauttaa { data, raportti }.
 * printifyGet null = --vain-kartta.
 */
export async function buildSaatavuus({ rows, printifyGet, shopId, now = () => new Date() }) {
  let shopProducts = [];
  let copyOf = [];
  const linkedIds = new Set(rows.map((r) => r.printify_product_id).filter(Boolean).map(String));
  if (printifyGet) {
    shopProducts = await listShopProducts(printifyGet, shopId);
  }
  const catalogCache = new Map();
  async function catalogFor(bp, pp) {
    if (!printifyGet || bp == null || pp == null) return null;
    const k = `${bp}/${pp}`;
    if (!catalogCache.has(k)) {
      let map = null;
      try {
        const { status, data } = await printifyGet(`/catalog/blueprints/${bp}/print_providers/${pp}/variants.json?show-out-of-stock=1`);
        if (status !== 404 && Array.isArray(data?.variants)) map = new Map(data.variants.map((v) => [Number(v.id), v]));
      } catch {
        map = null;
      }
      catalogCache.set(k, map);
    }
    return catalogCache.get(k);
  }

  const products = {};
  const kokonaan = [];
  const top = [];
  const syyLaskuri = {};
  const virheet = [];
  const ilmanTuotetta = [];
  let checkedProducts = 0;
  let checkedVariants = 0;
  let unavailableVariants = 0;

  for (const row of rows) {
    let ppid = row.printify_product_id ? String(row.printify_product_id) : null;
    let printifyProduct = null;
    let puuttuu = false;
    if (printifyGet) {
      if (!ppid) {
        const osuma = mapRowToShopProduct(row, shopProducts);
        if (!osuma) {
          ilmanTuotetta.push(row.slug);
          continue;
        }
        ppid = String(osuma.id);
        linkedIds.add(ppid);
      }
      try {
        const { status, data } = await printifyGet(`/shops/${shopId}/products/${ppid}.json`);
        if (status === 404) puuttuu = true;
        else printifyProduct = data;
      } catch (e) {
        virheet.push({ slug: row.slug, virhe: String(e?.message ?? e) });
        continue;
      }
    }
    const combos = variantCombos(row.variants);
    checkedProducts++;
    checkedVariants += combos.length;
    let unavailable;
    let syyt;
    if (puuttuu) {
      unavailable = combos;
      syyt = Object.fromEntries(combos.map((k) => [k, "printify_tuote_puuttuu"]));
    } else {
      const catalog = printifyProduct ? await catalogFor(printifyProduct.blueprint_id, printifyProduct.print_provider_id) : null;
      ({ unavailable, syyt } = computeUnavailable(row, printifyProduct, catalog));
    }
    for (const s of Object.values(syyt)) syyLaskuri[s] = (syyLaskuri[s] ?? 0) + 1;
    unavailableVariants += unavailable.length;
    if (unavailable.length > 0) top.push([row.slug, unavailable.length]);
    // JSONiin vain kartassa olevat avaimet: kartan aukot (ei_kartassa) kauppa päättelee itse tuotteen variant_map:sta
    // (src/lib/variantAvailability.ts), joten tiedosto pysyy pienenä.
    const kartta = row.variants?.variant_map ?? {};
    const jsonAvaimet = unavailable.filter((k) => typeof kartta[k] === "number");
    if (jsonAvaimet.length > 0) {
      products[row.slug] = {
        unavailable: jsonAvaimet,
        printify_product_id: ppid,
        provider_id: printifyProduct?.print_provider_id ?? null,
      };
    }
    if (combos.length > 0 && unavailable.length === combos.length) kokonaan.push(row.slug);
  }

  if (printifyGet) copyOf = copyOfProducts(shopProducts, linkedIds);

  const sorted = Object.fromEntries(Object.entries(products).sort(([a], [b]) => a.localeCompare(b)));
  const data = {
    generated_at: now().toISOString(),
    products: sorted,
    kokonaan_ei_saatavilla: kokonaan.sort(),
    summary: {
      checked_products: checkedProducts,
      checked_variants: checkedVariants,
      unavailable_variants: unavailableVariants,
      ei_kartassa: syyLaskuri.ei_kartassa ?? 0,
      tila: printifyGet ? "printify" : "vain-kartta",
    },
  };
  top.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return { data, raportti: { syyLaskuri, top: top.slice(0, 15), virheet, ilmanTuotetta, copyOf, shopProductCount: shopProducts.length } };
}

/**
 * Tappiolliset variantit (data/tappio-variantit.json, scripts/tappiotarkistus.mjs oma-tausta-haarassa: Printifyn kulu
 * toimitettuna > myynti ilman alv:tä - Stripe) piilotetaan samalla tavalla kuin valmistamattomat. Tuote, jonka kaikki
 * variant_map-yhdistelmät ovat piilossa, menee kokonaan_ei_saatavilla-listaan (pois listoista, syötteestä, sivukartasta).
 */
export function yhdistaTappio(data, rows, tappio) {
  if (!tappio || typeof tappio !== "object") return data;
  const products = { ...data.products };
  const kokonaan = new Set(data.kokonaan_ei_saatavilla ?? []);
  let lisatty = 0;
  for (const row of rows) {
    const avaimet = Array.isArray(tappio[row.slug]) ? tappio[row.slug] : [];
    if (!avaimet.length) continue;
    const vanha = products[row.slug] ?? { unavailable: [], printify_product_id: row.printify_product_id ?? null, provider_id: null };
    const yhdessa = [...new Set([...(vanha.unavailable ?? []), ...avaimet])].sort();
    lisatty += yhdessa.length - (vanha.unavailable ?? []).length;
    products[row.slug] = { ...vanha, unavailable: yhdessa };
    const kartta = Object.keys(row?.variants?.variant_map ?? {});
    if (kartta.length > 0 && kartta.every((k) => yhdessa.includes(k))) kokonaan.add(row.slug);
  }
  const sorted = Object.fromEntries(Object.entries(products).sort(([a], [b]) => a.localeCompare(b)));
  return { ...data, products: sorted, kokonaan_ei_saatavilla: [...kokonaan].sort(), summary: { ...data.summary, tappio_variantit: lisatty } };
}

export function renderJsModule(data) {
  return [
    "// GENEROITU: scripts/printify-saatavuus.mjs kirjoittaa tämän tiedoston. Älä muokkaa käsin.",
    "// Sama data kuin src/data/printify-saatavuus.json (kokonaan valmistamattomat tuotteet) syötteen ja sivukartan käyttöön.",
    `export const SAATAVUUS_GENERATED_AT = ${JSON.stringify(data.generated_at ?? null)};`,
    `export const KOKONAAN_EI_SAATAVILLA = new Set(${JSON.stringify(data.kokonaan_ei_saatavilla ?? [], null, 2)});`,
    "/** Koko data kaupan apufunktiolle (src/lib/variantAvailability.ts); JS-moduuli toimii Vitessä, middlewaressa ja Nodessa. */",
    `export const SAATAVUUS_DATA = ${JSON.stringify(data, null, 2)};`,
    "",
  ].join("\n");
}

function tulostaRaportti(data, raportti) {
  const s = data.summary;
  console.log(`Tila: ${s.tila}`);
  console.log(`Tarkistettu: ${s.checked_products} tuotetta, ${s.checked_variants} yhdistelmää`);
  console.log(`Valmistamattomia yhdistelmiä: ${s.unavailable_variants}, joista kartan aukkoja ${s.ei_kartassa} (päätellään kaupassa variant_map:sta)`);
  console.log(`JSONiin Printify-syyn vuoksi: ${Object.values(data.products).reduce((n, p) => n + p.unavailable.length, 0)} yhdistelmää ${Object.keys(data.products).length} tuotteessa`);
  console.log(`Kokonaan valmistamattomia tuotteita: ${data.kokonaan_ei_saatavilla.length}`);
  for (const slug of data.kokonaan_ei_saatavilla) console.log(`  - ${slug}`);
  console.log("Syyt:", JSON.stringify(raportti.syyLaskuri));
  console.log("Top 15 (valmistamattomia yhdistelmiä, kaikki syyt):");
  for (const [slug, n] of raportti.top) console.log(`  ${String(n).padStart(4)}  ${slug}`);
  if (raportti.ilmanTuotetta.length) {
    console.log(`Ei Printify-tuotetta (ei id:tä eikä yksiselitteistä osumaa): ${raportti.ilmanTuotetta.length}`);
    for (const slug of raportti.ilmanTuotetta) console.log(`  - ${slug}`);
  }
  if (raportti.virheet.length) {
    console.log(`Virheet (tuote ohitettu): ${raportti.virheet.length}`);
    for (const v of raportti.virheet) console.log(`  - ${v.slug}: ${v.virhe}`);
  }
  if (s.tila === "printify") {
    console.log(`Printify-kaupan tuotteita: ${raportti.shopProductCount}`);
    console.log(`"Copy of" -tuotteet (${raportti.copyOf.length}, ei poisteta):`);
    for (const c of raportti.copyOf) {
      console.log(`  - ${c.id}  ${c.title}  [${c.visible ? "näkyvä" : "piilotettu"}, ${c.published ? "julkaistu" : "julkaisematon"}, ${c.linked ? "linkitetty kauppaan" : "ei linkitetty"}]`);
    }
  }
}

function argValue(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const kuiva = args.includes("--kuiva");
  const vainKartta = args.includes("--vain-kartta");
  const pakota = args.includes("--pakota");
  const lahde = argValue(args, "--lahde");
  const apiKey = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!vainKartta && (!apiKey || !shopId)) {
    console.error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID tarvitaan (tai --vain-kartta).");
    process.exit(2);
  }
  const rows = await fetchShopRows({
    lahde,
    supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    supabaseKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY,
  });
  console.log(`Aktiivisia tuotteita: ${rows.length}`);
  const tappioPolku = path.join(ROOT, "data/tappio-variantit.json");
  const tappio = await fs.readFile(tappioPolku, "utf8").then(JSON.parse).catch(() => null);
  let data;
  if (process.argv.includes("--vain-tappio")) {
    // Ei Printify-kutsuja: nykyiseen saatavuustiedostoon yhdistetään vain tappiolliset variantit.
    data = yhdistaTappio(JSON.parse(await fs.readFile(JSON_OUT, "utf8")), rows, tappio);
  } else {
    const printifyGet = vainKartta ? null : createPrintifyClient({ apiKey });
    const built = await buildSaatavuus({ rows, printifyGet, shopId });
    tulostaRaportti(built.data, built.raportti);
    data = yhdistaTappio(built.data, rows, tappio);
  }
  if (tappio) console.log(`Tappiolliset variantit (data/tappio-variantit.json): ${data.summary.tappio_variantit ?? 0} lisätty, kokonaan piilossa ${data.kokonaan_ei_saatavilla.length}`);

  if (kuiva) {
    console.log("--kuiva: tiedostoja ei kirjoitettu.");
    return;
  }
  const osuus = data.summary.checked_products ? data.kokonaan_ei_saatavilla.length / data.summary.checked_products : 0;
  if (osuus > TURVARAJA && !pakota) {
    console.error(`Turvaraja: ${Math.round(osuus * 100)} % tuotteista kokonaan valmistamattomia. Tarkista PRINTIFY_SHOP_ID. Ei kirjoitettu (--pakota ohittaa).`);
    process.exit(3);
  }
  await fs.writeFile(JSON_OUT, `${JSON.stringify(data, null, 2)}\n`);
  await fs.writeFile(JS_OUT, renderJsModule(data));
  console.log(`Kirjoitettu: ${path.relative(ROOT, JSON_OUT)}, ${path.relative(ROOT, JS_OUT)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e?.message ?? e);
    process.exit(1);
  });
}
