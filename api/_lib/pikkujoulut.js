/**
 * Pikkujoulupaketit yrityksille (4.11.2026, sivu /pikkujoulut-yritykset): valmiit 10, 25 ja 50 t-paidan paketit, joissa on
 * 5, 8 tai 10 eri pikkujoulu-, työpaikka- ja jouluhuumorin designia. Ostaja voi vaihtaa designeja lyhyeltä listalta
 * ja asettaa kokojakauman (S-3XL, summa = paketin koko). Ei riippuvuuksia palvelimen kirjastoihin: selain (laskuri) ja
 * palvelin (api/sahkoposti.js action "tarjouspyynto", kenttä pikkujoulu) laskevat saman hinnan.
 *
 * Hinta (sama logiikka kuin tarjouslaskurissa, api/_lib/yritysmyynti.js hinnoitteleTarjous): t-paitojen hinnat
 * (ALV 25,5 % sis.) ja määräalennuksen portaat (api/_lib/vakiot.js MAARAALENNUS). Porras annetaan vain, jos nettokate on
 * vähintään PIKKUJOULU_MIN_KATE (9 €) jokaista paitaa kohden; muuten suurin pienempi porras tai ei alennusta.
 * Kate lasketaan pahimmalla mahdollisella jaolla: jokainen koko kalleimman valitun designin Printify-kululla ja toimitus
 * niin, että jokainen valittu painotalo lähettää oman paketin.
 *
 * Printifyn kulut (DESIGNIT): tuotannon /api/products 3.11.2026 (src/test/fixtures/kate-kaikki-2026-11-03.json),
 * kalleimman värin kulu kokoa kohden sentteinä; toimitus Suomeen 8,49 € + 1,19 €/lisäkappale (painotalo 30).
 * src/test/pikkujoulut.test.ts vertaa näitä tilannekuvaan ja käy läpi kaikki paketit, designit ja kokojakaumat.
 */
import { hinnoitteleTarjous, KOOT as TARJOUS_KOOT } from "./yritysmyynti.js";

export const PIKKUJOULU_POLKU = "/pikkujoulut-yritykset";
/** Tarjouspyynnön lähde (tarjouspyynnot.lahde, mittari). */
export const PIKKUJOULU_LAHDE = "pikkujoulut-yritykset";
/** Vähimmäiskate paitaa kohden tällä sivulla (tavallinen tarjous 7 €, api/_lib/katesaanto.js MIN_KATE_PER_KPL). */
export const PIKKUJOULU_MIN_KATE = 9;
/** Valittavat koot (sama nimeäminen kuin tarjouslaskurissa: 2XL, 3XL). */
export const PIKKUJOULU_KOOT = ["S", "M", "L", "XL", "2XL", "3XL"];
/** Lomakkeen vähimmäistäyttöaika (ms): nopeampi lähetys kuitataan tallentamatta, kuten piilokenttä. */
export const PIKKUJOULU_MIN_TAYTTOAIKA_MS = 3000;

/**
 * Designit: nimi (designin teksti), koot { koko: [hinta €, Printify-kulu senttiä] }, painotalo ja toimitus (senttiä).
 * Kaikki ovat myynnissä olevia, piilottamattomia t-paitoja (27,90 €, 3XL 29,90 €).
 */
