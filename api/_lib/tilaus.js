/**
 * Tilausten käsittely (oma-tausta). Tilan kulku:
 *   status:          odottaa_maksua -> maksettu (tai peruttu)
 *   printify_status: ei_lahetetty -> luotu (Printifyssä, on-hold) -> tuotannossa -> lahetetty
 *                    virhe = viimeisin yritys epäonnistui, next_retry_at kertoo seuraavan yrityksen
 *                    pysaytetty = tilausvahti esti tuotannon (EU:n ulkopuolinen painotalo tai Printifyn kulu yli myynnin
 *                    alv 0, api/_lib/tilausvahti.js): ei uudelleenyrityksiä, omistaja päättää
 * Tilaus on "lähetetty Printifyyn" vasta, kun send_to_production onnistuu (tuotannossa). Jos tilauksen luonti,
 * send_to_production tai variantti epäonnistuu, tilaa ei merkitä lähetetyksi: yritetään uudelleen (cron) ja
 * omistajalle lähtee heti sähköposti (kerran per tilaus ja vaihe, uusi hälytys vasta 24 h päästä).
 */
import { sql, kirjaaTapahtuma } from "./db.js";
import * as P from "./printify.js";
import { halytys, laheta, vahvistusViesti, tilausnumero } from "./sahkoposti.js";
import { onLahjakortti } from "./lahjakortti.js";
import { toimitaLahjakortit, veloitaLahjakortti } from "./lahjakortti-db.js";
import { pgMarkkinointi } from "./markkinointi-db.js";
import { onTuotannossa } from "./valvonta.js";
import { normalisoiEmail } from "./markkinointi.js";
import { tarkistaEnnenTuotantoa, pysaytysRivit } from "./tilausvahti.js";

/** Printifyyn menevät rivit (lahjakortit eivät mene). */
export const printifyRivit = (items) => (items || []).filter((i) => !onLahjakortti(i));

/** Uudelleenyrityksen viive yrityskerran mukaan: 15 min, 30 min, 1 h, 2 h, sitten 4 h välein. */
export function seuraavaYritys(yrityksia, nyt = new Date()) {
  const min = [15, 30, 60, 120][yrityksia - 1] ?? 240;
  return new Date(nyt.getTime() + min * 60000);
}

/** Puuttuuko jokin Printify-tieto riveiltä. */
export function puuttuvatVariantit(items) {
  return printifyRivit(items).filter((i) => !i.printify_product_id || typeof i.variant_id !== "number").map((i) => i.name);
}

/** Hälytetäänkö: ensimmäinen virhe tai edellisestä hälytyksestä yli 24 h. */
export function halytetaanko(tilaus, nyt = new Date()) {
  if (!tilaus.alert_sent_at) return true;
  return nyt.getTime() - new Date(tilaus.alert_sent_at).getTime() > 24 * 3600 * 1000;
}

async function virhe(tilaus, vaihe, viesti) {
  const yrityksia = (tilaus.printify_attempts || 0) + 1;
  const halyta = halytetaanko(tilaus);
  const db = sql();
  await db`update orders set printify_status = ${tilaus.printify_order_id ? "luotu" : "virhe"},
    printify_error = ${`${vaihe}: ${viesti}`.slice(0, 1000)}, printify_attempts = ${yrityksia},
    next_retry_at = ${seuraavaYritys(yrityksia)}, updated_at = now()
    ${halyta ? db`, alert_sent_at = now()` : db``}
    where id = ${tilaus.id}`;
  await kirjaaTapahtuma(tilaus.id, "printify_virhe", { vaihe, viesti, yrityksia });
  if (halyta) {
    await halytys(`Tilaus #${tilausnumero(tilaus.id)} ei mennyt Printifyn tuotantoon`, [
      `Vaihe: ${vaihe}`,
      `Virhe: ${viesti}`,
      `Asiakas: ${tilaus.customer_email}`,
      `Yrityksiä: ${yrityksia}, seuraava yritys automaattisesti ${seuraavaYritys(yrityksia).toISOString()}`,
      tilaus.printify_order_id ? `Printify-tilaus: ${tilaus.printify_order_id} (on hold)` : "Printify-tilausta ei ole luotu",
    ]);
  }
  return { ok: false, vaihe, viesti };
}

