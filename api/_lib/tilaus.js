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
import { halytys, laheta, vahvistusViesti, tilausnumero, seuraavaTilausSuositukset } from "./sahkoposti.js";
import { kaikkiTuotteet } from "./tuotteet.js";
import { onPiilotettuTuote } from "./piilotetut.js";
import { onLahjakortti } from "./lahjakortti.js";
import { toimitaLahjakortit, veloitaLahjakortti } from "./lahjakortti-db.js";
import { pgMarkkinointi } from "./markkinointi-db.js";
import { onTuotannossa } from "./valvonta.js";
import { normalisoiEmail } from "./markkinointi.js";
import { tarkistaEnnenTuotantoa, pysaytysRivit } from "./tilausvahti.js";

/**
 * Tilausvarasto (5.11.2026): Postgres (orders, order_events) tai Blob-puskuri, kun tietokanta ei vastaa
 * (api/_lib/puskuri.js). Printify-siirto, tilausvahti ja omistajan ilmoitus toimivat kummallakin samalla koodilla.
 *   hae(id), paivita(id, kentat), tapahtuma(id, laji, tiedot), onTapahtuma(id, laji)
 */
export function pgTilausVarasto(db = sql()) {
  return {
    laji: "kanta",
    hae: async (id) => (await db`select * from orders where id = ${id}`)[0] ?? null,
    paivita: async (id, kentat) => {
      // Sarakkeet koodista (ei käyttäjän syötettä); tagged template -muoto, jotta jokainen arvo on parametri.
      const avaimet = Object.keys(kentat).filter((k) => /^[a-z_]+$/.test(k));
      const osat = [...avaimet.map((k, i) => `${i ? ", " : "update orders set "}${k} = `), ", updated_at = now() where id = ", ""];
      if (!avaimet.length) osat.splice(0, 1, "update orders set updated_at = now() where id = ");
      await db(Object.assign(osat, { raw: [...osat] }), ...avaimet.map((k) => kentat[k]), id);
    },
    tapahtuma: (id, laji, tiedot = {}) => kirjaaTapahtuma(id, laji, tiedot),
    onTapahtuma: async (id, laji) => !!(await db`select 1 from order_events where order_id = ${id} and kind = ${laji} limit 1`)[0],
  };
}

/** Blob-puskurin tilaus (puskuri/tilaukset/<id>.json): tapahtumat tilauksen omassa listassa. */
export function blobTilausVarasto({ lue, kirjoita } = {}) {
  const muisti = new Map();
  const polku = (id) => `puskuri/tilaukset/${id}.json`;
  const lataa = async (id) => {
    if (muisti.has(id)) return muisti.get(id);
    const P = await import("./puskuri.js");
    const t = await (lue || P.lueBlob)(polku(id));
    if (t) muisti.set(id, t);
    return t;
  };
  const tallenna = async (t) => {
    muisti.set(t.id, t);
    const P = await import("./puskuri.js");
    await (kirjoita || P.kirjoitaBlob)(polku(t.id), t);
  };
  return {
    laji: "blob",
    hae: async (id) => {
      const t = await lataa(id);
      return t ? { ...t } : null;
    },
    paivita: async (id, kentat) => {
      const t = await lataa(id);
      if (!t) throw new Error(`puskuritilaus ${id} puuttuu`);
      const iso = (x) => (x instanceof Date ? x.toISOString() : x);
      await tallenna({ ...t, ...Object.fromEntries(Object.entries(kentat).map(([a, b]) => [a, iso(b)])), updated_at: new Date().toISOString() });
    },
    tapahtuma: async (id, laji, tiedot = {}) => {
      const t = await lataa(id);
      if (!t) return;
      await tallenna({ ...t, tapahtumat: [...(t.tapahtumat || []), { kind: laji, details: tiedot, created_at: new Date().toISOString() }] });
    },
    onTapahtuma: async (id, laji) => !!(await lataa(id))?.tapahtumat?.some((e) => e.kind === laji),
    luo: tallenna,
  };
}

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

