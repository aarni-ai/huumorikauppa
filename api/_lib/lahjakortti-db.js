/**
 * Lahjakorttien tietokantaosa (taulut gift_cards ja gift_card_redemptions, db/schema.sql).
 *  - haeLahjakortti: kassan tarkistus
 *  - toimitaLahjakortit: maksetun tilauksen lahjakorttirivit koodeiksi ja sähköpostiin (idempotentti)
 *  - veloitaLahjakortti: tilauksen lahjakorttiosuus saldosta maksun jälkeen (idempotentti, ei koskaan negatiivinen)
 */
import { sql, kirjaaTapahtuma } from "./db.js";
import { luoKoodi, voimassaAsti, onLahjakortti, normalisoiKoodi } from "./lahjakortti.js";
import { laheta, lahjakorttiViesti, halytys, tilausnumero } from "./sahkoposti.js";

export async function haeLahjakortti(syote) {
  const koodi = normalisoiKoodi(syote);
  if (!koodi) return null;
  const [r] = await sql()`select code, balance, initial_value, expires_at from gift_cards where code = ${koodi}`;
  return r || null;
}

/** Luo ja lähettää maksetun tilauksen lahjakortit. Turvallinen ajaa uudelleen (webhook, cron, vahvistussivu). */
export async function toimitaLahjakortit(tilaus) {
  const items = tilaus.items || [];
  if (!items.some((i) => onLahjakortti(i))) return { luotu: 0, lahettamatta: 0 };
  const db = sql();
  let luotu = 0;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!onLahjakortti(it)) continue;
    for (let u = 0; u < it.quantity; u++) {
      const [olemassa] = await db`select code from gift_cards where order_id = ${tilaus.id} and item_index = ${i} and unit_index = ${u}`;
      if (olemassa) continue;
      // Koodin törmäys on erittäin epätodennäköinen (60 bittiä); varalta uusi koodi.
      for (let yritys = 0; yritys < 5; yritys++) {
        const r = await db`insert into gift_cards (code, initial_value, balance, order_id, item_index, unit_index, buyer_email,
            recipient_email, recipient_name, message, expires_at)
          values (${luoKoodi()}, ${it.unit_price}, ${it.unit_price}, ${tilaus.id}, ${i}, ${u}, ${tilaus.customer_email},
            ${it.recipient_email || null}, ${it.recipient_name || null}, ${it.message || null},
            ${voimassaAsti(tilaus.paid_at ? new Date(tilaus.paid_at) : new Date())})
          on conflict do nothing returning code`;
        if (r.length) { luotu++; break; }
      }
    }
  }
  const lahettamatta = await db`select * from gift_cards where order_id = ${tilaus.id} and emailed_at is null order by item_index, unit_index`;
  for (const kortti of lahettamatta) {
    const ostajalle = await laheta({ to: tilaus.customer_email, ...lahjakorttiViesti(kortti) });
    let saajalle = { ok: true };
    if (kortti.recipient_email) {
      saajalle = await laheta({ to: kortti.recipient_email, ...lahjakorttiViesti(kortti, { saajalle: true, ostaja: tilaus.customer_name || "" }) });
    }
    if (ostajalle.ok && saajalle.ok) await db`update gift_cards set emailed_at = now(), updated_at = now() where code = ${kortti.code}`;
    else await kirjaaTapahtuma(tilaus.id, "lahjakortti_viesti_virhe", { virhe: ostajalle.virhe || saajalle.virhe });
  }
  if (luotu) await kirjaaTapahtuma(tilaus.id, "lahjakortit_luotu", { maara: luotu });
  return { luotu, lahettamatta: lahettamatta.length };
}

export class SaldoEiRiita extends Error {}

/**
 * Vähentää tilauksen lahjakorttiosuuden saldosta yhdessä transaktiossa. Idempotentti: käyttö kirjataan ensin
 * (gift_card_redemptions, yksi per tilaus), joten rinnakkaiset kutsut (webhook ja ajastin) veloittavat vain kerran.
 * Saldo ei mene negatiiviseksi: jos se ei riitä (sama kortti käytetty toisessa tilauksessa), mitään ei veloiteta.
 * @param tx transaktio (sql().begin), jos kutsuja haluaa veloituksen osaksi omaa transaktiotaan: silloin
 *   riittämätön saldo heittää SaldoEiRiita ja kutsuja perii koko transaktion. Ilman sitä palautetaan ok false ja
 *   omistajalle lähtee hälytys.
 */
export async function veloitaLahjakortti(tilaus, tx = null) {
  const summa = Number(tilaus.gift_card_amount || 0);
  if (!tilaus.gift_card_code || !(summa > 0)) return { ok: true, ei: true };
  const veloita = async (db) => {
    const kirjattu = await db`insert into gift_card_redemptions (code, order_id, amount)
      values (${tilaus.gift_card_code}, ${tilaus.id}, ${summa}) on conflict (order_id) do nothing returning id`;
    if (!kirjattu.length) return { ok: true, jo: true };
    const r = await db`update gift_cards set balance = balance - ${summa}, updated_at = now()
      where code = ${tilaus.gift_card_code} and balance >= ${summa} and expires_at > now() returning balance`;
    if (!r.length) throw new SaldoEiRiita("Lahjakortin saldo ei riitä");
    await db`update orders set gift_card_charged_at = now(), updated_at = now() where id = ${tilaus.id}`;
    return { ok: true, saldo: Number(r[0].balance) };
  };
  if (tx) return veloita(tx);
  try {
    const tulos = await sql().begin(veloita);
    if (!tulos.jo) await kirjaaTapahtuma(tilaus.id, "lahjakortti_veloitettu", { summa });
    return tulos;
  } catch (e) {
    if (!(e instanceof SaldoEiRiita)) throw e;
    await kirjaaTapahtuma(tilaus.id, "lahjakortti_saldo_ei_riita", { summa });
    await halytys(`Lahjakortin saldo ei riittänyt tilaukselle #${tilausnumero(tilaus.id)}`, [
      `Koodi: ${tilaus.gift_card_code}`,
      `Lahjakortilla maksettava osuus: ${summa.toFixed(2)} €`,
      `Asiakas: ${tilaus.customer_email}`,
      "Asiakas maksoi loput Stripellä. Tarkista kortin käyttö ja sovi erotus asiakkaan kanssa.",
    ]);
    return { ok: false };
  }
}
