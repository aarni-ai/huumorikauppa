/**
 * Personoidut lahjat (29.10.2026 ikäpaita, 2.11.2026 laajennus): asiakas valitsee mallin ja kirjoittaa nimen, toisen
 * nimen, vuosiluvun tai iän. Tuotesivu (/personoitu-paita) näyttää esikatselun, ja maksun jälkeen Printifyyn luodaan
 * tilaus lennosta luotavalla tuotteella (print_areas) ja tilauskohtaisella painokuvalla (api/painokuva.js).
 *
 * Tuotteet:
 * - T-paita: Gildan Softstyle 64000, OPT OnDemand (Tšekki, bp 145, pp 30), 32,90 €.
 * - Huppari: Gildan Heavy Blend 18500, Atelier Katanga (Ranska, bp 77, pp 402), sama pohja ja painotalo kuin kaupan
 *   hupparit (data/uudet-tuotteet/aukot-2026-11-02.json), 57,90 €, 3XL+ 60,90 €.
 * Hinnat api/_lib/vakiot.js HINNASTO; jokaisen variantin nettokate vähintään 10 € (src/test/personoidut.test.ts).
 *
 * Kassalle tuotteet ovat virtuaalisia tuoterivejä (PERSONOITU_TUOTE, PERSONOITU_HUPPARI) samassa muodossa kuin
 * tietokannan rivit, joten hinta, katevahti, variantit ja toimitus lasketaan kuten muillekin. Printifyn variantti-id:t
 * ovat katalogin id:t (catalog/blueprints/<b>/print_providers/<p>/variants.json), kulut kaupan saman pohjan tuotteilta.
 *
 * Personointi tallentuu ostoskorin customText-kenttään luettavassa muodossa "Malli: arvot" (esim. "Kokenut, ei vanha:
 * Marja 50v", "Naimisissa: Pekka & Marja, 1998"), ja palvelin jäsentää ja tarkistaa sen uudelleen (jasennaPersonointi):
 * merkit, pituus, kirosanat, tavaramerkit ja se, että teksti mahtuu painoalueelle.
 */
import { HINNASTO } from "./vakiot.js";
import { tavaramerkki } from "./tavaramerkit.js";
import { leveysEm } from "./tekstinleveys.js";

export const PERSONOITU_SLUG = "personoitu-ikapaita-t-paita";
export const PERSONOITU_PRINTIFY = "PERSONOITU";
export const PERSONOITU_POHJA = { blueprint_id: 145, print_provider_id: 30 };
export const PERSONOITU_HUPPARI_SLUG = "personoitu-huppari";
export const PERSONOITU_HUPPARI_PRINTIFY = "PERSONOITU_HUPPARI";
export const PERSONOITU_HUPPARI_POHJA = { blueprint_id: 77, print_provider_id: 402 };
export const PERSONOITU_HINTA = HINNASTO.personoitu;
export const PERSONOITU_HUPPARI_HINTA = HINNASTO.personoituHuppari.perus;
/** T-paidan painoalue (catalog/blueprints/145/print_providers/30/variants.json, front). Oma logo -paita käyttää samaa. */
export const PAINOALUE = { leveys: 3461, korkeus: 3955 };
/** Painoalueet tuotetyypeittäin (huppari: catalog/blueprints/77/print_providers/402/variants.json, front 3709 x 2472). */
export const PAINOALUEET = { "t-paita": PAINOALUE, huppari: { leveys: 3709, korkeus: 2472 } };
/**
 * Tekstilohkon paikka painoalueella (osuus korkeudesta). Hupparin yläosa jää nyörien alle (scripts/lib/uudet-tuotteet.mjs
 * 28.10.2026: Atelier Katangan painoalueella yläreunasta 0,2).
 */
const ASETTELU = { "t-paita": { yla: 0.08, ala: 0.04 }, huppari: { yla: 0.2, ala: 0.05 } };
export const TUOTETYYPIT = ["t-paita", "huppari"];
export const NIMI_MAX = 14;
/** Fonttikoon alaraja (osuus painoalueen leveydestä): t-paidalla noin 2 cm korkea teksti. Pienempää ei paineta. */
export const FONTTI_MIN = 0.07;

/** Rivien enimmäiskoot (osuus painoalueen leveydestä). */
const ISO = 0.2;
const KESKI = 0.13;
const PIENI = 0.1;

