/**
 * Yritysmyynti (/yritykset, /yritykset/tilaus, /hallinta/tarjoukset): Y-tunnus, joulun aikataulu, tarjouslaskuri ja
 * Stripe-laskun muodostus. Ei riippuvuuksia (selain ja palvelin käyttävät samoja), paitsi PRH-haku (fetch).
 *
 * Aikataulu (KASVU-RAPORTTI.md 30.10.2026): t-paidan joulutakaraja lasketaan 16 arkipäivästä (src/data/campaignSchedule.ts
 * JOULU_TOIMITUS_ARKIPAIVAA["t-paidat"]). Yritystilaukseen lisätään 3 arkipäivää kokojen keruuseen ja maksuun, joten
 * yritysten takaraja on 19 arkipäivää ennen 23.12. Laskulla tilaus lähtee painoon vasta maksun jälkeen.
 */
import { HINNASTO, MAARAALENNUS, TOIMITUS, ILMAINEN_TOIMITUS_RAJA, TILAUKSEN_MIN_KATE_EUROA } from "./vakiot.js";

const maaraPorras = (kpl) => (MAARAALENNUS.kaytossa ? [...MAARAALENNUS.portaat].sort((a, b) => b.min - a.min).find((p) => kpl >= p.min) ?? null : null);

export const JOULU_PERILLA_ISO = "2026-12-23";
export const TPAITA_TOIMITUS_ARKIPAIVAA = 16;
export const YRITYS_LISA_ARKIPAIVAA = 3;
export const YRITYS_MIN_KPL = 10;
export const LASKU_MAKSUAIKA_PV = 14;

