/**
 * Tilauskohtaisten katteiden puhdas laskenta (scripts/tilauskatteet.mjs, testit src/test/tilausvahti.test.ts).
 * Ei verkkoa. Kaava kuten api/_lib/kate.js, mutta Printifyn todellisilla tilauskuluilla:
 *   maksettu      = kaupan hinnat x kpl + toimitusmaksu (6,90 €, jos tuotteet alle 79 €)
 *   myynti alv 0  = maksettu / 1,255
 *   nettokate     = myynti alv 0 - Printify ilman alv:tä (total_price + total_shipping) - Stripe (1,5 % + 0,25 €)
 *   Printifyn alv (total_tax) vähennetään ALV-ilmoituksessa (1.11.2026 alkaen Uusiku Oy, FI36536667), joten se ei ole kulu.
 */
import { ALV, STRIPE_PROSENTTI, STRIPE_KIINTEA } from "../../api/_lib/kate.js";

export const OSIO = "Tilauskohtaiset katteet (Printify, 1.6.2026 alkaen)";
export const KASIN_ALKU = "<!-- käsin: alku (skripti säilyttää) -->";
export const KASIN_LOPPU = "<!-- käsin: loppu -->";
const r2 = (x) => Math.round(x * 100) / 100;
export const eur = (x) => `${r2(x).toFixed(2).replace(".", ",")} €`;
export const pros = (x) => `${(Math.round(x * 1000) / 10).toFixed(1).replace(".", ",")} %`;

/** Asiakas tunnistamattomana: etunimi + sukunimen alkukirjain ("Liisa K."). Ei osoitteita, sähköposteja eikä puhelimia. */
export function asiakas(osoite) {
  const etu = String(osoite?.first_name || "").trim().split(/\s+/)[0];
  const suku = String(osoite?.last_name || "").trim();
  if (!etu || /PII_DELETED/i.test(etu)) return "(poistettu)";
  const k = suku && !/PII_DELETED/i.test(suku) ? ` ${suku[0].toUpperCase()}.` : "";
  return `${etu[0].toUpperCase()}${etu.slice(1)}${k}`;
}

/** Tuotenimen vertailumuoto (Printifyn otsikko vs kaupan nimi). */
export function nimiAvain(s) {
  return String(s ?? "").toLowerCase().replace(/[｜|]/g, "|").replace(/[–—-]/g, "-").replace(/\s*\|\s*/g, " | ").replace(/\s+/g, " ").trim();
}

/** EU-siirtojen (data/eu-siirto-*.json) tuotetunnukset molempiin suuntiin: id -> [toiset id:t]. */
export function siirtoKartta(lokit) {
  const k = new Map();
  const lisaa = (a, b) => { if (!k.has(a)) k.set(a, []); k.get(a).push(b); };
  for (const loki of lokit || []) for (const s of loki?.siirrot || []) {
    if (!s.vanhaId || !s.uusiId) continue;
    lisaa(s.vanhaId, s.uusiId);
    lisaa(s.uusiId, s.vanhaId);
  }
  return k;
}

/**
 * Kaupan hinta tilausriville. tuotteet = kaupan rivit (slug, name, price, printify_product_id).
 * Järjestys: printify_product_id, EU-siirron toinen pää (myös ketjut), nimi, varalla Printifyn metadata.price (liputettu).
 * Palauttaa { hinta, lahde: "tuote" | "eu-siirto" | "nimi" | "printify" | null, slug }.
 */
export function teeHinnasto(tuotteet, siirrot = new Map()) {
  const idlla = new Map();
  const nimella = new Map();
  for (const p of tuotteet || []) {
    if (p.printify_product_id && !idlla.has(p.printify_product_id)) idlla.set(p.printify_product_id, p);
    const n = nimiAvain(p.name);
    if (n && !nimella.has(n)) nimella.set(n, p);
  }
  return function hinta(rivi) {
    const id = rivi.product_id;
    const osuma = (p, lahde) => ({ hinta: Number(p.price), lahde, slug: p.slug });
    if (idlla.has(id)) return osuma(idlla.get(id), "tuote");
    const nahty = new Set([id]);
    const jono = [...(siirrot.get(id) || [])];
    while (jono.length) {
      const x = jono.shift();
      if (nahty.has(x)) continue;
      nahty.add(x);
      if (idlla.has(x)) return osuma(idlla.get(x), "eu-siirto");
      jono.push(...(siirrot.get(x) || []));
    }
    const n = nimiAvain(rivi.metadata?.title);
    if (n && nimella.has(n)) return osuma(nimella.get(n), "nimi");
    const p = rivi.metadata?.price;
    if (typeof p === "number") return { hinta: p / 100, lahde: "printify", slug: null };
    return { hinta: null, lahde: null, slug: null };
  };
}