/**
 * Mallit. kentat: nimi, nimi2 (true) ja vuosi, ika ([min, max]). rivit(arvot) -> [[teksti, enimmäiskoko], ...],
 * teksti painetaan versaaleilla. aihe ryhmittelee mallit (kategoriasivu, nostot). vanha: 29.10.2026 ikäpaitamallit,
 * joiden customText-muoto on "Malli: Nimi 50v" (vanhat ostoskorit).
 */
export const MALLIT = [
  // Ikäpaidat 29.10.2026 (säilytetään ennallaan).
  { id: "kokenut", nimi: "Kokenut, ei vanha", aihe: "synttarit", vanha: true, kentat: { nimi: true, ika: [18, 110] }, esimerkki: { nimi: "Marja", ika: 50 },
    kuvaus: "Nimi ja ikä, alla teksti kokenut, ei vanha.", rivit: (a) => [[`${a.nimi} ${a.ika}v`, ISO], ["kokenut, ei vanha", KESKI]] },
  { id: "nuori", nimi: "Vuotta nuori", aihe: "synttarit", vanha: true, kentat: { nimi: true, ika: [18, 110] }, esimerkki: { nimi: "Pekka", ika: 60 },
    kuvaus: "Nimi ja teksti 60 vuotta nuori.", rivit: (a) => [[a.nimi, ISO], [`${a.ika} vuotta nuori`, KESKI]] },
  { id: "paras", nimi: "Paras vasta tulossa", aihe: "synttarit", vanha: true, kentat: { nimi: true, ika: [18, 110] }, esimerkki: { nimi: "Anne", ika: 40 },
    kuvaus: "Nimi ja ikä, alla teksti ja paras vasta tulossa.", rivit: (a) => [[`${a.nimi} ${a.ika}`, ISO], ["ja paras vasta tulossa", KESKI]] },
  { id: "takuu", nimi: "Takuu mennyt, toimii silti", aihe: "synttarit", vanha: true, kentat: { nimi: true, ika: [18, 110] }, esimerkki: { nimi: "Jussi", ika: 50 },
    kuvaus: "Nimi ja ikä, alla teksti takuu mennyt, toimii silti.", rivit: (a) => [[`${a.nimi} ${a.ika}v`, ISO], ["takuu mennyt, toimii silti", KESKI]] },
  { id: "amatimies", nimi: "Amatimies", aihe: "tyo", vanha: true, kentat: { nimi: true }, esimerkki: { nimi: "Pertti" },
    kuvaus: "Teksti amatimies ja nimi.", rivit: (a) => [["amatimies", ISO], [a.nimi, KESKI]] },

  // Personoidut lahjat 2.11.2026.
  { id: "paras-isa", nimi: "Maailman paras isä", aihe: "isa", kentat: { nimi: true }, esimerkki: { nimi: "Pekka" },
    kuvaus: "Maailman paras isä ja isän nimi.", rivit: (a) => [["Maailman paras isä:", KESKI], [a.nimi, ISO]] },
  { id: "isa-legenda", nimi: "Isä, legenda", aihe: "isa", kentat: { nimi: true }, esimerkki: { nimi: "Jari" },
    kuvaus: "Isän nimi, isä, legenda ja grillimestari.", rivit: (a) => [[a.nimi, ISO], ["isä. legenda.", KESKI], ["grillimestari.", PIENI]] },
  { id: "paras-aiti", nimi: "Maailman paras äiti", aihe: "aiti", kentat: { nimi: true }, esimerkki: { nimi: "Marja" },
    kuvaus: "Maailman paras äiti ja äidin nimi.", rivit: (a) => [["Maailman paras äiti:", KESKI], [a.nimi, ISO]] },
  { id: "aiti-pomo", nimi: "Perheen toimitusjohtaja", aihe: "aiti", kentat: { nimi: true }, esimerkki: { nimi: "Sanna" },
    kuvaus: "Äidin nimi ja titteli perheen toimitusjohtaja.", rivit: (a) => [["äiti", KESKI], [a.nimi, ISO], ["perheen toimitusjohtaja", PIENI]] },
  { id: "pappa", nimi: "Pappa tietää kaiken", aihe: "pappa", kentat: { nimi: true }, esimerkki: { nimi: "Kalevi" },
    kuvaus: "Pappa ja nimi, alla tietää kaiken, muistaa puolet.", rivit: (a) => [["pappa", KESKI], [a.nimi, ISO], ["tietää kaiken, muistaa puolet", PIENI]] },
  { id: "mummo", nimi: "Mummo, hemmottelun ammattilainen", aihe: "mummo", kentat: { nimi: true }, esimerkki: { nimi: "Aino" },
    kuvaus: "Mummo ja nimi, alla hemmottelun ammattilainen.", rivit: (a) => [["mummo", KESKI], [a.nimi, ISO], ["hemmottelun ammattilainen", PIENI]] },
  { id: "saunan-vanhin", nimi: "Saunan vanhin", aihe: "sauna", kentat: { nimi: true }, esimerkki: { nimi: "Erkki" },
    kuvaus: "Nimi ja saunan vanhin.", rivit: (a) => [[`${a.nimi},`, ISO], ["saunan vanhin", KESKI]] },
  { id: "loylymestari", nimi: "Löylymestari", aihe: "sauna", kentat: { nimi: true, vuosi: [1930, 2026] }, esimerkki: { nimi: "Timo", vuosi: 1975 },
    kuvaus: "Löylymestari, nimi ja vuosi, josta lähtien.", rivit: (a) => [["löylymestari", KESKI], [a.nimi, ISO], [`vuodesta ${a.vuosi}`, PIENI]] },
  { id: "mokkimestari", nimi: "Mökkimestari", aihe: "mokki", kentat: { nimi: true }, esimerkki: { nimi: "Seppo" },
    kuvaus: "Mökkimestari ja nimi.", rivit: (a) => [["mökkimestari", KESKI], [a.nimi, ISO]] },
  { id: "kalastaja", nimi: "Kalastaja", aihe: "kalastus", kentat: { nimi: true }, esimerkki: { nimi: "Markku" },
    kuvaus: "Kalastaja ja nimi, alla kala kasvaa kertoessa.", rivit: (a) => [["kalastaja", KESKI], [a.nimi, ISO], ["kala kasvaa kertoessa", PIENI]] },
  { id: "jahtimestari", nimi: "Jahtimestari", aihe: "metsastys", kentat: { nimi: true, vuosi: [1940, 2026] }, esimerkki: { nimi: "Heikki", vuosi: 1982 },
    kuvaus: "Jahtimestari, nimi ja passissa vuodesta.", rivit: (a) => [["jahtimestari", KESKI], [a.nimi, ISO], [`passissa vuodesta ${a.vuosi}`, PIENI]] },
  { id: "elakkeella-vuodesta", nimi: "Eläkkeellä vuodesta", aihe: "elake", kentat: { vuosi: [1970, 2030] }, esimerkki: { vuosi: 2026 },
    kuvaus: "Eläkkeellä vuodesta ja eläkkeelle jäämisen vuosi.", rivit: (a) => [["eläkkeellä", KESKI], ["vuodesta", PIENI], [String(a.vuosi), ISO]] },
  { id: "elakelainen", nimi: "Eläkeläinen, ei kiirettä", aihe: "elake", kentat: { nimi: true }, esimerkki: { nimi: "Pirkko" },
    kuvaus: "Nimi, eläkeläinen ja ei kiirettä enää.", rivit: (a) => [[a.nimi, ISO], ["eläkeläinen", KESKI], ["ei kiirettä enää", PIENI]] },
  { id: "naimisissa", nimi: "Naimisissa", aihe: "pari", kentat: { nimi: true, nimi2: true, vuosi: [1940, 2026] }, esimerkki: { nimi: "Pekka", nimi2: "Marja", vuosi: 1998 },
    kuvaus: "Kaksi nimeä ja naimisissa vuodesta lähtien.", rivit: (a) => [[`${a.nimi} ja ${a.nimi2}`, ISO], ["naimisissa", KESKI], [`${a.vuosi} lähtien`, KESKI]] },
  { id: "synttarisankari", nimi: "Synttärisankari", aihe: "synttarit", kentat: { nimi: true, ika: [1, 110] }, esimerkki: { nimi: "Ville", ika: 30 },
    kuvaus: "Synttärisankari, nimi ja ikä vuosina.", rivit: (a) => [["synttärisankari", KESKI], [a.nimi, ISO], [`${a.ika} vuotta`, KESKI]] },
  { id: "vuosikerta", nimi: "Vuosikerta", aihe: "synttarit", kentat: { vuosi: [1920, 2026] }, esimerkki: { vuosi: 1976 },
    kuvaus: "Vuosikerta ja syntymävuosi, alla alkuperäiset osat.", rivit: (a) => [["vuosikerta", KESKI], [String(a.vuosi), ISO], ["alkuperäiset osat", PIENI]] },
  { id: "tyokaveri", nimi: "Paras työkaveri", aihe: "tyo", kentat: { nimi: true }, esimerkki: { nimi: "Tiina" },
    kuvaus: "Paras työkaveri ja nimi, alla kahvia ja hyvää mieltä.", rivit: (a) => [["paras työkaveri", KESKI], [a.nimi, ISO], ["kahvia ja hyvää mieltä", PIENI]] },
  { id: "pikkujoulu", nimi: "Pikkujoulut", aihe: "joulu", kentat: { nimi: true, vuosi: [2020, 2030] }, esimerkki: { nimi: "Mikko", vuosi: 2026 },
    kuvaus: "Pikkujoulut ja vuosi, nimi ja oli paikalla.", rivit: (a) => [[`pikkujoulut ${a.vuosi}`, KESKI], [a.nimi, ISO], ["oli paikalla", PIENI]] },
  { id: "tonttu", nimi: "Tonttu", aihe: "joulu", kentat: { nimi: true }, esimerkki: { nimi: "Laura" },
    kuvaus: "Tonttu ja nimi, alla kiltti lähes koko vuoden.", rivit: (a) => [["tonttu", KESKI], [a.nimi, ISO], ["kiltti lähes koko vuoden", PIENI]] },
  { id: "golfari", nimi: "Golfari", aihe: "golf", kentat: { nimi: true }, esimerkki: { nimi: "Kari" },
    kuvaus: "Golfari ja nimi, alla tasoitus: salaisuus.", rivit: (a) => [["golfari", KESKI], [a.nimi, ISO], ["tasoitus: salaisuus", PIENI]] },
];

