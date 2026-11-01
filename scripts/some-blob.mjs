/**
 * Somevideot, kansikuvat, JULKAISUT.md sekä Pinterest- ja Shopping-kuvat Vercel Blobiin (1.11.2026, ilmainen taso,
 * varasto huumorikauppa-some, fra1, julkinen) Coworkin ladattavaksi Chromessa.
 *   some/manifest.json        /hallinta/some-sivun tiedot (api/sahkoposti.js ?some=): videot julkaisujärjestyksessä
 *                             latauslinkkeineen, kuvateksteineen, hashtageineen ja UTM-linkkeineen sekä Pinterest-kuvat
 *   api/_lib/lisakuvat.generated.js   Shopping-kuvien osoitteet Merchant-syötteen lisäkuviksi (api/_lib/syote.js)
 * Tiedostoilla on satunnainen pääte (ei arvattavissa); manifestin polku on kiinteä.
 *
 * Ajo: BLOB_READ_WRITE_TOKEN=... NODE_PATH=<kansio, jossa @vercel/blob> node scripts/some-blob.mjs
 *      [--lisakuvat some/kuvat/kuvat-<tiedosto>.json]  vain nämä Shopping- ja Pinterest-kuvat: lisäkuvat yhdistetään
 *      nykyisiin (lisakuvat.generated.js) ja Pinterest-kuvat manifestiin, videoita ei ladata uudelleen.
 * (token: vercel env pull --environment production; @vercel/blob ei ole projektin riippuvuus).
 */
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { julkaisulista } from "./some-videot.mjs";

const require = createRequire(join(process.env.NODE_PATH || process.cwd(), "x.js"));
const { put } = require("@vercel/blob");
const JUURI = new URL("..", import.meta.url).pathname;
const KAUPPA = "https://huumorikauppa.fi";

function pinniTiedot(k, pin) {
  const linkki = `${KAUPPA}/tuote/${k.slug}?utm_source=pinterest&utm_medium=social&utm_campaign=pin`;
  return { slug: k.slug, nimi: k.nimi, kuva: pin, lataus: `${pin}?download=1`, otsikko: `${k.teksti} | ${k.kategoria === "hupparit" ? "Hauska huppari" : k.kategoria === "seinataulut" ? "Hauska juliste" : k.kategoria === "tarrat" ? "Hauska tarra" : "Hauska t-paita"}`,
    kuvaus: `${k.teksti}. Suomalaista huumoria paitaan, lahjaksi tai itselle. Katso koot ja värit: huumorikauppa.fi`, linkki };
}

async function kirjoitaLisakuvat(shopping, n) {
  await writeFile(join(JUURI, "api/_lib/lisakuvat.generated.js"), `/** Generoitu ${new Date().toISOString().slice(0, 10)} (scripts/some-blob.mjs): sisustustyyliset 1000 x 1500 -lisäkuvat
 * ${n} tuotteelle (50 suosituinta ja joulumallisto 2026; scripts/pinterest-kuvat.mjs, ilman mainostekstiä) Vercel Blobissa.
 * Merchant-syötteen ensimmäinen lisäkuva (api/_lib/syote.js). */
export default ${JSON.stringify(shopping, null, 1)};
`);
}

async function lataa(polku, pathname, contentType) {
  const r = await put(pathname, await readFile(polku), { access: "public", addRandomSuffix: true, contentType });
  return r.url;
}

const lisaArg = process.argv.includes("--lisakuvat") ? process.argv[process.argv.indexOf("--lisakuvat") + 1] : null;
if (lisaArg) {
  const kuvat = JSON.parse(await readFile(join(JUURI, lisaArg), "utf8"));
  const { default: nykyiset } = await import("../api/_lib/lisakuvat.generated.js");
  const shopping = { ...nykyiset };
  const pinterest = [];
  for (const k of kuvat) {
    const pin = await lataa(join(JUURI, "some/kuvat/pinterest", `${k.slug}.jpg`), `some/pinterest/${k.slug}.jpg`, "image/jpeg");
    shopping[k.slug] = await lataa(join(JUURI, "some/kuvat/shopping", `${k.slug}.jpg`), `some/shopping/${k.slug}.jpg`, "image/jpeg");
    pinterest.push(pinniTiedot(k, pin));
    console.log(k.slug);
  }
  const host = process.env.BLOB_READ_WRITE_TOKEN.split("_")[3].toLowerCase();
  const manifest = await (await fetch(`https://${host}.public.blob.vercel-storage.com/some/manifest.json?t=${Date.now()}`)).json();
  // Saman tuotteen aiempi Pinterest-kuva korvataan (esim. uusi kuva, kun väri on poistettu myynnistä).
  const uudet = new Set(pinterest.map((p) => p.slug));
  manifest.pinterest = [...manifest.pinterest.filter((p) => !uudet.has(p.slug)), ...pinterest];
  manifest.paivitetty = new Date().toISOString();
  await put("some/manifest.json", JSON.stringify(manifest), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });
  await kirjoitaLisakuvat(shopping, Object.keys(shopping).length);
  console.log(`valmis: ${pinterest.length} uutta kuvaa, lisäkuvia yhteensä ${Object.keys(shopping).length}`);
  process.exit(0);
}

const lista = julkaisulista();
const videot = [];
for (const v of lista) {
  const video = await lataa(join(JUURI, "some/videot", `${v.nimi}.mp4`), `some/videot/${v.nimi}.mp4`, "video/mp4");
  const kansi = await lataa(join(JUURI, "some/videot", `${v.nimi}.jpg`), `some/videot/${v.nimi}.jpg`, "image/jpeg");
  videot.push({ ...v, video, lataus: `${video}?download=1`, kansi });
  console.log(v.nimi);
}
const md = await lataa(join(JUURI, "some/JULKAISUT.md"), "some/JULKAISUT.md", "text/markdown; charset=utf-8");

const kuvat = JSON.parse(await readFile(join(JUURI, "some/kuvat/kuvat.json"), "utf8"));
const pinterest = [];
const shopping = {};
for (const k of kuvat) {
  const pin = await lataa(join(JUURI, "some/kuvat/pinterest", `${k.slug}.jpg`), `some/pinterest/${k.slug}.jpg`, "image/jpeg");
  shopping[k.slug] = await lataa(join(JUURI, "some/kuvat/shopping", `${k.slug}.jpg`), `some/shopping/${k.slug}.jpg`, "image/jpeg");
  pinterest.push(pinniTiedot(k, pin));
  console.log(k.slug);
}

const manifest = { paivitetty: new Date().toISOString(), julkaisut: md, videot, pinterest };
await put("some/manifest.json", JSON.stringify(manifest), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });

await kirjoitaLisakuvat(shopping, Object.keys(shopping).length);
console.log(`valmis: ${videot.length} videota, ${pinterest.length} Pinterest-kuvaa`);
