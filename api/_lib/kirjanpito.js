/**
 * Kuukauden myyntiraportti kirjanpitoon (Huumorikauppa, Uusiku Oy): tilaukset Neonista, maksutapa, Stripen kulut,
 * palautukset ja tilitykset Stripen rajapinnasta sekä kumppaniprovisiot. Tuottaa CSV:n (puolipiste, desimaalipilkku,
 * Excel) ja PDF:n (oma pieni PDF-kirjoitin, ei riippuvuuksia).
 *
 * Ajo: cron ?tehtava=kuukausiraportti[&alku=YYYY-MM-DD&loppu=YYYY-MM-DD][&laheta=1] ja scripts/kuukausiraportti.mjs
 * (tallentaa kansioon kirjanpito/YYYY-MM/). Vercel Cron ajaa edellisen kuun raportin kuun 2. päivä ja lähettää sen
 * omistajalle. Uusiku Oy:n myynti alkaa 27.10.2026 (UUSIKU_ALKU); sitä aiemmat myynnit kuuluvat Tmi Intellerille.
 *
 * ALV: myyntihinnat sisältävät 25,5 % ALV:n. Myydyt lahjakortit (monikäyttöinen arvoseteli) eivät ole ALV:n
 * alaisia myyntihetkellä; ALV syntyy, kun lahjakortilla ostetaan, joten lahjakortilla maksettu tilaus on ALV-pohjassa.
 */
import { provisioJaTila, tilauksenKate } from "./kumppani.js";

export const UUSIKU_ALKU = "2026-10-27";
export const ALV_KANTA = 0.255;
const r2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
const alv0 = (x) => r2(x / (1 + ALV_KANTA));
const hki = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date(d));
const unix = (iso, loppu = false) => Math.floor(Date.parse(`${iso}T${loppu ? "23:59:59" : "00:00:00"}+02:00`) / 1000);

/** Edellisen kuukauden aikaväli Suomen aikaa (Uusiku Oy:n osalta aikaisintaan UUSIKU_ALKU). */
export function edellinenKuukausi(nyt = new Date()) {
  const [v, k] = hki(nyt).split("-").map(Number);
  const ev = k === 1 ? v - 1 : v, ek = k === 1 ? 12 : k - 1;
  const kk = `${ev}-${String(ek).padStart(2, "0")}`;
  const viimeinen = new Date(Date.UTC(ev, ek, 0)).getUTCDate();
  const alku = `${kk}-01` < UUSIKU_ALKU ? UUSIKU_ALKU : `${kk}-01`;
  return { kuukausi: kk, alku, loppu: `${kk}-${String(viimeinen).padStart(2, "0")}` };
}

/** Maksutapa ja Stripen kulu maksun tapahtumasta (balance_transaction). */
async function stripeMaksu(stripe, tilaus) {
  if (!stripe || !tilaus.stripe_payment_intent) return { maksutapa: tilaus.amount_paid > 0 ? "stripe" : "lahjakortti", kulu: 0 };
  try {
    const pi = await stripe.paymentIntents.retrieve(tilaus.stripe_payment_intent, { expand: ["latest_charge.balance_transaction"] });
    const ch = pi.latest_charge;
    const tapa = ch?.payment_method_details?.type || "?";
    const lompakko = ch?.payment_method_details?.card?.wallet?.type;
    return { maksutapa: lompakko ? `${tapa} (${lompakko})` : tapa, kulu: (ch?.balance_transaction?.fee ?? 0) / 100 };
  } catch {
    return { maksutapa: "?", kulu: null };
  }
}

/**
 * Raportti aikaväliltä [alku, loppu] Suomen aikaa. db = postgres-tagi, stripe = Stripe-asiakas tai null,
 * haeTilaus = Printify-haku provision katetta varten (tai null).
 */
