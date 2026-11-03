/**
 * Laskeutumisten seuranta (3.11.2026): kuka poistuu alle 10 sekunnissa ja mistä hän tuli. Selain (src/lib/laskeutuminen.ts)
 * lähettää yhden koosteen ulkopuolelta tulleesta käynnistä, kun sivu suljetaan tai piilotetaan tai kun kävijä siirtyy
 * sivuston sisällä toiselle sivulle. Tallennetaan vain koostemäärä päivä x polku x lähde x laite x selain x aika x jatkoi
 * x LCP x A/B-versio: ei evästeitä, ei IP-osoitetta eikä tunnisteita (kuten api/_lib/kaynnit.js).
 *
 * Lähde, laite ja selain päätellään palvelimella User-Agentista ja viittaajasta; somen sovellusselaimet (Instagram,
 * TikTok, Facebook) omina selaimina. Polku: tuotesivut ja blogit omina polkuinaan, muut ensimmäisen tason osiona.
 */
import { kaynninLahde, someSovellus } from "./kaynnit.js";

export const AIKAKORIT = ["0-3", "3-10", "10-30", "30-60", "60+"];
export const LCP_KORIT = ["0-2.5", "2.5-4", "4+", "?"];
/** A/B-testit (src/lib/abTestit.ts): koko = tuotesivun koon esivalinta, blogi = ideat ensin. */
export const AB_ARVOT = ["", "koko-a", "koko-b", "blogi-a", "blogi-b"];

export function laite(ua) {
  const u = String(ua || "");
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(u)) return "tabletti";
  if (/iPhone|iPod|Android.*Mobile|Mobile/i.test(u)) return "mobiili";
  return "kone";
}

