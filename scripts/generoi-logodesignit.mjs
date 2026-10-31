/**
 * Generoi api/_lib/logodesignit.generated.js: t-paitadesignit, jotka voi yhdistää yrityksen logoon (Oma logo -paita,
 * api/_lib/logopaita.js). Mukaan tulevat paidat, joiden Printify-tuotteen etupuolella on täsmälleen yksi PNG-kerros
 * (vähintään 2000 px leveä); tekstikerroksia ei voi painaa uudelleen. Järjestys: top50 ensin, sitten nimen mukaan.
 * varit: alkuperäisen tuotteen värit, jotka logopaidalla on (design on tehty niille; tumma painatus ei näy mustassa).
 *
 * Aja: set -a; . ./.env.printify.local; set +a; node scripts/generoi-logodesignit.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import top50 from "../api/_lib/top50.generated.js";

const LOGOVARIT = ["Musta", "Valkoinen", "Vaaleanharmaa", "Tummansininen"];
const s = JSON.parse(readFileSync("data/products-snapshot.json", "utf8"));
const kaikki = (Array.isArray(s) ? s : s.products || s.data || []).filter((p) => p.category === "t-paidat" && p.is_active !== false && p.printify_product_id);
const { PRINTIFY_API_KEY: avain, PRINTIFY_SHOP_ID: kauppa } = process.env;
if (!avain || !kauppa) throw new Error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID puuttuvat");

const tulos = [];
for (const p of kaikki) {
  const r = await fetch(`https://api.printify.com/v1/shops/${kauppa}/products/${p.printify_product_id}.json`, { headers: { Authorization: `Bearer ${avain}` } });
  if (!r.ok) { console.error(p.slug, r.status); continue; }
  const d = await r.json();
  const etu = (d.print_areas?.[0]?.placeholders || []).find((x) => x.position === "front");
  const kuvat = etu?.images || [];
  if (kuvat.length !== 1) continue;
  const k = kuvat[0];
  if (k.type !== "image/png" || !k.src || Number(k.width) < 2000) continue;
  const varit = LOGOVARIT.filter((v) => (p.variants?.colors || []).includes(v));
  tulos.push({ slug: p.slug, nimi: p.name.replace(/\s*\|\s*T-Paita$/i, ""), src: k.src, w: Math.round(k.width), h: Math.round(k.height), varit: varit.length ? varit : ["Valkoinen", "Vaaleanharmaa"] });
  await new Promise((ok) => setTimeout(ok, 120));
}
tulos.sort((a, b) => (top50.has(b.slug) - top50.has(a.slug)) || a.nimi.localeCompare(b.nimi, "fi"));
writeFileSync("api/_lib/logodesignit.generated.js",
  `/** Generoitu ${new Date().toISOString().slice(0, 10)} (scripts/generoi-logodesignit.mjs): Oma logo -paitaan yhdistettävät designit (${tulos.length}/${kaikki.length}). */\n` +
  `export const LOGODESIGNIT = ${JSON.stringify(tulos, null, 0).replace(/\},\{/g, "},\n  {")};\n`);
console.log(`${tulos.length}/${kaikki.length} designia`);