export async function kuukausiraportti(db, { alku, loppu, stripe = null, haeTilaus = null }) {
  const tilaukset = await db`select o.*, (select e.details->>'koodi' from order_events e where e.order_id = o.id and e.kind = 'kumppani' limit 1) as kumppani,
      (select e.details->>'invoice' from order_events e where e.order_id = o.id and e.kind = 'lasku' limit 1) as lasku
    from orders o where o.status = 'maksettu' and o.customer_email <> 'kassatesti@huumorikauppa.fi'
      and (o.paid_at at time zone 'Europe/Helsinki')::date between ${alku}::date and ${loppu}::date
    order by o.paid_at`;
  const rivit = [];
  for (const t of tilaukset) {
    const items = t.items || [];
    const lahjakortitMyyty = r2(items.filter((i) => i.type === "giftcard").reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0));
    const yhteensa = r2(t.total);
    const toimitus = r2(t.shipping);
    const alvPohja = r2(yhteensa - lahjakortitMyyty);
    const m = t.lasku ? { maksutapa: "lasku", kulu: null } : await stripeMaksu(stripe, t);
    let provisio = 0;
    if (t.kumppani) provisio = provisioJaTila(yhteensa - toimitus, (await tilauksenKate(t, haeTilaus)) ?? NaN).provisio;
    rivit.push({
      tilaus: String(t.id).slice(0, 8).toUpperCase(), maksettu: hki(t.paid_at), maksutapa: m.maksutapa,
      kpl: items.filter((i) => i.type !== "giftcard").reduce((s, i) => s + (i.quantity || 0), 0),
      tuotteet: r2(yhteensa - toimitus - lahjakortitMyyty), toimitus, lahjakortitMyyty, alennukset: r2(Number(t.discount || 0) + Number(t.bundle_discount || 0) + Number(t.basket_discount || 0)),
      yhteensa, alv0: alv0(alvPohja), alv: r2(alvPohja - alv0(alvPohja)),
      lahjakortilla: r2(t.gift_card_amount), stripella: r2(t.amount_paid ?? 0), stripeKulu: m.kulu == null ? null : r2(m.kulu),
      kumppani: t.kumppani || "", provisio: r2(provisio),
    });
  }
  const palautukset = [];
  const tilitykset = [];
  if (stripe) {
    for await (const r of stripe.refunds.list({ created: { gte: unix(alku), lte: unix(loppu, true) }, limit: 100, expand: ["data.payment_intent"] })) {
      if (r.status !== "succeeded") continue;
      palautukset.push({ pvm: hki(r.created * 1000), summa: r2(r.amount / 100), tilaus: String(r.payment_intent?.metadata?.order_id || "").slice(0, 8).toUpperCase(), syy: r.reason || "" });
    }
    for await (const p of stripe.payouts.list({ arrival_date: { gte: unix(alku), lte: unix(loppu, true) }, limit: 100 })) {
      tilitykset.push({ pvm: hki(p.arrival_date * 1000), summa: r2(p.amount / 100), tila: p.status, kuvaus: p.statement_descriptor || "" });
    }
  }
  const summa = (f) => r2(rivit.reduce((s, r) => s + (Number(r[f]) || 0), 0));
  const yhteenveto = {
    tilauksia: rivit.length, kpl: summa("kpl"), tuotteet: summa("tuotteet"), toimitukset: summa("toimitus"), lahjakortitMyyty: summa("lahjakortitMyyty"),
    alennukset: summa("alennukset"), myyntiAlvKanssa: summa("yhteensa"), myyntiAlv0: summa("alv0"), alv: summa("alv"),
    lahjakortilla: summa("lahjakortilla"), stripella: summa("stripella"), stripeKulut: summa("stripeKulu"),
    palautukset: r2(palautukset.reduce((s, p) => s + p.summa, 0)), palautuksetAlv: r2(palautukset.reduce((s, p) => s + p.summa - alv0(p.summa), 0)),
    provisiot: summa("provisio"), tilitykset: r2(tilitykset.reduce((s, p) => s + p.summa, 0)),
  };
  return { yritys: "Huumorikauppa (Uusiku Oy, Y-tunnus 3653666-7, ALV FI36536667)", alku, loppu, luotu: new Date().toISOString(), rivit, palautukset, tilitykset, yhteenveto };
}

