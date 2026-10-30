/**
 * POST /api/checkout (korvaa Lovable Cloudin create-checkout-funktion). Sama pyyntö kuin ennen:
 * { items, customerEmail, customerName, shippingAddress {address, zip, city, phone}, recipientName, discountCode }
 * sekä uutena giftCardCode (lahjakortin koodi). Lahjakorttirivi: { id: "lahjakortti-50", type: "giftcard",
 * quantity, giftCard: { recipientEmail, recipientName, message } }.
 * Luo tilausrivin (odottaa_maksua) ja Stripe Checkout -session, jonka metadataan menee vain tilauksen id.
 * Jos lahjakortti kattaa koko tilauksen, Stripeä ei käytetä: tilaus merkitään maksetuksi ja viedään Printifyyn heti.
 * Vastaus { ok, url } tai { ok: false, error }. Ilman STRIPE_SECRET_KEY:tä ja DATABASE_URL:ia 503.
 *
 * POST { action: "lahjakortti", code } tarkistaa lahjakortin saldon kassasivulle: { ok, saldo, voimassa } tai
 * { ok: false, error }. Ei vaadi Stripeä.
 *
 * POST { action: "kumppanikoodi", code } -> { ok, koodi }: hyväksytty, aktiivinen kumppanikoodi (kassan vahvistus).
 *
 * POST { action: "lasku", items, yritys: { yritys, ytunnus, nimi, email, puhelin, osoite, postinumero, kaupunki, viite },
 *   toimitus: { nimi, osoite, postinumero, kaupunki } } yritystilaus laskulla (/yritykset/tilaus): vähintään 10
 *   fyysistä tuotetta, Y-tunnus (tarkiste ja PRH). Tilaus odottaa maksua; Stripe lähettää laskun (maksuaika 14 pv).
 *   Printify-tilaus lähtee vasta, kun lasku on maksettu (api/_lib/tilaus.js kasitteleLasku: webhook invoice.paid ja
 *   tunnin cron). Vastaus { ok, lasku: hosted_invoice_url, tilaus }.
 */
import { onTietokanta, sql, kirjaaTapahtuma } from "./_lib/db.js";
import { onStripe, stripe } from "./_lib/stripe.js";
import { kaikkiTuotteet } from "./_lib/tuotteet.js";
import { omaVahvistusKaytossa } from "./_lib/sahkoposti.js";
import { tarkistaKumppani } from "./_lib/kumppani.js";
import { ytunnus as tarkistaYtunnus, haeYritys, laskuData, YRITYS_MIN_KPL } from "./_lib/yritysmyynti.js";
import { onPrintify, haeTuote } from "./_lib/printify.js";
import { liveSaatavuus } from "./_lib/saatavuus.js";
import { laskeTilaus, KassaVirhe, OLETUSKOODIT } from "./_lib/kassa.js";
import { tarkistaLahjakortti, normalisoiKoodi, onLahjakortti } from "./_lib/lahjakortti.js";
import { haeLahjakortti, veloitaLahjakortti, SaldoEiRiita } from "./_lib/lahjakortti-db.js";
import { jalkikasittely } from "./_lib/tilaus.js";
import PAKETIT from "./_lib/paketit-data.js";
import { pgMarkkinointi } from "./_lib/markkinointi-db.js";
import { tarkistaEnsitilausKoodi, normalisoiEmail, kelpaaEmail } from "./_lib/markkinointi.js";

/**
 * Alennuskoodi: discount_codes-taulu, ensitilauksen koodi (TERVE-..., api/_lib/markkinointi.js: sama sähköposti,
 * ei aiempia maksettuja tilauksia, koodia ei ole käytetty) tai oletuskoodit. Ensitilauksen koodin virhe keskeyttää
 * kassan selkeällä viestillä; tuntematon muu koodi ohitetaan kuten ennen.
 */
