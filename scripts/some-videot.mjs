/**
 * Somevideot (1.11.2026): 20 pystyvideota (1080 x 1920, 9:16, noin 10,5 s) TikTokiin, Instagram Reelsiin ja YouTube
 * Shortsiin sekä some/JULKAISUT.md (julkaisujärjestys, kuvatekstit, hashtagit, UTM-linkit).
 *
 * Rakenne: koukku ensimmäisestä ruudusta (iso teksti) > kaksi tuotekuvaa (Printifyn mockupit, hidas zoom) > loppuruutu
 * "huumorikauppa.fi". Ei musiikkia: äänirata on hiljainen, ja TikTokissa lisätään sovelluksen oma musiikki.
 * Personoitu paita: painokuvat piirretään samalla koodilla kuin tilauksen painokuva (api/_lib/personoitu.js).
 *
 * Ajo: FFMPEG=/polku/ffmpeg node scripts/some-videot.mjs [--vain 07] [--md]
 *   --md  kirjoita vain some/JULKAISUT.md
 * Kuvat haetaan julkisesta tuoterajapinnasta ja välimuistitetaan kansioon some/.valimuisti (ei gittiin).
 * Videot some/videot/NN-slug.mp4 ja kansikuvat NN-slug.jpg (mp4 ja jpg eivät ole gitissä, koska repo on julkinen ja
 * tiedostot ovat isoja; ne ovat Aarnin koneella ja jaetaan Coworkille kansiosta).
 */
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import { painokuvaSvg, tarkistaPersonointi } from "../api/_lib/personoitu.js";

const JUURI = new URL("..", import.meta.url).pathname;
const ULOS = join(JUURI, "some/videot");
const VALI = join(JUURI, "some/.valimuisti");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const W = 1080, H = 1920, FPS = 30;
const KAUPPA = "https://huumorikauppa.fi";
const ANTON = "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf";
const ARIAL = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

const TEEMAT = {
  perus: { tausta: "#15171f", korostus: "#ffd23f" },
  metsa: { tausta: "#1d3326", korostus: "#f5a623" },
  kala: { tausta: "#0f3150", korostus: "#7fd3ff" },
  mokki: { tausta: "#2e2a24", korostus: "#ffb36b" },
  joulu: { tausta: "#6e1720", korostus: "#ffe08a" },
  synttari: { tausta: "#2a1f4a", korostus: "#ff9ecf" },
};

/**
 * Videot julkaisujärjestyksessä (päivä 1 = ensimmäinen). hook = ensimmäisen sekunnin teksti, kuvat = mockupien
 * indeksit (tai "lifestyle"), linkki = sivu, jolle YouTube-kuvauksen linkki vie.
 */