/**
 * Yhden tilauksen luvut. rivit = [{ hinta, quantity }]; kulut = printifyKulut(o) euroina; kurssi = euroa per Printifyn
 * tilin valuuttayksikkö (oletus 1 = summat euroina). Palauttaa myynnin, kulut ja katteet.
 */
export function laskeTilaus(rivit, kulut, { toimitusmaksu = 6.9, ilmainenRaja = 79, kurssi = 1 } = {}) {
  const tuotteet = r2(rivit.reduce((s, r) => s + (Number(r.hinta) || 0) * (r.quantity || 1), 0));
  const toimitus = tuotteet < ilmainenRaja ? toimitusmaksu : 0;
  const maksettu = r2(tuotteet + toimitus);
  const myyntiAlv0 = maksettu / (1 + ALV);
  const stripe = maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA;
  const kulu = kulut.kulu * kurssi;
  const kuluIlmanAlv = kulut.kuluIlmanAlv * kurssi;
  const alv = ((kulut.kuluSisAlv ?? kulut.kulu) - kulut.kuluIlmanAlv) * kurssi;
  const kate = myyntiAlv0 - kulu - stripe;
  const kateIlmanAlv = myyntiAlv0 - kuluIlmanAlv - stripe;
  return {
    tuotteet, toimitus, maksettu, myyntiAlv0: r2(myyntiAlv0), stripe: r2(stripe), kulu: r2(kulu), kuluIlmanAlv: r2(kuluIlmanAlv), alv: r2(alv),
    kate: r2(kate), kateProsentti: myyntiAlv0 > 0 ? kate / myyntiAlv0 : null,
    kateIlmanAlv: r2(kateIlmanAlv), kateIlmanAlvProsentti: myyntiAlv0 > 0 ? kateIlmanAlv / myyntiAlv0 : null,
  };
}

/** Yhteissummat tilauslistasta (tilaus.luvut = laskeTilaus). */
export function yhteensa(tilaukset) {
  const s = tilaukset.reduce((a, t) => ({
    maksettu: a.maksettu + t.luvut.maksettu, myyntiAlv0: a.myyntiAlv0 + t.luvut.myyntiAlv0, stripe: a.stripe + t.luvut.stripe,
    kulu: a.kulu + t.luvut.kulu, kuluIlmanAlv: a.kuluIlmanAlv + t.luvut.kuluIlmanAlv, alv: a.alv + (t.luvut.alv || 0), kate: a.kate + t.luvut.kate, kateIlmanAlv: a.kateIlmanAlv + t.luvut.kateIlmanAlv,
  }), { maksettu: 0, myyntiAlv0: 0, stripe: 0, kulu: 0, kuluIlmanAlv: 0, alv: 0, kate: 0, kateIlmanAlv: 0 });
  const out = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, r2(v)]));
  return { tilauksia: tilaukset.length, ...out, kateProsentti: s.myyntiAlv0 > 0 ? s.kate / s.myyntiAlv0 : null, kateIlmanAlvProsentti: s.myyntiAlv0 > 0 ? s.kateIlmanAlv / s.myyntiAlv0 : null };
}

const solu = (s) => String(s ?? "").replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");

