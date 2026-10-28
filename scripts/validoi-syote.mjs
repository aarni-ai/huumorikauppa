#!/usr/bin/env node
/**
 * Tarkistaa Google Merchant -syötteen maksuttomia listauksia varten (säännöt: scripts/syote-validointi.mjs).
 *
 *   node scripts/validoi-syote.mjs [syöte-URL tai tiedosto] [--ei-verkkoa] [--otos N] [--rinnakkain N] [--api URL] [--json]
 *
 * Oletuksena https://huumorikauppa.fi/api/product-feed. Verkkotarkistukset (oletuksena kaikki tuotteet):
 * tuotesivu 200 ilman ohjausta + canonical + JSON-LD-hinta, pääkuva 200 + image/* + mitat,
 * sivukartan tuotteet, Googlen kategoriataksonomia (polut ja numeeriset ID:t) ja hinta = sivuston /api/products-hinta.
 * --otos N rajaa sivu- ja kuvatarkistukset N tuotteeseen (otos jakautuu tasaisesti koko syötteeseen).
 * Poistuu koodilla 1, jos syötteessä on virheitä.
 */
import fs from "node:fs";
import { SITE, validateFeed, summarize, validateImageResponse, validateLandingPage, slugOf, parsePrice, categoryPath } from "./syote-validointi.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const arvo = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const lahde = args.find((a, i) => !a.startsWith("--") && !["--otos", "--rinnakkain", "--api"].includes(args[i - 1])) || `${SITE}/api/product-feed`;
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
let taxonomyIds;
let sitemapSlugs;
if (verkko) {
  try {
    // "212 - Apparel & Accessories > Clothing > Shirts & Tops": sekä polut että ID:t samasta tiedostosta.
    const t = await haeTeksti("https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt");
    const rivit = t.split("\n").map((r) => r.trim().match(/^(\d+) - (.+)$/)).filter(Boolean);
    taxonomy = new Set(rivit.map((m) => m[2]));
    taxonomyIds = new Map(rivit.map((m) => [m[1], m[2]]));
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

// Oma tausta: tuoterivit (printify_product_id) /api/products-rajapinnasta, jotta EU-kopioon siirretty rivi ei ole
// virhe (api/_lib/eu-reititys.js onEuReititetty). Ilman rajapintaa (vanha tausta) päätös tehdään slugista.
let euReititetty;
let apiHinnat;
// Samasta rajapinnasta hinnat: syötteen hinnan on vastattava sivuston hintaa (tuotesivu ja kassa käyttävät samaa riviä).
// --api URL: paikallisen syötetiedoston hinnat ja rivit annetusta sivustosta (esim. https://huumorikauppa.fi).
const apiOrigin = arvo("--api", null) || (/^https?:\/\//.test(lahde) ? new URL(lahde).origin : null);
if (verkko && apiOrigin) {
  try {
    const r = await fetch(`${new URL(apiOrigin).origin}/api/products?fields=slug,printify_product_id,price`, { headers: { "User-Agent": UA } });
    const rivit = r.ok && /json/.test(r.headers.get("content-type") || "") ? await r.json() : null;
    if (Array.isArray(rivit)) apiHinnat = new Map(rivit.filter((x) => x?.slug).map((x) => [x.slug, Number(x.price)]));
    if (Array.isArray(rivit) && rivit.some((x) => x?.printify_product_id)) {
      const { onEuReititetty, onEuReititettySlug } = await import("../api/_lib/eu-reititys.js");
      const kartta = new Map(rivit.map((x) => [x.slug, x]));
      euReititetty = (slug) => (kartta.has(slug) ? onEuReititetty(kartta.get(slug)) : onEuReititettySlug(slug));
    }
  } catch { /* ei rajapintaa: slug-päätös */ }
}
const { items, tulokset } = validateFeed(xml, { taxonomy, taxonomyIds, sitemapSlugs, euReititetty, apiHinnat });

if (verkko && items.length) {
  const kaikki = items.map((item, k) => ({ item, k }));
  const kohteet = otos && otos < kaikki.length ? kaikki.filter((_, k) => k % Math.ceil(kaikki.length / otos) === 0).slice(0, otos) : kaikki;
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
    return validateImageResponse({ status: r.status, contentType: r.headers.get("content-type"), bytes, redirected: r.redirected }, categoryPath(item.fields.google_product_category?.[0], taxonomyIds));
  });
  kohteet.forEach(({ k }, j) => tulokset[k].ongelmat.push(...(sivut[j] || []), ...(kuvat[j] || [])));
}

const yhteenveto = summarize(tulokset);
if (flag("--json")) {
  console.log(JSON.stringify({ lahde, yhteenveto, tulokset: tulokset.filter((t) => t.ongelmat.length) }, null, 2));
} else {
  console.log(`Syöte: ${lahde}`);
  console.log(`Tuotteita ${yhteenveto.tuotteita}, joista virheellisiä ${yhteenveto.tuotteitaVirheilla}${verkko ? `, verkkotarkistus ${Math.min(otos || items.length, items.length)} tuotteelle${apiHinnat ? `, hinnat verrattu ${apiHinnat.size} rajapintariviin` : ""}` : ", verkkotarkistukset ohitettu"}`);
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
