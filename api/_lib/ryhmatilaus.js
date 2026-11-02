/**
 * Ryhmätilaukset (2.11.2026): abipaidat, polttaripaidat, joukkuepaidat ja yhdistysten paidat (sivut /abipaidat,
 * /polttarit, /joukkueet, /yhdistykset). Ryhmän vetäjä suunnittelee etupuolen (ryhmän nimi, vuosiluku, oma teksti tai
 * logo) ja jakaa jäsenlinkin; jokainen jäsen kirjoittaa kokotaulukkoon selkänimensä (ja halutessa numeron) ja koon.
 *
 * Tuote: t-paita Gildan Softstyle 64000, OPT OnDemand (Tšekki, bp 145, pp 30), sama pohja kuin personoidussa paidassa
 * (variantit ja kulut api/_lib/personoitu.js). Selkäpainatus on toinen painoalue: sen kulu on arvio
 * RYHMA_SELKA_KULU_SENTIT, joka lisätään jokaisen variantin kuluun (scripts/ryhmatilaus-testi.mjs vertaa arviota
 * Printifyn testitilauksen todelliseen kuluun).
 *
 * Hinta: kappalehinta tilauksen paitamäärän mukaan (vakiot.js HINNASTO.ryhmapaita, portaat 5+, 10+, 25+, 50+;
 * 3XL-5XL + isoLisa). Kaikki paidat toimitetaan vetäjän osoitteeseen yhtenä tilauksena, toimitus sisältyy hintaan.
 *
 * Maksu- ja lukitussääntö (RYHMA_SAANTO):
 * - maksutapa "vetaja": jäsenet täyttävät kokotaulukon, vetäjä lukitsee ja maksaa kaikki paidat kerralla.
 * - maksutapa "jasenet": jokainen maksaa oman paitansa jaetusta linkistä paidan perushinnalla (5-9 paidan porras).
 *   Kun kokotaulukon kaikki paikat on maksettu, tilaus lukittuu ja lähtee painoon automaattisesti. Vetäjä voi lukita
 *   aiemmin: maksamattomat jäävät pois ("jata-pois") tai vetäjä maksaa heidän paitansa ("maksa-loput").
 * - Kun tilaus lähtee painoon, kappalehinta lasketaan lopullisesta paitamäärästä, ja itse maksaneille palautetaan
 *   erotus maksukortille.
 * - Tilauksessa on vähintään RYHMA_MIN_KPL paitaa.
 *
 * Moduuli on puhdas (ei Node-riippuvuuksia): selain (suunnittelutyökalu, esikatselu, hinnat) ja palvelin käyttävät
 * samoja tarkistuksia. Tietokanta, Stripe ja Printify-lähetys: api/_lib/ryhmatilaus-db.js.
 */
import { HINNASTO } from "./vakiot.js";
import { PERSONOITU_TUOTE, PERSONOITU_POHJA, PAINOALUE, asettele, sallittuTeksti, tekstinVari, NIMI_MAX } from "./personoitu.js";
import { tavaramerkki } from "./tavaramerkit.js";
import { tarkistaRivi, onLogoId, LOGOPAITA_VARIT } from "./logopaita.js";
import { laskeTilauksenNettokate, STRIPE_PROSENTTI, STRIPE_KIINTEA, PRINTIFY_KULUKERROIN } from "./kate.js";

export const RYHMATYYPIT = ["abi", "polttarit", "joukkue", "yhdistys"];
export const RYHMA_MIN_KPL = 5;
export const RYHMA_MAX_KPL = 100;
/** Jokaisen paidan nettokate vähintään (kaikki kulut, Stripe ja hyvitykset mukana). */
export const RYHMA_MIN_KATE_PER_PAITA = 9;
/** Selkäpainatuksen kulu (arvio, sentit): lisätään jokaisen variantin etupainatuksen kuluun. */
export const RYHMA_SELKA_KULU_SENTIT = 600;
export const RYHMAPAITA_PRINTIFY = "RYHMAPAITA";
export const RYHMAPAITA_SLUG = "ryhmapaita";
export const RYHMAPAITA_POHJA = PERSONOITU_POHJA;
export const RYHMA_HINNASTO = HINNASTO.ryhmapaita;
export const RYHMA_VARIT = LOGOPAITA_VARIT;
export const RYHMA_KOOT = PERSONOITU_TUOTE.variants.sizes;
export const ISOT_KOOT = ["3XL", "4XL", "5XL"];
export const RYHMA_NIMI_MAX = 24;
export const SELKA_NIMI_MAX = NIMI_MAX;
export { PAINOALUE, tekstinVari };

