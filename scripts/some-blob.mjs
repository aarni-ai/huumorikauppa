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
 *      [--uudet]  vain uudet videot (nimi puuttuu manifestista) ja JULKAISUT.md; manifestin videot julkaisulistan mukaan.
 *                 Uudelleen tehdyt videot (3.11. alkaen, pääte -v2) ovat uusia nimiä, joten ne ladataan ja manifesti
 *                 osoittaa niihin; 2.11. julkaistujen videoiden osoitteet säilyvät.
 * (token: vercel env pull --environment production).
 *
 * --palvelin (3.11.2026): ilman Blob-avainta koneella. Jokaiselle tiedostolle haetaan lyhytikäinen lataustoken kaupan
 * palvelimelta (POST /api/cron/tilaukset?tehtava=blob-lataus, CRON_SECRET tiedostosta .env.cron.local; api/_lib/blob-lataus.js),
 * ja tiedosto ladataan suoraan Blobiin (@vercel/blob client upload). Esim. node scripts/some-blob.mjs --palvelin --uudet
 *   [--kansio <polku>]  videoiden ja kansikuvien kansio (oletus some/videot)
 */
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { julkaisulista } from "./some-videot.mjs";
import { palvelimenPut } from "./lib/blob-palvelin.mjs";

const JUURI = new URL("..", import.meta.url).pathname;
const KAUPPA = "https://huumorikauppa.fi";
const PALVELIN = process.argv.includes("--palvelin");
const KANSIO = process.argv.includes("--kansio") ? process.argv[process.argv.indexOf("--kansio") + 1] : join(JUURI, "some/videot");
const BLOB_HOST = "f9rxc7ndxeb58y5f";

/** Blob-varaston julkinen isäntä: avaimesta, tai palvelintilassa tunnettu varasto huumorikauppa-some. */
const blobHost = () => (PALVELIN ? BLOB_HOST : process.env.BLOB_READ_WRITE_TOKEN.split("_")[3].toLowerCase());

const put = PALVELIN ? palvelimenPut : createRequire(join(process.env.NODE_PATH || process.cwd(), "x.js"))("@vercel/blob").put;

function pinniTiedot(k, pin) {
  // 2.11.2026: ilman UTM-parametreja; Pinterest tunnistetaan viittaajasta ja sovelluksen selaimesta.
  const linkki = `${KAUPPA}/tuote/${k.slug}`;
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

// --tekstit (2.11.2026): kuvatekstit ja Pinterest-linkit manifestiin ilman videoiden uudelleenlatausta (ei UTM-linkkejä).
if (process.argv.includes("--tekstit")) {
  const host = process.env.BLOB_READ_WRITE_TOKEN.split("_")[3].toLowerCase();
  const manifest = await (await fetch(`https://${host}.public.blob.vercel-storage.com/some/manifest.json?t=${Date.now()}`)).json();
  const uudet = new Map(julkaisulista().map((v) => [v.nro, v]));
  manifest.videot = manifest.videot.map(({ utm: _pois, ...v }) => ({ ...v, kuvateksti: uudet.get(v.nro)?.kuvateksti ?? v.kuvateksti }));
  manifest.pinterest = manifest.pinterest.map((p) => ({ ...p, linkki: `${KAUPPA}/tuote/${p.slug}` }));
  manifest.julkaisut = await lataa(join(JUURI, "some/JULKAISUT.md"), "some/JULKAISUT.md", "text/markdown; charset=utf-8");
  manifest.paivitetty = new Date().toISOString();
  await put("some/manifest.json", JSON.stringify(manifest), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });
  console.log(`valmis: ${manifest.videot.length} kuvatekstiä, ${manifest.pinterest.length} Pinterest-linkkiä`);
  process.exit(0);
}

// --uudet (2.11.2026, toinen kierros): manifestin videot julkaisulistan järjestykseen. Jo ladatut videot (sama nimi)
// pidetään entisinä osoitteina, vain uudet videot ja kansikuvat sekä JULKAISUT.md ladataan. Pinterest-kuvat ennallaan.
if (process.argv.includes("--uudet")) {
  const manifest = await (await fetch(`https://${blobHost()}.public.blob.vercel-storage.com/some/manifest.json?t=${Date.now()}`)).json();
  const vanhat = new Map(manifest.videot.map((v) => [v.nimi, v]));
  const lista = julkaisulista();
  const videot = new Array(lista.length);
  let uusia = 0;
  // 3.11.2026: uudet ladataan rinnakkain (RINNAKKAIN, oletus 6), koska yhteys on hidas; manifestin järjestys säilyy.
  const jono = [];
  lista.forEach((v, i) => {
    const vanha = vanhat.get(v.nimi);
    if (vanha) videot[i] = { ...v, video: vanha.video, lataus: vanha.lataus, kansi: vanha.kansi };
    else jono.push([v, i]);
  });
  const tyontekija = async () => {
    for (let t = jono.shift(); t; t = jono.shift()) {
      const [v, i] = t;
      const video = await lataa(join(KANSIO, `${v.nimi}.mp4`), `some/videot/${v.nimi}.mp4`, "video/mp4");
      const kansi = await lataa(join(KANSIO, `${v.nimi}.jpg`), `some/videot/${v.nimi}.jpg`, "image/jpeg");
      videot[i] = { ...v, video, lataus: `${video}?download=1`, kansi };
      uusia++;
      console.log(v.nimi);
    }
  };
  await Promise.all(Array.from({ length: Number(process.env.RINNAKKAIN || 6) }, tyontekija));
  manifest.videot = videot;
  manifest.julkaisut = await lataa(join(JUURI, "some/JULKAISUT.md"), "some/JULKAISUT.md", "text/markdown; charset=utf-8");
  manifest.paivitetty = new Date().toISOString();
  await put("some/manifest.json", JSON.stringify(manifest), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });
  console.log(`valmis: ${videot.length} videota, joista ${uusia} uutta`);
  process.exit(0);
}

// --tiktok (12.11.2026): TikTok julkaistaan puhelimesta. Manifestiin TikTokin jono: julkaisujärjestyksen videot, joita ei
// ole julkaistu TikTokissa (some/julkaistut.csv). /hallinta/some näyttää jonosta yhden videon päivässä alku-päivästä
// alkaen ("Tämän päivän TikTok"). Ajetaan, kun julkaistut.csv tai julkaisulista muuttuu.
if (process.argv.includes("--tiktok")) {
  const manifest = await (await fetch(`https://${blobHost()}.public.blob.vercel-storage.com/some/manifest.json?t=${Date.now()}`)).json();
  const julkaistut = new Set((await readFile(join(JUURI, "some/julkaistut.csv"), "utf8")).split("\n").map((r) => r.split(","))
    .filter((r) => r[1] === "tiktok").map((r) => r[0]));
  const alku = process.argv[process.argv.indexOf("--tiktok") + 1]?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] || new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  manifest.tiktok = { alku, jono: manifest.videot.map((v) => v.nro).filter((n) => !julkaistut.has(n)), julkaistut: [...julkaistut] };
  manifest.paivitetty = new Date().toISOString();
  await put("some/manifest.json", JSON.stringify(manifest), { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });
  console.log(`valmis: TikTok-jonossa ${manifest.tiktok.jono.length} videota ${alku} alkaen, julkaistu ${julkaistut.size}`);
  process.exit(0);
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
  const manifest = await (await fetch(`https://${blobHost()}.public.blob.vercel-storage.com/some/manifest.json?t=${Date.now()}`)).json();
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