async function alennus(koodi, email) {
  if (!koodi) return null;
  const k = String(koodi).trim().toUpperCase();
  if (onTietokanta()) {
    const [r] = await sql()`select discount_type, discount_value, is_active from discount_codes where upper(code) = ${k}`;
    if (r) return r.is_active ? { type: r.discount_type, value: Number(r.discount_value) } : null;
    if (k.startsWith("TERVE-")) {
      const store = pgMarkkinointi(sql());
      const t = tarkistaEnsitilausKoodi({
        tilaaja: await store.haeTilaajaKoodilla(k), email,
        aiempiaTilauksia: kelpaaEmail(email) ? await store.maksettujaTilauksia(normalisoiEmail(email)) : 0,
        koodiKaytetty: await store.koodiKaytetty(k),
      });
      if (!t.ok) throw new KassaVirhe(t.virhe, "discount_invalid");
      return t.alennus;
    }
  }
  return OLETUSKOODIT[k] ?? null;
}

/** Lahjakortti koodista: { koodi, saldo } tai KassaVirhe. */
async function lahjakortti(koodi) {
  if (!koodi) return null;
  const k = normalisoiKoodi(koodi);
  if (!k) throw new KassaVirhe("Tarkista lahjakortin koodi.", "giftcard_invalid");
  const t = tarkistaLahjakortti(await haeLahjakortti(k));
  if (!t.ok) throw new KassaVirhe(t.virhe, "giftcard_invalid");
  return { koodi: k, saldo: t.saldo };
}

