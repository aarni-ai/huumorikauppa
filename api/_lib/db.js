/**
 * Oma tietokanta (oma-tausta, 21.10.2026): mikä tahansa Postgres (uusi Supabase-projekti ilmaistasolla tai Neon).
 * Yhteys ympäristömuuttujasta DATABASE_URL (tai POSTGRES_URL, jonka Vercelin Neon-integraatio asettaa).
 * Ilman yhteyttä kauppa toimii lukutilassa: tuotteet tulevat repon tilannekuvasta (data/products-snapshot.json).
 * Taulut: db/schema.sql.
 */
import postgres from "postgres";

let yhteys = null;

export const tietokantaUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const onTietokanta = () => !!tietokantaUrl();

/** Jaettu yhteys (serverless: yksi yhteys per instanssi, prepare pois poolerin takia). */
export function sql() {
  if (!onTietokanta()) throw new Error("DATABASE_URL puuttuu");
  if (!yhteys) {
    const paikallinen = /@(localhost|127\.0\.0\.1)[:/]/.test(tietokantaUrl());
    yhteys = postgres(tietokantaUrl(), { ssl: paikallinen ? false : "require", max: 1, idle_timeout: 20, prepare: false });
  }
  return yhteys;
}

/** Tilausloki (order_events). Ei kaada kutsujaa. */
export async function kirjaaTapahtuma(orderId, laji, tiedot = {}) {
  if (!onTietokanta()) return;
  try {
    await sql()`insert into order_events (order_id, kind, details) values (${orderId}, ${laji}, ${sql().json(tiedot)})`;
  } catch (e) {
    console.error("order_events-kirjaus epäonnistui:", e?.message);
  }
}