// ── CSV ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const luku = (x) => (x == null ? "" : Number(x).toFixed(2).replace(".", ","));
const solu = (x) => { const s = String(x ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export const SARAKKEET = [
  ["tilaus", "Tilaus"], ["maksettu", "Maksettu"], ["maksutapa", "Maksutapa"], ["kpl", "Kpl"], ["tuotteet", "Tuotteet sis. ALV"],
  ["toimitus", "Toimitus sis. ALV"], ["lahjakortitMyyty", "Myydyt lahjakortit (ei ALV)"], ["alennukset", "Alennukset"], ["yhteensa", "Yhteensä sis. ALV"],
  ["alv0", "Myynti ALV 0 %"], ["alv", "ALV 25,5 %"], ["lahjakortilla", "Maksettu lahjakortilla"], ["stripella", "Maksettu Stripellä"],
  ["stripeKulu", "Stripen kulu"], ["kumppani", "Kumppani"], ["provisio", "Provisio"],
];

export function csv(r) {
  const y = r.yhteenveto;
  const rivit = [
    [`Myyntiraportti ${r.yritys}`], [`Aikaväli ${r.alku} - ${r.loppu} (Suomen aikaa)`], [],
    SARAKKEET.map(([, n]) => n),
    ...r.rivit.map((x) => SARAKKEET.map(([k]) => (typeof x[k] === "number" && k !== "kpl" ? luku(x[k]) : x[k]))),
    [], ["Yhteenveto"],
    ["Tilauksia", y.tilauksia], ["Tuotteita (kpl)", y.kpl], ["Myynti sis. ALV", luku(y.myyntiAlvKanssa)], ["Josta toimitukset sis. ALV", luku(y.toimitukset)],
    ["Josta myydyt lahjakortit (ei ALV)", luku(y.lahjakortitMyyty)], ["Myynti ALV 0 %", luku(y.myyntiAlv0)], ["ALV 25,5 %", luku(y.alv)],
    ["Alennukset (sis. hintoihin)", luku(y.alennukset)], ["Maksettu lahjakortilla", luku(y.lahjakortilla)], ["Maksettu Stripellä", luku(y.stripella)],
    ["Stripen kulut", luku(y.stripeKulut)], ["Palautukset sis. ALV", luku(y.palautukset)], ["Palautusten ALV", luku(y.palautuksetAlv)],
    ["Kumppaniprovisiot", luku(y.provisiot)], ["Stripe-tilitykset tilille", luku(y.tilitykset)],
    [], ["Palautukset"], ["Päivä", "Summa", "Tilaus", "Syy"], ...r.palautukset.map((p) => [p.pvm, luku(p.summa), p.tilaus, p.syy]),
    [], ["Stripe-tilitykset"], ["Päivä", "Summa", "Tila"], ...r.tilitykset.map((p) => [p.pvm, luku(p.summa), p.tila]),
  ];
  return "﻿" + rivit.map((rr) => rr.map(solu).join(";")).join("\r\n") + "\r\n";
}

// ── PDF (Courier, A4 vaaka, WinAnsi) ─────────────────────────────────────────────────────────────────────────────
const WIN = { "€": 0x80, "–": 0x96, "—": 0x97, "’": 0x92, "”": 0x94, "“": 0x93 };
function pdfTeksti(s) {
  let out = "";
  for (const ch of String(s)) {
    const c = WIN[ch] ?? ch.codePointAt(0);
    if (c === 0x28 || c === 0x29 || c === 0x5c) out += "\\" + ch;
    else if (c < 32 || c > 255) out += "?";
    else if (c > 126) out += "\\" + c.toString(8).padStart(3, "0");
    else out += ch;
  }
  return out;
}

/** Yksinkertainen tekstirivi-PDF (Buffer). */
export function pdfRiveista(rivit, { otsikko = "" } = {}) {
  const LEV = 842, KORK = 595, KOKO = 7.5, VALI = 10, YLA = 560, ALA = 30;
  const perSivu = Math.floor((YLA - ALA) / VALI);
  const sivut = [];
  for (let i = 0; i < Math.max(1, rivit.length); i += perSivu) sivut.push(rivit.slice(i, i + perSivu));
  const objektit = [];
  const lisaa = (s) => { objektit.push(s); return objektit.length; };
  const fontti = lisaa("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");
  const sivuIdt = [];
  const juuriId = objektit.length + sivut.length * 2 + 1;
  sivut.forEach((rr, si) => {
    let virta = `BT /F1 ${KOKO} Tf ${VALI} TL 30 ${YLA} Td\n`;
    for (const r of rr) virta += `(${pdfTeksti(r)}) Tj T*\n`;
    virta += `ET\nBT /F1 7 Tf 30 15 Td (${pdfTeksti(`${otsikko}  sivu ${si + 1}/${sivut.length}`)}) Tj ET`;
    const sis = lisaa(`<< /Length ${Buffer.byteLength(virta, "latin1")} >>\nstream\n${virta}\nendstream`);
    sivuIdt.push(lisaa(`<< /Type /Page /Parent ${juuriId} 0 R /MediaBox [0 0 ${LEV} ${KORK}] /Resources << /Font << /F1 ${fontti} 0 R >> >> /Contents ${sis} 0 R >>`));
  });
  const sivutId = lisaa(`<< /Type /Pages /Kids [${sivuIdt.map((i) => `${i} 0 R`).join(" ")}] /Count ${sivuIdt.length} >>`);
  if (sivutId !== juuriId) throw new Error("pdf: objektinumerot");
  const catalog = lisaa(`<< /Type /Catalog /Pages ${sivutId} 0 R >>`);
  let pdf = "%PDF-1.4\n";
  const offsetit = [];
  objektit.forEach((o, i) => { offsetit.push(Buffer.byteLength(pdf, "latin1")); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objektit.length + 1}\n0000000000 65535 f \n${offsetit.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objektit.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

export function pdf(r) {
  const y = r.yhteenveto;
  const e = (x) => (x == null ? "-" : `${Number(x).toFixed(2).replace(".", ",")} €`);
  const s = (x, n, oikea = false) => { const t = String(x ?? ""); return oikea ? t.slice(0, n).padStart(n) : t.slice(0, n).padEnd(n); };
  const rr = [
    `MYYNTIRAPORTTI  ${r.yritys}`, `Aikaväli ${r.alku} - ${r.loppu} (Suomen aikaa). Luotu ${r.luotu.slice(0, 16).replace("T", " ")} UTC.`, "",
    "YHTEENVETO",
    `  Tilauksia ${y.tilauksia}, tuotteita ${y.kpl} kpl`,
    `  Myynti sis. ALV ${s(e(y.myyntiAlvKanssa), 14, true)}   josta toimitukset ${e(y.toimitukset)}, myydyt lahjakortit (ei ALV) ${e(y.lahjakortitMyyty)}`,
    `  Myynti ALV 0 %  ${s(e(y.myyntiAlv0), 14, true)}`,
    `  ALV 25,5 %      ${s(e(y.alv), 14, true)}`,
    `  Alennukset ${e(y.alennukset)} (sisältyvät hintoihin). Maksettu Stripellä ${e(y.stripella)}, lahjakortilla ${e(y.lahjakortilla)}.`,
    `  Stripen kulut ${e(y.stripeKulut)}. Palautukset ${e(y.palautukset)} (ALV ${e(y.palautuksetAlv)}). Kumppaniprovisiot ${e(y.provisiot)}.`,
    `  Stripe-tilitykset tilille ${e(y.tilitykset)}.`, "",
    "TILAUKSET",
    `  ${s("Tilaus", 9)}${s("Maksettu", 11)}${s("Maksutapa", 20)}${s("Kpl", 4, true)}${s("Tuotteet", 11, true)}${s("Toimitus", 10, true)}${s("Yht. ALV", 11, true)}${s("ALV 0 %", 11, true)}${s("ALV", 9, true)}${s("Stripe", 9, true)}${s("Lahjak.", 9, true)}${s("Kulu", 7, true)}  ${s("Kumppani", 10)}${s("Prov.", 7, true)}`,
    ...r.rivit.map((x) => `  ${s(x.tilaus, 9)}${s(x.maksettu, 11)}${s(x.maksutapa, 20)}${s(x.kpl, 4, true)}${s(luku(x.tuotteet), 11, true)}${s(luku(x.toimitus), 10, true)}${s(luku(x.yhteensa), 11, true)}${s(luku(x.alv0), 11, true)}${s(luku(x.alv), 9, true)}${s(luku(x.stripella), 9, true)}${s(luku(x.lahjakortilla), 9, true)}${s(luku(x.stripeKulu), 7, true)}  ${s(x.kumppani, 10)}${s(luku(x.provisio), 7, true)}`),
    ...(r.rivit.length ? [] : ["  Ei maksettuja tilauksia aikavälillä."]), "",
    "PALAUTUKSET", ...(r.palautukset.length ? r.palautukset.map((p) => `  ${p.pvm}  ${s(e(p.summa), 12, true)}  tilaus ${p.tilaus}  ${p.syy}`) : ["  Ei palautuksia."]), "",
    "STRIPE-TILITYKSET", ...(r.tilitykset.length ? r.tilitykset.map((p) => `  ${p.pvm}  ${s(e(p.summa), 12, true)}  ${p.tila}`) : ["  Ei tilityksiä aikavälillä."]), "",
    "Hinnat sisältävät ALV:n 25,5 %. Myydyt lahjakortit ovat monikäyttöisiä arvoseteleitä (ALV lahjakortilla ostettaessa).",
    "Printifyn ostolaskut (ALV vähennettävissä) ja Stripen kululaskut tulevat erikseen. Lähde: Neon (orders) ja Stripe API.",
  ];
  return pdfRiveista(rr, { otsikko: `Huumorikauppa ${r.alku} - ${r.loppu}` });
}