const kuvaus = (r) => [r.size && `Koko: ${r.size}`, r.color && `Väri: ${r.color}`, r.custom_text && `Oma teksti: "${r.custom_text}"`,
  r.paketti && `Pakettialennus ${r.paketti_alennus_prosentti} %`, r.korialennus_prosentti && `Kahden tuotteen alennus ${r.korialennus_prosentti} %`, r.tpaitapari && "Kaksi t-paitaa 44,90 €", r.maaraalennus_prosentti && `Määräalennus ${r.maaraalennus_prosentti} %`, r.recipient_name && `Saaja: ${r.recipient_name}`].filter(Boolean).join(" | ");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST" });
  let pyynto;
  try {
    pyynto = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ ok: false, error: "Virheellinen pyyntö." });
  }

  if (pyynto.action === "lahjakortti") {
    if (!onTietokanta()) return res.status(503).json({ ok: false, error: "Lahjakortit eivät ole vielä käytössä tässä ympäristössä." });
    try {
      const k = normalisoiKoodi(pyynto.code);
      const kortti = k ? await haeLahjakortti(k) : null;
      const t = tarkistaLahjakortti(kortti);
      if (!t.ok) return res.status(200).json({ ok: false, error: k ? t.virhe : "Tarkista lahjakortin koodi." });
      return res.status(200).json({ ok: true, code: k, saldo: t.saldo, voimassa: kortti.expires_at });
    } catch (e) {
      console.error("lahjakortti:", e?.message || e);
      return res.status(200).json({ ok: false, error: "Lahjakortin tarkistus epäonnistui. Yritä hetken kuluttua uudelleen." });
    }
  }

  if (pyynto.action === "alennuskoodi") {
    // Kassasivun koodikenttä: { ok, percent } tai { ok: false, error }. Lopullinen tarkistus tehdään maksun alussa.
    try {
      const a = await alennus(pyynto.code, pyynto.email);
      if (a?.type === "percent") return res.status(200).json({ ok: true, code: String(pyynto.code).trim().toUpperCase(), percent: a.value });
      return res.status(200).json({ ok: false, error: "Virheellinen alennuskoodi." });
    } catch (e) {
      if (e instanceof KassaVirhe) return res.status(200).json({ ok: false, error: e.message });
      console.error("alennuskoodi:", e?.message || e);
      return res.status(200).json({ ok: false, error: "Koodin tarkistus epäonnistui. Yritä hetken kuluttua uudelleen." });
    }
  }

  if (pyynto.action === "kumppanikoodi") {
    if (!onTietokanta()) return res.status(200).json({ ok: false });
    const koodi = await tarkistaKumppani(sql(), pyynto.code).catch(() => null);
    return res.status(200).json(koodi ? { ok: true, koodi } : { ok: false });
  }

  if (pyynto.action === "lasku") return laskuTilaus(pyynto, res);

  // Lahjakortin koodi toimitetaan vain sähköpostilla: myynti vasta, kun oma sähköposti on käytössä (Resend-domain
  // vahvistettu, SAHKOPOSTI_VAHVISTETTU=1). Muuten ostaja maksaisi saamatta koodia.
  if (!omaVahvistusKaytossa() && Array.isArray(pyynto?.items) && pyynto.items.some((it) => onLahjakortti(it))) {
    return res.status(200).json({ ok: false, error: "Lahjakortit eivät ole juuri nyt myynnissä. Poista lahjakortti ostoskorista ja jatka tilausta.", diagnostics: { error_stage: "giftcard_unavailable" } });
  }

  if (!onStripe() || !onTietokanta()) {
    return res.status(503).json({ ok: false, error: "Kassa ei ole vielä käytössä tässä ympäristössä.", diagnostics: { error_stage: "not_configured" } });
  }
  let tilausId = null;
  try {
    // Saatavuus: tallennettu päivittäinen tieto, täydennettynä tuoreella Printify-haulla (3 s, virheessä tallennettu).
    let tuotteet = await kaikkiTuotteet();
    if (onPrintify()) tuotteet = await liveSaatavuus(tuotteet, pyynto.items, { haeTuote: (id) => haeTuote(id, { aikaraja: 3000 }) });
    const laskettu = laskeTilaus(pyynto, tuotteet, await alennus(pyynto.discountCode, pyynto.customerEmail), {
      paketit: PAKETIT,
      lahjakortti: await lahjakortti(pyynto.giftCardCode),
    });
    const osoite = laskettu.only_gift_cards ? {} : { ...pyynto.shippingAddress, country: "FI" };
    const [tilaus] = await sql()`insert into orders (customer_email, customer_name, recipient_name, phone, shipping_address,
        items, subtotal, shipping, discount_code, discount, bundle_discount, total, gift_card_code, gift_card_amount, printify_status)
      values (${pyynto.customerEmail.trim()}, ${pyynto.customerName || null}, ${pyynto.recipientName?.trim()?.slice(0, 200) || null},
        ${pyynto.shippingAddress?.phone || null}, ${sql().json(osoite)},
        ${sql().json(laskettu.rivit.map(({ unit_cents, ...r }) => r))}, ${laskettu.subtotal}, ${laskettu.shipping},
        ${pyynto.discountCode ? String(pyynto.discountCode).toUpperCase() : null}, ${laskettu.discount}, ${laskettu.bundle_discount},
        ${laskettu.total}, ${laskettu.gift_card_code}, ${laskettu.gift_card_amount},
        ${laskettu.only_gift_cards ? "ei_tarvita" : "ei_lahetetty"})
      returning *`;
    tilausId = tilaus.id;
    const origin = req.headers.origin || `https://${req.headers.host}`;

    // Lahjakortti kattaa koko summan: ei Stripeä. Veloitus ja maksetuksi merkintä samassa transaktiossa.
    if (laskettu.amount_due <= 0) {
      try {
        await sql().begin(async (tx) => {
          await veloitaLahjakortti(tilaus, tx);
          await tx`update orders set status = 'maksettu', paid_at = now(), amount_paid = 0, updated_at = now() where id = ${tilaus.id}`;
        });
      } catch (e) {
        await sql()`update orders set status = 'peruttu', updated_at = now() where id = ${tilaus.id}`;
        if (e instanceof SaldoEiRiita) throw new KassaVirhe("Lahjakortin saldo ei riitä. Tarkista koodi ja yritä uudelleen.", "giftcard_balance");
        throw e;
      }
      await kirjaaTapahtuma(tilaus.id, "maksettu", { lahjakortti: laskettu.gift_card_amount });
      const [maksettu] = await sql()`select * from orders where id = ${tilaus.id}`;
      await jalkikasittely(maksettu);
      return res.status(200).json({ ok: true, url: `${origin}/tilaus-vahvistettu?tilaus=${tilaus.id}` });
    }

    let lineItems;
    if (laskettu.gift_card_amount > 0) {
      // Stripe Checkout ei hyväksy negatiivisia rivejä: koko tilaus yhtenä rivinä, lahjakortin osuus vähennettynä.
      lineItems = [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Huumorikauppa, tilaus (lahjakortilla maksettu ${laskettu.gift_card_amount.toFixed(2).replace(".", ",")} €)`,
            description: laskettu.rivit.map((r) => `${r.quantity} x ${r.name}`).join(", ").slice(0, 480),
          },
          unit_amount: Math.round(laskettu.amount_due * 100),
        },
        quantity: 1,
      }];
    } else {
      lineItems = laskettu.rivit.map((r) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: r.name,
            ...(kuvaus(r) ? { description: kuvaus(r) } : {}),
            ...(r.image ? { images: [r.image] } : {}),
          },
          unit_amount: r.unit_cents,
        },
        quantity: r.quantity,
      }));
      if (laskettu.shipping > 0) {
        lineItems.push({ price_data: { currency: "eur", product_data: { name: "Toimitus, Posti kotiinkuljetus" }, unit_amount: Math.round(laskettu.shipping * 100) }, quantity: 1 });
      }
    }
    const session = await stripe().checkout.sessions.create({
      customer_email: pyynto.customerEmail.trim(),
      client_reference_id: tilaus.id,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/tilaus-vahvistettu?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kassa`,
      metadata: { order_id: tilaus.id },
      // Kunnes oma tilausvahvistus on käytössä (Resend-domain vahvistettu, SAHKOPOSTI_VAHVISTETTU=1), Stripe lähettää
      // kuitin: receipt_email live-tilassa lähettää sen Stripen sähköpostiasetuksista riippumatta.
      payment_intent_data: { metadata: { order_id: tilaus.id }, ...(omaVahvistusKaytossa() ? {} : { receipt_email: pyynto.customerEmail.trim() }) },
      locale: "fi",
    });
    await sql()`update orders set stripe_session_id = ${session.id} where id = ${tilaus.id}`;
    await kirjaaTapahtuma(tilaus.id, "kassa", { session: session.id, total: laskettu.total, lahjakortti: laskettu.gift_card_amount });
    // Kumppanuusohjelma (pois päältä, api/_lib/vakiot.js KUMPPANUUS): hyväksytty koodi kirjataan tilaukselle.
    const kumppani = await tarkistaKumppani(sql(), pyynto.kumppani);
    if (kumppani) await kirjaaTapahtuma(tilaus.id, "kumppani", { koodi: kumppani });
    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    if (e instanceof KassaVirhe) return res.status(200).json({ ok: false, error: e.message, diagnostics: { error_stage: e.vaihe } });
    console.error("checkout:", e?.message || e);
    if (tilausId) await sql()`update orders set status = 'peruttu', updated_at = now() where id = ${tilausId} and status = 'odottaa_maksua'`.catch(() => {});
    return res.status(200).json({ ok: false, error: "Maksun aloitus epäonnistui. Yritä hetken kuluttua uudelleen.", diagnostics: { error_stage: "stripe_checkout_create" } });
  }
}

