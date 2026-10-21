#!/usr/bin/env node
/**
 * Build-vaiheen staattinen esirenderöinti (ajetaan `vite build`:n jälkeen, ks. package.json).
 *
 * Kirjoittaa jokaiselle indeksoitavalle reitille dist/<reitti>/index.html -tiedoston, jossa on
 * sivun oma title, description, canonical, OG-tagit, JSON-LD sekä kevyt semanttinen runko
 * (H1, johdanto, tuotelinkit, UKK) <div id="root">:n sisällä. Vercel tarjoilee tiedostot ennen
 * vercel.json:n rewritejä, joten /joululahjat palauttaa dist/joululahjat/index.html:n kaikille
 * user agenteille ilman JavaScriptiä.
 *
 * Lisäksi kirjoitetaan dist/spa-shell.html (ei canonicalia, ei sivukohtaista sisältöä), johon
 * vercel.json ohjaa reitit, joita ei ole esirenderöity (esim. buildin jälkeen lisätyt tuotteet).
 *
 * Tuotteet haetaan Supabasen REST-rajapinnasta julkisella anon-avaimella
 * (VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY). Jos ne puuttuvat tai haku epäonnistuu,
 * tuotesivut jätetään väliin ja muut sivut renderöidään silti.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, loadEnv } from "vite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SHELL_FILE = "spa-shell.html";
// Vain ASCII-polut: ääkkösiä sisältävien tiedostonimien URL-dekoodaus Vercelin
// tiedostojärjestelmässä ei ole taattu, joten ne jäävät SPA-kuoren + middlewaren varaan.
const SAFE_SEGMENT = /^[A-Za-z0-9-]+$/;

function log(msg) {
  console.log(`[prerender] ${msg}`);
}

function readEnv() {
  const fileEnv = loadEnv("production", ROOT, ["VITE_", "SUPABASE_"]);
  const pick = (...keys) => keys.map((k) => process.env[k] || fileEnv[k]).find(Boolean) || "";
  return {
    url: pick("VITE_SUPABASE_URL", "SUPABASE_URL").replace(/\/$/, ""),
    key: pick("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"),
  };
}

/** Kaikki tuoterivit sivuttain. select=* kuten use-products.ts (is_active-sarake voi puuttua). */
async function fetchProductRows({ url, key }) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; from < 20000; from += pageSize) {
    const res = await fetch(`${url}/rest/v1/products?select=*&order=created_at.desc`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${from}-${from + pageSize - 1}`,
        "Range-Unit": "items",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

function outputFile(routePath) {
  if (routePath === "/") return path.join(DIST, "index.html");
  const segments = routePath.split("/").filter(Boolean);
  if (segments.length === 0 || !segments.every((s) => SAFE_SEGMENT.test(s))) return null;
  return path.join(DIST, ...segments, "index.html");
}

function validate(html, page) {
  const problems = [];
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) problems.push(`${h1Count} kpl <h1>`);
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push("title puuttuu");
  const canonicals = html.match(/<link rel="canonical"[^>]*>/g) || [];
  if (canonicals.length !== 1) problems.push(`${canonicals.length} canonicalia`);
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (err) {
      problems.push(`virheellinen JSON-LD (${err.message})`);
    }
  }
  if (problems.length > 0) throw new Error(`${page.path}: ${problems.join(", ")}`);
}

async function main() {
  const started = Date.now();
  const templatePath = path.join(DIST, "index.html");
  const template = await fs.readFile(templatePath, "utf8").catch(() => {
    throw new Error("dist/index.html puuttuu: aja ensin `vite build`");
  });
  if (template.includes("data-prerender")) {
    throw new Error("dist/index.html on jo esirenderöity: aja `npm run build` (vite build + prerender) alusta");
  }

  const vite = await createServer({
    root: ROOT,
    configFile: path.join(ROOT, "vite.config.ts"),
    mode: "production",
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    // react-router v7 tarjoaa ESM-version Nodelle "module-sync"-ehdolla; ilman sitä Vite
    // päätyy CommonJS-buildiin, jonka nimettyjä exportteja se ei tunnista.
    ssr: { resolve: { externalConditions: ["module-sync"] } },
  });

  try {
    const pagesMod = await vite.ssrLoadModule("/src/seo/prerender/pages.ts");
    const htmlMod = await vite.ssrLoadModule("/src/seo/prerender/html.ts");
    const componentsMod = await vite.ssrLoadModule("/src/seo/prerender/renderComponents.tsx");
    const metaMod = await vite.ssrLoadModule("/src/seo/staticPageMeta.ts");

    // 1) Tuotteet
    let products = [];
    const env = readEnv();
    if (!env.url || !env.key) {
      log("VAROITUS: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY puuttuu, tuotesivuja ei esirenderöidä.");
    } else {
      try {
        const rows = await fetchProductRows(env);
        products = pagesMod.normalizeProducts(rows);
        log(`Supabase: ${rows.length} riviä, ${products.length} myynnissä olevaa tuotetta.`);
      } catch (err) {
        log(`VAROITUS: tuotteiden haku epäonnistui (${err.message}), tuotesivuja ei esirenderöidä.`);
      }
    }

    // 2) Komponenteista renderöitävät sisältösivut
    const componentHtml = await componentsMod.renderComponentPages((m) => log(m));

    // 3) Sivut
    const nav = pagesMod.buildSiteNav(products);
    const pages = pagesMod.buildPrerenderPages({ products, componentHtml });

    // SPA-kuori ensin, jotta se on olemassa vaikka jokin sivu epäonnistuisi.
    const home = metaMod.STATIC_PAGE_META["/"];
    const shell = htmlMod.renderShellHtml(template, nav, { title: home.title, description: home.description });
    await fs.writeFile(path.join(DIST, SHELL_FILE), shell);

    const seen = new Set();
    let written = 0;
    let bytes = 0;
    const skipped = [];
    for (const page of pages) {
      if (seen.has(page.path)) throw new Error(`Sama polku kahdesti: ${page.path}`);
      seen.add(page.path);
      const file = outputFile(page.path);
      if (!file) {
        skipped.push(page.path);
        continue;
      }
      const html = htmlMod.renderPageHtml(template, page, nav);
      validate(html, page);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, html);
      written += 1;
      bytes += Buffer.byteLength(html);
    }
    if (skipped.length > 0) log(`Ohitettu (polku ei kelpaa tiedostonimeksi): ${skipped.join(", ")}`);

    // 4) llms.txt + llms-full.txt (ajantasaiset sivu- ja tuotelistat)
    const llmsMod = await vite.ssrLoadModule("/src/seo/llms.ts");
    await fs.writeFile(path.join(DIST, "llms.txt"), llmsMod.buildLlmsTxt(products));
    await fs.writeFile(path.join(DIST, "llms-full.txt"), llmsMod.buildLlmsFullTxt(products));
    const productPages = pages.filter((p) => p.path.startsWith("/tuote/")).length;
    log(
      `${written} sivua (${productPages} tuotesivua) + ${SHELL_FILE}, ` +
        `${(bytes / 1024 / 1024).toFixed(1)} MB, ${((Date.now() - started) / 1000).toFixed(1)} s`,
    );
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error(`[prerender] VIRHE: ${err.stack || err.message}`);
  process.exit(1);
});
