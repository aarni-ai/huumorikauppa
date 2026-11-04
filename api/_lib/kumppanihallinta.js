/**
 * Kumppanikoodien luonti ilman Claudea (4.11.2026): sivu /hallinta/kumppanit (src/pages/PartnerAdminPage.tsx) ja
 * api/sahkoposti.js ?kumppanit= (lista) sekä POST "kumppani-luo" ja "kumppani-tila". Sama luonti on käytössä cron
 * ?tehtava=kumppani-lisaa:ssa (api/cron/tilaukset.js), joten molemmat antavat saman /k/-linkin ja raporttilinkin.
 *
 * Vain palvelimella: tuo allekirjoituksen (node:crypto). Selain käyttää api/_lib/kumppani.js:ää.
 */
import { allekirjoita } from "./markkinointi.js";
import { KUMPPANIKOODI, KUMPPANIMALLIT, RAPORTTI_TARKOITUS, kumppaniKoodinMuoto, kumppaniLinkki, varmistaKlikkitaulu, varmistaKumppanitaulu } from "./kumppani.js";

export const KOODIN_MAKSIMI_NIMESTA = 30;
export const MASSALUONNIN_MAKSIMI = 100;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const kauppa = (pohja) => String(pohja || process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "");

/** Kumppanin oma raporttilinkki (/kumppanit/raportti): allekirjoitettu avain, jota ei tallenneta mihinkään. */
export const raporttiLinkki = (koodi, pohja) =>
  `${kauppa(pohja)}/kumppanit/raportti?koodi=${koodi}&avain=${encodeURIComponent(allekirjoita(RAPORTTI_TARKOITUS, koodi))}`;

/**
 * Koodi nimestä: pienet kirjaimet, ä -> a, ö -> o, å -> a (muut tarkkeet pois), muut kuin kirjaimet ja numerot
 * väliviivaksi, enintään 30 merkkiä. Palauttaa null, jos tulos ei kelpaa koodiksi (esim. yksi kirjain).
 */
export function koodiNimesta(nimi) {
  const k = String(nimi ?? "").toLowerCase()
    .replace(/[äå]/g, "a").replace(/ö/g, "o")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, KOODIN_MAKSIMI_NIMESTA).replace(/-+$/, "");
  return KUMPPANIKOODI.test(k) ? k : null;
}