/** Tilausvahdin pysäytys: tila 'pysaytetty', ei uudelleenyritystä, hälytys omistajalle heti. */
async function pysayta(tilaus, printifyId, v) {
  const syy = v.syyt.join("; ");
  const virheteksti = `tilausvahti: ${syy}`.slice(0, 1000);
  let lisa = [];
  try {
    await sql()`update orders set printify_status = 'pysaytetty', printify_error = ${virheteksti},
      next_retry_at = null, alert_sent_at = now(), updated_at = now() where id = ${tilaus.id}`;
  } catch (e) {
    // Tila puuttuu tarkistusehdosta (db/schema.sql ajamatta): ei tuotantoon, uusi tarkistus ja hälytys vuorokauden päästä.
    await sql()`update orders set printify_error = ${virheteksti}, next_retry_at = ${new Date(Date.now() + 24 * 3600e3)},
      alert_sent_at = now(), updated_at = now() where id = ${tilaus.id}`;
    lisa = [`Tilaa 'pysaytetty' ei voitu tallentaa (${e?.message || e}): aja db/schema.sql. Tarkistus toistuu vuorokauden päästä.`];
  }
  await kirjaaTapahtuma(tilaus.id, "printify_pysaytetty", {
    syyt: v.syyt, printifyId, kulu: v.kulut?.kulu ?? null, kuluIlmanAlv: v.kulut?.kuluIlmanAlv ?? null, myyntiAlv0: v.myyntiAlv0,
    painotalot: v.rivit.map((r) => ({ product_id: r.product_id, providerId: r.providerId, nimi: r.nimi, maa: r.maa, eu: r.eu })),
  });
  await halytys(`Tilaus #${tilausnumero(tilaus.id)} pysäytetty ennen Printifyn tuotantoa`, [...pysaytysRivit(tilaus, printifyId, v), ...lisa]);
  return { ok: false, vaihe: "pysaytetty", viesti: syy };
}

/**
 * Vie maksetun tilauksen Printifyyn ja tuotantoon. Idempotentti: luo Printify-tilauksen vain kerran
 * (printify_order_id tallennetaan heti) ja lähettää tuotantoon, kunnes se onnistuu.
 */
export async function lahetaPrintifyyn(tilausId) {
  const [tilaus] = await sql()`select * from orders where id = ${tilausId}`;
  if (!tilaus) return { ok: false, vaihe: "haku", viesti: "tilausta ei löydy" };
  if (tilaus.status !== "maksettu") return { ok: false, vaihe: "tila", viesti: `tilaus ${tilaus.status}` };
  if (["tuotannossa", "lahetetty", "ei_tarvita"].includes(tilaus.printify_status)) return { ok: true, jo: true };
  // Tilausvahdin pysäyttämä: omistaja päättää, ei automaattista uutta yritystä.
  if (tilaus.printify_status === "pysaytetty") return { ok: false, vaihe: "pysaytetty", viesti: tilaus.printify_error || "pysäytetty" };
  if (printifyRivit(tilaus.items).length === 0) {
    // Pelkkiä lahjakortteja: ei Printify-tilausta.
    await sql()`update orders set printify_status = 'ei_tarvita', updated_at = now() where id = ${tilaus.id}`;
    return { ok: true, ei_tarvita: true };
  }
  if (!P.onPrintify()) return virhe(tilaus, "avain", "PRINTIFY_API_KEY tai PRINTIFY_SHOP_ID puuttuu");

  const puuttuu = puuttuvatVariantit(tilaus.items);
  if (puuttuu.length) return virhe(tilaus, "variantti", `Printify-variantti puuttuu: ${puuttuu.join(", ")}`);

  let printifyId = tilaus.printify_order_id;
  if (!printifyId) {
    const r = await P.luoTilaus(P.tilausRunko(tilaus));
    if (!r.ok || !r.data?.id) return virhe(tilaus, "luonti", r.virhe || "Printify ei palauttanut tilausnumeroa");
    printifyId = r.data.id;
    await sql()`update orders set printify_order_id = ${printifyId}, printify_status = 'luotu', updated_at = now() where id = ${tilaus.id}`;
    // Erillisenä: jos schema.sql:n uusi sarake puuttuu, Printify-tunnus on silti tallessa (ei kaksoistilausta).
    await sql()`update orders set printify_created_at = now() where id = ${tilaus.id}`.catch((e) => console.error("printify_created_at:", e?.message));
    tilaus.printify_order_id = printifyId;
    await kirjaaTapahtuma(tilaus.id, "printify_luotu", { printifyId });
  }

  // Tilausvahti: luotu Printify-tilaus (todelliset kulut ja painotalot) ennen tuotantoa.
  const luotu = await P.haeTilaus(printifyId);
  if (!luotu.ok || !luotu.data) return virhe(tilaus, "tilausvahti", luotu.virhe || "Printify-tilauksen haku epäonnistui");
  if (!onTuotannossa(luotu.data.status)) {
    const v = await tarkistaEnnenTuotantoa(luotu.data, tilaus, { haePainotalo: P.haePainotalo });
    if (v.kulut) {
      await sql()`update orders set printify_cost = ${v.kulut.kulu}, printify_cost_ex_tax = ${v.kulut.kuluIlmanAlv},
        printify_product_cost = ${v.kulut.tuotteet} where id = ${tilaus.id}`
        .catch((e) => console.error("printify_cost:", e?.message));
    }
    if (v.tulos === "tuntematon") return virhe(tilaus, "tilausvahti", v.syyt.join("; "));
    if (v.tulos === "pysayta") return pysayta(tilaus, printifyId, v);
  }

  const t = await P.lahetaTuotantoon(printifyId);
  if (!t.ok) {
    // Jos Printify on jo ottanut tilauksen tuotantoon (esim. edellinen yritys onnistui, mutta vastaus katosi),
    // send_to_production palauttaa virheen: tarkistetaan tila ennen kuin merkitään virheeksi.
    const tila = await P.haeTilaus(printifyId);
    if (!(tila.ok && onTuotannossa(tila.data?.status))) return virhe(tilaus, "send_to_production", t.virhe || "tuntematon virhe");
  }
  await sql()`update orders set printify_status = 'tuotannossa', printify_error = null, next_retry_at = null,
    sent_to_production_at = now(), updated_at = now() where id = ${tilaus.id}`;
  await kirjaaTapahtuma(tilaus.id, "printify_tuotannossa", { printifyId });
  return { ok: true };
}

