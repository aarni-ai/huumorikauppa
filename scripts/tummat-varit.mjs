/**
 * Tumma painatus tummalla pohjalla (1.11.2026): jokaisen myynnissä olevan tuotteen jokainen väri tarkistetaan
 * vertaamalla Printifyn painokuvaa (etupuolen painoalue sillä varianttiryhmällä) tuotteen pohjaväriin (Printifyn värin
 * hex). Painokuvan näkyvä pikseli on näkymätön paidalla, kun pohja on tumma (luminanssi alle TUMMA_POHJA),
 * WCAG-kontrasti alle KONTRASTI_RAJA (suuren tekstin minimi 3:1) ja värietäisyys (CIE ΔE76) alle DELTA_E_RAJA (eri
 * sävy, esim. punainen sydän harmaalla, erottuu). Väri poistetaan, jos
 *  - Printifyn tekstikerroksen (text/svg) väri on näkymätön, tai
 *  - kuvakerroksen näkyvistä pikseleistä vähintään OSUUS_RAJA on näkymättömiä (kokonaan tumma teksti tummalla on
 *    100 %; ohut tumma ääriviiva vaalean tekstin ympärillä jää alle rajan). Valokuvissa ja monivärisissä kuvituksissa
 *    (yli KUVA_VARIT merkittävää väriä) raja on OSUUS_RAJA_KUVA: tumma tausta sulautuu paitaan, mutta kuva erottuu.
 *
 * Tulokset:
 *   api/_lib/tummat-varit.generated.js  slug -> poistettavat värit (api/_lib/tummat-varit.js poistaa ne kaupasta,
 *                                       kassasta ja Merchant-syötteestä valmisteleRivi-vaiheessa)
 *   some/.valimuisti/tummat-varit.json  kaikkien värien mittaukset (tarkistusta varten, ei repoon)
 *   --printify                          poistaa samat variantit käytöstä Printifyssä (is_enabled false)
 *
 * Ajo: PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... node scripts/tummat-varit.mjs [--printify]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import sharp from "sharp";

export const TUMMA_POHJA = 0.2;
export const KONTRASTI_RAJA = 3;
export const DELTA_E_RAJA = 40;
export const OSUUS_RAJA = 0.5;
export const OSUUS_RAJA_KUVA = 0.9;
export const KUVA_VARIT = 20;

const JUURI = new URL("..", import.meta.url).pathname;
const VALIMUISTI = join(JUURI, "some/.valimuisti/tummat");
const API = "https://api.printify.com/v1";
const KAUPPA = process.env.KAUPPA || "https://huumorikauppa.fi";
const { PRINTIFY_API_KEY: AVAIN, PRINTIFY_SHOP_ID: KAUPPA_ID } = process.env;

/** WCAG-suhteellinen luminanssi [r, g, b] 0-255. */
export function luminanssi([r, g, b]) {
  const k = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
}
export const kontrasti = (a, b) => { const [x, y] = [luminanssi(a), luminanssi(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const hexRgb = (hex) => { const h = String(hex).replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };

/** sRGB -> CIE Lab (D65). */
export function lab(rgb) {
  const [r, g, b] = rgb.map((c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
export const deltaE = (a, b) => { const [p, q] = [lab(a), lab(b)]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

/** Näkymätön reunapikseli: tumma pohja, kontrasti alle 3:1 ja sama sävy. */
export const nakymaton = (rgb, pohja) => luminanssi(pohja) < TUMMA_POHJA && kontrasti(rgb, pohja) < KONTRASTI_RAJA && deltaE(rgb, pohja) < DELTA_E_RAJA;

/**
 * Painokuvan näkyvyys pohjavärillä: pikselit [{ rgb, n }] -> { osuus: näkymättömien osuus, mediaani: kontrastin
 * mediaani }. Meleerattu väri (kaksi hexiä) lasketaan keskiarvona.
 */
export function luettavuus(pikselit, pohja) {
  let yht = 0, piilossa = 0;
  const arvot = [];
  for (const { rgb, n } of pikselit) {
    yht += n;
    if (nakymaton(rgb, pohja)) piilossa += n;
    arvot.push([kontrasti(rgb, pohja), n]);
  }
  arvot.sort((a, b) => a[0] - b[0]);
  let kertyma = 0, mediaani = 0;
  for (const [c, n] of arvot) { kertyma += n; if (kertyma >= yht / 2) { mediaani = c; break; } }
  return { osuus: yht ? piilossa / yht : 0, mediaani };
}

export const poistetaanko = (l) => l.syyt.length > 0;

async function printify(polku, init = {}) {
  for (let yritys = 0; ; yritys++) {
    const r = await fetch(`${API}${polku}`, { ...init, headers: { Authorization: `Bearer ${AVAIN}`, "Content-Type": "application/json", ...(init.headers || {}) } });
    if (r.status === 429 && yritys < 5) { await new Promise((ok) => setTimeout(ok, 5000 * (yritys + 1))); continue; }
    if (!r.ok) throw new Error(`Printify ${polku}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }
}

/** Painokuvan näkyvät pikselit kvantisoituina (16 tasoa per kanava), välimuistissa url:n mukaan. */
async function kuvanPikselit(src) {
  const tiedosto = join(VALIMUISTI, `${createHash("sha1").update(src).digest("hex")}.json`);
  try { return JSON.parse(await readFile(tiedosto, "utf8")); } catch { /* haetaan */ }
  const r = await fetch(src);
  if (!r.ok) throw new Error(`kuva ${r.status}`);
  const { data, info } = await sharp(Buffer.from(await r.arrayBuffer())).resize(200, 200, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const kartta = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 160) continue;
    const k = [data[i], data[i + 1], data[i + 2]].map((c) => Math.min(255, (c >> 4) * 16 + 8)).join(",");
    kartta.set(k, (kartta.get(k) || 0) + 1);
  }
  const pikselit = [...kartta].map(([k, n]) => ({ rgb: k.split(",").map(Number), n }));
  await writeFile(tiedosto, JSON.stringify(pikselit));
  return pikselit;
}

/** Värin hex Printifyn tuotteesta: variantin väriarvo -> colors (meleerattu: kahden keskiarvo). */
function varinRgb(pf, variantti) {
  const varit = (pf.options || []).find((o) => o.type === "color");
  if (!varit) return null;
  const arvo = varit.values.find((v) => variantti.options.includes(v.id));
  const hexit = (arvo?.colors || []).filter((h) => /^#?[0-9a-f]{6}$/i.test(h));
  if (!hexit.length) return null;
  const rgbt = hexit.map(hexRgb);
  return { nimi: arvo.title, rgb: [0, 1, 2].map((i) => Math.round(rgbt.reduce((s, c) => s + c[i], 0) / rgbt.length)) };
}

/** Merkittävien värien määrä (yli 0,2 % pikseleistä): valokuva tai monivärinen kuvitus, kun yli KUVA_VARIT. */
const merkittavia = (pikselit) => { const yht = pikselit.reduce((s, x) => s + x.n, 0); return pikselit.filter((x) => x.n > yht * 0.002).length; };

async function tarkistaTuote(p) {
  const pf = await printify(`/shops/${KAUPPA_ID}/products/${p.printify_product_id}.json`);
  const vari = new Map(Object.entries(p.variants?.variant_map || {}).map(([a, id]) => [Number(id), a.split("|")[0]]));
  const tulos = {};
  for (const alue of pf.print_areas || []) {
    const paikat = alue.placeholders || [];
    const paikka = paikat.find((x) => x.position === "front" && x.images?.length) || paikat.find((x) => x.images?.length);
    if (!paikka) continue;
    const kuvat = await Promise.all(paikka.images.filter((k) => k.src && k.type !== "text/svg").map(async (k) => {
      const pikselit = await kuvanPikselit(k.src);
      return { pikselit, raja: merkittavia(pikselit) > KUVA_VARIT ? OSUUS_RAJA_KUVA : OSUUS_RAJA };
    }));
    const tekstit = paikka.images.filter((k) => k.layerType === "text" && /^#[0-9a-f]{6}$/i.test(k.font_color || ""))
      .map((k) => ({ teksti: String(k.input_text || "").replace(/\s+/g, " ").slice(0, 40), rgb: hexRgb(k.font_color) }));
    if (!kuvat.length && !tekstit.length) continue;
    for (const vid of alue.variant_ids) {
      const nimi = vari.get(Number(vid));
      if (!nimi || tulos[nimi]) continue;
      const v = (pf.variants || []).find((x) => x.id === Number(vid));
      const pohja = v && varinRgb(pf, v);
      if (!pohja) continue;
      const mitatut = kuvat.map((k) => ({ ...luettavuus(k.pikselit, pohja.rgb), raja: k.raja }));
      const piilossaTeksti = tekstit.filter((t) => nakymaton(t.rgb, pohja.rgb)).map((t) => t.teksti);
      const syyt = [
        ...mitatut.filter((m) => m.osuus >= m.raja).map((m) => `kuvasta ${Math.round(m.osuus * 100)} % ei erotu`),
        ...piilossaTeksti.map((t) => `teksti "${t}" ei erotu`),
      ];
      tulos[nimi] = {
        osuus: Math.max(0, ...mitatut.map((m) => m.osuus)), mediaani: mitatut[0]?.mediaani ?? null, syyt,
        hex: `#${pohja.rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`, printify: pohja.nimi, paikka: paikka.position,
      };
    }
  }
  return { pf, tulos };
}

async function rinnakkain(lista, n, f) {
  const tulos = new Array(lista.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < lista.length) { const j = i++; tulos[j] = await f(lista[j], j); } }));
  return tulos;
}

async function main() {
  if (!AVAIN || !KAUPPA_ID) throw new Error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID tarvitaan");
  await mkdir(VALIMUISTI, { recursive: true });
  const d = await (await fetch(`${KAUPPA}/api/products`)).json();
  const tuotteet = (Array.isArray(d) ? d : d.products).filter((p) => p.printify_product_id && (p.variants?.colors || []).length > 1);
  console.log(`${tuotteet.length} moniväristä tuotetta`);
  const mittaukset = {};
  const poistot = {};
  const virheet = [];
  const pfTuotteet = {};
  await rinnakkain(tuotteet, 4, async (p, j) => {
    try {
      const { pf, tulos } = await tarkistaTuote(p);
      mittaukset[p.slug] = tulos;
      const pois = p.variants.colors.filter((c) => tulos[c] && poistetaanko(tulos[c]));
      // Tuote jää aina myyntiin vähintään yhdellä värillä: jos kaikki värit ylittäisivät rajan, paras jätetään.
      if (pois.length && pois.length >= p.variants.colors.length) {
        const paras = [...pois].sort((a, b) => tulos[a].syyt.length - tulos[b].syyt.length || tulos[a].osuus - tulos[b].osuus)[0];
        pois.splice(pois.indexOf(paras), 1);
      }
      if (pois.length) { poistot[p.slug] = pois; pfTuotteet[p.slug] = { pf, p }; }
    } catch (e) {
      virheet.push(`${p.slug}: ${e.message}`);
    }
    if (j % 50 === 0) console.log(j);
  });
  // Poistot ovat pysyviä: julkaisun jälkeen /api/products ei enää näytä poistettuja värejä, joten aiempi lista
  // yhdistetään uuteen (muuten uusi ajo palauttaisi värit kauppaan).
  try {
    const { default: aiemmat } = await import(`../api/_lib/tummat-varit.generated.js?t=${Date.now()}`);
    for (const [slug, varit] of Object.entries(aiemmat)) poistot[slug] = [...new Set([...(poistot[slug] || []), ...varit])];
  } catch { /* ensimmäinen ajo */ }
  const jarj = Object.fromEntries(Object.keys(poistot).sort().map((s) => [s, poistot[s]]));
  await writeFile(join(JUURI, "some/.valimuisti/tummat-varit.json"), JSON.stringify({ mittaukset, poistot: jarj, virheet }, null, 1));
  await writeFile(join(JUURI, "api/_lib/tummat-varit.generated.js"), `/** Generoitu ${new Date().toISOString().slice(0, 10)} (scripts/tummat-varit.mjs): värit, joissa on
 * tumma painatus tummalla pohjalla (kontrasti alle ${KONTRASTI_RAJA}:1 ja ΔE alle ${DELTA_E_RAJA}): tekstikerros tai vähintään
 * ${Math.round(OSUUS_RAJA * 100)} % kuvasta (valokuvat ${Math.round(OSUUS_RAJA_KUVA * 100)} %) ei erotu pohjasta.
 * Poistetaan kaupasta, kassasta ja Merchant-syötteestä (api/_lib/tummat-varit.js); Printifyssä variantit pois käytöstä. */
export default ${JSON.stringify(jarj, null, 1)};
`);
  const maara = Object.values(jarj).reduce((s, v) => s + v.length, 0);
  console.log(`poistettavia värejä ${maara} / ${Object.keys(jarj).length} tuotteessa, virheitä ${virheet.length}`);
  if (virheet.length) console.log(virheet.slice(0, 10).join("\n"));

  if (process.argv.includes("--printify")) {
    let ok = 0;
    for (const [slug, { pf, p }] of Object.entries(pfTuotteet)) {
      const pois = new Set(Object.entries(p.variants.variant_map).filter(([a]) => jarj[slug].includes(a.split("|")[0])).map(([, id]) => Number(id)));
      if (!pf.variants.some((v) => pois.has(v.id) && v.is_enabled)) continue;
      // Koko varianttilista ennallaan, vain poistettavat pois käytöstä (hinnat säilyvät).
      const variants = pf.variants.map((v) => ({ id: v.id, price: v.price, is_enabled: pois.has(v.id) ? false : v.is_enabled }));
      try {
        await printify(`/shops/${KAUPPA_ID}/products/${pf.id}.json`, { method: "PUT", body: JSON.stringify({ variants }) });
        ok++;
      } catch (e) {
        console.log(`Printify ${slug}: ${e.message}`);
      }
    }
    console.log(`Printify: ${ok} tuotetta päivitetty`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