const OPT = { pp: 30, eka: 849, lisa: 119 };
const PERUS = { S: [27.9, 890], M: [27.9, 890], L: [27.9, 890], XL: [27.9, 890], "2XL": [27.9, 890] };
export const DESIGNIT = {
  "pikkujoulut-nyt-sinuttelen-esimiesta-t-paita-jouluun": { nimi: "Pikkujoulut. Nyt sinuttelen esimiestä", koot: PERUS, ...OPT },
  "tanaan-tanssin-huomenna-kadun-t-paita-pikkujouluihin": { nimi: "Tänään tanssin. Huomenna kadun", koot: PERUS, ...OPT },
  "karaokevuoro-varattu-jo-syyskuussa-t-paita-pikkujouluihin": { nimi: "Karaokevuoro varattu jo syyskuussa", koot: PERUS, ...OPT },
  "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin": { nimi: "Pikkujoulujen nimetty kuski", koot: PERUS, ...OPT },
  "pikkujoulut-muistan-osittain-t-paita-pikkujouluihin": { nimi: "Pikkujoulut. Muistan osittain", koot: PERUS, ...OPT },
  "pikkujouluissa-kaikki-on-salaista-t-paita-jouluun": { nimi: "Pikkujouluissa kaikki on salaista", koot: PERUS, ...OPT },
  "pikkujoulut-lauloin-vain-yhden-laulun-t-paita-jouluun": { nimi: "Pikkujoulut. Lauloin vain yhden laulun", koot: PERUS, ...OPT },
  "tontun-tyosopimus-paattyy-24-12-t-paita-jouluun": { nimi: "Tontun työsopimus päättyy 24.12", koot: PERUS, ...OPT },
  "tanssilattian-kuningas-pikkujoulut-2026-t-paita-jouluun": { nimi: "Tanssilattian kuningas. Pikkujoulut 2026", koot: PERUS, ...OPT },
  "hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti": { nimi: "Tämäkin olisi voinut olla sähköposti", koot: PERUS, ...OPT },
  // Vaihtoehdot (vaihdettavissa pakettien designien tilalle).
  "kolmas-glogi-nyt-laulan-t-paita-jouluun": { nimi: "Kolmas glögi. Nyt laulan", koot: PERUS, ...OPT },
  "glogin-virallinen-maistaja-t-paita-jouluun": { nimi: "Glögin virallinen maistaja", koot: PERUS, ...OPT },
  "joulupukin-virallinen-testaaja-t-paita-jouluun": { nimi: "Joulupukin virallinen testaaja", koot: PERUS, ...OPT },
  "tonttu-koeajalla-t-paita-jouluun": { nimi: "Tonttu koeajalla", koot: PERUS, ...OPT },
  "kiltti-enimmakseen-t-paita-jouluun": { nimi: "Kiltti. Enimmäkseen", koot: PERUS, ...OPT },
  "hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa": { nimi: "Tiimipelaaja, vaikka tiimi ei pelaa", koot: PERUS, ...OPT },
  "perjantaina-ei-julkaista-t-paita-it-ihmiselle": { nimi: "Perjantaina ei julkaista", koot: PERUS, ...OPT },
  // Ainoa työpaikkahuumorin design, jossa on myös 3XL (Printify-kulu 9,93 €, hinta 29,90 €).
  "huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita": { nimi: "Huonokin päivä kalassa on parempi kuin hyvä päivä töissä", koot: { ...PERUS, "3XL": [29.9, 993] }, ...OPT },
};

const PERUS10 = [
  "pikkujoulut-nyt-sinuttelen-esimiesta-t-paita-jouluun",
  "tanaan-tanssin-huomenna-kadun-t-paita-pikkujouluihin",
  "karaokevuoro-varattu-jo-syyskuussa-t-paita-pikkujouluihin",
  "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin",
  "pikkujoulut-muistan-osittain-t-paita-pikkujouluihin",
];
const LISA25 = [
  "pikkujouluissa-kaikki-on-salaista-t-paita-jouluun",
  "pikkujoulut-lauloin-vain-yhden-laulun-t-paita-jouluun",
  "tontun-tyosopimus-paattyy-24-12-t-paita-jouluun",
];
const LISA50 = [
  "tanssilattian-kuningas-pikkujoulut-2026-t-paita-jouluun",
  "hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti",
];

