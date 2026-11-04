/**
 * Tuotesivun kevyt tapahtumaseuranta (2.11.2026): missä kohtaa kävijät poistuvat tuotesivulta. Selain
 * (src/lib/tuoteseuranta.ts) lähettää yhden koosteen tuotesivun katselua kohden, kun sivu suljetaan tai vaihdetaan.
 * Tallennetaan vain koostemäärä päivä x tapahtuma (kuten suppilo, api/_lib/suppilo.js): ei evästeitä, ei tunnisteita.
 *
 * Tapahtumat: naytto (katselu), koko (koon valinta), vari (värin vaihto), kokotaulukko (kokoapu tai kokotaulukko
 * avattu), lisaa_nakyvissa (Lisää koriin -painike vähintään puoliksi näkyvissä), kori (lisätty koriin),
 * vieritys:25|50|75|100 (syvin kohta), aika:0-10|10-30|30-60|60-180|180+ (sekuntia sivulla).
 */
export const TAPAHTUMAT = ["naytto", "koko", "vari", "kokotaulukko", "lisaa_nakyvissa", "kori", "koko_esivalittu"];
/** Koon esivalinnan A/B-testi (3.11.2026, src/lib/abTestit.ts): sama kooste myös versiokohtaisena "koko-b|koko". */
export const TUOTE_AB = ["koko-a", "koko-b"];
export const VIERITYS = ["25", "50", "75", "100"];
export const AIKA = ["0-10", "10-30", "30-60", "60-180", "180+"];

/** Selaimen kooste -> sallitut avaimet (tuntemattomat pois, jokainen kerran). */
export function puhdista(body) {
  const t = new Set((Array.isArray(body?.tapahtumat) ? body.tapahtumat : []).filter((x) => TAPAHTUMAT.includes(x)));
  t.add("naytto");
  const avaimet = [...t];
  if (VIERITYS.includes(String(body?.vieritys))) avaimet.push(`vieritys:${body.vieritys}`);
  if (AIKA.includes(String(body?.aika))) avaimet.push(`aika:${body.aika}`);
  return avaimet;
}

export async function varmistaTuoteseuranta(db) {
  await db`create table if not exists tuotesivu_seuranta (paiva date not null, tapahtuma text not null, n integer not null default 0,
    primary key (paiva, tapahtuma))`;
}

/** Tuotteen slug selaimen koosteesta (vain muoto tarkistetaan; tuntematon slug ei haittaa, se ei vain nouse listalle). */
export const katselunSlug = (x) => (typeof x === "string" && /^[a-z0-9][a-z0-9-]{1,150}$/.test(x) ? x : null);

/**
 * Tuotekohtaiset aidot katselut (4.11.2026): päivä x slug x katselut ja koriin lisäykset, ei tunnisteita. Lähde
 * joulukalenterin tuotevalinnalle (api/cron/tilaukset.js ?tehtava=suosituimmat-tuotteet). Botit ja oma liikenne on
 * ohitettu ennen tätä (api/sahkoposti.js ohitaTaiBotti).
 */
export async function varmistaTuotekatselut(db) {
  await db`create table if not exists tuotesivu_katselut (paiva date not null, slug text not null, katselut integer not null default 0,
    kori integer not null default 0, primary key (paiva, slug))`;
}