async function virhe(tilaus, vaihe, viesti, v) {
  const yrityksia = (tilaus.printify_attempts || 0) + 1;
  const halyta = halytetaanko(tilaus);
  await v.paivita(tilaus.id, {
    printify_status: tilaus.printify_order_id ? "luotu" : "virhe", printify_error: `${vaihe}: ${viesti}`.slice(0, 1000),
    printify_attempts: yrityksia, next_retry_at: seuraavaYritys(yrityksia), ...(halyta ? { alert_sent_at: new Date() } : {}),
  });
  await v.tapahtuma(tilaus.id, "printify_virhe", { vaihe, viesti, yrityksia });
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
async function pysayta(tilaus, printifyId, v, varasto) {
  const syy = v.syyt.join("; ");
  const virheteksti = `tilausvahti: ${syy}`.slice(0, 1000);
  let lisa = [];
  try {
    await varasto.paivita(tilaus.id, { printify_status: "pysaytetty", printify_error: virheteksti, next_retry_at: null, alert_sent_at: new Date() });
  } catch (e) {
    // Tila puuttuu tarkistusehdosta (db/schema.sql ajamatta): ei tuotantoon, uusi tarkistus ja hälytys vuorokauden päästä.
    await varasto.paivita(tilaus.id, { printify_error: virheteksti, next_retry_at: new Date(Date.now() + 24 * 3600e3), alert_sent_at: new Date() });
    lisa = [`Tilaa 'pysaytetty' ei voitu tallentaa (${e?.message || e}): aja db/schema.sql. Tarkistus toistuu vuorokauden päästä.`];
  }
  await varasto.tapahtuma(tilaus.id, "printify_pysaytetty", {
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
export async function lahetaPrintifyyn(tilausId, varasto = pgTilausVarasto()) {
  const tilaus = await varasto.hae(tilausId);
  if (!tilaus) return { ok: false, vaihe: "haku", viesti: "tilausta ei löydy" };
  if (tilaus.status !== "maksettu") return { ok: false, vaihe: "tila", viesti: `tilaus ${tilaus.status}` };
  if (["tuotannossa", "lahetetty", "ei_tarvita"].includes(tilaus.printify_status)) return { ok: true, jo: true };
  // Tilausvahdin pysäyttämä: omistaja päättää, ei automaattista uutta yritystä.
  if (tilaus.printify_status === "pysaytetty") return { ok: false, vaihe: "pysaytetty", viesti: tilaus.printify_error || "pysäytetty" };
  if (printifyRivit(tilaus.items).length === 0) {
    // Pelkkiä lahjakortteja: ei Printify-tilausta.
    await varasto.paivita(tilaus.id, { printify_status: "ei_tarvita" });
    return { ok: true, ei_tarvita: true };
  }
  if (!P.onPrintify()) return virhe(tilaus, "avain", "PRINTIFY_API_KEY tai PRINTIFY_SHOP_ID puuttuu", varasto);

  const puuttuu = puuttuvatVariantit(tilaus.items);
  if (puuttuu.length) return virhe(tilaus, "variantti", `Printify-variantti puuttuu: ${puuttuu.join(", ")}`, varasto);

  let printifyId = tilaus.printify_order_id;
  if (!printifyId) {
    const r = await P.luoTilaus(P.tilausRunko(tilaus));
    if (!r.ok || !r.data?.id) return virhe(tilaus, "luonti", r.virhe || "Printify ei palauttanut tilausnumeroa", varasto);
    printifyId = r.data.id;
    await varasto.paivita(tilaus.id, { printify_order_id: printifyId, printify_status: "luotu" });
    // Erillisenä: jos schema.sql:n uusi sarake puuttuu, Printify-tunnus on silti tallessa (ei kaksoistilausta).
    await varasto.paivita(tilaus.id, { printify_created_at: new Date() }).catch((e) => console.error("printify_created_at:", e?.message));
    tilaus.printify_order_id = printifyId;
    await varasto.tapahtuma(tilaus.id, "printify_luotu", { printifyId });
  }

  // Tilausvahti: luotu Printify-tilaus (todelliset kulut ja painotalot) ennen tuotantoa.
  const luotu = await P.haeTilaus(printifyId);
  if (!luotu.ok || !luotu.data) return virhe(tilaus, "tilausvahti", luotu.virhe || "Printify-tilauksen haku epäonnistui", varasto);
  if (!onTuotannossa(luotu.data.status)) {
    const v = await tarkistaEnnenTuotantoa(luotu.data, tilaus, { haePainotalo: P.haePainotalo });
    if (v.kulut) {
      await varasto.paivita(tilaus.id, { printify_cost: v.kulut.kulu, printify_cost_ex_tax: v.kulut.kuluIlmanAlv, printify_product_cost: v.kulut.tuotteet })
        .catch((e) => console.error("printify_cost:", e?.message));
    }
    if (v.tulos === "tuntematon") return virhe(tilaus, "tilausvahti", v.syyt.join("; "), varasto);
    if (v.tulos === "pysayta") return pysayta(tilaus, printifyId, v, varasto);
  }

  const t = await P.lahetaTuotantoon(printifyId);
  if (!t.ok) {
    // Jos Printify on jo ottanut tilauksen tuotantoon (esim. edellinen yritys onnistui, mutta vastaus katosi),
    // send_to_production palauttaa virheen: tarkistetaan tila ennen kuin merkitään virheeksi.
    const tila = await P.haeTilaus(printifyId);
    if (!(tila.ok && onTuotannossa(tila.data?.status))) return virhe(tilaus, "send_to_production", t.virhe || "tuntematon virhe", varasto);
  }
  await varasto.paivita(tilaus.id, { printify_status: "tuotannossa", printify_error: null, next_retry_at: null, sent_to_production_at: new Date() });
  await varasto.tapahtuma(tilaus.id, "printify_tuotannossa", { printifyId });
  return { ok: true };
}

/**
 * Stripe Checkout -session maksetuksi (webhook, cron ja vahvistussivu käyttävät samaa). Idempotentti.
 * Palauttaa tilausrivin id:n tai null.
 */
export async function kasitteleMaksu(session) {
  if (session.payment_status !== "paid") return null;
  // Ryhmätilauksen maksu (jäsenen tai vetäjän, api/_lib/ryhmatilaus-db.js): ei omaa tilausriviä ennen lähetystä.
  if (session.metadata?.ryhma_id) {
    const { kasitteleRyhmaMaksu } = await import("./ryhmatilaus-db.js");
    await kasitteleRyhmaMaksu(session);
    return null;
  }
  const tilausId = session.metadata?.order_id || session.client_reference_id;
  // Kassa ilman tietokantaa (api/checkout.js, metadata puskuri=1): tilaus Blobissa, ellei valvonta ole jo siirtänyt sitä kantaan.
  if (tilausId && session.metadata?.puskuri === "1") {
    const kasitelty = await kasittelePuskuriMaksu(session, tilausId);
    if (kasitelty !== undefined) return kasitelty;
  }
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
 * Blob-puskurin tilauksen maksu: maksetuksi, vahvistusviesti, Printify ja omistajan ilmoitus samoin kuin kannassa.
 * Ei lahjakortteja, asiakaskoodeja eikä muistutusten lopetusta (vaativat tietokannan; kassa ei myy lahjakortteja
 * puskuritilassa). Palauttaa undefined, jos tilausta ei ole Blobissa (siirretty kantaan): silloin käsittely jatkuu kannassa.
 */
export async function kasittelePuskuriMaksu(session, tilausId, varasto = blobTilausVarasto()) {
  const t = await varasto.hae(tilausId);
  if (!t) return undefined;
  if (t.status === "odottaa_maksua") {
    await varasto.paivita(tilausId, {
      status: "maksettu", paid_at: new Date(), stripe_session_id: session.id,
      stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
      amount_paid: (session.amount_total ?? 0) / 100,
    });
    await varasto.tapahtuma(tilausId, "maksettu", { session: session.id, puskuri: true });
  }
  const tilaus = await varasto.hae(tilausId);
  if (tilaus.status !== "maksettu") return tilaus.id;
  if (!tilaus.confirmation_email_sent_at) {
    let suositukset = [];
    try { suositukset = seuraavaTilausSuositukset(tilaus, await kaikkiTuotteet(), { piilotettu: onPiilotettuTuote }); } catch { /* ilman suosituksia */ }
    const r = await laheta({ to: tilaus.customer_email, ...vahvistusViesti(tilaus, suositukset, {}) });
    if (r.ok) await varasto.paivita(tilausId, { confirmation_email_sent_at: new Date() });
    else await varasto.tapahtuma(tilausId, "vahvistus_virhe", { virhe: r.virhe });
  }
  await lahetaPrintifyyn(tilausId, varasto);
  await ilmoitaOmistajalle(tilausId, varasto);
  return tilausId;
}

/**
 * Yritystilauksen lasku (api/checkout.js laskuTilaus): maksettu lasku merkitsee tilauksen maksetuksi ja vie sen
 * Printifyyn (jalkikasittely). Mitätöity tai perimätön lasku perii tilauksen. Idempotentti: webhook invoice.paid ja
 * tunnin cron (api/cron/tilaukset.js) kutsuvat samaa.
 */
export async function kasitteleLasku(lasku) {
  const tilausId = lasku?.metadata?.order_id;
  if (!tilausId) return null;
  if (lasku.status === "void" || lasku.status === "uncollectible") {
    const r = await sql()`update orders set status = 'peruttu', updated_at = now() where id = ${tilausId} and status = 'odottaa_maksua' returning id`;
    if (r.length) await kirjaaTapahtuma(tilausId, "peruttu", { syy: `lasku ${lasku.status}`, invoice: lasku.id });
    return null;
  }
  if (lasku.status !== "paid") return null;
  const paivitetyt = await sql()`update orders set status = 'maksettu', paid_at = now(), amount_paid = ${(lasku.amount_paid ?? 0) / 100}, updated_at = now()
    where id = ${tilausId} and status = 'odottaa_maksua' returning id`;
  if (paivitetyt.length) await kirjaaTapahtuma(tilausId, "maksettu", { invoice: lasku.id });
  const [tilaus] = await sql()`select * from orders where id = ${tilausId}`;
  if (!tilaus) {
    await halytys("Maksettu lasku ilman tilausta", [`Lasku ${lasku.id}`, `Tilaus ${tilausId}`]);
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
  // Uudelleenostot (api/_lib/uusintaosto.js): kiitos- ja ystäväkoodi tälle tilaukselle, ja jos tilauksessa käytettiin
  // ystäväkoodia, palkkiokoodi koodin antajalle. Virhe ei estä vahvistusta eikä Printify-siirtoa.
  let asiakaskoodit = {};
  try {
    const { tilauksenAsiakaskoodit, kirjaaAsiakaskoodinKaytto } = await import("./uusintaosto.js");
    asiakaskoodit = await tilauksenAsiakaskoodit(sql(), tilaus);
    const palkkio = await kirjaaAsiakaskoodinKaytto(sql(), tilaus);
    if (palkkio) {
      const { palkkioViesti } = await import("./sahkoposti.js");
      const r = await laheta({ to: palkkio.email, ...palkkioViesti(palkkio) });
      await kirjaaTapahtuma(tilaus.id, "ystavapalkkio", { lahetetty: r.ok });
    }
  } catch (e) {
    console.error("asiakaskoodit:", e?.message || e);
  }
  if (!tilaus.confirmation_email_sent_at) {
    // "Seuraava tilaus" -suositukset samasta aiheesta (ei alennuskoodia); virhe ei estä vahvistusta.
    let suositukset = [];
    try { suositukset = seuraavaTilausSuositukset(tilaus, await kaikkiTuotteet(), { piilotettu: onPiilotettuTuote }); } catch { /* ilman suosituksia */ }
    const v = vahvistusViesti(tilaus, suositukset, asiakaskoodit);
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
  await ilmoitaOmistajalle(tilaus.id);
}

/**
 * Omistajalle heti ilmoitus maksetusta tilauksesta (kerran per tilaus, order_events "omistaja_ilmoitettu"):
 * summa, tuotteet ja Printify-tila (EU-painotalo ja tuotanto: tilausvahti, lahetaPrintifyyn). Poikkeama (ei
 * tuotannossa) näkyy viestissä, ja tunnin valvonta jatkaa siitä.
 */
export async function ilmoitaOmistajalle(tilausId, varasto = pgTilausVarasto()) {
  try {
    if (await varasto.onTapahtuma(tilausId, "omistaja_ilmoitettu")) return;
    const t = await varasto.hae(tilausId);
    if (!t || t.status !== "maksettu") return;
    const rivit = (t.items || []).map((i) => `${i.quantity} x ${i.name}${i.color || i.size ? ` (${[i.color, i.size].filter(Boolean).join(" / ")})` : ""}, ${Number(i.unit_price).toFixed(2).replace(".", ",")} €`);
    const tuotannossa = ["tuotannossa", "lahetetty", "ei_tarvita"].includes(t.printify_status);
    const r = await halytys(`Uusi tilaus #${tilausnumero(t.id)}: ${Number(t.amount_paid ?? t.total).toFixed(2).replace(".", ",")} €`, [
      ...rivit,
      `Toimitus ${Number(t.shipping).toFixed(2).replace(".", ",")} €, asiakas ${t.customer_name || "?"}, ${t.shipping_address?.city || ""}`,
      `Printify: ${t.printify_status}${t.printify_order_id ? ` (tilaus ${t.printify_order_id})` : ""}${tuotannossa ? "" : `, POIKKEAMA: ei tuotannossa${t.printify_error ? `: ${t.printify_error}` : ""}`}`,
      ...(varasto.laji === "blob" ? ["Tietokanta ei vastannut: tilaus on Blob-puskurissa, valvonta siirtää sen kantaan, kun kanta vastaa."] : []),
    ]);
    await varasto.tapahtuma(tilausId, r.ok ? "omistaja_ilmoitettu" : "omistaja_ilmoitus_virhe", r.ok ? {} : { virhe: r.virhe });
  } catch (e) {
    console.error("omistajan ilmoitus:", e?.message || e);
  }
}