const pyorista = (x) => Math.round(x * 100) / 100;

const KULUT = Object.fromEntries(Object.entries(PERSONOITU_TUOTE.variants.costs).map(([id, c]) => [id, c + RYHMA_SELKA_KULU_SENTIT]));

/** Virtuaalinen tuoterivi (sama muoto kuin products-rivi): kate lasketaan kassan funktioilla (api/_lib/kate.js). */
export const RYHMAPAITA_TUOTE = {
  ...PERSONOITU_TUOTE,
  id: "ryhmapaita",
  slug: RYHMAPAITA_SLUG,
  name: "Ryhmäpaita | T-Paita",
  price: RYHMA_HINNASTO.portaat[RYHMA_HINNASTO.portaat.length - 1][1],
  description: "Ryhmän t-paita: etupuolelle ryhmän nimi, vuosi ja teksti tai logo, selkään jäsenen nimi. Gildan Softstyle 64000, painetaan tilauksesta EU:ssa.",
  printify_product_id: RYHMAPAITA_PRINTIFY,
  variants: { ...PERSONOITU_TUOTE.variants, costs: KULUT, personoitu: false, ryhmapaita: true },
};

/** Printifyn variantti värille ja koolle tai null. */
export const variantti = (vari, koko) => RYHMAPAITA_TUOTE.variants.variant_map[`${vari}|${koko}`] ?? null;
/** Koot, jotka värissä on saatavilla (5XL vain mustana). */
export const kootVarille = (vari) => RYHMA_KOOT.filter((k) => variantti(vari, k) !== null);

// ── Hinta ja kate ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Hintaporras paitamäärälle: { min, hinta } (alle RYHMA_MIN_KPL: pienin porras). */
export function hintaporras(kpl, hinnasto = RYHMA_HINNASTO) {
  const n = Math.max(Number(kpl) || 0, RYHMA_MIN_KPL);
  const [min, hinta] = hinnasto.portaat.find(([m]) => n >= m) ?? hinnasto.portaat[hinnasto.portaat.length - 1];
  return { min, hinta };
}

/** Kappalehinta euroina: paitamäärän porras, 3XL-5XL + isoLisa. */
export function kappalehinta(kpl, koko, hinnasto = RYHMA_HINNASTO) {
  return pyorista(hintaporras(kpl, hinnasto).hinta + (ISOT_KOOT.includes(koko) ? hinnasto.isoLisa : 0));
}

/** Perushinta (pienin porras): jäsen maksaa tämän, ja erotus palautetaan, kun tilaus lähtee painoon. */
export const perushinta = (koko, hinnasto = RYHMA_HINNASTO) => kappalehinta(RYHMA_MIN_KPL, koko, hinnasto);

/** Portaat näytettäväksi: [{ min, max, hinta, isoHinta }] pienimmästä alkaen. */
export function hintaportaat(hinnasto = RYHMA_HINNASTO) {
  const p = [...hinnasto.portaat].sort((a, b) => a[0] - b[0]);
  return p.map(([min, hinta], i) => ({ min, max: i + 1 < p.length ? p[i + 1][0] - 1 : null, hinta, isoHinta: pyorista(hinta + hinnasto.isoLisa) }));
}

/**
 * Ryhmätilauksen nettokate (kassan kaava, api/_lib/kate.js laskeTilauksenNettokate): myynti = paitojen lopulliset
 * hinnat, kulut = Printifyn tuotekulu (etu + selkä) ja toimitus yhteen osoitteeseen (ensimmäinen ja lisäkappaleet),
 * Stripe = 1,5 % jokaisesta veloituksesta (ennen hyvitystä) + 0,25 € jokaisesta maksusta.
 * @param rivit [{ koko, vari, hinta, maksettu }] hinta = lopullinen kappalehinta, maksettu = veloitettu (oletus hinta)
 * @param asetukset { maksuja (Stripe-maksujen määrä, oletus yksi per paita), kerroin (Printify-kulujen ALV-kerroin) }
 * Palauttaa { tunnettu, nettokate, perPaita }.
 */