export async function kirjaaTuotetapahtumat(db, body) {
  const perus = puhdista(body);
  const avaimet = TUOTE_AB.includes(body?.ab) ? [...perus, ...perus.map((a) => `${body.ab}|${a}`)] : perus;
  await varmistaTuoteseuranta(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  for (const a of avaimet) {
    await db`insert into tuotesivu_seuranta (paiva, tapahtuma, n) values (${paiva}::date, ${a}, 1)
      on conflict (paiva, tapahtuma) do update set n = tuotesivu_seuranta.n + 1`;
  }
  const slug = katselunSlug(body?.slug);
  if (slug) {
    const kori = perus.includes("kori") ? 1 : 0;
    await varmistaTuotekatselut(db);
    await db`insert into tuotesivu_katselut (paiva, slug, katselut, kori) values (${paiva}::date, ${slug}, 1, ${kori})
      on conflict (paiva, slug) do update set katselut = tuotesivu_katselut.katselut + 1, kori = tuotesivu_katselut.kori + ${kori}`;
  }
  return perus.length;
}

const pros = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

/** Aitoja katseluja vähintään, ennen kuin suurin poistumiskohta merkitään (3.11.2026). */
export const RAPORTTI_MIN_KATSELUT = 50;

/**
 * Tuotesivun suppilo järjestyksessä: katselu -> Lisää koriin -painike näkyi -> koko valittu -> lisätty koriin.
 * Vieritys raportoidaan erikseen, koska isolla näytöllä painike näkyy ilman vieritystä. Jokaiselle vaiheelle valmis
 * korjausehdotus, kun se on suurin poistumiskohta.
 */
export const SUPPILO_VAIHEET = [
  { avain: "lisaa_nakyvissa", nimi: "näki Lisää koriin -painikkeen", ehdotus: "Ostopainike jää näkymättä: kiinteä ostopalkki mobiilissa heti sivun auetessa, lähikuva ja hinta ensimmäiseen näkymään ja koon valinta kuvan alle." },
  { avain: "koko", nimi: "valitsi koon", ehdotus: "Painike näkyy, mutta kokoa ei valita: koot isoina painikkeina, kokotaulukko suoraan näkyviin ja suosituin koko korostettuna." },
  { avain: "kori", nimi: "lisäsi koriin", ehdotus: "Koko valitaan, mutta koriin ei lisätä: ilmainen toimitus kahdesta tuotteesta, 14 päivän palautusoikeus ja toimitusaika painikkeen viereen." },
];

/**
 * Kooste rivit { tapahtuma, n } -> { nayttoja, osuudet: { koko: %, ... }, vieritys: { "25": %, ... } (vähintään
 * kyseiseen syvyyteen), aika: { "0-10": %, ... }, suppilo: [{ nimi, n, pros, putosi }], suurin (suurin poistumiskohta,
 * kun katseluja vähintään RAPORTTI_MIN_KATSELUT), poistuminen: lyhyt sanallinen arvio }.
 */
export function koostaTuoteseuranta(rivit) {
  const n = Object.fromEntries(rivit.map((r) => [r.tapahtuma, (Number(r.n) || 0)]));
  const nayttoja = n.naytto || 0;
  const osuudet = Object.fromEntries(TAPAHTUMAT.filter((t) => t !== "naytto").map((t) => [t, pros(n[t] || 0, nayttoja)]));
  // Vieritys kertyy: 100 % vierittänyt on myös ohittanut 25, 50 ja 75 %.
  const vieritys = Object.fromEntries(VIERITYS.map((v, i) => [v, pros(VIERITYS.slice(i).reduce((s, x) => s + (n[`vieritys:${x}`] || 0), 0), nayttoja)]));
  const aika = Object.fromEntries(AIKA.map((a) => [a, pros(n[`aika:${a}`] || 0, nayttoja)]));
  // Vaiheen määrä ei voi olla edellistä suurempi (koosteet kirjataan katselua kohden, joten tämä on varmistus).
  let edellinen = nayttoja;
  const suppilo = SUPPILO_VAIHEET.map((v) => {
    const raaka = n[v.avain] || 0;
    const maara = Math.min(raaka, edellinen);
    const vaihe = { ...v, n: maara, pros: pros(maara, nayttoja), putosi: edellinen - maara, putosiPros: pros(edellinen - maara, edellinen) };
    edellinen = maara;
    return vaihe;
  });
  const riittaa = nayttoja >= RAPORTTI_MIN_KATSELUT;
  const suurin = riittaa ? [...suppilo].sort((a, b) => b.putosi - a.putosi)[0] : null;
  let poistuminen = null;
  if (nayttoja) {
    poistuminen = suurin
      ? `suurin pudotus ennen vaihetta "${suurin.nimi}" (${suurin.putosi} katselua, ${suurin.putosiPros} %). Korjausehdotus: ${suurin.ehdotus}`
      : `${nayttoja} aitoa katselua, alle ${RAPORTTI_MIN_KATSELUT}: suurinta poistumiskohtaa ei vielä merkitä.`;
  }
  return { nayttoja, osuudet, vieritys, aika, suppilo, suurin, poistuminen };
}

/**
 * Koon esivalinnan A/B-vertailu: versioittain katselut, poistui alle 10 s (aika 0-10), valitsi koon itse, koko valmiina
 * (itse valittu tai esivalittu) ja lisäsi koriin.
 */
export function koostaTuoteAb(rivit) {
  return Object.fromEntries(TUOTE_AB.map((v) => {
    const omat = rivit.filter((r) => r.tapahtuma.startsWith(`${v}|`)).map((r) => ({ tapahtuma: r.tapahtuma.slice(v.length + 1), n: r.n }));
    const n = Object.fromEntries(omat.map((r) => [r.tapahtuma, Number(r.n) || 0]));
    const k = n.naytto || 0;
    return [v, { nayttoja: k, alle10: pros(n["aika:0-10"] || 0, k), koko: pros(n.koko || 0, k), kokoValmiina: pros(Math.min(k, (n.koko || 0) + (n.koko_esivalittu || 0)), k), kori: pros(n.kori || 0, k) }];
  }));
}

export async function tuoteseurantaValilla(db, alku, loppu) {
  await varmistaTuoteseuranta(db);
  const rivit = await db`select tapahtuma, sum(n)::int as n from tuotesivu_seuranta where paiva between ${alku}::date and ${loppu}::date group by 1`;
  return { alku, loppu, ...koostaTuoteseuranta(rivit), ab: koostaTuoteAb(rivit) };
}

/** Päivän yhteenvedon rivit (klo 7, api/cron/tilaukset.js ?tehtava=yhteenveto). */
export function tuoteseurantaRivit(s) {
  if (!s?.nayttoja) return [`Tuotesivun seuranta ${s?.alku ?? ""}–${s?.loppu ?? ""}: ei vielä katseluita.`];
  const o = s.osuudet;
  return [
    `Tuotesivun seuranta ${s.alku}–${s.loppu} (${s.nayttoja} aitoa katselua): koko ${o.koko} %, väri ${o.vari} %, kokotaulukko ${o.kokotaulukko} %, Lisää koriin näkyvissä ${o.lisaa_nakyvissa} %, koriin ${o.kori} %.`,
    `Suppilo: ${s.suppilo.map((v) => `${v.nimi} ${v.n} (${v.pros} %)`).join(" -> ")}.`,
    `Vieritys vähintään 25/50/75/100 %: ${VIERITYS.map((v) => `${s.vieritys[v]} %`).join(" / ")}. Aika sivulla 0-10 s ${s.aika["0-10"]} %, 10-30 s ${s.aika["10-30"]} %, 30-60 s ${s.aika["30-60"]} %, 1-3 min ${s.aika["60-180"]} %, yli 3 min ${s.aika["180+"]} %.`,
    `Poistumiskohta: ${s.poistuminen}`,
    ...(s.ab && TUOTE_AB.some((v) => s.ab[v]?.nayttoja) ? [`Koon esivalinta A/B: ${TUOTE_AB.map((v) => { const x = s.ab[v]; return `${v === "koko-a" ? "A (valitse itse)" : "B (L esivalittu)"} ${x.nayttoja} katselua, alle 10 s ${x.alle10 ?? "-"} %, valitsi koon ${x.koko ?? "-"} %, koko valmiina ${x.kokoValmiina ?? "-"} %, koriin ${x.kori ?? "-"} %`; }).join("; ")}.`] : []),
  ];
}