/** Aiheet kategoriasivulle ja nostoille (järjestys = näyttöjärjestys). */
export const AIHEET = {
  isa: "Isälle", aiti: "Äidille", pappa: "Papalle", mummo: "Mummolle", pari: "Pariskunnalle", synttarit: "Synttäreille",
  elake: "Eläkkeelle jäävälle", sauna: "Saunojalle", mokki: "Mökkeilijälle", kalastus: "Kalastajalle",
  metsastys: "Metsästäjälle", golf: "Golfarille", tyo: "Työkaverille", joulu: "Jouluun ja pikkujouluihin",
};

export const malli = (id) => MALLIT.find((m) => m.id === id) || null;
/** Mallin kentät järjestyksessä: nimi, nimi2, vuosi, ika. */
export const mallinKentat = (m) => ["nimi", "nimi2", "vuosi", "ika"].filter((k) => m?.kentat?.[k]);

/**
 * Estetyt sanat (kirosanat, solvaukset, väkivalta, ääriliikkeet). PITKAT haetaan mistä kohdasta tahansa, LYHYET vain
 * sanan alusta, jottei esimerkiksi nimi Tapani tai Panu esty. Vertailu pienaakkosilla, numerot kirjaimiksi.
 */
const PITKAT = [
  "vittu", "perkele", "saatana", "helvet", "paska", "kyrpä", "kyrpa", "mulkku", "huora", "lutka", "neekeri", "ryssä",
  "ryssa", "mutakuono", "natsi", "hitler", "raiskaa", "tappaa", "fuck", "shit", "bitch", "cunt", "nigger", "nigga",
  "whore", "porno", "nussi",
];
const LYHYET = ["vitu", "kusi", "pillu", "homo", "neeke", "kill", "fag", "sex", "kuole"];

