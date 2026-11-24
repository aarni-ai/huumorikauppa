/**
 * Blogien konversioseuranta (24.11.2026): koostemäärä päivä x blogi x tapahtuma, ei evästeitä eikä tunnisteita.
 * Botit ja oma liikenne ohitetaan (api/sahkoposti.js ohitaTaiBotti). Kirjaukset kulkevat Blob-puskurin kautta.
 *
 * Tapahtumat:
 *   naytto       blogiartikkeli avattiin
 *   tuote        tuotekortti tai tuotelinkki klikattiin (siirtyminen tuotesivulle)
 *   kori         tuote lisättiin koriin blogisivulta (Top 3, tekstin kortit, nostot)
 *   kassa        ostoskorista siirryttiin kassalle blogikäynnin aikana
 */
export const BLOGI_TAPAHTUMAT = ["naytto", "tuote", "kori", "kassa"];
const SLUG = /^[a-z0-9-]{2,120}$/;

export async function varmistaBlogiseuranta(db) {
  await db`create table if not exists blogi_seuranta (paiva date not null, blogi text not null, tapahtuma text not null,
    n integer not null default 0, primary key (paiva, blogi, tapahtuma))`;
}

export async function kirjaaBlogitapahtuma(db, blogi, tapahtuma) {
  if (!BLOGI_TAPAHTUMAT.includes(tapahtuma) || !SLUG.test(String(blogi || ""))) return false;
  await varmistaBlogiseuranta(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into blogi_seuranta (paiva, blogi, tapahtuma, n) values (${paiva}::date, ${blogi}, ${tapahtuma}, 1)
    on conflict (paiva, blogi, tapahtuma) do update set n = blogi_seuranta.n + 1`;
  return true;
}