export function ryhmanNettokate(rivit, { maksuja = rivit.length, kerroin = PRINTIFY_KULUKERROIN } = {}) {
  if (!Array.isArray(rivit) || rivit.length === 0) return { tunnettu: false, nettokate: null, perPaita: null };
  const osat = rivit.map((r) => ({ tuote: RYHMAPAITA_TUOTE, varianttiId: variantti(r.vari, r.koko), maara: 1, yksikkohinta: r.hinta }));
  if (osat.some((o) => o.varianttiId === null)) return { tunnettu: false, nettokate: null, perPaita: null };
  const k = laskeTilauksenNettokate(osat, 0, { kerroin, stripeProsentti: 0, stripeKiintea: 0 });
  if (!k.tunnettu) return { tunnettu: false, nettokate: null, perPaita: null };
  const stripe = rivit.reduce((s, r) => s + Number(r.maksettu ?? r.hinta) * STRIPE_PROSENTTI, 0) + maksuja * STRIPE_KIINTEA;
  const nettokate = pyorista(k.nettokate - stripe);
  return { tunnettu: true, nettokate, perPaita: pyorista(nettokate / rivit.length) };
}

// ── Tekstit ja painokuvat ──────────────────────────────────────────────────────────────────────────────────────────

const MERKKI_VIRHE = "Tuotemerkkejä, hahmoja ja tunnettujen joukkueiden nimiä ei voi painaa. Kirjoita toinen teksti.";
const siisti = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

/** Etupuolen rivit ilman logoa: ryhmän nimi, vuosiluku isona ja oma teksti pienenä. */
export function etuRivit(d) {
  return [[d.nimi, 0.18], d.vuosi ? [String(d.vuosi), 0.3] : null, d.teksti ? [d.teksti, 0.1] : null].filter(Boolean);
}
/** Etupuolen tekstirivit logon kanssa (logopaidan asettelu, api/_lib/logopaita-kuva.js): nimi sekä teksti ja vuosi. */
export const logoEtuRivit = (d) => [d.nimi, [d.teksti, d.vuosi].filter(Boolean).join(" ")].filter(Boolean);
/** Selän rivit: nimi ja numero isona sen alla. */
export function selkaRivit(j) {
  return [[j.nimi, 0.16], j.numero ? [String(j.numero), 0.42] : null].filter(Boolean);
}

/**
 * Ryhmän etupuoli: { nimi, vuosi, teksti, logo } -> { ok: true, nimi, vuosi, teksti, logo } tai { ok: false, virhe }.
 * Nimi pakollinen (enintään 24 merkkiä), vuosi valinnainen (1950-2099), teksti valinnainen (enintään 28 merkkiä),
 * logo valinnainen (ladatun logon id). Ei kirosanoja, osoitteita eikä tavaramerkkejä; teksti mahtuu painoalueelle.
 */
export function tarkistaDesign(arvot = {}) {
  const nimi = siisti(arvot.nimi);
  if (!nimi) return { ok: false, virhe: "Kirjoita ryhmän nimi." };
  if (nimi.length > RYHMA_NIMI_MAX) return { ok: false, virhe: `Ryhmän nimessä voi olla enintään ${RYHMA_NIMI_MAX} merkkiä.` };
  const n = tarkistaRivi(nimi);
  if (!n.ok) return n;
  let vuosi = null;
  const v = siisti(arvot.vuosi);
  if (v) {
    if (!/^\d{4}$/.test(v) || Number(v) < 1950 || Number(v) > 2099) return { ok: false, virhe: "Kirjoita vuosiluku neljällä numerolla (1950-2099)." };
    vuosi = v;
  }
  let teksti = null;
  if (siisti(arvot.teksti)) {
    const t = tarkistaRivi(arvot.teksti);
    if (!t.ok) return t;
    teksti = t.rivi;
  }
  // Verkko-osoitteet ja sähköpostit eivät kuulu ryhmäpaitaan (logopaita sallii yrityksen kotisivun).
  if ([nimi, teksti].some((t) => t && !sallittuTeksti(t))) return { ok: false, virhe: "Tätä tekstiä ei voi painaa. Kirjoita toinen teksti." };
  if ([nimi, teksti].some((t) => t && tavaramerkki(t))) return { ok: false, virhe: MERKKI_VIRHE };
  const logo = arvot.logo ? String(arvot.logo).toLowerCase() : null;
  if (logo && !onLogoId(logo)) return { ok: false, virhe: "Lataa logo uudelleen." };
  const d = { ok: true, nimi, vuosi, teksti, logo };
  if (logo) {
    const toinen = tarkistaRivi(logoEtuRivit(d)[1] ?? "");
    if (!toinen.ok) return { ok: false, virhe: "Logon kanssa teksti ja vuosiluku mahtuvat yhdelle riville (enintään 28 merkkiä yhteensä)." };
  } else if (!asettele(etuRivit(d)).mahtuu) {
    return { ok: false, virhe: "Teksti ei mahdu paidan etupuolelle. Lyhennä nimeä tai tekstiä." };
  }
  return d;
}