/** Markdown-taulukko ja yhteenveto. tilaukset: [{ pvm, tyyppi, asiakas, rivit: [{ title, variant, quantity, hinta, lahde, painotalo }], luvut }] */
export function markdown(tilaukset, { paiva, alkaen, kurssi = 1, huomiot = [] } = {}) {
  const y = yhteensa(tilaukset);
  const otsikko = [
    `Päivitetty ${paiva} skriptillä \`scripts/tilauskatteet.mjs\` (Printify-kaupan kaikki tilaukset ${alkaen} alkaen, perutut pois).`,
    "Myynti = kaupan nykyinen hinta (Supabase, printify_product_id; EU-kopiolle siirtokirjauksen kautta; varalla nimellä) x kpl +",
    "toimitusmaksu 6,90 €, jos tuotteet alle 79 €. Myynti alv 0 = / 1,255. Nettokate = myynti alv 0 - Printifyn kulu ilman",
    "alv:tä (total_price + total_shipping) - Stripe 1,5 % + 0,25 €. Printifyn veloittama alv (total_tax, 25,5 %) vähennetään",
    "ALV-ilmoituksessa (kaupan pitäjä on ALV-rekisterissä, 1.11.2026 alkaen Uusiku Oy, FI36536667), joten se ei ole kulu; sarake vain tiedoksi.",
    kurssi === 1
      ? "Oletus: Printifyn summat ovat tilin valuutassa ja ne luetaan euroina (kuten muualla tässä tiedostossa). Jos tili on dollareissa, kulut ovat noin 13 % euromääriä suurempia (ajo `--kurssi 0.87`)."
      : `Printifyn summat muunnettu kertoimella ${kurssi} (tilin valuutta -> euro).`,
    "Asiakkaasta vain etunimi ja sukunimen alkukirjain. Hinta (P) = kaupasta ei löytynyt tuotetta, käytetty Printifyn",
    "vähittäishintaa (metadata.price). Tyyppi manual = luotu Printifyn hallinnassa (voi olla korvaus tai uudelleenlähetys,",
    "jolloin todellista myyntiä ei ole).",
  ];
  const taulu = [
    "| Pvm | Asiakas | Tuotteet | Painotalo | Hinta sis. toimitus | Myynti alv 0 | Printify ilman alv | Printifyn alv (vähennetään) | Nettokate | Kate % |",
    "|---|---|---|---|--:|--:|--:|--:|--:|--:|",
    ...tilaukset.map((t) => {
      const tuotteet = t.rivit.map((r) => `${r.quantity} x ${solu(r.title)}${r.variant ? ` (${solu(r.variant)})` : ""}, ${eur(r.hinta ?? 0)}${r.lahde === "printify" ? " (P)" : ""}`).join("; ");
      const talot = [...new Set(t.rivit.map((r) => `${solu(r.painotalo.nimi)} ${r.painotalo.maa || "?"}${r.painotalo.eu ? "" : " **EI EU**"}`))].join("; ");
      return `| ${t.pvm}${t.tyyppi && t.tyyppi !== "api" ? ` (${t.tyyppi})` : ""} | ${solu(t.asiakas)} | ${tuotteet} | ${talot} | ${eur(t.luvut.maksettu)} | ${eur(t.luvut.myyntiAlv0)} | ${eur(t.luvut.kuluIlmanAlv)} | ${eur(t.luvut.alv ?? 0)} | ${eur(t.luvut.kate)} | ${t.luvut.kateProsentti == null ? "-" : pros(t.luvut.kateProsentti)} |`;
    }),
    `| **Yhteensä** | ${y.tilauksia} tilausta | | | ${eur(y.maksettu)} | ${eur(y.myyntiAlv0)} | ${eur(y.kuluIlmanAlv)} | ${eur(y.alv ?? 0)} | ${eur(y.kate)} | ${y.kateProsentti == null ? "-" : pros(y.kateProsentti)} |`,
  ];
  const summat = [
    `- Tilauksia ${y.tilauksia}, myynti sis. alv ${eur(y.maksettu)}, ilman alv:tä ${eur(y.myyntiAlv0)}, Stripe ${eur(y.stripe)}.`,
    `- Printifyn kulut ilman alv:tä ${eur(y.kuluIlmanAlv)}: nettokate ${eur(y.kate)} (${y.kateProsentti == null ? "-" : pros(y.kateProsentti)}), keskimäärin ${eur(y.tilauksia ? y.kate / y.tilauksia : 0)} tilausta kohden.`,
    `- Printifyn veloittama alv ${eur(y.alv ?? 0)} vähennetään ALV-ilmoituksessa (ei kulu).`,
  ];
  return [...otsikko, "", ...taulu, "", ...summat, ...(huomiot.length ? ["", "Huomiot:", "", ...huomiot.map((h) => `- ${h}`)] : [])].join("\n");
}

/**
 * Korvaa osion "## otsikko" (seuraavaan ##-otsikkoon asti) tai lisää sen ennen ensimmäistä ##-otsikkoa. Osion käsin
 * kirjoitettu lohko (KASIN_ALKU ... KASIN_LOPPU) säilyy uudelleenajossa.
 */
export function korvaaOsio(md, otsikko, sisalto) {
  const rivit = md.split("\n");
  const alku = rivit.findIndex((r) => r.trim() === `## ${otsikko}`);
  let kasin = "";
  if (alku >= 0) {
    let loppu = rivit.findIndex((r, i) => i > alku && /^## /.test(r));
    if (loppu < 0) loppu = rivit.length;
    const vanha = rivit.slice(alku, loppu).join("\n");
    const a = vanha.indexOf(KASIN_ALKU), b = vanha.indexOf(KASIN_LOPPU);
    if (a >= 0 && b > a) kasin = vanha.slice(a, b + KASIN_LOPPU.length);
    const uusi = [`## ${otsikko}`, "", sisalto, ...(kasin ? ["", kasin] : []), ""];
    return [...rivit.slice(0, alku), ...uusi, ...rivit.slice(loppu)].join("\n");
  }
  const ensimmainen = rivit.findIndex((r) => /^## /.test(r));
  const uusi = [`## ${otsikko}`, "", sisalto, ""];
  if (ensimmainen < 0) return [...rivit, "", ...uusi].join("\n");
  return [...rivit.slice(0, ensimmainen), ...uusi, ...rivit.slice(ensimmainen)].join("\n");
}