export const VIDEOT = [
  { slug: "tonnin-seteli-t-paita", teema: "perus", ala: "SUOMIHUUMORIA", hook: "Kun kaveri kysyy, paljonko se maksoi", kuvat: [0, 1],
    teksti: "Vastaus on aina sama: tonnin seteli. T-paita ja huppari löytyvät osoitteesta huumorikauppa.fi", tagit: ["#hauskapaita", "#suomihuumori", "#tonninseteli", "#lahjaidea"] },
  { slug: "pikkujoulut-muistan-osittain-t-paita-pikkujouluihin", teema: "joulu", ala: "PIKKUJOULUIHIN", hook: "Pikkujoulujen jälkeinen aamu", kuvat: [0, 1],
    teksti: "Pikkujoulut. Muistan osittain. T-paitana ja huppari­na, huumorikauppa.fi", tagit: ["#pikkujoulut", "#pikkujoulupaita", "#hauskapaita", "#joulu"] },
  { slug: "passissa-14-tuntia-hirvi-naki-minut-t-paita-metsastajalle", teema: "metsa", ala: "METSÄSTÄJÄLLE", hook: "Passissa 14 tuntia.", kuvat: [0, 1],
    teksti: "Ja sitten hirvi näki minut. T-paita metsästäjälle, huumorikauppa.fi", tagit: ["#metsästys", "#hirvijahti", "#hauskapaita", "#lahjaidea"] },
  { slug: "saatanan-tunarit-t-paita", teema: "perus", ala: "SUOMIHUUMORIA", hook: "Kun koko porukka on taas myöhässä", kuvat: [0, 1],
    teksti: "Saatanan tunarit. Klassikko nyt paitana, huumorikauppa.fi", tagit: ["#hauskapaita", "#suomihuumori", "#saatanantunarit"] },
  { slug: "kiltti-enimmakseen-t-paita-jouluun", teema: "joulu", ala: "JOULUPAITA", hook: "Pukki kysyy: oletko ollut kiltti?", kuvat: [0, 1],
    teksti: "Kiltti. Enimmäkseen. Joulupaita rehelliselle ihmiselle, huumorikauppa.fi", tagit: ["#joulupaita", "#joululahja", "#hauskapaita", "#joulu"] },
  { slug: "60v-kokenut-ei-vanha-huppari", teema: "synttari", ala: "60-VUOTIAALLE", hook: "Hän täyttää 60. Älä sano vanha.", kuvat: [0, 1],
    teksti: "60v kokenut, ei vanha. Lahja, joka naurattaa päivänsankaria. huumorikauppa.fi", tagit: ["#60v", "#lahjaidea", "#syntymäpäivä", "#hauskapaita"] },
  { slug: "kala-oli-tatakin-isompi-t-paita-kalastajalle", teema: "kala", ala: "KALASTAJALLE", hook: "Se kala oli näin iso. Oikeasti.", kuvat: [0, 1],
    teksti: "Kala oli tätäkin isompi. Kalastajalle, jolla on aina tarina. huumorikauppa.fi", tagit: ["#kalastus", "#kalastaja", "#hauskapaita", "#lahjaidea"] },
  { slug: "personoitu-ikapaita-t-paita", teema: "synttari", ala: "PERSONOITU PAITA", hook: "Paita, jossa lukee hänen nimensä", personoitu: true,
    linkki: "/personoitu-paita",
    teksti: "Kirjoita nimi ja ikä, ja näet paidan heti esikatselussa. Personoitu t-paita: huumorikauppa.fi", tagit: ["#personoitupaita", "#synttärilahja", "#lahjaidea", "#hauskapaita"] },
  { slug: "tonttu-koeajalla-t-paita-jouluun", teema: "joulu", ala: "JOULUPAITA", hook: "Uusi tonttu aloitti tänään", kuvat: [0, 1],
    teksti: "Tonttu koeajalla. Joulupaita työpaikan pikkujouluihin, huumorikauppa.fi", tagit: ["#joulupaita", "#pikkujoulut", "#tonttu", "#joululahja"] },
  { slug: "pilkilla-ala-soita-t-paita-kalastajalle", teema: "kala", ala: "KALASTAJALLE", hook: "Lauantaiaamu jäällä. Puhelin äänettömällä.", kuvat: [0, 1],
    teksti: "Pilkillä. Älä soita. huumorikauppa.fi", tagit: ["#pilkki", "#kalastus", "#talvikalastus", "#hauskapaita"] },
  { slug: "se-oli-tonnin-seteli-t-paita", teema: "perus", ala: "SUOMIHUUMORIA", hook: "Se oli tonnin seteli.", kuvat: [0, 1],
    teksti: "Tunnistaa jokainen, joka on kuullut tarinan. T-paita ja huppari, huumorikauppa.fi", tagit: ["#hauskapaita", "#suomihuumori", "#meemi"] },
  { slug: "mokilla-ei-ole-kiire-eika-kenttaa-t-paita-mokkeilijalle", teema: "mokki", ala: "MÖKKEILIJÄLLE", hook: "Mökillä ei ole kiire.", kuvat: [0, 1],
    teksti: "Eikä kenttää. Mökkeilijälle, joka tietää. huumorikauppa.fi", tagit: ["#mökki", "#mökkielämä", "#hauskapaita", "#suomihuumori"] },
  { slug: "glogi-ensin-sitten-joulu-t-paita-jouluun", teema: "joulu", ala: "JOULUPAITA", hook: "Joulun oikea järjestys", kuvat: [0, 1],
    teksti: "Glögi ensin. Sitten joulu. huumorikauppa.fi", tagit: ["#glögi", "#joulupaita", "#joululahja", "#suomihuumori"] },
  { slug: "koira-loysi-mina-en-t-paita-metsastajalle", teema: "metsa", ala: "METSÄSTÄJÄLLE", hook: "Kun koira löytää linnun ennen sinua", kuvat: [0, 1],
    teksti: "Koira löysi. Minä en. Paita jokaiseen jahtiporukkaan, huumorikauppa.fi", tagit: ["#metsästys", "#lintukoira", "#hauskapaita"] },
  { slug: "60v-takuu-mennyt-toimii-silti-t-paita", teema: "synttari", ala: "60-VUOTIAALLE", hook: "Takuu meni jo. Toimii silti.", kuvat: [0, 1],
    teksti: "Kuusikymppiselle, joka pitää huumorista. huumorikauppa.fi", tagit: ["#60v", "#synttärilahja", "#hauskapaita", "#suomihuumori"] },
  { slug: "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin", teema: "joulu", ala: "PIKKUJOULUIHIN", hook: "Joku ajaa kotiin. Tänä vuonna sinä.", kuvat: [0, 1],
    teksti: "Pikkujoulujen nimetty kuski. Ansaittu paita. huumorikauppa.fi", tagit: ["#pikkujoulut", "#pikkujoulupaita", "#hauskapaita"] },
  { slug: "sauna-lampiaa-muut-asiat-odottaa-t-paita-mokkeilijalle", teema: "mokki", ala: "SAUNOJALLE", hook: "Sauna lämpiää.", kuvat: [0, 1],
    teksti: "Muut asiat odottaa. huumorikauppa.fi", tagit: ["#sauna", "#mökki", "#suomihuumori", "#hauskapaita"] },
  { slug: "saatanan-tunarit-huppari", teema: "perus", ala: "HUPPARI", hook: "Talvi tulee. Tunarit eivät lähde mihinkään.", kuvat: [0, 1],
    teksti: "Saatanan tunarit, nyt myös huppari. huumorikauppa.fi", tagit: ["#huppari", "#suomihuumori", "#hauskapaita"] },
  { slug: "hauska-t-paita-golfaajalle-bogey-on-elamantapa", teema: "perus", ala: "GOLFAAJALLE", hook: "Par on tavoite. Bogey on elämäntapa.", kuvat: [0, "lifestyle"],
    teksti: "Golfaajalle, joka tuntee kentän. huumorikauppa.fi", tagit: ["#golf", "#golfhuumori", "#hauskapaita", "#lahjaidea"] },
  { slug: "kalastan-siis-valehtelen-t-paita-kalastajalle", teema: "kala", ala: "KALASTAJALLE", hook: "Kalastaja kertoo saaliistaan", kuvat: [0, 1],
    teksti: "Kalastan, siis valehtelen. huumorikauppa.fi", tagit: ["#kalastus", "#suomihuumori", "#hauskapaita"] },
].map((v, i) => ({ ...v, nro: String(i + 1).padStart(2, "0"), teksti: v.teksti.replace(/­/g, "") }));

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Rivitys arvioidulla merkkileveydellä (Anton noin 0,46 em, Arial Bold noin 0,6 em). */
function rivita(teksti, koko, leveys, kerroin = 0.46) {
  const max = Math.max(4, Math.floor(leveys / (koko * kerroin)));
  const rivit = [];
  for (const sana of teksti.split(/\s+/)) {
    const v = rivit[rivit.length - 1];
    if (v && (v + " " + sana).length <= max) rivit[rivit.length - 1] = v + " " + sana;
    else rivit.push(sana);
  }
  return rivit;
}