const normalisoi = (s) => String(s).toLowerCase().normalize("NFC").replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s");

/** Onko teksti sallittu (ei estettyä sanaa, ei osoitteita). Tavaramerkit tarkistetaan erikseen (tavaramerkki). */
export function sallittuTeksti(s) {
  if (/https?:|www\.|@|\.(fi|com|net)\b/i.test(String(s))) return false;
  const n = normalisoi(s);
  const yhteen = n.replace(/[^a-zåäö]/g, "");
  if (PITKAT.some((e) => yhteen.includes(e))) return false;
  const sanat = n.split(/[^a-zåäö]+/).filter(Boolean);
  return !sanat.some((w) => LYHYET.some((e) => w.startsWith(e)));
}

const tyyppi = (t) => (t === "huppari" ? "huppari" : "t-paita");

/**
 * Painokuvan asettelu: rivien fonttikoot ja peruslinjat. Koko = rivin enimmäiskoko tai se, jolla rivi mahtuu 92 %:iin
 * painoalueen leveydestä (Anton-fontin merkkileveydet, api/_lib/tekstinleveys.js). Jos rivit eivät mahdu korkeuteen,
 * kaikkia pienennetään samassa suhteessa. mahtuu = jokainen rivi vähintään FONTTI_MIN.
 */