/** Paketit: kpl, designit (valmis valikoima) ja oletuskokojakauma. */
export const PIKKUJOULU_PAKETIT = [
  {
    id: "pikkujoulu-10", kpl: 10, nimi: "Pikkujoulupaketti 10",
    kuvaus: "Pienelle tiimille: kymmenen paitaa ja viisi eri vitsiä.",
    designit: PERUS10,
    oletusKoot: { S: 1, M: 3, L: 3, XL: 2, "2XL": 1, "3XL": 0 },
  },
  {
    id: "pikkujoulu-25", kpl: 25, nimi: "Pikkujoulupaketti 25",
    kuvaus: "Osastolle tai koko toimistolle: 25 paitaa ja kahdeksan eri vitsiä.",
    designit: [...PERUS10, ...LISA25],
    oletusKoot: { S: 2, M: 7, L: 8, XL: 5, "2XL": 3, "3XL": 0 },
  },
  {
    id: "pikkujoulu-50", kpl: 50, nimi: "Pikkujoulupaketti 50",
    kuvaus: "Isoille pikkujouluille: 50 paitaa ja kymmenen eri vitsiä.",
    designit: [...PERUS10, ...LISA25, ...LISA50],
    oletusKoot: { S: 4, M: 14, L: 15, XL: 11, "2XL": 6, "3XL": 0 },
  },
];

/** Designit, joilla pakettien designeja voi vaihtaa (lyhyt lista). */
export const PIKKUJOULU_VAIHTOEHDOT = Object.keys(DESIGNIT).filter((s) => !PIKKUJOULU_PAKETIT[2].designit.includes(s));
/** Kaikki sallitut designit. */
export const PIKKUJOULU_SALLITUT = Object.keys(DESIGNIT);

export const pikkujouluPaketti = (id) => PIKKUJOULU_PAKETIT.find((p) => p.id === id) ?? null;
export const designinNimi = (slug) => DESIGNIT[slug]?.nimi ?? slug;

/** Koot, jotka ovat saatavilla vähintään yhdessä valitussa designissa (paidat jaetaan designeille koon mukaan). */
export function sallitutKoot(designit) {
  return PIKKUJOULU_KOOT.filter((k) => designit.some((s) => DESIGNIT[s]?.koot[k]));
}

const kokonaisluku = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? Math.max(0, Math.min(999, Math.floor(n))) : 0;
};

/**
 * Paketin valinnan tarkistus. { paketti, designit: [slug], koot: { S: n, ... } } -> { ok, virheet, paketti, designit, koot }.
 * Säännöt: tunnettu paketti; designeja täsmälleen paketin verran, eri designit, kaikki sallitulta listalta; kokojen
 * summa = paketin koko; jokainen valittu koko löytyy vähintään yhdestä valitusta designista.
 */
export function tarkistaPikkujoulu(valinta = {}) {
  const virheet = [];
  const paketti = pikkujouluPaketti(valinta?.paketti);
  if (!paketti) return { ok: false, virheet: ["Valitse paketti."], paketti: null, designit: [], koot: {} };
  const designit = Array.isArray(valinta.designit) ? valinta.designit.map(String) : [];
  if (designit.some((s) => !DESIGNIT[s])) virheet.push("Valitse designit listalta.");
  if (new Set(designit).size !== designit.length) virheet.push("Sama design on valittu kahdesti.");
  if (designit.length !== paketti.designit.length) virheet.push(`Valitse ${paketti.designit.length} eri designia.`);
  const koot = Object.fromEntries(PIKKUJOULU_KOOT.map((k) => [k, kokonaisluku(valinta?.koot?.[k])]));
  const tuntematon = Object.keys(valinta?.koot || {}).some((k) => !PIKKUJOULU_KOOT.includes(k) && kokonaisluku(valinta.koot[k]) > 0);
  if (tuntematon) virheet.push("Valittavissa ovat koot S-3XL.");
  const summa = Object.values(koot).reduce((s, n) => s + n, 0);
  if (summa !== paketti.kpl) virheet.push(`Kokojen summa on ${summa}, paketissa on ${paketti.kpl} paitaa.`);
  const saatavilla = sallitutKoot(designit.filter((s) => DESIGNIT[s]));
  const puuttuvat = PIKKUJOULU_KOOT.filter((k) => koot[k] > 0 && !saatavilla.includes(k));
  if (puuttuvat.length) virheet.push(`Kokoa ${puuttuvat.join(", ")} ei ole valituissa designeissa.`);
  return { ok: virheet.length === 0, virheet, paketti, designit, koot };
}

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * Pahimman tapauksen Printify-kulut euroina (ALV 0): jokainen koko kalleimman sen kokoisen valitun designin kululla,
 * toimitus jokaiselle valitulle painotalolle omana lähetyksenään (kallein ensimmäinen kappale ja lisäkappale).
 */