/** Suurin fonttikoko, jolla teksti mahtuu laatikkoon (leveys x korkeus). */
function sovita(teksti, leveys, korkeus, { max = 170, min = 60, rivivali = 1.08 } = {}) {
  for (let k = max; k >= min; k -= 4) {
    const r = rivita(teksti, k, leveys);
    if (r.length * k * rivivali <= korkeus && r.every((x) => x.length * k * 0.46 <= leveys)) return { koko: k, rivit: r };
  }
  return { koko: min, rivit: rivita(teksti, min, leveys) };
}

let fontit;
async function lataaFontit() {
  if (fontit) return fontit;
  await mkdir(VALI, { recursive: true });
  const anton = join(VALI, "anton.ttf");
  try { await access(anton); } catch { await writeFile(anton, Buffer.from(await (await fetch(ANTON)).arrayBuffer())); }
  fontit = [anton, ARIAL];
  return fontit;
}

async function svgPng(svg) {
  return new Resvg(svg, { font: { fontFiles: await lataaFontit(), loadSystemFonts: false, defaultFontFamily: "Anton" }, fitTo: { mode: "original" } }).render().asPng();
}

const tekstiSvg = (rivit, koko, y0, vari, perhe = "Anton", rivivali = 1.08) => rivit
  .map((r, i) => `<text x="${W / 2}" y="${y0 + koko + i * koko * rivivali}" font-family="${perhe}" font-size="${koko}" fill="${vari}" text-anchor="middle">${xml(r)}</text>`).join("");