/**
 * Jäsenen rivi: { nimi, numero, koko } ryhmän värille -> { ok: true, nimi, numero, koko } tai { ok: false, virhe }.
 * Nimi tai lempinimi 1-14 merkkiä (kirjaimet, välilyönti, väliviiva, heittomerkki), numero valinnainen 0-99.
 */
export function tarkistaJasen(arvot = {}, vari = "Musta") {
  const nimi = siisti(arvot.nimi);
  if (!nimi) return { ok: false, virhe: "Kirjoita nimi tai lempinimi selkään." };
  if (nimi.length > SELKA_NIMI_MAX) return { ok: false, virhe: `Selkänimessä voi olla enintään ${SELKA_NIMI_MAX} merkkiä.` };
  if (!/^[\p{L}][\p{L}' .-]*$/u.test(nimi)) return { ok: false, virhe: "Selkänimessä voi olla kirjaimia, välilyönti, piste ja väliviiva." };
  if (!sallittuTeksti(nimi)) return { ok: false, virhe: "Tätä nimeä ei voi painaa. Kirjoita toinen nimi." };
  if (tavaramerkki(nimi)) return { ok: false, virhe: MERKKI_VIRHE };
  const nr = siisti(arvot.numero);
  if (nr && !/^\d{1,2}$/.test(nr)) return { ok: false, virhe: "Numero on 0-99." };
  const koko = String(arvot.koko ?? "");
  if (!kootVarille(vari).includes(koko)) return { ok: false, virhe: `Valitse koko (${kootVarille(vari).join(", ")}).` };
  const j = { ok: true, nimi, numero: nr || null, koko };
  if (!asettele(selkaRivit(j)).mahtuu) return { ok: false, virhe: "Nimi ei mahdu selkään. Lyhennä nimeä." };
  return j;
}

export const tarkistaVari = (vari) => RYHMA_VARIT.includes(vari);

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Tekstirivit SVG:ksi painoalueelle (asettelu api/_lib/personoitu.js asettele, Anton, versaalit). */
function tekstiSvg(rivit, vari, { fontti = "Anton", leveys = PAINOALUE.leveys, korkeus = PAINOALUE.korkeus } = {}) {
  const a = asettele(rivit, "t-paita", { leveys, korkeus });
  const v = tekstinVari(vari);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${leveys}" height="${korkeus}" viewBox="0 0 ${leveys} ${korkeus}">` +
    a.tekstit.map((t, i) => `<text x="${leveys / 2}" y="${a.linjat[i]}" font-family="${fontti}" font-size="${a.koot[i]}" fill="${v}" text-anchor="middle">${xml(t)}</text>`).join("") +
    `</svg>`;
}

/** Etupuolen painokuva ilman logoa (selaimen esikatselu ja palvelimen PNG, api/painokuva.js). */
export const etuSvg = (d, vari, asetukset) => tekstiSvg(etuRivit(d), vari, asetukset);
/** Selän painokuva. */
export const selkaSvg = (j, vari, asetukset) => tekstiSvg(selkaRivit(j), vari, asetukset);

// ── Tilakone ───────────────────────────────────────────────────────────────────────────────────────────────────────
//
// Ryhmä:  avoin -> lukittu (suunnitelma tallessa; odottaa vetäjän maksua) -> lahetetty (tilaus Printifyyn)
//         avoin | lukittu -> peruttu (itse maksaneille palautus)
//         lukittu -> avoin (vetäjä avaa uudelleen ennen maksua)
// Jäsen:  tayttanyt -> maksettu (itse tai vetäjä) ; tayttanyt | maksettu -> poistettu (vetäjä, maksu palautetaan)
//         tayttanyt -> pois (lukitus ilman maksua)

export const RYHMA_TILAT = ["avoin", "lukittu", "lahetetty", "peruttu"];
export const JASEN_TILAT = ["tayttanyt", "maksettu", "poistettu", "pois"];
export const aktiiviset = (jasenet) => jasenet.filter((j) => j.tila === "tayttanyt" || j.tila === "maksettu");
export const maksetut = (jasenet) => jasenet.filter((j) => j.tila === "maksettu");
/** Itse maksaneiden maksu, josta hyvitys tai palautus lasketaan (vetäjän maksamia ei palauteta jäsenelle). */
export const omaMaksu = (j) => (j.tila === "maksettu" && j.maksaja === "jasen" ? pyorista(Number(j.maksettu || 0) - Number(j.hyvitetty || 0)) : 0);

/** Voiko jaetusta linkistä lisätä uuden rivin kokotaulukkoon: null tai virheviesti. */
export function liittymisenEste(ryhma, jasenet) {
  if (ryhma.tila === "peruttu") return "Ryhmätilaus on peruttu.";
  if (ryhma.tila !== "avoin") return "Ryhmätilaus on jo lukittu, joten uusia paitoja ei voi lisätä.";
  if (aktiiviset(jasenet).length >= ryhma.paikat) return "Kokotaulukko on täynnä. Pyydä ryhmän vetäjää lisäämään paikkoja.";
  return null;
}

/** Voiko jäsen maksaa oman paitansa: null tai virheviesti. */
export function maksunEste(ryhma, jasen) {
  if (ryhma.maksutapa !== "jasenet") return "Tässä ryhmässä vetäjä maksaa kaikki paidat kerralla.";
  if (ryhma.tila !== "avoin") return "Ryhmätilaus on jo lukittu.";
  if (!jasen || jasen.tila !== "tayttanyt") return jasen?.tila === "maksettu" ? "Paitasi on jo maksettu." : "Riviä ei löydy.";
  return null;
}

/** Ovatko kaikki kokotaulukon paikat maksettu (jäsenet maksavat -malli): tilaus lähtee automaattisesti. */
export function kaikkiMaksaneet(ryhma, jasenet) {
  return ryhma.maksutapa === "jasenet" && ryhma.tila === "avoin" && maksetut(jasenet).length >= ryhma.paikat
    && aktiiviset(jasenet).every((j) => j.tila === "maksettu");
}

/**
 * Lukituksen suunnitelma (puhdas): kuka on mukana, kenen paidan vetäjä maksaa, lopulliset hinnat ja hyvitykset.
 * tapa: "vetaja" (vetäjä maksaa -malli), "jata-pois" tai "maksa-loput" (jäsenet maksavat -malli; kaikki maksaneet =
 * "jata-pois" ilman maksamattomia). testi: testiryhmä (cron), vähimmäismäärä 1.
 * Palauttaa { ok: true, kpl, mukaan, pois, vetajaMaksaa, hinnat, hyvitykset, vetajanSumma, porras, kate } tai { ok: false, virhe }.
 */
export function lukitusSuunnitelma(ryhma, jasenet, tapa, { testi = false, kerroin } = {}) {
  if (ryhma.tila !== "avoin") return { ok: false, virhe: ryhma.tila === "peruttu" ? "Ryhmätilaus on peruttu." : "Ryhmätilaus on jo lukittu." };
  const akt = aktiiviset(jasenet);
  const maksamatta = akt.filter((j) => j.tila !== "maksettu");
  let mukaan, pois = [], vetajaMaksaa = [];
  if (ryhma.maksutapa === "vetaja") {
    mukaan = akt;
    vetajaMaksaa = maksamatta;
  } else if (tapa === "jata-pois") {
    mukaan = maksetut(akt);
    pois = maksamatta;
  } else if (tapa === "maksa-loput") {
    mukaan = akt;
    vetajaMaksaa = maksamatta;
  } else {
    return { ok: false, virhe: "Valitse, jäävätkö maksamattomat pois vai maksatko heidän paitansa." };
  }
  const min = testi ? 1 : RYHMA_MIN_KPL;
  if (mukaan.length < min) return { ok: false, virhe: `Ryhmätilauksessa on vähintään ${RYHMA_MIN_KPL} paitaa. Nyt mukaan tulisi ${mukaan.length}.` };
  if (mukaan.length > RYHMA_MAX_KPL) return { ok: false, virhe: `Ryhmätilauksessa on enintään ${RYHMA_MAX_KPL} paitaa.` };
  const kpl = mukaan.length;
  const hinnat = Object.fromEntries(mukaan.map((j) => [j.id, kappalehinta(kpl, j.koko)]));
  const hyvitykset = mukaan.filter((j) => omaMaksu(j) > hinnat[j.id]).map((j) => ({ id: j.id, summa: pyorista(omaMaksu(j) - hinnat[j.id]) }));
  const vetajanSumma = pyorista(vetajaMaksaa.reduce((s, j) => s + hinnat[j.id], 0));
  const itseMaksaneet = mukaan.filter((j) => j.tila === "maksettu" && j.maksaja === "jasen").length;
  const kate = ryhmanNettokate(mukaan.map((j) => ({ koko: j.koko, vari: ryhma.vari, hinta: hinnat[j.id], maksettu: omaMaksu(j) || hinnat[j.id] })),
    { maksuja: itseMaksaneet + (vetajaMaksaa.length ? 1 : 0), ...(kerroin ? { kerroin } : {}) });
  if (!kate.tunnettu) return { ok: false, virhe: "Paidan väri tai koko puuttuu. Tarkista kokotaulukko." };
  if (!testi && kate.perPaita < RYHMA_MIN_KATE_PER_PAITA) return { ok: false, virhe: "Tilausta ei voitu vahvistaa. Ota yhteyttä asiakaspalveluun.", kate };
  return { ok: true, kpl, mukaan: mukaan.map((j) => j.id), pois: pois.map((j) => j.id), vetajaMaksaa: vetajaMaksaa.map((j) => j.id),
    hinnat, hyvitykset, vetajanSumma, porras: hintaporras(kpl), kate: kate.nettokate };
}

/**
 * Printifyyn menevät tilausrivit (orders.items, api/_lib/printify.js tilausRunko): yksi rivi per paita, koska
 * jokaisen selkä on oma painokuvansa. ryhma-kenttä kantaa etupuolen ja selän painokuvan tiedot.
 */
export function tilausRivit(ryhma, jasenet, suunnitelma) {
  const byId = new Map(jasenet.map((j) => [j.id, j]));
  return suunnitelma.mukaan.map((id) => {
    const j = byId.get(id);
    const v = variantti(ryhma.vari, j.koko);
    return {
      product_id: RYHMAPAITA_TUOTE.id, slug: RYHMAPAITA_SLUG, name: `Ryhmäpaita ${ryhma.design.nimi} | T-Paita`,
      size: j.koko, color: ryhma.vari, custom_text: `Selkä: ${[j.nimi, j.numero].filter(Boolean).join(" ")}`, image: null,
      quantity: 1, unit_price: suunnitelma.hinnat[id], printify_product_id: RYHMAPAITA_PRINTIFY, variant_id: v,
      kulu_sentit: RYHMAPAITA_TUOTE.variants.costs[String(v)] ?? null, toimitus_sentit: RYHMAPAITA_TUOTE.variants.shipping_cents,
      ryhma: { id: ryhma.id, etu: { nimi: ryhma.design.nimi, vuosi: ryhma.design.vuosi ?? null, teksti: ryhma.design.teksti ?? null, logo: ryhma.design.logo ?? null },
        selka: { nimi: j.nimi, numero: j.numero ?? null } },
    };
  });
}

/** Paitojen määrät koon mukaan (vetäjän yhteenveto): { M: 3, L: 2 }. */
export function kootYhteensa(jasenet) {
  const m = {};
  for (const j of aktiiviset(jasenet)) m[j.koko] = (m[j.koko] || 0) + 1;
  return Object.fromEntries(RYHMA_KOOT.filter((k) => m[k]).map((k) => [k, m[k]]));
}