// ── Päivämäärät (YYYY-MM-DD, arkipäivä = ma-pe) ──────────────────────────────────────────────────────────────────
const paiva = (iso) => new Date(`${iso}T12:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);
const lisaa = (s, n) => { const d = paiva(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const arki = (s) => { const w = paiva(s).getUTCDay(); return w !== 0 && w !== 6; };
export const tanaanHelsinki = (nyt = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(nyt);

/** n arkipäivää eteenpäin (tai taaksepäin, kun n < 0). */
export function arkipaivat(alku, n) {
  let d = alku;
  const suunta = n < 0 ? -1 : 1;
  for (let j = Math.abs(n); j > 0; ) { d = lisaa(d, suunta); if (arki(d)) j--; }
  return d;
}

/** Yritysten joulutakaraja: tilaus ja maksu viimeistään tänä päivänä. */
export const YRITYS_JOULU_TAKARAJA_ISO = (() => {
  let d = JOULU_PERILLA_ISO;
  while (!arki(d)) d = lisaa(d, -1);
  return arkipaivat(d, -(TPAITA_TOIMITUS_ARKIPAIVAA + YRITYS_LISA_ARKIPAIVAA));
})();

/** Päivä muodossa "pe 27.11." */
export function paivaTeksti(s) {
  const d = paiva(s);
  return `${["su", "ma", "ti", "ke", "to", "pe", "la"][d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
}

/**
 * Arvioitu perilläolo, kun tilaus tehdään tänään: 16 arkipäivää (joulun mitoitus), laskulla lisäksi maksuaika
 * (oletus 3 arkipäivää). Palauttaa { perilla, ehtii, jouluun } toivotulle päivälle.
 */
export function aikataulu(toivottuIso, { tanaan = tanaanHelsinki(), lasku = false } = {}) {
  const perilla = arkipaivat(tanaan, TPAITA_TOIMITUS_ARKIPAIVAA + (lasku ? YRITYS_LISA_ARKIPAIVAA : 0));
  const jouluun = tanaan <= YRITYS_JOULU_TAKARAJA_ISO;
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(String(toivottuIso || ""));
  return { tanaan, perilla, jouluun, takaraja: YRITYS_JOULU_TAKARAJA_ISO, toivottu: ok ? toivottuIso : null, ehtii: ok ? toivottuIso >= perilla : null };
}

// ── Y-tunnus ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** Normalisoitu Y-tunnus (1234567-8), jos muoto ja tarkiste ovat oikein; muuten null. */
export function ytunnus(arvo) {
  const m = String(arvo ?? "").trim().replace(/^FI/i, "").match(/^(\d{6,7})-?(\d)$/);
  if (!m) return null;
  const runko = m[1].padStart(7, "0");
  const painot = [7, 9, 10, 5, 8, 4, 2];
  const j = [...runko].reduce((s, c, i) => s + Number(c) * painot[i], 0) % 11;
  if (j === 1) return null;
  const tarkiste = j === 0 ? 0 : 11 - j;
  return tarkiste === Number(m[2]) ? `${runko}-${tarkiste}` : null;
}

/**
 * Yrityksen haku PRH:n avoimesta YTJ-rajapinnasta (maksuton). { ok, nimi } kun yritys löytyy eikä sillä ole
 * lopetuspäivää; { ok: false, syy } muuten; { ok: null } jos rajapinta ei vastaa (kassa hyväksyy silloin tarkisteen).
 */
export async function haeYritys(tunnus, { fetchFn = fetch, aikaraja = 4000 } = {}) {
  try {
    const r = await fetchFn(`https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId=${encodeURIComponent(tunnus)}`, { signal: AbortSignal.timeout(aikaraja) });
    if (!r.ok) return { ok: null };
    const c = (await r.json())?.companies?.[0];
    if (!c) return { ok: false, syy: "Y-tunnusta ei löytynyt kaupparekisteristä." };
    if (c.endDate || (Array.isArray(c.companySituations) && c.companySituations.some((s) => /KONK|SANE|LOPP/i.test(s.type || "")))) {
      return { ok: false, syy: "Yritys ei ole toiminnassa." };
    }
    const nimi = (c.names || []).find((n) => !n.endDate && String(n.type) === "1")?.name || (c.names || []).find((n) => !n.endDate)?.name || null;
    return { ok: true, nimi };
  } catch {
    return { ok: null };
  }
}

// ── Tarjouslaskuri ───────────────────────────────────────────────────────────────────────────────────────────────
export const KOOT = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const ISO = /^(3|4|5)XL$/;

/**
 * Mallit laskuriin. Kulut ovat arvioita (KATTEET.md: OPT 64000 8,90 €, 3XL+ 10,68 €, toimitus 8,49 € + 1,19 €/kpl;
 * Textildruck 18500 24,77 €, 3XL+ 27,50 €, toimitus 10,89 € + 2,39 €/kpl); lopullinen kate lasketaan Printifyn kuluista.
 */
export const MALLIT = {
  meemipaita: { nimi: "Meemipaita (esim. Saatanan tunarit, Tonnin seteli)", hinta: () => HINNASTO.tpaita.suora, iso: () => HINNASTO.tpaita.suoraIso, kulu: 8.9, kuluIso: 10.68, eka: 8.49, lisa: 1.19, maara: true },
  tpaita: { nimi: "T-paita (ammatti-, harrastus-, pikkujoulu- ja muut designit)", hinta: () => HINNASTO.tpaita.uniikki, iso: () => HINNASTO.tpaita.uniikkiIso, kulu: 8.9, kuluIso: 10.68, eka: 8.49, lisa: 1.19, maara: true },
  huppari: { nimi: "Huppari", hinta: () => HINNASTO.hupparit.perus, iso: () => HINNASTO.hupparit.iso, kulu: 24.77, kuluIso: 27.5, eka: 10.89, lisa: 2.39, maara: false },
};

const r2 = (x) => Math.round(x * 100) / 100;

/**
 * { malli, koot: { S: 3, M: 5, ... } } -> { kpl, ennen, alennusProsentti, hinta, toimitus, yhteensa, kate, katePerKpl }.
 * hinta = asiakkaan maksama tuotteiden summa (ALV 25,5 % sis.), kate = arvio (vain sisäiseen käyttöön).
 */
export function laskeTarjous({ malli, koot } = {}, { kerroin = 1 } = {}) {
  const m = MALLIT[malli];
  if (!m) return null;
  let kpl = 0, ennen = 0, kulut = 0;
  for (const k of KOOT) {
    const n = Math.max(0, Math.min(999, Math.floor(Number(koot?.[k]) || 0)));
    if (!n) continue;
    kpl += n;
    ennen += n * (ISO.test(k) ? m.iso() : m.hinta());
    kulut += n * (ISO.test(k) ? m.kuluIso : m.kulu);
  }
  if (!kpl) return { kpl: 0, ennen: 0, alennusProsentti: 0, hinta: 0, toimitus: 0, yhteensa: 0, kate: 0, katePerKpl: 0 };
  const porras = m.maara ? maaraPorras(kpl) : null;
  const alennusProsentti = porras?.prosentti ?? 0;
  const hinta = r2(ennen * (1 - alennusProsentti / 100));
  const toimitus = ennen >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUS;
  const yhteensa = r2(hinta + toimitus);
  kulut += m.eka + (kpl - 1) * m.lisa;
  const kate = r2(yhteensa / 1.255 - kulut * kerroin - (yhteensa * 0.015 + 0.25));
  return { kpl, ennen: r2(ennen), alennusProsentti, hinta, toimitus, yhteensa, kate, katePerKpl: r2(kate / kpl) };
}

/** Pakettitarjousten esimerkkihinnat (10, 25 ja 50 kappaletta, koot M-XL tasan). */
export function esimerkkiHinnat(malli, maarat = [10, 25, 50]) {
  return maarat.map((n) => {
    const koot = { M: Math.ceil(n / 3), L: Math.ceil(n / 3), XL: n - 2 * Math.ceil(n / 3) };
    const t = laskeTarjous({ malli, koot });
    return { kpl: n, yhteensa: t.yhteensa, perKpl: r2(t.yhteensa / n), alennusProsentti: t.alennusProsentti };
  });
}

// ── Stripe-lasku ─────────────────────────────────────────────────────────────────────────────────────────────────
export const MYYJA = "Uusiku Oy, Y-tunnus 3653666-7, ALV-numero FI36536667";

/**
 * Stripe-laskun rivit ja asetukset kassan laskennasta (api/_lib/kassa.js laskeTilaus). Puhdas funktio (testit).
 * rivit: [{ name, size, color, quantity, unit_cents }], toimitus euroina.
 */
export function laskuData({ rivit, toimitus, tilausId, asiakas }) {
  const kuvaus = (r) => [r.name, [r.color, r.size].filter(Boolean).join(" / ")].filter(Boolean).join(", ");
  const items = rivit.map((r) => ({ description: `${kuvaus(r)}`.slice(0, 500), quantity: r.quantity, unit_amount: r.unit_cents }));
  if (toimitus > 0) items.push({ description: "Toimitus", quantity: 1, unit_amount: Math.round(toimitus * 100) });
  return {
    asiakas: {
      name: asiakas.yritys, email: asiakas.email,
      address: { line1: asiakas.osoite, postal_code: asiakas.postinumero, city: asiakas.kaupunki, country: "FI" },
      preferred_locales: ["fi"],
      metadata: { ytunnus: asiakas.ytunnus, order_id: tilausId },
      tax_id_data: [{ type: "eu_vat", value: `FI${asiakas.ytunnus.replace("-", "")}` }],
    },
    lasku: {
      collection_method: "send_invoice", days_until_due: LASKU_MAKSUAIKA_PV, currency: "eur",
      metadata: { order_id: tilausId },
      description: `Huumorikaupan yritystilaus. Tilaus lähtee painoon, kun lasku on maksettu.`,
      footer: `${MYYJA}. Hinnat sisältävät arvonlisäveron 25,5 %.`,
      custom_fields: [{ name: "Y-tunnus", value: asiakas.ytunnus }, ...(asiakas.viite ? [{ name: "Viite", value: String(asiakas.viite).slice(0, 30) }] : [])],
    },
    items,
    summa: items.reduce((s, i) => s + i.unit_amount * i.quantity, 0) / 100,
  };
}

/** Vähimmäiskate yritystilaukselle: 5 €/paita (MAARAALENNUS), muuten tavallinen 7 €. */
export const yritysMinKate = (kpl) => Math.max(TILAUKSEN_MIN_KATE_EUROA, MAARAALENNUS.minKatePerPaita * kpl);