/**
 * Stripe Checkout -session maksetuksi (webhook, cron ja vahvistussivu käyttävät samaa). Idempotentti.
 * Palauttaa tilausrivin id:n tai null.
 */
export async function kasitteleMaksu(session) {
  if (session.payment_status !== "paid") return null;
  const tilausId = session.metadata?.order_id || session.client_reference_id;
  if (!tilausId) {
    await halytys("Maksu ilman tilausta", [`Stripe-session ${session.id}`, `Asiakas ${session.customer_details?.email || session.customer_email || "?"}`]);
    return null;
  }
  const paivitetyt = await sql()`update orders set status = 'maksettu', paid_at = now(), stripe_session_id = ${session.id},
      stripe_payment_intent = ${typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null},
      amount_paid = ${(session.amount_total ?? 0) / 100}, updated_at = now()
    where id = ${tilausId} and status = 'odottaa_maksua' returning id`;
  if (paivitetyt.length) await kirjaaTapahtuma(tilausId, "maksettu", { session: session.id });
  const [tilaus] = await sql()`select * from orders where id = ${tilausId}`;
  if (!tilaus) {
    await halytys("Maksettu tilaus puuttuu tietokannasta", [`Tilaus ${tilausId}`, `Stripe-session ${session.id}`]);
    return null;
  }
  await jalkikasittely(tilaus);
  return tilaus.id;
}

/**
 * Maksetun tilauksen jatko (Stripe-maksu tai kokonaan lahjakortilla maksettu): lahjakortin veloitus, vahvistusviesti,
 * ostettujen lahjakorttien koodit ja Printify-siirto. Jokainen vaihe on idempotentti.
 */
export async function jalkikasittely(tilaus) {
  if (tilaus.gift_card_code && !tilaus.gift_card_charged_at) await veloitaLahjakortti(tilaus);
  if (!tilaus.confirmation_email_sent_at) {
    const v = vahvistusViesti(tilaus);
    const r = await laheta({ to: tilaus.customer_email, ...v });
    if (r.ok) await sql()`update orders set confirmation_email_sent_at = now() where id = ${tilaus.id}`;
    else await kirjaaTapahtuma(tilaus.id, "vahvistus_virhe", { virhe: r.virhe });
  }
  try {
    // Keskeneräisen tilauksen muistutukset loppuvat, kun samalla osoitteella maksetaan (valvonta tarkistaa myös).
    await pgMarkkinointi(sql()).lopetaKoriMaksettuna(normalisoiEmail(tilaus.customer_email), tilaus.id);
  } catch (e) {
    console.error("muistutusten lopetus:", e?.message || e);
  }
  try {
    await toimitaLahjakortit(tilaus);
  } catch (e) {
    await kirjaaTapahtuma(tilaus.id, "lahjakortti_virhe", { virhe: String(e?.message || e) });
    await halytys(`Lahjakortin luonti epäonnistui tilaukselle #${tilausnumero(tilaus.id)}`, [String(e?.message || e), "Valvonta yrittää uudelleen."]);
  }
  await lahetaPrintifyyn(tilaus.id);
}
