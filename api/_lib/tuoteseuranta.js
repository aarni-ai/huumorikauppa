/**
 * Tuotesivun kevyt tapahtumaseuranta (2.11.2026): missä kohtaa kävijät poistuvat tuotesivulta. Selain
 * (src/lib/tuoteseuranta.ts) lähettää yhden koosteen tuotesivun katselua kohden, kun sivu suljetaan tai vaihdetaan.
 * Tallennetaan vain koostemäärä päivä x tapahtuma (kuten suppilo, api/_lib/suppilo.js): ei evästeitä, ei tunnisteita.
 *
 * Tapahtumat: naytto (katselu), koko (koon valinta), vari (värin vaihto), kokotaulukko (kokoapu tai kokotaulukko
 * avattu), lisaa_nakyvissa (Lisää koriin -painike vähintään puoliksi näkyvissä), kori (lisätty koriin),
 * vieritys:25|50|75|100 (syvin kohta), aika:0-10|10-30|30-60|60-180|180+ (sekuntia sivulla).
 */
export const TAPAHTUMAT = ["naytto", "koko", "vari", "kokotaulukko", "lisaa_nakyvissa", "kori"];
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

export async function kirjaaTuotetapahtumat(db, body) {
  const avaimet = puhdista(body);
  await varmistaTuoteseuranta(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  for (const a of avaimet) {
    await db`insert into tuotesivu_seuranta (paiva, tapahtuma, n) values (${paiva}::date, ${a}, 1)
      on conflict (paiva, tapahtuma) do update set n = tuotesivu_seuranta.n + 1`;
  }
  return avaimet.length;
}

const pros = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);

/**
 * Kooste rivit { tapahtuma, n } -> { nayttoja, osuudet: { koko: %, ... }, vieritys: { "25": %, ... } (vähintään
 * kyseiseen syvyyteen), aika: { "0-10": %, ... }, poistuminen: lyhyt sanallinen arvio heikoimmasta kohdasta }.
 */
export function koostaTuoteseuranta(rivit) {
  const n = Object.fromEntries(rivit.map((r) => [r.tapahtuma, (Number(r.n) || 0)]));
  const nayttoja = n.naytto || 0;
  const osuudet = Object.fromEntries(TAPAHTUMAT.filter((t) => t !== "naytto").map((t) => [t, pros(n[t] || 0, nayttoja)]));
  // Vieritys kertyy: 100 % vierittänyt on myös ohittanut 25, 50 ja 75 %.
  const vieritys = Object.fromEntries(VIERITYS.map((v, i) => [v, pros(VIERITYS.slice(i).reduce((s, x) => s + (n[`vieritys:${x}`] || 0), 0), nayttoja)]));
  const aika = Object.fromEntries(AIKA.map((a) => [a, pros(n[`aika:${a}`] || 0, nayttoja)]));
  let poistuminen = null;
  if (nayttoja) {
    const lyhyt = aika["0-10"] ?? 0;
    if (lyhyt >= 50) poistuminen = `${lyhyt} % poistuu alle 10 sekunnissa: ensimmäinen kuva, otsikko tai hinta ei pidä.`;
    else if ((osuudet.koko ?? 0) < 15) poistuminen = `Vain ${osuudet.koko ?? 0} % valitsee koon: kävijä katsoo, mutta ei aloita ostoa.`;
    else if ((osuudet.kori ?? 0) < (osuudet.koko ?? 0) / 3) poistuminen = `${osuudet.koko} % valitsee koon, mutta vain ${osuudet.kori ?? 0} % lisää koriin: hinta, toimitus tai luottamus jarruttaa.`;
    else poistuminen = `Koon valinnasta koriin jatketaan (${osuudet.koko} % -> ${osuudet.kori} %).`;
  }
  return { nayttoja, osuudet, vieritys, aika, poistuminen };
}

export async function tuoteseurantaValilla(db, alku, loppu) {
  await varmistaTuoteseuranta(db);
  const rivit = await db`select tapahtuma, sum(n)::int as n from tuotesivu_seuranta where paiva between ${alku}::date and ${loppu}::date group by 1`;
  return { alku, loppu, ...koostaTuoteseuranta(rivit) };
}

/** Päivän yhteenvedon rivit. */
export function tuoteseurantaRivit(s) {
  if (!s?.nayttoja) return [`Tuotesivun seuranta ${s?.alku ?? ""}–${s?.loppu ?? ""}: ei vielä katseluita.`];
  const o = s.osuudet;
  return [
    `Tuotesivun seuranta ${s.alku}–${s.loppu} (${s.nayttoja} katselua): koko ${o.koko} %, väri ${o.vari} %, kokotaulukko ${o.kokotaulukko} %, Lisää koriin näkyvissä ${o.lisaa_nakyvissa} %, koriin ${o.kori} %.`,
    `Vieritys vähintään 25/50/75/100 %: ${VIERITYS.map((v) => `${s.vieritys[v]} %`).join(" / ")}. Aika sivulla 0-10 s ${s.aika["0-10"]} %, 10-30 s ${s.aika["10-30"]} %, 30-60 s ${s.aika["30-60"]} %, 1-3 min ${s.aika["60-180"]} %, yli 3 min ${s.aika["180+"]} %.`,
    `Poistumiskohta: ${s.poistuminen}`,
  ];
}
