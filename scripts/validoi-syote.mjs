#!/usr/bin/env node
/**
 * Tarkistaa Google Merchant -syötteen maksuttomia listauksia varten (säännöt: scripts/syote-validointi.mjs).
 *
 *   node scripts/validoi-syote.mjs [syöte-URL tai tiedosto] [--ei-verkkoa] [--otos N] [--rinnakkain N] [--json]
 *
 * Oletuksena https://huumorikauppa.fi/api/product-feed. Verkkotarkistukset (oletuksena kaikki tuotteet):
 * tuotesivu 200 ilman ohjausta + canonical + JSON-LD-hinta, pääkuva 200 + image/* + mitat,
 * sivukartan tuotteet ja Googlen kategoriataksonomia. --otos N rajaa sivu- ja kuvatarkistukset N tuotteeseen.
 * Poistuu koodilla 1, jos syötteessä on virheitä.
 */
import fs from "node:fs";
import { SITE, validateFeed, summarize, validateImageResponse, validateLandingPage, slugOf, parsePrice } from "./syote-validointi.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const arvo = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const lahde = args.find((a, i) => !a.startsWith("--") && !["--otos", "--rinnakkain"].includes(args[i - 1])) || `${SITE}/api/product-feed`;
const verkko = !flag("--ei-verkkoa");
const otos = Number(arvo("--otos", "0")) || 0;
const rinnakkain = Number(arvo("--rinnakkain", "8")) || 8;
const UA = "Mozilla/5.0 (compatible; huumorikauppa-syotetarkistus/1.0)";

async function haeTeksti(url) {
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
}

async function rinnakkaisesti(lista, n, fn) {
  const tulos = new Array(lista.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, lista.length) }, async () => {
      while (i < lista.length) {
        const k = i++;
        for (let yritys = 0; ; yritys++) {
          try {
            tulos[k] = await fn(lista[k]);
            break;
          } catch (e) {
            if (yritys >= 2) {
              tulos[k] = [{ taso: "virhe", tyyppi: "verkkovirhe", viesti: String(e?.message || e) }];
              break;
            }
            await new Promise((r) => setTimeout(r, 500 * (yritys + 1)));
          }
        }
      }
    }),
  );
  return tulos;
}

const xml = /^https?:\/\//.test(lahde) ? await haeTeksti(lahde) : fs.readFileSync(lahde, "utf8");

let taxonomy;
let sitemapSlugs;
if (verkko) {
  try {
    const t = await haeTeksti("https://www.google.com/basepages/producttype/taxonomy.en-US.txt");
    taxonomy = new Set(t.split("\n").filter((r) => r && !r.startsWith("#")).map((r) => r.trim()));
  } catch (e) {
    console.error(`Taksonomiaa ei saatu (${e.message}), kategorioiden tarkistus ohitetaan.`);
  }
  try {
    const sm = await haeTeksti(`${SITE}/sitemap.xml`);
    sitemapSlugs = new Set([...sm.matchAll(/<loc>[^<]*\/tuote\/([^<]+)<\/loc>/g)].map((m) => m[1]));
  } catch (e) {
    console.error(`Sivukarttaa ei saatu (${e.message}), sivukarttavertailu ohitetaan.`);
  }
}

const { items, tulokset } = validateFeed(xml, { taxonomy, sitemapSlugs });

if (verkko && items.length) {
  const kohteet = items.map((item, k) => ({ item, k })).slice(0, otos || items.length);
  const sivut = await rinnakkaisesti(kohteet, rinnakkain, async ({ item }) => {
    const link = item.fields.link?.[0];
    if (!link || !slugOf(link)) return [];
    const r = await fetch(link, { redirect: "manual", headers: { "User-Agent": UA } });
    const html = r.status === 200 ? await r.text() : "";
    return validateLandingPage({ status: r.status, location: r.headers.get("location"), html }, { link, price: parsePrice(item.fields.price?.[0]) });
  });
  const kuvat = await rinnakkaisesti(kohteet, rinnakkain, async ({ item }) => {
    const img = item.fields.image_link?.[0];
    if (!img) return [];
    const r = await fetch(img, { headers: { "User-Agent": UA } });
    const bytes = r.ok ? new Uint8Array(await r.arrayBuffer()) : null;
    return validateImageResponse({ status: r.status, contentType: r.headers.get("content-type"), bytes, redirected: r.redirected }, item.fields.google_product_category?.[0]);
  });
  kohteet.forEach(({ k }, j) => tulokset[k].ongelmat.push(...(sivut[j] || []), ...(kuvat[j] || [])));
}

const yhteenveto = summarize(tulokset);
if (flag("--json")) {
  console.log(JSON.stringify({ lahde, yhteenveto, tulokset: tulokset.filter((t) => t.ongelmat.length) }, null, 2));
} else {
  console.log(`Syöte: ${lahde}`);
  console.log(`Tuotteita ${yhteenveto.tuotteita}, joista virheellisiä ${yhteenveto.tuotteitaVirheilla}${verkko ? `, verkkotarkistus ${otos || items.length} tuotteelle` : ", verkkotarkistukset ohitettu"}`);
  const tulosta = (otsikko, obj) => {
    const rivit = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    console.log(`\n${otsikko} (${rivit.reduce((s, [, n]) => s + n, 0)}):`);
    for (const [tyyppi, n] of rivit) {
      const esim = tulokset.flatMap((t) => t.ongelmat.filter((o) => o.tyyppi === tyyppi).map((o) => o.viesti || t.id)).slice(0, 2);
      console.log(`  ${String(n).padStart(5)}  ${tyyppi}${esim.length ? `  esim. ${esim.join(" | ").slice(0, 140)}` : ""}`);
    }
    if (!rivit.length) console.log("  ei yhtään");
  };
  tulosta("Virheet", yhteenveto.virheet);
  tulosta("Varoitukset", yhteenveto.varoitukset);
}
process.exit(Object.keys(yhteenveto.virheet).length ? 1 : 0);