const teksti = (x, max) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ALV 25,5 % (sisältyy hintoihin) Stripe-laskun riveille: haetaan tai luodaan kerran. */
let alvId = null;
async function alvVerokanta() {
  if (alvId) return alvId;
  for await (const t of stripe().taxRates.list({ active: true, limit: 100 })) {
    if (t.inclusive && Number(t.percentage) === 25.5 && t.country === "FI") return (alvId = t.id);
  }
  alvId = (await stripe().taxRates.create({ display_name: "ALV", percentage: 25.5, inclusive: true, country: "FI", jurisdiction: "FI", description: "Arvonlisävero 25,5 %" })).id;
  return alvId;
}

/** Yritystilaus laskulla (ks. tiedoston alku). */
async function laskuTilaus(pyynto, res) {
  if (!onStripe() || !onTietokanta()) return res.status(503).json({ ok: false, error: "Laskutus ei ole vielä käytössä." });
  const y = pyynto.yritys || {};
  const tunnus = tarkistaYtunnus(y.ytunnus);
  const a = {
    yritys: teksti(y.yritys, 120), ytunnus: tunnus, nimi: teksti(y.nimi, 100), email: teksti(y.email, 200), puhelin: teksti(y.puhelin, 40),
    osoite: teksti(y.osoite, 200), postinumero: teksti(y.postinumero, 10), kaupunki: teksti(y.kaupunki, 80), viite: teksti(y.viite, 30),
  };
  if (!tunnus) return res.status(200).json({ ok: false, error: "Tarkista Y-tunnus (muoto 1234567-8)." });
  if (!a.yritys || !a.nimi || !a.email || !EMAIL_RE.test(a.email) || !a.osoite || !/^\d{5}$/.test(a.postinumero || "") || !a.kaupunki) {
    return res.status(200).json({ ok: false, error: "Täytä yritys, yhteyshenkilö, sähköposti ja laskutusosoite." });
  }
  const prh = await haeYritys(tunnus);
  if (prh.ok === false) return res.status(200).json({ ok: false, error: prh.syy });
  const t = pyynto.toimitus || {};
  const toimitus = { address: teksti(t.osoite, 200) || a.osoite, zip: teksti(t.postinumero, 10) || a.postinumero, city: teksti(t.kaupunki, 80) || a.kaupunki, phone: a.puhelin };
  let tilausId = null;
  try {
    const tuotteet = await kaikkiTuotteet();
    const kassa = { items: pyynto.items, customerEmail: a.email, customerName: a.nimi, shippingAddress: toimitus, recipientName: teksti(t.nimi, 200) || a.yritys };
    const laskettu = laskeTilaus(kassa, tuotteet, null, {});
    const kpl = laskettu.rivit.filter((r) => r.type !== "giftcard").reduce((s, r) => s + r.quantity, 0);
    if (laskettu.rivit.some((r) => r.type === "giftcard")) return res.status(200).json({ ok: false, error: "Lahjakortit ostetaan tavallisen kassan kautta." });
    if (kpl < YRITYS_MIN_KPL) return res.status(200).json({ ok: false, error: `Laskulla voi tilata vähintään ${YRITYS_MIN_KPL} tuotetta. Pienemmän tilauksen voi maksaa kortilla.` });
    const [tilaus] = await sql()`insert into orders (customer_email, customer_name, recipient_name, phone, shipping_address,
        items, subtotal, shipping, discount_code, discount, bundle_discount, total, gift_card_code, gift_card_amount, printify_status)
      values (${a.email}, ${a.nimi}, ${kassa.recipientName}, ${a.puhelin}, ${sql().json({ ...toimitus, country: "FI" })},
        ${sql().json(laskettu.rivit.map(({ unit_cents, ...r }) => r))}, ${laskettu.subtotal}, ${laskettu.shipping}, null, ${laskettu.discount},
        ${laskettu.bundle_discount}, ${laskettu.total}, null, 0, 'ei_lahetetty')
      returning *`;
    tilausId = tilaus.id;
    const d = laskuData({ rivit: laskettu.rivit, toimitus: laskettu.shipping, tilausId, asiakas: a });
    const asiakas = await stripe().customers.create(d.asiakas);
    const vero = await alvVerokanta();
    const lasku = await stripe().invoices.create({ customer: asiakas.id, ...d.lasku, pending_invoice_items_behavior: "exclude" });
    for (const i of d.items) {
      await stripe().invoiceItems.create({ customer: asiakas.id, invoice: lasku.id, currency: "eur", amount: i.unit_amount * i.quantity,
        description: i.quantity > 1 ? `${i.quantity} x ${i.description} (${(i.unit_amount / 100).toFixed(2).replace(".", ",")} €/kpl)` : i.description,
        tax_rates: [vero] });
    }
    const valmis = await stripe().invoices.finalizeInvoice(lasku.id);
    if (Math.abs(valmis.total / 100 - laskettu.total) > 0.01) throw new Error(`laskun summa ${valmis.total / 100} != tilaus ${laskettu.total}`);
    await stripe().invoices.sendInvoice(valmis.id);
    await kirjaaTapahtuma(tilaus.id, "lasku", { invoice: valmis.id, ytunnus: tunnus, yritys: a.yritys, prh: prh.ok === true ? prh.nimi : "ei vastausta", viite: a.viite });
    const kumppani = await tarkistaKumppani(sql(), pyynto.kumppani);
    if (kumppani) await kirjaaTapahtuma(tilaus.id, "kumppani", { koodi: kumppani });
    return res.status(200).json({ ok: true, lasku: valmis.hosted_invoice_url, tilaus: tilaus.id, summa: laskettu.total });
  } catch (e) {
    if (tilausId) await sql()`update orders set status = 'peruttu', updated_at = now() where id = ${tilausId} and status = 'odottaa_maksua'`.catch(() => {});
    if (e instanceof KassaVirhe) return res.status(200).json({ ok: false, error: e.message });
    console.error("lasku:", e?.message || e);
    return res.status(200).json({ ok: false, error: "Laskun luonti epäonnistui. Yritä hetken kuluttua uudelleen tai pyydä tarjous." });
  }
}