export function selain(ua) {
  const u = String(ua || "");
  const sovellus = someSovellus(u);
  if (sovellus) return `${sovellus}-sovellus`;
  if (/SamsungBrowser/i.test(u)) return "samsung";
  if (/Edg\//.test(u)) return "edge";
  if (/Firefox|FxiOS/i.test(u)) return "firefox";
  if (/CriOS|Chrome\//.test(u)) return "chrome";
  if (/Safari\//.test(u)) return "safari";
  return "muu";
}

/** Polku koostettavaksi: /tuote/x ja /blogi/x sellaisenaan, /paidat/x ja /abipaidat/x sellaisenaan, muut osiona. */
export function koostePolku(polku) {
  const p = String(polku || "/").split(/[?#]/)[0].toLowerCase();
  const osat = p.split("/").filter(Boolean).map((x) => x.replace(/[^a-z0-9-]/g, "").slice(0, 80));
  if (!osat.length) return "/";
  if (["tuote", "blogi", "lahjat", "paidat", "abipaidat"].includes(osat[0]) && osat[1]) return `/${osat[0]}/${osat[1]}`;
  return `/${osat[0]}`;
}

const kori = (arvo, korit) => (korit.includes(String(arvo)) ? String(arvo) : null);

/** Selaimen kooste ja pyynnön otsakkeet -> tallennettava rivi tai null. */
export function laskeutumisRivi(body, ua) {
  const aika = kori(body?.aika, AIKAKORIT);
  if (!aika) return null;
  const teksti = (x, max) => (typeof x === "string" ? x.trim().slice(0, max) : "");
  return {
    polku: koostePolku(teksti(body.polku, 200)),
    lahde: kaynninLahde({ utm: teksti(body.utm, 40), ref: teksti(body.ref, 40), gclid: !!body.gclid, viittaaja: teksti(body.viittaaja, 120), ua }),
    laite: laite(ua),
    selain: selain(ua),
    aika,
    jatkoi: body.jatkoi === true,
    lcp: kori(body.lcp, LCP_KORIT) || "?",
    ab: AB_ARVOT.includes(body.ab) ? body.ab : "",
  };
}

export async function varmistaLaskeutumiset(db) {
  await db`create table if not exists laskeutumiset (paiva date not null, polku text not null, lahde text not null,
    laite text not null, selain text not null, aika text not null, jatkoi boolean not null, lcp text not null,
    ab text not null default '', n integer not null default 0,
    primary key (paiva, polku, lahde, laite, selain, aika, jatkoi, lcp, ab))`;
}

export async function kirjaaLaskeutuminen(db, rivi) {
  await varmistaLaskeutumiset(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into laskeutumiset (paiva, polku, lahde, laite, selain, aika, jatkoi, lcp, ab, n)
    values (${paiva}::date, ${rivi.polku}, ${rivi.lahde}, ${rivi.laite}, ${rivi.selain}, ${rivi.aika}, ${rivi.jatkoi}, ${rivi.lcp}, ${rivi.ab}, 1)
    on conflict (paiva, polku, lahde, laite, selain, aika, jatkoi, lcp, ab) do update set n = laskeutumiset.n + 1`;
}

const pros = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
/** Poistui alle 10 s: ei siirtynyt sivuston sisällä ja lähti 10 sekunnin sisällä. */
export const alle10 = (r) => !r.jatkoi && (r.aika === "0-3" || r.aika === "3-10");

/** Rivit -> { yhteensa, alle10, alle3, jatkoi, lcpHidas, ryhmat: { lahde: [...], laite, selain, polku, ab } }. */
export function koostaLaskeutumiset(rivit) {
  const summa = (rs, f) => rs.reduce((s, r) => s + (f(r) ? Number(r.n) || 0 : 0), 0);
  const kaikki = (rs) => summa(rs, () => true);
  const tunnusluvut = (rs) => {
    const n = kaikki(rs);
    return { n, alle10: pros(summa(rs, alle10), n), alle3: pros(summa(rs, (r) => !r.jatkoi && r.aika === "0-3"), n), jatkoi: pros(summa(rs, (r) => r.jatkoi), n), lcpHidas: pros(summa(rs, (r) => r.lcp === "4+"), n) };
  };
  const ryhmittele = (avain) => {
    const m = new Map();
    for (const r of rivit) m.set(r[avain], [...(m.get(r[avain]) || []), r]);
    return [...m.entries()].map(([nimi, rs]) => ({ nimi, ...tunnusluvut(rs) })).sort((a, b) => b.n - a.n);
  };
  return { ...tunnusluvut(rivit), ryhmat: Object.fromEntries(["lahde", "laite", "selain", "polku", "ab"].map((k) => [k, ryhmittele(k)])) };
}

export async function laskeutumisetValilla(db, alku, loppu) {
  await varmistaLaskeutumiset(db);
  const rivit = await db`select polku, lahde, laite, selain, aika, jatkoi, lcp, ab, sum(n)::int as n from laskeutumiset
    where paiva between ${alku}::date and ${loppu}::date group by 1, 2, 3, 4, 5, 6, 7, 8`;
  return { alku, loppu, ...koostaLaskeutumiset(rivit) };
}

/** Raporttirivit: kokonaisuus ja suurimmat ryhmät. */
export function laskeutumisRivit(s, maara = 6) {
  if (!s?.n) return [`Laskeutumiset ${s?.alku ?? ""}–${s?.loppu ?? ""}: ei vielä koosteita.`];
  const ryhma = (k, otsikko) => `${otsikko}: ${s.ryhmat[k].slice(0, maara).map((g) => `${g.nimi} ${g.n} (alle 10 s ${g.alle10} %)`).join(", ")}.`;
  return [
    `Laskeutumiset ${s.alku}–${s.loppu}: ${s.n} käyntiä, poistui alle 10 s ${s.alle10} % (alle 3 s ${s.alle3} %), jatkoi toiselle sivulle ${s.jatkoi} %, LCP yli 4 s ${s.lcpHidas} %.`,
    ryhma("lahde", "Lähde"), ryhma("laite", "Laite"), ryhma("selain", "Selain"), ryhma("polku", "Laskeutumissivu"),
    ...(s.ryhmat.ab.some((g) => g.nimi) ? [ryhma("ab", "A/B")] : []),
  ];
}
