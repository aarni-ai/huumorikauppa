#!/usr/bin/env node
/**
 * Medialle-sivun (/media) staattiset zip-paketit: public/media/huumorikauppa-*.zip.
 *
 * Ajo:   node scripts/media-zip.mjs
 * Valinnainen ympäristömuuttuja MEDIA_PRODUCTS_URL (oletus https://huumorikauppa.fi/api/products).
 *
 * Lukee slugilistat tiedostosta src/data/mediaKit.ts (KARKITUOTTEET ja SARJAT), hakee aktiiviset tuotteet
 * rajapinnasta, lataa jokaisen tuotteen 2048 px:n tuotekuvan ja tunnelmakuvan ja pakkaa ne:
 *   - huumorikauppa-<sarjan id>.zip   yksi per sarja (SARJAT)
 *   - huumorikauppa-kuvat-kaikki.zip  kaikkien ryhmien kuvat (kärkituotteet ja sarjat), kansio per ryhmä
 * Kärkituotteille ei tehdä erillistä zipiä (sama sisältö kuin kaikki-zipissä, kokonaiskoko pysyy kurissa).
 * Jokaisessa zipissä on tuotetiedot.txt (nimi, hinta, värit, koot, linkki, toimitus ja joulun tilausaika).
 * Vercelin funktion vastaus on rajattu noin 4,5 megatavuun, joten zipit tehdään etukäteen ja commitoidaan.
 * Uuden sarjan jälkeen aja skripti uudelleen (ohje: src/data/mediaKit.ts).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { zipSync, strToU8 } from "fflate";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "media");
const PRODUCTS_URL = process.env.MEDIA_PRODUCTS_URL || "https://huumorikauppa.fi/api/products";
const RAJA_MT = 25;

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

const imageCache = new Map();
async function lataaKuva(url) {
  if (!imageCache.has(url)) {
    imageCache.set(
      url,
      (async () => {
        for (let yritys = 1; yritys <= 3; yritys++) {
          const res = await fetch(url);
          // 2048 px säilyy; mozjpeg laatu 82 pudottaa koon noin kolmannekseen, jotta kaikki sarjat mahtuvat zip-rajaan.
          if (res.ok && /image\//.test(res.headers.get("content-type") || "")) return new Uint8Array(await sharp(Buffer.from(await res.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
          if (yritys === 3) throw new Error(`Kuvan lataus epäonnistui (${res.status}): ${url}`);
          await new Promise((r) => setTimeout(r, 500 * yritys));
        }
      })(),
    );
  }
  return imageCache.get(url);
}

const euro = (n) => `${n.toFixed(2).replace(".", ",")} €`;

const vite = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, "vite.config.ts"),
  mode: "production",
  logLevel: "error",
  appType: "custom",
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  ssr: { resolve: { externalConditions: ["module-sync"] } },
});

try {
  const kit = await vite.ssrLoadModule("/src/data/mediaKit.ts");
  const lib = await vite.ssrLoadModule("/src/lib/mediaKit.ts");
  const site = await vite.ssrLoadModule("/src/seo/site.ts");

  const res = await fetch(PRODUCTS_URL);
  if (!res.ok) throw new Error(`Tuotteiden haku epäonnistui (${res.status}): ${PRODUCTS_URL}`);
  const aktiiviset = (await res.json()).filter((p) => p.is_active !== false);

  await fs.mkdir(OUT, { recursive: true });
  for (const f of await fs.readdir(OUT)) if (f.endsWith(".zip")) await fs.rm(path.join(OUT, f));

  const kaupanTiedot = kit.mediaKaupanTiedot().join("\n");

  /** Ryhmän tiedostot: { zipin polku: sisältö }, tuotetiedot.txt ja puuttuvat slugit. */
  async function ryhmanTiedostot(ryhma) {
    const tuotteet = lib.valitseTuotteet(ryhma.slugs, aktiiviset);
    const puuttuu = ryhma.slugs.filter((s) => !tuotteet.some((p) => p.slug === s));
    if (puuttuu.length) console.warn(`  ${ryhma.id}: ei aktiivinen tai ei löydy, jätetään pois: ${puuttuu.join(", ")}`);
    const files = {};
    const rivit = [];
    for (const p of tuotteet) {
      const { tuote, toinen } = lib.mediaKuvat(p);
      const nimet = [];
      for (const k of [tuote, toinen]) {
        if (!k) continue;
        const nimi = `${p.slug}-${k.tunnus}.jpg`;
        files[`${ryhma.id}/${nimi}`] = [await lataaKuva(k.tulostusUrl), { level: 0 }];
        nimet.push(nimi);
      }
      const v = p.variants || {};
      rivit.push(
        [
          p.name,
          `Hinta: ${euro(Number(p.price))}`,
          `Värit: ${(v.colors || []).join(", ") || "ei tietoa"}`,
          `Koot: ${(v.sizes || []).join(", ") || "ei tietoa"}`,
          `Linkki: ${site.SITE_URL}/tuote/${p.slug}`,
          `Kuvat: ${nimet.join(", ")}`,
        ].join("\n"),
      );
    }
    return { files, rivit, maara: tuotteet.length };
  }

  function tuotetiedot(otsikko, rivit) {
    return [
      `Huumorikauppa.fi: ${otsikko}`,
      "",
      kaupanTiedot,
      "",
      "Tuotteet",
      "",
      rivit.join("\n\n"),
      "",
    ].join("\n");
  }

  const ryhmat = [];
  for (const r of kit.KUVARYHMAT) {
    console.log(`Ryhmä ${r.id} (${r.slugs.length} slugia)`);
    ryhmat.push({ ryhma: r, ...(await ryhmanTiedostot(r)) });
  }

  const tulokset = [];
  async function kirjoita(nimi, otsikko, osat, kansiot) {
    const files = {};
    const rivit = [];
    for (const o of osat) {
      for (const [k, v] of Object.entries(o.files)) files[kansiot ? k : k.split("/").slice(1).join("/")] = v;
      rivit.push(...o.rivit);
    }
    files["tuotetiedot.txt"] = [strToU8(tuotetiedot(otsikko, rivit)), { level: 6 }];
    const buf = zipSync(files);
    const tiedosto = path.join(OUT, nimi);
    await fs.writeFile(tiedosto, buf);
    tulokset.push({ tiedosto: path.relative(ROOT, tiedosto), tavua: buf.length, kuvia: Object.keys(files).length - 1 });
  }

  for (const r of ryhmat.filter((x) => x.ryhma.id !== kit.KARKITUOTTEET.id)) await kirjoita(`huumorikauppa-${r.ryhma.id}.zip`, r.ryhma.heading, [r], false);
  await kirjoita(`huumorikauppa-${kit.KAIKKI_ZIP_ID}.zip`, "kaikki kuvat", ryhmat, true);

  let yhteensa = 0;
  for (const t of tulokset) {
    yhteensa += t.tavua;
    console.log(`${t.tiedosto}  ${(t.tavua / 1048576).toFixed(1)} Mt  ${t.kuvia} kuvaa`);
  }
  console.log(`Yhteensä ${(yhteensa / 1048576).toFixed(1)} Mt`);
  if (yhteensa > RAJA_MT * 1048576) console.warn(`VAROITUS: zipit ylittävät ${RAJA_MT} Mt:n tavoiterajan`);
} finally {
  await vite.close();
}