/** Koukkuruutu: teeman tausta, pieni yläotsikko ja iso koukku keskellä (pysyy TikTokin käyttöliittymän turva-alueella). */
async function koukku(v) {
  const t = TEEMAT[v.teema];
  const { koko, rivit } = sovita(v.hook.toUpperCase(), 900, 760);
  const korkeus = rivit.length * koko * 1.08;
  const y0 = 760 - korkeus / 2;
  return svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    <rect x="${W / 2 - 260}" y="${y0 - 150}" width="520" height="84" rx="42" fill="${t.korostus}"/>
    ${tekstiSvg([v.ala], 46, y0 - 150 + 6, t.tausta, "Arial", 1)}
    ${tekstiSvg(rivit, koko, y0, "#ffffff")}</svg>`);
}

/** Tuoteruutu: paidan teksti ylhäällä, mockup pyöristetyssä kortissa. */
async function tuoteruutu(v, kuva, otsikko) {
  const t = TEEMAT[v.teema];
  const { koko, rivit } = sovita(`"${otsikko}"`, 920, 230, { max: 96, min: 50 });
  const koko2 = 980;
  const maski = Buffer.from(`<svg width="${koko2}" height="${koko2}"><rect width="${koko2}" height="${koko2}" rx="36" fill="#fff"/></svg>`);
  // Mockupeissa on paljon tyhjää: rajataan keskeltä 78 %, jotta paidan teksti erottuu puhelimen ruudulla.
  const m = await sharp(kuva).metadata();
  const rajaus = v.personoitu ? null : { left: Math.round(m.width * 0.11), top: Math.round(m.height * 0.1), width: Math.round(m.width * 0.78), height: Math.round(m.height * 0.78) };
  const kortti = await (rajaus ? sharp(kuva).extract(rajaus) : sharp(kuva)).resize(koko2, koko2, { fit: "cover" }).composite([{ input: maski, blend: "dest-in" }]).png().toBuffer();
  const ylä = await svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    ${tekstiSvg(rivit, koko, 250 - (rivit.length - 1) * koko * 0.54, t.korostus)}</svg>`);
  return sharp(ylä).composite([{ input: kortti, left: (W - koko2) / 2, top: 470 }]).png().toBuffer();
}