export function pahimmatKulut(designit, koot) {
  const valitut = designit.map((s) => DESIGNIT[s]).filter(Boolean);
  let kpl = 0, tuotteet = 0;
  for (const k of PIKKUJOULU_KOOT) {
    const n = koot[k] || 0;
    if (!n) continue;
    const kulut = valitut.map((d) => d.koot[k]?.[1]).filter((x) => typeof x === "number");
    if (!kulut.length) return null;
    kpl += n;
    tuotteet += n * Math.max(...kulut);
  }
  if (!kpl) return 0;
  const painotalot = new Set(valitut.map((d) => d.pp)).size;
  const eka = Math.max(...valitut.map((d) => d.eka));
  const lisa = Math.max(...valitut.map((d) => d.lisa));
  const lahetyksia = Math.min(painotalot, kpl);
  return r2((tuotteet + lahetyksia * eka + (kpl - lahetyksia) * lisa) / 100);
}

/**
 * Paketin hinta-arvio: { ok, virheet, kpl, ennen, alennusProsentti, hinta, toimitus, yhteensa, perKpl, kate, katePerKpl }.
 * Hinnat ALV:n kanssa; kate on pahimman tapauksen arvio (vain sisäiseen käyttöön, ei näytetä asiakkaalle).
 * Koon hinta on valittujen designien edullisin (kaikki 27,90 €, 3XL 29,90 €; testi varmistaa, että hinnat ovat samat).
 */
export function laskePikkujoulu(valinta, { kerroin = 1, minKatePerKpl = PIKKUJOULU_MIN_KATE } = {}) {
  const t = tarkistaPikkujoulu(valinta);
  if (!t.ok) return { ...t, kpl: 0, yhteensa: 0 };
  const valitut = t.designit.map((s) => DESIGNIT[s]);
  let ennen = 0;
  for (const k of PIKKUJOULU_KOOT) {
    if (!t.koot[k]) continue;
    ennen += t.koot[k] * Math.min(...valitut.map((d) => d.koot[k]?.[0]).filter((x) => typeof x === "number"));
  }
  const kulut = pahimmatKulut(t.designit, t.koot);
  const h = hinnoitteleTarjous({ kpl: t.paketti.kpl, ennen, kulut }, { kerroin, minKatePerKpl });
  return { ...t, ...h, perKpl: r2(h.yhteensa / h.kpl), katePerKplTarkka: h.kate / h.kpl };
}

/**
 * Myynnistä poistuneet designit korvataan vaihtoehdoilla (selain: tuotelista /api/products ei sisällä piilotettuja).
 * onSaatavilla(slug) -> boolean. Palauttaa uuden listan; jos vaihtoehtoja ei riitä, puuttuva jää paikalleen.
 */
export function korvaaPuuttuvat(designit, onSaatavilla) {
  const tulos = [...designit];
  const vapaat = PIKKUJOULU_SALLITUT.filter((s) => onSaatavilla(s) && !designit.includes(s));
  for (let i = 0; i < tulos.length; i++) {
    if (onSaatavilla(tulos[i])) continue;
    const korvaaja = vapaat.shift();
    if (korvaaja) tulos[i] = korvaaja;
  }
  return tulos;
}

/** Paketin oletusvalinta (designit ja kokojakauma). */
export const oletusValinta = (paketti) => ({ paketti: paketti.id, designit: [...paketti.designit], koot: { ...paketti.oletusKoot } });