export function asettele(rivit, tuote = "t-paita", alue = PAINOALUEET[tyyppi(tuote)]) {
  const { leveys, korkeus } = alue;
  const a = ASETTELU[tyyppi(tuote)];
  const tekstit = rivit.map(([t]) => String(t).toUpperCase());
  let koot = rivit.map(([, max], i) => Math.min(max * leveys, (leveys * 0.92) / Math.max(leveysEm(tekstit[i]), 0.5)));
  // Rivin korkeus 1,05 em (versaalit ja ääkkösten pisteet), väli 0,22 em seuraavan rivin koosta.
  const korkeusYht = (k) => k.reduce((s, x, i) => s + x * 1.05 + (i > 0 ? x * 0.22 : 0), 0);
  const tila = korkeus * (1 - a.yla - a.ala);
  const h = korkeusYht(koot);
  if (h > tila) koot = koot.map((k) => (k * tila) / h);
  koot = koot.map((k) => Math.floor(k));
  let y = korkeus * a.yla;
  const linjat = koot.map((k, i) => {
    y += (i > 0 ? k * 0.22 : 0) + k * 1.05;
    return Math.round(y - k * 0.08);
  });
  const pienin = Math.min(...koot);
  return { tekstit, koot, linjat, leveys, korkeus, mahtuu: pienin >= Math.floor(FONTTI_MIN * leveys) };
}

const LUKU_VIRHE = { vuosi: "vuosiluku", ika: "ikä" };

/**
 * Tarkistaa personoinnin: { malli, nimi, nimi2, vuosi, ika } -> { ok: true, malli, nimi, nimi2, vuosi, ika } tai
 * { ok: false, virhe }. Nimi 1-14 merkkiä (kirjaimet, välilyönti, väliviiva, heittomerkki), ei kirosanoja eikä
 * tavaramerkkejä; vuosi ja ikä mallin välillä; lopuksi teksti mahtuu valitun tuotteen painoalueelle.
 * asetukset.tuote: "t-paita" (oletus) tai "huppari".
 */
