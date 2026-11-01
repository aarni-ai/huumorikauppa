/**
 * Pinterest- ja Google Shopping -kuvat (1.11.2026): 50 suosituimmalle tuotteelle (api/_lib/top50.generated.js)
 * pystykuva 1000 x 1500 sisustustyyliin.
 *   some/kuvat/shopping/<slug>.jpg   ilman tekstiä: Merchant-syötteen lisäkuva (Googlen kuvasääntö: ei mainostekstiä)
 *   some/kuvat/pinterest/<slug>.jpg  paidan teksti otsikkona ja huumorikauppa.fi: Pinterest-pinni
 * Tuote irrotetaan Printify-mockupin tasaisesta taustasta (täyttö reunoilta) ja asetetaan seinän ja puulattian
 * eteen varjon kanssa. Jos tuotteella on Printifyn lifestyle-mockup, sitä käytetään sellaisenaan (rajattu 2:3).
 *
 * Ajo: node scripts/pinterest-kuvat.mjs [--vain slug] [--lista data/uudet-tuotteet-2026-11-02.json]. --lista tekee kuvat
 * tuontitiedoston tuotteille (esim. joulumallisto) ja kirjoittaa some/kuvat/kuvat-<tiedosto>.json. Julkaisu Blobiin:
 * scripts/some-blob.mjs (--lisakuvat some/kuvat/kuvat-<tiedosto>.json lataa vain nämä).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import TOP50 from "../api/_lib/top50.generated.js";
import { paidanTeksti } from "./some-videot.mjs";

const JUURI = new URL("..", import.meta.url).pathname;
const VALI = join(JUURI, "some/.valimuisti");
const ULOS = join(JUURI, "some/kuvat");
const W = 1000, H = 1500;
const KAUPPA = "https://huumorikauppa.fi";

/** Seinän ja lattian sävyt vuorotellen, jotta pinnit eivät näytä samalta. */
const MIILIT = [
  { seina: ["#efe6da", "#e2d5c3"], lattia: ["#b98c62", "#9c7350"], korostus: "#2b2118" },
  { seina: ["#e3e8e4", "#cfd8d2"], lattia: ["#c9a27a", "#a8835f"], korostus: "#1d2a24" },
  { seina: ["#f1ece4", "#e4dccf"], lattia: ["#8f6a4b", "#755538"], korostus: "#2a1d14" },
  { seina: ["#e6e1ea", "#d6cfdd"], lattia: ["#b0906f", "#93745a"], korostus: "#241d2b" },
];

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Tausta: seinä (pehmeä liukuvärji ja valo) ja puulattia lankkuineen. */
function taustaSvg(m, lattiaY) {
  const lankut = Array.from({ length: 9 }, (_, i) => {
    const y = lattiaY + 18 + i * i * 9;
    return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#000" stroke-opacity="${0.05 + i * 0.008}" stroke-width="2"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.seina[0]}"/><stop offset="1" stop-color="${m.seina[1]}"/></linearGradient>
      <linearGradient id="l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.lattia[0]}"/><stop offset="1" stop-color="${m.lattia[1]}"/></linearGradient>
      <radialGradient id="v" cx="0.3" cy="0.15" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${lattiaY}" fill="url(#s)"/>
    <rect y="${lattiaY}" width="${W}" height="${H - lattiaY}" fill="url(#l)"/>
    ${lankut}
    <rect y="${lattiaY - 6}" width="${W}" height="10" fill="#000" fill-opacity="0.08"/>
    <rect width="${W}" height="${H}" fill="url(#v)"/>
  </svg>`;
}

/** Mockupin tausta läpinäkyväksi: täyttö reunoilta taustan värisävyä myöten (toleranssi), reuna pehmennetään. */
export async function irrota(kuva, toleranssi = 14) {
  const { data, info } = await sharp(kuva).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const idx = (x, y) => (y * w + x) * 4;
  const bg = [data[0], data[1], data[2]];
  const lahella = (i) => Math.abs(data[i] - bg[0]) <= toleranssi && Math.abs(data[i + 1] - bg[1]) <= toleranssi && Math.abs(data[i + 2] - bg[2]) <= toleranssi;
  const tausta = new Uint8Array(w * h);
  const jono = [];
  for (let x = 0; x < w; x++) { jono.push(x, 0, x, h - 1); }
  for (let y = 0; y < h; y++) { jono.push(0, y, w - 1, y); }
  while (jono.length) {
    const y = jono.pop(), x = jono.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (tausta[p] || !lahella(idx(x, y))) continue;
    tausta[p] = 1;
    jono.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  const maski = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) maski[p] = tausta[p] ? 0 : 255;
  const pehmea = await sharp(maski, { raw: { width: w, height: h, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
  for (let p = 0; p < w * h; p++) data[p * 4 + 3] = pehmea[p];
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
}

async function lataa(url, nimi) {
  // Avain sisältää URL:n tiivisteen: tuotteen kuvalistan muuttuessa (esim. väri poistettu) vanha kuva ei jää käyttöön.
  const polku = join(VALI, `${nimi}-${createHash("sha1").update(url).digest("hex").slice(0, 10)}.jpg`);
  try { return await readFile(polku); } catch { /* haetaan */ }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`kuva ${r.status}: ${url}`);
  const b = Buffer.from(await r.arrayBuffer());
  await writeFile(polku, b);
  return b;
}

async function svgPng(svg, fontit) {
  return new Resvg(svg, { font: { fontFiles: fontit, loadSystemFonts: false, defaultFontFamily: "Anton" } }).render().asPng();
}

/**
 * Tuotteen etukuvista (enintään 4 ensimmäistä) se, jossa painatus erottuu parhaiten (keskialueen hajonta), kun vaate
 * ei ole valkoinen: valkoinen vaate valkoisella mockup-taustalla ei irtoa siististi.
 */
async function parasEtukuva(p) {
  let paras = null;
  for (const [n, url] of p.images.slice(0, 4).entries()) {
    if (!/camera_label=front(&|$)/.test(url)) continue;
    const b = await lataa(url, `${p.slug}-${n}`);
    const keski = await sharp(b).extract({ left: 420, top: 380, width: 360, height: 420 }).stats();
    const vaate = await sharp(b).extract({ left: 380, top: 860, width: 120, height: 120 }).stats();
    const vaateKirkkaus = vaate.channels.slice(0, 3).reduce((a, c) => a + c.mean, 0) / 3;
    const kontrasti = keski.channels.slice(0, 3).reduce((a, c) => a + c.stdev, 0) / 3;
    // Valkoinen vaate irrotetaan tarkemmalla toleranssilla; se valitaan vain, jos painatus erottuu selvästi paremmin.
    const valkoinen = vaateKirkkaus > 235;
    const pisteet = kontrasti - (valkoinen ? 12 : 0);
    if (!paras || pisteet > paras.pisteet) paras = { url, n, pisteet, valkoinen };
  }
  return paras || { url: p.images[0], n: 0 };
}

/** Tekstitön sisustuskuva (Shopping-lisäkuva). */
async function sisustuskuva(p, m) {
  // Printifyn lifestyle-mockup: oletusvärin (variant_images), muuten minkä tahansa värin tai tuotekuvien joukosta.
  const vi = p.variants?.variant_images || {};
  const onLife = (u) => /camera_label=(lifestyle|context)/.test(u);
  const life = (vi[p.variants?.default_color] || []).find(onLife) || Object.values(vi).flat().find(onLife) || (p.images || []).find(onLife);
  if (life) {
    const b = await lataa(life, `${p.slug}-life`);
    // Neliökuva (1200 x 1200) rajataan 2:3:ksi keskeltä, jotta henkilö ja paita pysyvät kuvassa.
    return sharp(b).resize(W, H, { fit: "cover", position: "attention" }).jpeg({ quality: 86 }).toBuffer();
  }
  const juliste = p.category === "seinataulut" || p.category === "tarrat";
  const lattiaY = 1200;
  const tausta = await sharp(Buffer.from(taustaSvg(m, lattiaY))).png().toBuffer();
  // Vaatteista etukuva, jossa painatus erottuu parhaiten (ei valkoinen vaate).
  const lahde = juliste ? { url: p.images[0], n: 0 } : await parasEtukuva(p);
  const irti = await irrota(await lataa(lahde.url, `${p.slug}-${lahde.n}`), lahde.valkoinen ? 3 : 14);
  const maxL = juliste ? 620 : 800, maxK = juliste ? 820 : 860;
  const tuote = await sharp(irti).resize(maxL, maxK, { fit: "inside" }).png().toBuffer();
  const tm = await sharp(tuote).metadata();
  const left = Math.round((W - tm.width) / 2);
  const top = juliste ? 250 : 300;
  // Varjo seinällä: siluetti tummana, sumennettu ja hieman alas oikealle.
  const varjo = await sharp(tuote).ensureAlpha().linear([0, 0, 0, 0.28], [0, 0, 0, 0]).blur(22).png().toBuffer();
  const kerrokset = [{ input: varjo, left: left + 18, top: top + 26 }];
  if (!juliste) {
    // Puinen henkari ja koukku kauluksen yläpuolella.
    const hx = W / 2, hy = top + 18;
    const henkari = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <path d="M ${hx} ${hy - 120} q 0 -34 26 -34 q 26 0 26 26" fill="none" stroke="#6b6b6b" stroke-width="8" stroke-linecap="round" transform="translate(-26 0)"/>
      <line x1="${hx}" y1="${hy - 122}" x2="${hx}" y2="${hy - 70}" stroke="#6b6b6b" stroke-width="8"/>
      <path d="M ${hx - 250} ${hy + 30} L ${hx} ${hy - 72} L ${hx + 250} ${hy + 30}" fill="none" stroke="#8a5a32" stroke-width="22" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
    kerrokset.push({ input: await sharp(Buffer.from(henkari)).png().toBuffer(), left: 0, top: 0 });
  }
  kerrokset.push({ input: tuote, left, top });
  return sharp(tausta).composite(kerrokset).jpeg({ quality: 86 }).toBuffer();
}

/** Pinterest-pinni: sisustuskuva, yläreunaan paidan teksti ja alareunaan huumorikauppa.fi. */
async function pinni(p, pohja, m, fontit) {
  const teksti = paidanTeksti(p.name);
  const koko = teksti.length > 34 ? 52 : teksti.length > 22 ? 62 : 74;
  const rivit = [];
  for (const sana of `"${teksti}"`.split(" ")) {
    const v = rivit[rivit.length - 1];
    if (v && (v + " " + sana).length * koko * 0.46 <= 880) rivit[rivit.length - 1] = v + " " + sana; else rivit.push(sana);
  }
  const korkeus = 60 + rivit.length * koko * 1.1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="40" y="40" width="${W - 80}" height="${korkeus}" rx="24" fill="#ffffff" fill-opacity="0.92"/>
    ${rivit.map((r, i) => `<text x="${W / 2}" y="${40 + 30 + koko + i * koko * 1.1 - 10}" font-family="Anton" font-size="${koko}" fill="${m.korostus}" text-anchor="middle">${xml(r)}</text>`).join("")}
    <rect x="${W / 2 - 230}" y="${H - 130}" width="460" height="80" rx="40" fill="${m.korostus}"/>
    <text x="${W / 2}" y="${H - 72}" font-family="Anton" font-size="46" fill="#ffffff" text-anchor="middle">HUUMORIKAUPPA.FI</text></svg>`;
  return sharp(pohja).composite([{ input: await svgPng(svg, fontit) }]).jpeg({ quality: 86 }).toBuffer();
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const vain = process.argv.includes("--vain") ? process.argv[process.argv.indexOf("--vain") + 1] : null;
  const listaTiedosto = process.argv.includes("--lista") ? process.argv[process.argv.indexOf("--lista") + 1] : null;
  const slugit = listaTiedosto ? JSON.parse(await readFile(join(JUURI, listaTiedosto), "utf8")).tuotteet.map((t) => t.slug) : [...TOP50];
  await mkdir(join(ULOS, "shopping"), { recursive: true });
  await mkdir(join(ULOS, "pinterest"), { recursive: true });
  const fontit = [join(VALI, "anton.ttf")];
  const r = await fetch(`${KAUPPA}/api/products?fields=slug,name,images,price,category,variants`);
  const j = await r.json();
  const tuotteet = new Map((Array.isArray(j) ? j : j.products).map((p) => [p.slug, p]));
  const lista = [];
  let i = 0;
  for (const slug of slugit) {
    if (vain && slug !== vain) continue;
    const p = tuotteet.get(slug);
    if (!p?.images?.length) { console.log(`ohitettu ${slug}`); continue; }
    const m = MIILIT[i++ % MIILIT.length];
    const kuva = await sisustuskuva(p, m);
    await writeFile(join(ULOS, "shopping", `${slug}.jpg`), kuva);
    await writeFile(join(ULOS, "pinterest", `${slug}.jpg`), await pinni(p, kuva, m, fontit));
    lista.push({ slug, nimi: p.name, teksti: paidanTeksti(p.name), kategoria: p.category });
    console.log(slug);
  }
  const nimi = listaTiedosto ? `kuvat-${listaTiedosto.split("/").pop().replace(/\.json$/, "")}.json` : "kuvat.json";
  if (!vain) await writeFile(join(ULOS, nimi), JSON.stringify(lista, null, 1));
}