// ── Lomake ──────────────────────────────────────────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const siisti = (x, max) => (typeof x === "string" ? x.trim().slice(0, max) : "");

/**
 * Lomakkeen tarkistus (selain ja palvelin): yritys, yhteyshenkilö, sähköposti, toimituksen postinumero (5 numeroa) ja
 * paikkakunta pakollisia; puhelin, logo- tai tekstitoive ja viesti vapaaehtoisia. Palauttaa { ok, virheet, kentat }.
 */
export function tarkistaPikkujouluLomake(l = {}) {
  const kentat = {
    yritys: siisti(l.yritys, 120), nimi: siisti(l.nimi, 100), email: siisti(l.email, 200).toLowerCase(), puhelin: siisti(l.puhelin, 40),
    postinumero: siisti(l.postinumero, 10).replace(/\s/g, ""), kaupunki: siisti(l.kaupunki, 60), logoToive: siisti(l.logoToive, 500), viesti: siisti(l.viesti, 2000),
  };
  const virheet = [];
  if (!kentat.yritys) virheet.push("Kirjoita yrityksen nimi.");
  if (!kentat.nimi) virheet.push("Kirjoita yhteyshenkilön nimi.");
  if (!EMAIL_RE.test(kentat.email)) virheet.push("Kirjoita toimiva sähköpostiosoite.");
  if (!/^\d{5}$/.test(kentat.postinumero)) virheet.push("Kirjoita toimitusosoitteen postinumero (5 numeroa).");
  if (!kentat.kaupunki) virheet.push("Kirjoita toimitusosoitteen paikkakunta.");
  if (kentat.puhelin && !/^[+\d][\d\s()-]{4,}$/.test(kentat.puhelin)) virheet.push("Tarkista puhelinnumero.");
  return { ok: virheet.length === 0, virheet, kentat };
}

/**
 * Paketti -> tarjouspyynnön kentät (api/sahkoposti.js tarjouspyynto, taulu tarjouspyynnot). malli "tpaita" pitää
 * hallinnan ja mittarin ennallaan; pikkujoulu-sarake kertoo paketin, designit, kokojakauman, hinta-arvion ja toiveet.
 * Palauttaa { ok: false, virheet } tai { ok: true, tarjous, arvio }.
 */
export function pikkujouluTarjous(body = {}, { kerroin = 1 } = {}) {
  const v = laskePikkujoulu(body.pikkujoulu || {}, { kerroin });
  const l = tarkistaPikkujouluLomake(body);
  const virheet = [...(v.ok ? [] : v.virheet), ...l.virheet];
  if (virheet.length) return { ok: false, virheet };
  const koot = Object.fromEntries(Object.entries(v.koot).filter(([k, n]) => n > 0 && TARJOUS_KOOT.includes(k)));
  const arvio = {
    malli: "pikkujoulu", nimi: `${v.paketti.nimi} (${v.designit.length} designia)`, kpl: v.kpl, yhteensa: v.yhteensa, perKpl: v.perKpl,
    alennusProsentti: v.alennusProsentti, toimitus: v.toimitus,
  };
  return {
    ok: true,
    arvio,
    tarjous: {
      yritys: l.kentat.yritys, nimi: l.kentat.nimi, email: l.kentat.email, puhelin: l.kentat.puhelin || null,
      maara: v.kpl, viesti: l.kentat.viesti || null, paketti: v.paketti.id, malli: "tpaita", koot, hinta: v.yhteensa, kate: v.kate,
      lahde: PIKKUJOULU_LAHDE,
      pikkujoulu: {
        paketti: v.paketti.id, nimi: v.paketti.nimi, designit: v.designit.map((slug) => ({ slug, nimi: designinNimi(slug) })), koot,
        ennen: v.ennen, alennusProsentti: v.alennusProsentti, yhteensa: v.yhteensa, perKpl: v.perKpl, toimitus: v.toimitus,
        postinumero: l.kentat.postinumero, kaupunki: l.kentat.kaupunki, logoToive: l.kentat.logoToive || null,
      },
    },
  };
}