/** Loppuruutu: huumorikauppa.fi isona. */
async function loppu(v) {
  const t = TEEMAT[v.teema];
  return svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${t.tausta}"/>
    ${tekstiSvg(["HUUMORIKAUPPA.FI"], 118, 640, "#ffffff")}
    <rect x="${W / 2 - 300}" y="830" width="600" height="8" rx="4" fill="${t.korostus}"/>
    ${tekstiSvg(["Hauskat paidat suomeksi"], 56, 900, t.korostus, "Arial", 1)}
    ${tekstiSvg(["Linkki profiilissa"], 46, 1010, "#ffffff", "Arial", 1)}</svg>`);
}

/** Personoidun paidan esimerkki: oikea painokuva (sama koodi kuin tilauksessa) paidan värisellä pohjalla. */
async function personoituKuva(malli, nimi, ika, vari) {
  const pers = tarkistaPersonointi({ malli, nimi, ika });
  if (!pers.ok) throw new Error(pers.virhe);
  const paino = await svgPng(painokuvaSvg(pers, vari, { leveys: 1200, korkeus: 1371 }));
  const pohja = vari === "Musta" ? "#1b1b1d" : "#f2f2f0";
  const p = await sharp(paino).trim().resize(760, 600, { fit: "inside" }).png().toBuffer();
  return sharp({ create: { width: 1200, height: 1200, channels: 4, background: pohja } }).composite([{ input: p, gravity: "center" }]).jpeg().toBuffer();
}

let tuotteet;
async function tuote(slug) {
  if (!tuotteet) {
    const r = await fetch(`${KAUPPA}/api/products?fields=slug,name,images,price,category`);
    const j = await r.json();
    tuotteet = new Map((Array.isArray(j) ? j : j.products).map((p) => [p.slug, p]));
  }
  const p = tuotteet.get(slug);
  if (!p) throw new Error(`tuotetta ei löydy: ${slug}`);
  return p;
}

async function kuva(url, nimi) {
  const polku = join(VALI, `${nimi}.jpg`);
  try { return await readFile(polku); } catch { /* haetaan */ }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`kuva ${r.status}: ${url}`);
  const b = Buffer.from(await r.arrayBuffer());
  await writeFile(polku, b);
  return b;
}

/** Paidan teksti tuotteen nimestä ("Kala oli tätäkin isompi | T-paita kalastajalle" -> "Kala oli tätäkin isompi"). */
export function paidanTeksti(nimi) {
  const n = String(nimi).split("|")[0].trim();
  const m = n.match(/^Hauska (?:T-Paita|Huppari)[^:]*:\s*(.+)$/i);
  let s = (m ? m[1] : n).trim();
  // Otsikkomuoto ("Bogey On Elämäntapa") virkkeeksi: paidassa ja videossa luetaan tavallisena lauseena.
  const sanat = s.split(" ");
  if (sanat.length > 1 && sanat.every((w) => /^[A-ZÅÄÖ0-9]/.test(w))) s = [sanat[0], ...sanat.slice(1).map((w) => w.toLowerCase())].join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Kehykset ffmpegillä: hidas zoom jokaiseen ruutuun, ristihäivytys 0,35 s, hiljainen äänirata. */
function koosta(ruudut, kestot, ulos) {
  const H2 = 0.35;
  const args = ["-y", "-loglevel", "error"];
  ruudut.forEach((r, i) => args.push("-loop", "1", "-t", String(kestot[i]), "-i", r));
  args.push("-f", "lavfi", "-t", "20", "-i", "anullsrc=r=44100:cl=stereo");
  const suodin = [];
  ruudut.forEach((_, i) => {
    const n = Math.round(kestot[i] * FPS);
    // Ensimmäinen ruutu ilman zoomin alkua: koukku näkyy täytenä heti.
    suodin.push(`[${i}:v]scale=${W * 2}:${H * 2},zoompan=z='min(1+on*0.0009,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${n}:s=${W}x${H}:fps=${FPS},format=yuv420p,setsar=1[v${i}]`);
  });
  let edellinen = "v0", aika = kestot[0];
  for (let i = 1; i < ruudut.length; i++) {
    const nimi = `x${i}`;
    suodin.push(`[${edellinen}][v${i}]xfade=transition=fade:duration=${H2}:offset=${(aika - H2).toFixed(2)}[${nimi}]`);
    aika += kestot[i] - H2;
    edellinen = nimi;
  }
  args.push("-filter_complex", suodin.join(";"), "-map", `[${edellinen}]`, "-map", `${ruudut.length}:a`, "-t", aika.toFixed(2),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", ulos);
  execFileSync(FFMPEG, args, { stdio: "inherit" });
  return aika;
}

export const utm = (polku, lahde, nro, kampanja = "somevideo") =>
  `${KAUPPA}${polku}${polku.includes("?") ? "&" : "?"}utm_source=${lahde}&utm_medium=social&utm_campaign=${kampanja}&utm_content=video${nro}`;

async function teeVideo(v) {
  const ruudut = [];
  const tmp = join(VALI, "ruudut");
  await mkdir(tmp, { recursive: true });
  const tallenna = async (b, n) => { const p = join(tmp, `${v.nro}-${n}.png`); await writeFile(p, b); ruudut.push(p); };
  const k = await koukku(v);
  await tallenna(k, "a");
  if (v.personoitu) {
    await tallenna(await tuoteruutu(v, await personoituKuva("kokenut", "Marja", "60", "Musta"), "Marja 60v, kokenut, ei vanha"), "b");
    await tallenna(await tuoteruutu(v, await personoituKuva("nuori", "Jari", "50", "Valkoinen"), "Jari, 50 vuotta nuori"), "c");
  } else {
    const p = await tuote(v.slug);
    const urlit = v.kuvat.map((x) => (x === "lifestyle" ? p.images.find((u) => u.includes("lifestyle")) : p.images[x]));
    for (const [i, u] of urlit.entries()) await tallenna(await tuoteruutu(v, await kuva(u, `${v.slug}-${i}`), paidanTeksti(p.name)), String.fromCharCode(98 + i));
  }
  await tallenna(await loppu(v), "z");
  await mkdir(ULOS, { recursive: true });
  const nimi = `${v.nro}-${v.slug.slice(0, 48).replace(/-+$/, "")}`;
  const kesto = koosta(ruudut, [2.6, 3.2, 3.2, 2.6], join(ULOS, `${nimi}.mp4`));
  await sharp(k).resize(540, 960).jpeg({ quality: 85 }).toFile(join(ULOS, `${nimi}.jpg`));
  return { nimi, kesto };
}

