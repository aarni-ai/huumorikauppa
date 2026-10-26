#!/usr/bin/env node
/**
 * Merchant-syötteen kateluokat (custom_label_0) ja myydyimmät tuotteet (custom_label_2).
 *
 * Kirjoittaa api/_lib/kateluokat.js:n, jota api/_lib/syote-lisakentat.js käyttää.
 *
 * Ajo:
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_PUBLISHABLE_KEY=... \
 *     node scripts/generoi-kateluokat.mjs <katteet.json> [--tilaukset <printify-orders.json>] [--min-kpl 2] [--kuiva]
 *
 *   <katteet.json>   taulukko { slug, price, kulu, toimitus, nyky: { kate, nettokate }, oma: {...} };
 *                    kateluokka lasketaan nyky.kate-arvosta (toimitus src/config/toimitus.ts:n nykyarvoilla)
 *   --tilaukset      Printifyn tilaukset (taulukko tai { data: [...] }); line_items[].product_id
 *                    yhdistetään slugiin Supabasen anon REST -rajapinnalla (products?select=slug,printify_product_id).
 *                    Peruttuja tilauksia (status canceled) ei lasketa.
 *   --min-kpl N      myydyin = vähintään N kpl myyty (oletus 2)
 *   --kuiva          ei kirjoiteta tiedostoa, vain jakauma
 *
 * Tilaustiedostosta luetaan vain tuote-id:t, määrät ja tila; henkilötietoja ei käsitellä eikä tulosteta.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "api/_lib/kateluokat.js");

/** Aina myydyimpiin (kaupan tunnetuin tuote). */
export const AINA_MYYDYIMMAT = ["tonnin-seteli-t-paita"];

/** Kate (0-1) -> custom_label_0. */
export function kateluokka(kate) {
  if (typeof kate !== "number" || !Number.isFinite(kate)) return null;
  if (kate < 0.2) return "kate-alle-20";
  if (kate < 0.3) return "kate-20-30";
  if (kate < 0.4) return "kate-30-40";
  return "kate-yli-40";
}

/** Laskee myydyt kappaleet tuote-id:ittäin (peruttuja tilauksia ei lasketa). */
export function myydytKappaleet(tilaukset) {
  const lista = Array.isArray(tilaukset) ? tilaukset : tilaukset?.data || [];
  const kpl = new Map();
  for (const t of lista) {
    if (t.status === "canceled" || t.status === "cancelled") continue;
    for (const li of t.line_items || []) {
      if (!li.product_id) continue;
      kpl.set(li.product_id, (kpl.get(li.product_id) || 0) + (Number(li.quantity) || 1));
    }
  }
  return kpl;
}

/**
 * @param katteet katteet-JSONin rivit
 * @param kplIdlle Map printify_product_id -> kpl
 * @param slugitIdlle Map printify_product_id -> slug[]
 */
export function laskeLuokat(katteet, kplIdlle = new Map(), slugitIdlle = new Map(), minKpl = 2) {
  const luokat = {};
  for (const r of katteet) {
    const l = kateluokka(r?.nyky?.kate);
    if (r.slug && l) luokat[r.slug] = l;
  }
  const kplSlugille = new Map();
  for (const [pid, kpl] of kplIdlle) {
    for (const slug of slugitIdlle.get(pid) || []) kplSlugille.set(slug, (kplSlugille.get(slug) || 0) + kpl);
  }
  const myydyimmat = new Set(AINA_MYYDYIMMAT);
  for (const [slug, kpl] of kplSlugille) if (kpl >= minKpl) myydyimmat.add(slug);
  return { luokat, myydyimmat: [...myydyimmat].sort(), kplSlugille };
}

async function slugitSupabasesta() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL ja VITE_SUPABASE_PUBLISHABLE_KEY tarvitaan tilausten yhdistämiseen");
  const res = await fetch(`${url}/rest/v1/products?select=slug,printify_product_id&printify_product_id=not.is.null`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Range: "0-9999" },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const rivit = await res.json();
  const m = new Map();
  for (const r of rivit) m.set(r.printify_product_id, [...(m.get(r.printify_product_id) || []), r.slug]);
  return m;
}

function moduuli({ luokat, myydyimmat }, meta) {
  const jarj = Object.fromEntries(Object.entries(luokat).sort(([a], [b]) => a.localeCompare(b)));
  return `// GENEROITU: scripts/generoi-kateluokat.mjs kirjoittaa tämän tiedoston. Älä muokkaa käsin.
// Merchant-syötteen custom_label_0 (kateluokka nykyisellä toimituksella) ja custom_label_2 (myydyin | muut).
export const KATELUOKAT_GENERATED_AT = ${JSON.stringify(meta.generatedAt)};
export const KATELUOKAT_LAHDE = ${JSON.stringify(meta.lahde)};
/** slug -> kate-alle-20 | kate-20-30 | kate-30-40 | kate-yli-40 */
export const KATELUOKAT = ${JSON.stringify(jarj, null, 2)};
/** custom_label_2 = "myydyin" näille, muille "muut". */
export const MYYDYIMMAT = new Set(${JSON.stringify(myydyimmat, null, 2)});
`;
}

async function main() {
  const args = process.argv.slice(2);
  const arvo = (nimi) => {
    const i = args.indexOf(nimi);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const kattetPolku = args.find((a, i) => !a.startsWith("--") && !["--tilaukset", "--min-kpl"].includes(args[i - 1]));
  if (!kattetPolku) {
    console.error("Käyttö: node scripts/generoi-kateluokat.mjs <katteet.json> [--tilaukset orders.json] [--min-kpl 2] [--kuiva]");
    process.exit(1);
  }
  const katteet = JSON.parse(fs.readFileSync(kattetPolku, "utf8"));
  const minKpl = Number(arvo("--min-kpl") || 2);
  let kpl = new Map();
  let slugit = new Map();
  const tilauksetPolku = arvo("--tilaukset");
  let tilauksia = 0;
  if (tilauksetPolku) {
    const tilaukset = JSON.parse(fs.readFileSync(tilauksetPolku, "utf8"));
    tilauksia = (Array.isArray(tilaukset) ? tilaukset : tilaukset.data || []).length;
    kpl = myydytKappaleet(tilaukset);
    slugit = await slugitSupabasesta();
  }
  const tulos = laskeLuokat(katteet, kpl, slugit, minKpl);
  const jakauma = {};
  for (const l of Object.values(tulos.luokat)) jakauma[l] = (jakauma[l] || 0) + 1;
  const yhdistamatta = [...kpl.keys()].filter((pid) => !slugit.has(pid)).length;
  console.log(`Kateluokat ${Object.keys(tulos.luokat).length} tuotteelle:`, jakauma);
  console.log(`Tilauksia ${tilauksia}, tuote-id:itä ${kpl.size} (slugiin yhdistämättä ${yhdistamatta}).`);
  console.log(`Myydyimmät (vähintään ${minKpl} kpl + aina ${AINA_MYYDYIMMAT.join(", ")}):`);
  for (const s of tulos.myydyimmat) console.log(`  ${s} ${tulos.kplSlugille.get(s) || 0} kpl`);
  if (args.includes("--kuiva")) return;
  const meta = {
    generatedAt: new Date().toISOString(),
    lahde: { kate: "nyky.kate (nykyinen toimitus, src/config/toimitus.ts)", tuotteita: katteet.length, tilauksia, minKpl },
  };
  fs.writeFileSync(OUT, moduuli(tulos, meta));
  console.log(`Kirjoitettu ${path.relative(ROOT, OUT)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