export function tarkistaPersonointi(arvot, { tuote = "t-paita" } = {}) {
  const m = malli(arvot?.malli);
  if (!m) return { ok: false, virhe: "Valitse malli." };
  const tulos = { ok: true, malli: m.id, nimi: null, nimi2: null, vuosi: null, ika: null };
  for (const k of ["nimi", "nimi2"]) {
    if (!m.kentat[k]) continue;
    const n = String(arvot[k] ?? "").trim().replace(/\s+/g, " ");
    const mika = k === "nimi2" ? "Toisessa nimessä" : "Nimessä";
    if (!n) return { ok: false, virhe: k === "nimi2" ? "Kirjoita toinen nimi." : "Kirjoita nimi." };
    if (n.length > NIMI_MAX) return { ok: false, virhe: `${mika} voi olla enintään ${NIMI_MAX} merkkiä.` };
    if (!/^[\p{L}][\p{L}' -]*$/u.test(n)) return { ok: false, virhe: `${mika} voi olla vain kirjaimia, välilyönti ja väliviiva.` };
    if (!sallittuTeksti(n)) return { ok: false, virhe: "Tätä nimeä ei voi painaa. Kirjoita toinen nimi." };
    if (tavaramerkki(n)) return { ok: false, virhe: "Tuotemerkkejä, hahmoja ja joukkueiden nimiä ei voi painaa. Kirjoita toinen nimi." };
    tulos[k] = n;
  }
  if (m.kentat.nimi2 && tavaramerkki(`${tulos.nimi}${tulos.nimi2}`)) {
    return { ok: false, virhe: "Tuotemerkkejä, hahmoja ja joukkueiden nimiä ei voi painaa. Kirjoita toinen nimi." };
  }
  for (const k of ["vuosi", "ika"]) {
    if (!m.kentat[k]) continue;
    const [min, max] = m.kentat[k];
    const s = String(arvot[k] ?? "").trim();
    const x = /^\d{1,4}$/.test(s) ? Number(s) : NaN;
    if (!Number.isInteger(x) || x < min || x > max) return { ok: false, virhe: `Kirjoita ${LUKU_VIRHE[k]} numerona (${min}-${max}).` };
    tulos[k] = x;
  }
  if (!asettele(m.rivit(tulos), tuote).mahtuu) {
    return { ok: false, virhe: "Teksti ei mahdu painoalueelle. Lyhennä nimeä." };
  }
  return tulos;
}

/** Arvo-osa customTextissä: "Pekka & Marja, 1998, 50v" (nimissä ei voi olla &- eikä pilkkumerkkiä). */
function arvoTeksti(m, a) {
  const osat = [];
  if (m.kentat.nimi) osat.push(m.kentat.nimi2 ? `${a.nimi} & ${a.nimi2}` : a.nimi);
  if (m.kentat.vuosi) osat.push(String(a.vuosi));
  if (m.kentat.ika) osat.push(`${a.ika}v`);
  return osat.join(", ");
}

/** Ostoskorin customText: "Kokenut, ei vanha: Marja 50v" (vanhat mallit) tai "Naimisissa: Pekka & Marja, 1998". */
export function personointiTeksti(p) {
  const m = malli(p.malli);
  if (m.vanha) return `${m.nimi}: ${p.nimi}${m.kentat.ika ? ` ${p.ika}v` : ""}`;
  return `${m.nimi}: ${arvoTeksti(m, p)}`;
}

/** Mallit pisimmästä nimestä alkaen, jottei lyhyempi nimi osu pidemmän alkuun. */
const JASENNYS = [...MALLIT].sort((a, b) => b.nimi.length - a.nimi.length);

/** customText -> tarkistettu personointi tai { ok: false }. asetukset.tuote kuten tarkistaPersonointi. */
export function jasennaPersonointi(teksti, asetukset = {}) {
  const s = String(teksti ?? "").trim();
  const puuttuu = { ok: false, virhe: "Personointi puuttuu." };
  for (const m of JASENNYS) {
    if (!s.startsWith(`${m.nimi}: `)) continue;
    const loput = s.slice(m.nimi.length + 2);
    if (m.vanha) {
      const osuma = m.kentat.ika ? /^(.+) (\d{1,3})v$/.exec(loput) : [null, loput];
      if (!osuma) return puuttuu;
      return tarkistaPersonointi({ malli: m.id, nimi: osuma[1], ika: osuma[2] }, asetukset);
    }
    const osat = loput.split(", ");
    const arvot = { malli: m.id };
    if (m.kentat.nimi) {
      const nimet = String(osat.shift() ?? "").split(" & ");
      if (nimet.length !== (m.kentat.nimi2 ? 2 : 1)) return puuttuu;
      [arvot.nimi, arvot.nimi2] = nimet;
    }
    if (m.kentat.vuosi) arvot.vuosi = osat.shift();
    if (m.kentat.ika) {
      const ika = /^(\d{1,3})v$/.exec(String(osat.shift() ?? ""));
      if (!ika) return puuttuu;
      arvot.ika = ika[1];
    }
    if (osat.length) return puuttuu;
    return tarkistaPersonointi(arvot, asetukset);
  }
  return puuttuu;
}

/** Tummalle tuotteelle valkoinen teksti, vaalealle musta. */
export const TUMMAT = new Set(["Musta", "Tummansininen"]);
export const tekstinVari = (vari) => (TUMMAT.has(vari) ? "#ffffff" : "#111111");

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Painokuvan SVG (sama selaimen esikatselussa ja palvelimen PNG:ssä). Anton, versaalit, rivit keskitettynä;
 * fonttikoot asettele-funktiosta. asetukset: { tuote: "t-paita" | "huppari", fontti, leveys, korkeus }.
 */
export function painokuvaSvg(pers, vari, { tuote = "t-paita", fontti = "Anton", leveys, korkeus } = {}) {
  const m = malli(pers.malli);
  const perus = PAINOALUEET[tyyppi(tuote)];
  const alue = { leveys: leveys ?? perus.leveys, korkeus: korkeus ?? perus.korkeus };
  const a = asettele(m.rivit(pers), tuote, alue);
  const v = tekstinVari(vari);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${alue.leveys}" height="${alue.korkeus}" viewBox="0 0 ${alue.leveys} ${alue.korkeus}">` +
    a.tekstit.map((t, i) => `<text x="${alue.leveys / 2}" y="${a.linjat[i]}" font-family="${fontti}" font-size="${a.koot[i]}" fill="${v}" text-anchor="middle">${xml(t)}</text>`).join("") +
    `</svg>`;
}

// ── Tuotteet ───────────────────────────────────────────────────────────────────────────────────────────────────────

export const PERSONOITU_VARIANTIT = {"Musta|S": 38164, "Musta|M": 38178, "Musta|L": 38192, "Musta|XL": 38206, "Musta|2XL": 38220, "Musta|3XL": 42122, "Musta|4XL": 66213, "Musta|5XL": 95180, "Valkoinen|S": 38163, "Valkoinen|M": 38177, "Valkoinen|L": 38191, "Valkoinen|XL": 38205, "Valkoinen|2XL": 38219, "Valkoinen|3XL": 42120, "Valkoinen|4XL": 66211, "Vaaleanharmaa|S": 38162, "Vaaleanharmaa|M": 38176, "Vaaleanharmaa|L": 38190, "Vaaleanharmaa|XL": 38204, "Vaaleanharmaa|2XL": 38218, "Vaaleanharmaa|3XL": 42119, "Vaaleanharmaa|4XL": 66210, "Tummansininen|S": 38161, "Tummansininen|M": 38175, "Tummansininen|L": 38189, "Tummansininen|XL": 38203, "Tummansininen|2XL": 38217, "Tummansininen|3XL": 42118, "Tummansininen|4XL": 66208};
const KULUT = {"38161": 890, "38162": 890, "38163": 890, "38164": 890, "38175": 890, "38176": 890, "38177": 890, "38178": 890, "38189": 890, "38190": 890, "38191": 890, "38192": 890, "38203": 890, "38204": 890, "38205": 890, "38206": 890, "38217": 890, "38218": 890, "38219": 890, "38220": 890, "42118": 993, "42119": 993, "42120": 993, "42122": 993, "66208": 993, "66210": 993, "66211": 993, "66213": 993, "95180": 993};

/**
 * Hupparin variantit (catalog/blueprints/77/print_providers/402/variants.json, 2.11.2026): Black, White, Sport Grey ja
 * Navy S-3XL, Black ja White myös 4XL-5XL. Kulut kaupan Atelier Katanga -hupparilta (S-2XL 23,79 €, 3XL+ 31,17 €),
 * Suomen toimitus 10,89 € + lisäkappale 2,39 € (api/_lib/kate.js PRINTIFY_TOIMITUS_FI "77/402").
 */
export const PERSONOITU_HUPPARI_VARIANTIT = {
  "Musta|S": 32918, "Musta|M": 32919, "Musta|L": 32920, "Musta|XL": 32921, "Musta|2XL": 32922, "Musta|3XL": 32923, "Musta|4XL": 32924, "Musta|5XL": 32925,
  "Valkoinen|S": 32910, "Valkoinen|M": 32911, "Valkoinen|L": 32912, "Valkoinen|XL": 32913, "Valkoinen|2XL": 32914, "Valkoinen|3XL": 32915, "Valkoinen|4XL": 32916, "Valkoinen|5XL": 32917,
  "Vaaleanharmaa|S": 32902, "Vaaleanharmaa|M": 32903, "Vaaleanharmaa|L": 32904, "Vaaleanharmaa|XL": 32905, "Vaaleanharmaa|2XL": 32906, "Vaaleanharmaa|3XL": 32907,
  "Tummansininen|S": 32894, "Tummansininen|M": 32895, "Tummansininen|L": 32896, "Tummansininen|XL": 32897, "Tummansininen|2XL": 32898, "Tummansininen|3XL": 32899,
};
const HUPPARI_ISOT = new Set([32899, 32907, 32915, 32916, 32917, 32923, 32924, 32925]);
const HUPPARI_KULUT = Object.fromEntries(Object.values(PERSONOITU_HUPPARI_VARIANTIT).map((id) => [String(id), HUPPARI_ISOT.has(id) ? 3117 : 2379]));
const ISOT_KOOT = ["3XL", "4XL", "5XL"];

/** Virtuaalinen tuoterivi kassalle (sama muoto kuin tietokannan products-rivi). */
export const PERSONOITU_TUOTE = {
  id: "personoitu-ikapaita",
  slug: PERSONOITU_SLUG,
  name: "Personoitu t-paita | T-Paita",
  category: "t-paidat",
  price: PERSONOITU_HINTA,
  stock: 99,
  is_active: true,
  supplier: "printify",
  description: "T-paita, johon painetaan saajan nimi, vuosiluku tai ikä. Gildan Softstyle 64000, painetaan tilauksesta EU:ssa.",
  images: [],
  printify_product_id: PERSONOITU_PRINTIFY,
  variants: {
    variant_map: PERSONOITU_VARIANTIT,
    costs: KULUT,
    colors: ["Musta", "Valkoinen", "Vaaleanharmaa", "Tummansininen"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    default_color: "Musta",
    shipping_cents: 849,
    shipping_additional_cents: 119,
    print_provider_id: 30,
    personoitu: true,
    tuotetyyppi: "t-paita",
  },
};

export const PERSONOITU_HUPPARI = {
  id: "personoitu-huppari",
  slug: PERSONOITU_HUPPARI_SLUG,
  name: "Personoitu huppari | Huppari",
  category: "hupparit",
  price: PERSONOITU_HUPPARI_HINTA,
  stock: 99,
  is_active: true,
  supplier: "printify",
  description: "Huppari, johon painetaan saajan nimi, vuosiluku tai ikä. Gildan Heavy Blend 18500, painetaan tilauksesta EU:ssa.",
  images: [],
  printify_product_id: PERSONOITU_HUPPARI_PRINTIFY,
  variants: {
    variant_map: PERSONOITU_HUPPARI_VARIANTIT,
    costs: HUPPARI_KULUT,
    colors: ["Musta", "Valkoinen", "Vaaleanharmaa", "Tummansininen"],
    sizes: ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    size_prices: Object.fromEntries(ISOT_KOOT.map((k) => [k, HINNASTO.personoituHuppari.iso])),
    default_color: "Musta",
    shipping_cents: 1089,
    shipping_additional_cents: 239,
    print_provider_id: 402,
    personoitu: true,
    tuotetyyppi: "huppari",
  },
};

/** Personoidut tuotteet tuotetyypin mukaan. */
export const PERSONOIDUT_TUOTTEET = { "t-paita": PERSONOITU_TUOTE, huppari: PERSONOITU_HUPPARI };
/** Printify-pohja personoidun rivin printify_product_id:n mukaan. */
export const PERSONOIDUT_POHJAT = { [PERSONOITU_PRINTIFY]: { pohja: PERSONOITU_POHJA, tuote: "t-paita" }, [PERSONOITU_HUPPARI_PRINTIFY]: { pohja: PERSONOITU_HUPPARI_POHJA, tuote: "huppari" } };

export const onPersonoitu = (p) => [PERSONOITU_SLUG, PERSONOITU_HUPPARI_SLUG].includes(p?.slug) || !!PERSONOIDUT_POHJAT[p?.printify_product_id];
/** Personoidun tuoterivin tuotetyyppi ("t-paita" tai "huppari"). */
export const personoitujenTyyppi = (p) => (p?.slug === PERSONOITU_HUPPARI_SLUG || p?.printify_product_id === PERSONOITU_HUPPARI_PRINTIFY ? "huppari" : "t-paita");

/** Mallin personointisivun osoite (kategoriasivu, nostot). */
export const mallinPolku = (id, tuote = "t-paita") => `/personoitu-paita?malli=${encodeURIComponent(id)}${tuote === "huppari" ? "&tuote=huppari" : ""}`;