/** some/JULKAISUT.md: 20 päivän järjestys, kuvatekstit, hashtagit ja UTM-linkit kanavittain. */
async function julkaisut(alku = "2026-11-02") {
  const pv = (i) => { const d = new Date(`${alku}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i); return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`; };
  const bio = (l) => utm("/linkit", l, "", "bio").replace("&utm_content=video", "");
  const rivit = [
    "# Somevideot: julkaisujärjestys 20 päivälle",
    "",
    "Videot ovat kansiossa `some/videot/` (1080 x 1920, 9:16, noin 10,5 s, H.264, hiljainen äänirata). Kansikuva on samanniminen .jpg.",
    "Tehty skriptillä `scripts/some-videot.mjs` (1.11.2026). Tuotekuvat ovat kaupan omia Printify-mockupeja.",
    "",
    "## Näin julkaiset",
    "",
    "- **Yksi video päivässä kaikkiin kolmeen kanavaan**, mieluiten klo 18-20.",
    "- **TikTok:** lisää sovelluksen oma musiikki (Commercial Music Library, jos tili on yritystili). Videossa ei ole musiikkia.",
    "- **Instagram Reels ja YouTube Shorts:** voi julkaista sellaisenaan tai lisätä sovelluksen oman äänen.",
    "- **Bio-linkki joka kanavaan** (laskee käynnit lähteittäin /hallinta/mittarit-sivulle):",
    `  - TikTok: ${bio("tiktok")}`,
    `  - Instagram: ${bio("instagram")}`,
    `  - YouTube: ${bio("youtube")}`,
    "- **YouTube-kuvaukseen** voi lisätä videon oman tuotelinkin (alla). TikTokissa ja Instagramissa linkki ei ole klikattava, joten kuvatekstissä viitataan profiilin linkkiin.",
    "- Kuvateksti on valmis kopioitavaksi. Hashtagit ovat sen perässä.",
    "",
    "## Julkaisujärjestys",
    "",
  ];
  for (const [i, v] of VIDEOT.entries()) {
    const polku = v.linkki || `/tuote/${v.slug}`;
    const nimi = `${v.nro}-${v.slug.slice(0, 48).replace(/-+$/, "")}`;
    rivit.push(`### Päivä ${i + 1} (${pv(i)}): ${v.hook}`, "",
      `- **Video:** \`some/videot/${nimi}.mp4\``,
      `- **Kuvateksti:** ${/[.!?]$/.test(v.teksti) ? v.teksti : `${v.teksti}.`} Linkki profiilissa. ${v.tagit.join(" ")}`,
      `- **YouTube-kuvauksen linkki:** ${utm(polku, "youtube", v.nro)}`,
      `- **Instagram (tarina tai linkkitarra):** ${utm(polku, "instagram", v.nro)}`,
      `- **TikTok (jos linkki sallitaan):** ${utm(polku, "tiktok", v.nro)}`, "");
  }
  rivit.push("## Seuranta", "",
    "- Käynnit lähteittäin (tiktok, instagram, youtube) näkyvät sivulla /hallinta/mittarit ja päivän yhteenvetoviestissä.",
    "- GA4 näyttää samat utm-parametrit (Hankinta > Liikenteen hankinta), kun kävijä on antanut analytiikkasuostumuksen.",
    "- Arvioi 7 päivän jälkeen, mikä aihe tuo eniten käyntejä, ja tee siitä lisää versioita.", "");
  await writeFile(join(JUURI, "some/JULKAISUT.md"), rivit.join("\n"));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const vain = process.argv.includes("--vain") ? process.argv[process.argv.indexOf("--vain") + 1] : null;
  await mkdir(join(JUURI, "some"), { recursive: true });
  await julkaisut();
  if (!process.argv.includes("--md")) {
    for (const v of VIDEOT.filter((x) => !vain || x.nro === vain)) {
      const r = await teeVideo(v);
      console.log(`${r.nimi}.mp4 ${r.kesto.toFixed(1)} s`);
    }
  }
}