const samaNimi = (a, b) => String(a ?? "").trim().replace(/\s+/g, " ").toLowerCase() === String(b ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Vapaa koodi: perus, jos se on vapaa tai saman nimisen kumppanin; muuten perus-2, perus-3 ... varatut: Map koodi -> nimi.
 */
export function vapaaKoodi(perus, nimi, varatut) {
  for (let i = 1; i < 1000; i++) {
    const k = i === 1 ? perus : `${perus}-${i}`;
    if (!varatut.has(k) || samaNimi(varatut.get(k), nimi)) return k;
  }
  return null;
}

/** Malli tekstistä: 1 / malli 1 / provisio -> "provisio", 2 / malli 2 / alennus -> "alennus", muuten null. */
export function malliTekstista(arvo) {
  const s = String(arvo ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (/^(malli ?)?1$|^m1$|^provisio$/.test(s)) return "provisio";
  if (/^(malli ?)?2$|^m2$|^alennus$/.test(s)) return "alennus";
  return null;
}

/**
 * Massaluonnin rivit (Google Sheetistä kopioitu tai käsin kirjoitettu): yksi kumppani per rivi, erottimena sarkain,
 * puolipiste tai pilkku. Muodot: "Nimi", "Nimi; malli", "Nimi; koodi", "Nimi; koodi; malli", ja sähköposti
 * missä tahansa sarakkeessa nimen jälkeen. Otsikkorivi (ensimmäinen sarake "nimi") ja tyhjät rivit ohitetaan.
 * Palauttaa { rivit: [{ rivi, nimi, koodi, malli, email }], virheet: [{ rivi, virhe }] }.
 */
export function jasennaKumppaniRivit(teksti) {
  const rivit = [], virheet = [];
  String(teksti ?? "").split(/\r?\n/).forEach((raaka, i) => {
    const rivi = i + 1;
    if (!raaka.trim()) return;
    const erotin = raaka.includes("\t") ? "\t" : raaka.includes(";") ? ";" : ",";
    const kentat = raaka.split(erotin).map((s) => s.trim());
    while (kentat.length && !kentat[kentat.length - 1]) kentat.pop();
    const [nimi, ...muut] = kentat;
    if (!nimi) return virheet.push({ rivi, virhe: "nimi puuttuu" });
    if (nimi.toLowerCase() === "nimi") return;
    let koodi = null, malli = null, email = null;
    for (const k of muut.filter(Boolean)) {
      if (k.includes("@")) {
        if (email || !EMAIL.test(k)) return virheet.push({ rivi, virhe: `sähköposti ei kelpaa: ${k.slice(0, 60)}` });
        email = k;
      } else if (!malli && malliTekstista(k)) malli = malliTekstista(k);
      else if (!koodi) {
        koodi = kumppaniKoodinMuoto(k);
        if (!koodi) return virheet.push({ rivi, virhe: `koodi ei kelpaa: ${k.slice(0, 60)} (pienet kirjaimet, numerot ja väliviiva, 2-40 merkkiä)` });
      } else return virheet.push({ rivi, virhe: `ylimääräinen sarake: ${k.slice(0, 60)}` });
    }
    rivit.push({ rivi, nimi: nimi.slice(0, 100), koodi, malli, email });
  });
  return { rivit, virheet };
}

/** Yksi syöte (lomake tai rajapinta) tarkistettuna: { nimi, koodi, malli, email } tai { virhe }. */
export function tarkistaKumppaniSyote(s) {
  const nimi = String(s?.nimi ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
  if (!nimi) return { virhe: "nimi puuttuu" };
  const raakaKoodi = String(s?.koodi ?? "").trim();
  const koodi = raakaKoodi ? kumppaniKoodinMuoto(raakaKoodi) : null;
  if (raakaKoodi && !koodi) return { virhe: "koodi: pienet kirjaimet, numerot ja väliviiva, 2-40 merkkiä" };
  const malli = s?.malli == null || s.malli === "" ? null : KUMPPANIMALLIT.includes(s.malli) ? s.malli : malliTekstista(s.malli);
  if (s?.malli != null && s.malli !== "" && !malli) return { virhe: "malli: 1 (provisio) tai 2 (alennus)" };
  const email = String(s?.email ?? "").trim().slice(0, 200) || null;
  if (email && !EMAIL.test(email)) return { virhe: "sähköposti ei kelpaa" };
  return { nimi, koodi, malli, email };
}

/**
 * Luo tai päivittää kumppanit. Annettu koodi luodaan tai päivitetään (kuten cron kumppani-lisaa). Ilman koodia koodi
 * muodostetaan nimestä; jos se on toisen nimisen kumppanin, lisätään -2, -3 ... Saman niminen päivittyy samaan koodiin.
 * Malli ilman arvoa: uusi saa mallin 1 (provisio), olemassa oleva säilyttää mallinsa. Sähköposti säilyy, jos tyhjä.
 * esikatselu: true laskee koodit kirjoittamatta mitään.
 * Palauttaa { tulokset: [{ rivi, nimi, koodi, malli, email, uusi, linkki, raportti } | { rivi, nimi, virhe }] }.
 */
export async function luoKumppanit(db, syotteet, { esikatselu = false, pohja } = {}) {
  await varmistaKumppanitaulu(db);
  const olemassa = new Map((await db`select koodi, nimi, malli from kumppanit`).map((r) => [r.koodi, r]));
  const varatut = new Map([...olemassa].map(([k, r]) => [k, r.nimi]));
  const tulokset = [];
  for (const [i, s] of syotteet.entries()) {
    const rivi = s?.rivi ?? i + 1;
    const t = tarkistaKumppaniSyote(s);
    if (t.virhe) { tulokset.push({ rivi, nimi: String(s?.nimi ?? "").slice(0, 100), virhe: t.virhe }); continue; }
    let koodi = t.koodi;
    if (!koodi) {
      const perus = koodiNimesta(t.nimi);
      koodi = perus && vapaaKoodi(perus, t.nimi, varatut);
      if (!koodi) { tulokset.push({ rivi, nimi: t.nimi, virhe: "koodia ei voi muodostaa nimestä, anna koodi itse" }); continue; }
    }
    const vanha = olemassa.get(koodi);
    const malli = t.malli || vanha?.malli || "provisio";
    if (!esikatselu) {
      await db`insert into kumppanit (koodi, nimi, email, malli) values (${koodi}, ${t.nimi}, ${t.email}, ${t.malli || "provisio"})
        on conflict (koodi) do update set nimi = excluded.nimi, email = coalesce(excluded.email, kumppanit.email), aktiivinen = true,
          malli = coalesce(${t.malli}, kumppanit.malli)`;
    }
    varatut.set(koodi, t.nimi);
    olemassa.set(koodi, { koodi, nimi: t.nimi, malli });
    tulokset.push({ rivi, nimi: t.nimi, koodi, malli, email: t.email, uusi: !vanha, linkki: kumppaniLinkki(koodi, kauppa(pohja)), raportti: raporttiLinkki(koodi, pohja) });
  }
  return { tulokset };
}

/** Yksi kumppani annetulla koodilla (cron ?tehtava=kumppani-lisaa). */
export async function luoKumppani(db, syote, asetukset = {}) {
  const { tulokset: [t] } = await luoKumppanit(db, [syote], asetukset);
  return t;
}

/**
 * Kumppanilista hallintaan: koodi, nimi, malli, tila, luontiaika, ensimmäinen käynti, klikit, maksetut tilaukset ja
 * linkit (raporttilinkki muodostetaan lennossa). Tilauksista vain lukumäärä, ei asiakastietoja.
 */
export async function kumppaniLista(db, { pohja } = {}) {
  await varmistaKumppanitaulu(db);
  await varmistaKlikkitaulu(db);
  const rivit = await db`select k.koodi, k.nimi, k.email, k.malli, k.aktiivinen, k.created_at, k.ensimmainen_kaynti,
      coalesce(c.klikit, 0)::int as klikit, c.ensimmainen_klikki
    from kumppanit k left join (select koodi, sum(klikit)::int as klikit, min(paiva) as ensimmainen_klikki
      from kumppani_klikit group by koodi) c on c.koodi = k.koodi
    order by k.created_at desc, k.koodi`;
  let tilaukset = new Map();
  try {
    tilaukset = new Map((await db`select e.details->>'koodi' as koodi, count(distinct o.id)::int as n
      from orders o join order_events e on e.order_id = o.id and e.kind = 'kumppani'
      where o.status = 'maksettu' and o.customer_email <> 'kassatesti@huumorikauppa.fi' group by 1`).map((r) => [r.koodi, r.n]));
  } catch { /* tilaustaulua ei ole tässä ympäristössä */ }
  return rivit.map((r) => ({
    koodi: r.koodi, nimi: r.nimi, email: r.email || null, malli: KUMPPANIMALLIT.includes(r.malli) ? r.malli : "provisio",
    aktiivinen: r.aktiivinen, created_at: r.created_at, ensimmainen_kaynti: r.ensimmainen_kaynti || null,
    klikit: r.klikit, ensimmainen_klikki: r.ensimmainen_klikki || null, tilaukset: tilaukset.get(r.koodi) || 0,
    linkki: kumppaniLinkki(r.koodi, kauppa(pohja)), raportti: raporttiLinkki(r.koodi, pohja),
  }));
}

/** Aktivoi tai poistaa käytöstä (tilaushistoria säilyy). Palauttaa true, jos koodi löytyi. */
export async function asetaKumppaninTila(db, koodi, aktiivinen) {
  const k = kumppaniKoodinMuoto(koodi);
  if (!k) return false;
  await varmistaKumppanitaulu(db);
  const r = await db`update kumppanit set aktiivinen = ${!!aktiivinen} where koodi = ${k} returning koodi`;
  return r.length > 0;
}
