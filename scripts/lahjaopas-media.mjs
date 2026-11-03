/**
 * Lahjaopas medialle ja bloggaajille (2.11.2026): 20 lahjaideaa /lahjaopas-media-sivulle ja PDF:ään.
 * Valinta ja tekstit: data/lahjaopas-media.json (10 klassikkoa ja 10 joulumalliston 2026 teemaa). Kuvat: pystykuva 1000 x 1500 (scripts/pinterest-kuvat.mjs,
 * Blobissa jo lisäkuvana) ja vaakakuva 1500 x 1000 tästä (sumennettu tausta ja tuote keskellä), Vercel Blobiin.
 * Kirjoittaa src/data/lahjaopasMedia.generated.ts. Hinnat ja nimet tuotannon rajapinnasta.
 *
 * Ajo: BLOB_READ_WRITE_TOKEN=... NODE_PATH=<kansio, jossa @vercel/blob> node scripts/lahjaopas-media.mjs
 *      tai ilman avainta: node scripts/lahjaopas-media.mjs --palvelin [--vain <slug>]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import sharp from "sharp";
import LISAKUVAT from "../api/_lib/lisakuvat.generated.js";

import { palvelimenPut } from "./lib/blob-palvelin.mjs";

// --palvelin (3.11.2026): lataus kaupan palvelimen lataustokenilla ilman Blob-avainta (scripts/lib/blob-palvelin.mjs).
// --vain <slug>: vain tämän idean vaakakuva ja pystykuvan osoite (LISAKUVAT) uusiksi, muut ideat ennallaan
// (esim. kun painokuva on piirretty uudelleen ja lisäkuva tehty: pinterest-kuvat.mjs --lista, some-blob.mjs --lisakuvat).
const PALVELIN = process.argv.includes("--palvelin");
const VAIN = process.argv.includes("--vain") ? process.argv[process.argv.indexOf("--vain") + 1] : null;
const put = PALVELIN ? palvelimenPut : createRequire(join(process.env.NODE_PATH || process.cwd(), "x.js"))("@vercel/blob").put;
const JUURI = new URL("..", import.meta.url).pathname;
const KAUPPA = "https://huumorikauppa.fi";

const haku = async (slug) => { const r = await fetch(`${KAUPPA}/api/products?slug=${slug}`); const j = await r.json(); return Array.isArray(j) ? j[0] : j; };
// Kuratoitu lista (data/lahjaopas-media.json): nimet ja kuvaukset käsin, hinnat ja kuvat tuotannosta.
const lista = JSON.parse(await readFile(join(JUURI, "data/lahjaopas-media.json"), "utf8")).tuotteet;
const DATA = join(JUURI, "src/data/lahjaopasMedia.generated.ts");
const nykyiset = VAIN ? JSON.parse((await readFile(DATA, "utf8")).match(/MEDIA_LAHJAIDEAT: MediaLahjaidea\[\] = (\[[\s\S]*?\n\]);/)[1]) : [];
if (VAIN && !nykyiset.some((i) => i.slug === VAIN)) throw new Error(`--vain ${VAIN}: ei lahjaoppaassa`);
const valitut = [];
for (const t of lista) {
  if (VAIN && t.slug !== VAIN) { valitut.push({ vanha: nykyiset.find((i) => i.slug === t.slug) }); continue; }
  const p = await haku(t.slug);
  if (!p) throw new Error(`tuotetta ei löydy: ${t.slug}`);
  if (!LISAKUVAT[t.slug]) throw new Error(`pystykuva puuttuu (pinterest-kuvat.mjs --lista + some-blob.mjs --lisakuvat): ${t.slug}`);
  valitut.push({ p, t });
}

async function lataa(buf, pathname) {
  return (await put(pathname, buf, { access: "public", addRandomSuffix: true, contentType: "image/jpeg" })).url;
}

await mkdir(join(JUURI, "some/kuvat/vaaka"), { recursive: true });
const ideat = [];
for (const { p, t, vanha } of valitut) {
  if (vanha) { ideat.push(vanha); continue; }
  const pystyPolku = join(JUURI, "some/kuvat/shopping", `${p.slug}.jpg`);
  const pysty = await readFile(pystyPolku);
  const tausta = await sharp(pysty).resize(1500, 1000, { fit: "cover" }).blur(30).modulate({ brightness: 1.05 }).toBuffer();
  const etu = await sharp(pysty).resize({ height: 1000 }).toBuffer();
  const vaaka = await sharp(tausta).composite([{ input: etu, gravity: "center" }]).jpeg({ quality: 86 }).toBuffer();
  await writeFile(join(JUURI, "some/kuvat/vaaka", `${p.slug}.jpg`), vaaka);
  ideat.push({
    slug: p.slug, nimi: t.nimi, tuote: p.category === "hupparit" ? "Huppari" : "T-paita", ryhma: t.ryhma, hinta: Number(p.price), kuvaus: t.kuvaus,
    pysty: LISAKUVAT[p.slug], vaaka: await lataa(vaaka, `media/lahjaopas/${p.slug}-vaaka.jpg`),
    linkki: `${KAUPPA}/tuote/${p.slug}?utm_source=media&utm_medium=lahjaopas&utm_campaign=joulu2026`,
  });
  console.log(ideat.length, p.slug);
}

// PDF-osoite säilyy (scripts/lahjaopas-media-pdf.mjs päivittää sen).
let pdf = "";
try { pdf = (await readFile(DATA, "utf8")).match(/MEDIA_LAHJAOPAS_PDF = "([^"]*)"/)?.[1] || ""; } catch { /* ensimmäinen ajo */ }
await writeFile(DATA, `/** Generoitu ${new Date().toISOString().slice(0, 10)} (scripts/lahjaopas-media.mjs): /lahjaopas-media, 20 lahjaideaa kuvineen. */
export interface MediaLahjaidea { slug: string; nimi: string; tuote: string; ryhma: string; hinta: number; kuvaus: string; pysty: string; vaaka: string; linkki: string }
export const MEDIA_LAHJAIDEAT: MediaLahjaidea[] = ${JSON.stringify(ideat, null, 1)};

/** PDF-versio (scripts/lahjaopas-media-pdf.mjs, Vercel Blob); tyhjä, kunnes PDF on tehty. */
export const MEDIA_LAHJAOPAS_PDF = ${JSON.stringify(pdf)};
`);
console.log(`valmis: ${ideat.length} ideaa`);
