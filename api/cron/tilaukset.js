/**
 * Tilausvalvonta. Vercel Cron kutsuu tunnin välein (vercel.json "crons", Pro-taso; Vercel lähettää otsakkeen
 * Authorization: Bearer CRON_SECRET itse). Käsiajo samalla otsakkeella.
 *  1. Paikkaus: Stripen maksetut sessiot 72 h ajalta, joita ei ole merkitty maksetuiksi (webhook jäi tulematta).
 *  2. Uudelleenyritys: maksetut tilaukset, joita ei ole saatu Printifyn tuotantoon (ei_lahetetty, luotu = Printifyssä
 *     on-hold, virhe). send_to_production uudelleen kasvavin välein (15 min, 30 min, 1 h, 2 h, sitten 4 h), hälytys heti
 *     ensimmäisestä virheestä (api/_lib/tilaus.js).
 *  2b. Lahjakortit: maksetut tilaukset, joiden lahjakortteja ei ole luotu tai lähetetty, tai joiden lahjakorttiosuutta
 *     ei ole veloitettu kortilta.
 *  2c. Jumissa yli 2 h (maksettu, ei tuotannossa): oma hälytys kerran per tilaus.
 *  3. Seuranta: tuotannossa olevien Printify-tila; lähetyksestä seurantakoodi ja viesti asiakkaalle. Jos Printify
 *     näyttää tuotantoon lähetetyn tilauksen on-hold-tilassa, se palautetaan uudelleenyritykseen ja omistaja saa
 *     hälytyksen heti; has-issues tai peruttu: hälytys.
 *  3c. Tilausvahdin pysäyttämät (printify_status 'pysaytetty'): ei uudelleenyritystä eikä hälytyksiä. Jos omistaja on
 *     lähettänyt tilauksen Printifyn hallinnasta tuotantoon, tila palautetaan 'tuotannossa' ja seuranta jatkuu.
 *  3b. Toimituspäivä (delivered_at) lähetetyille arviopyyntöä varten.
 *  4. Markkinointi: keskeneräisen tilauksen muistutukset ja arviopyynnöt (api/_lib/markkinointi.js, lähetysraja).
 *  5. Päivän yhteenvedon varmistus: jos klo 7 ajo jäi tekemättä, lähetetään klo 9 jälkeen.
 * ?kuiva=1 listaa vain, mitä tehtäisiin.
 *
 * ?tehtava=yhteenveto: päivän yhteenveto (api/_lib/valvonta.js). Vercel Cron kutsuu 04:00 ja 05:00 UTC; vain
 * Helsingin kello 7 -ajo lähettää (kesä- ja talviaika), kv estää toisen lähetyksen. &pakota=1 ohittaa kellonajan.
 *
 * ?tehtava=saatavuus: Printify-varianttien saatavuustarkistus (api/_lib/saatavuus.js) yhtenä eränä (noin 35 s, 5
 * kutsua sekunnissa). Vercel Cron kutsuu viiden minuutin välein klo 05-06 UTC; kun kaikki on tarkistettu (jaljella 0),
 * loput kutsut eivät tee mitään.
 *
 * ?tehtava=resend-domain: lisää huumorikauppa.fi Resendiin (alue eu-west-1), jos sitä ei ole, ja palauttaa domainin tilan
 * ja vahvistukseen tarvittavat DNS-tietueet (KAYTTOONOTTO.md). &vahvista=1 pyytää Resendiä tarkistamaan tietueet.
 *
 * ?tehtava=katetarkistus: näkyvien tuotteiden katevalvonta (api/_lib/katevalvonta.js) maanantaisin; yhteenveto
 * sähköpostilla omistajalle, jos jokin tuote on alle myynnin rajan tai kulut ovat tuntemattomat.
 *
 * ?tehtava=eu-siirrot: kirjatut EU-painotalosiirrot (data/eu-siirto-*.json) kantaan, kulut mukaan (api/_lib/eu-siirrot.js,
 * sama kirjastokoodi kuin scripts/printify-eu-painotalot.mjs --paivita-kanta). Idempotentti; ajetaan käsin julkaisun
 * jälkeen (ei Vercel Cronissa). Vastaus kertoo, osoittavatko EU-reitityksen piilottamat rivit EU-kopioihin.
 */
import { onTietokanta, sql, kirjaaTapahtuma } from "../_lib/db.js";
import { onStripe, stripe } from "../_lib/stripe.js";
import { kasitteleMaksu, lahetaPrintifyyn, halytetaanko, seuraavaYritys } from "../_lib/tilaus.js";
import { haeTilaus, lahetys, onPrintify, haeTuote, haeKatalogiVariantit, luoTilaus, tilausRunko, peruTilaus, haePainotalo } from "../_lib/printify.js";
import { laheta, lahetysViesti, halytys, tilausnumero, OMISTAJA, onSahkoposti, vahvistusViesti } from "../_lib/sahkoposti.js";
import { tarkistaEnnenTuotantoa } from "../_lib/tilausvahti.js";
import { hinnoitteleRivi } from "../_lib/kokohinnat.js";
import { ajaSaatavuus, pgVarasto, teeKuristin, muutosRivit } from "../_lib/saatavuus.js";
import { toimitaLahjakortit, veloitaLahjakortti } from "../_lib/lahjakortti-db.js";
import { kaikkiTuotteet } from "../_lib/tuotteet.js";
import { helsinki, printifyTila, jumissaYli, ajaYhteenveto, pgValvonta, KV_YHTEENVETO, JUMISSA_TUNTIA, pysaytetynSeuranta } from "../_lib/valvonta.js";
import { ajaMarkkinointi } from "../_lib/markkinointi.js";
import { pgMarkkinointi } from "../_lib/markkinointi-db.js";
import { katevalvonta, yhteenveto as kateYhteenveto, katetarkistusAihe, htmlEsi } from "../_lib/katevalvonta.js";
import { ajaEuSiirrot, euSiirtoKansio } from "../_lib/eu-siirrot.js";
import { postgresKanta, printifyHaut, tuoPrintifysta, lueEuSiirrot } from "../../scripts/lib/eu-kanta.mjs";
import { buildProductRow, fetchPrintifyProductById } from "../_lib/printify-sync.generated.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Vercelin funktioraja 60 s: valinnaiset vaiheet (3b, 4) jäävät seuraavaan ajoon, jos aikaa on kulunut yli tämän.
const AIKARAJA_MS = 40000;

export default async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).json({ error: "ei oikeutta" });
  if (!onTietokanta()) return res.status(503).json({ error: "DATABASE_URL puuttuu" });
  const kuiva = req.query.kuiva === "1";
  const loki = [];
  const db = sql();
  const alku = Date.now();
  const aikaa = () => Date.now() - alku < AIKARAJA_MS;

  if (req.query.tehtava === "yhteenveto") {
    const r = await ajaYhteenveto(pgValvonta(db, kaikkiTuotteet, onPrintify() ? { haeTilaus } : {}), { laheta, vastaanottaja: OMISTAJA(), pakota: req.query.pakota === "1", kuiva });
    return res.status(200).json({ ok: true, kuiva, lahetetty: r.lahetetty, syy: r.syy ?? null, rivit: r.sisalto?.rivit ?? [] });
  }

  if (req.query.tehtava === "saatavuus") {
    if (!onPrintify()) return res.status(503).json({ error: "Printify-avain puuttuu", jaljella: 0 });
    const kurista = teeKuristin();
    const r = await ajaSaatavuus(pgVarasto(db), {
      haeTuote: kurista((id) => haeTuote(id, { aikaraja: 10000 })),
      haeKatalogi: kurista(haeKatalogiVariantit),
      kuiva,
      ilmoita: async (muutokset, virheet) => {
        if (!onSahkoposti()) return { ok: false, eiKaytossa: true };
        const rivit = muutosRivit(muutokset);
        const lisa = virheet.length ? [`Tarkistusvirheitä viimeisessä erässä: ${virheet.length} (esim. ${virheet[0]})`] : [];
        return halytys(`Tuotteiden saatavuus muuttui (${muutokset.length} tuotetta)`, [...rivit.slice(0, 200), ...(rivit.length > 200 ? [`... ja ${rivit.length - 200} riviä lisää`] : []), ...lisa]);
      },
    });
    return res.status(200).json({ ok: true, kuiva, ...r });
  }

  if (req.query.tehtava === "resend-domain") {
    if (!onSahkoposti()) return res.status(503).json({ error: "RESEND_API_KEY puuttuu" });
    const resend = async (polku, init = {}) => {
      const r = await fetch(`https://api.resend.com${polku}`, { ...init, headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" } });
      return { status: r.status, body: await r.json().catch(() => ({})) };
    };
    const lista = await resend("/domains");
    if (lista.status !== 200) return res.status(502).json({ error: "Resendin domainlista epäonnistui", status: lista.status, viesti: lista.body?.message ?? null });
    let domain = (lista.body.data || []).find((d) => d.name === "huumorikauppa.fi");
    if (!domain && !kuiva) domain = (await resend("/domains", { method: "POST", body: JSON.stringify({ name: "huumorikauppa.fi", region: "eu-west-1" }) })).body;
    if (domain?.id && req.query.vahvista === "1" && !kuiva) await resend(`/domains/${domain.id}/verify`, { method: "POST" });
    const tiedot = domain?.id ? (await resend(`/domains/${domain.id}`)).body : null;
    return res.status(200).json({ ok: true, kuiva, domain: tiedot ? { name: tiedot.name, status: tiedot.status, region: tiedot.region, records: tiedot.records } : null });
  }

  if (req.query.tehtava === "katetarkistus") {
    // Koon mukaiset hinnat (api/_lib/kokohinnat.js) mukaan; raportti näyttää myös alle rajan jäävät (piilotetut) variantit.
    const tuotteet = (await db`select * from products`).map((r) => hinnoitteleRivi({ ...r, price: Number(r.price) }));
    const t = katevalvonta(tuotteet);
    const teksti = kateYhteenveto(t, "tietokanta");
    const huomioita = t.alle.length + t.tuntematon.length;
    const r = huomioita && !kuiva && onSahkoposti() ? await laheta({ to: OMISTAJA(), subject: katetarkistusAihe(t), text: teksti, html: htmlEsi(teksti) }) : null;
    return res.status(200).json({ ok: true, kuiva, tarkistettu: t.tarkistettu, alle: t.alle.length, tuntematon: t.tuntematon.length, lahetetty: !!r?.ok, virhe: r && !r.ok ? r.virhe : null });
  }

  // Käyttöönottotesti (KAYTTOONOTTO.md, scripts/kayttoonotto.sh): scripts/kassatesti.mjs:n tilaukset (kassatesti@huumorikauppa.fi,
  // 2 h) Neonissa, Stripe-sessiot vanhennetaan (Stripe lähettää webhookin checkout.session.expired -> tilaus peruttu),
  // viimeisimmästä Printify-tilaus pitoon, painotalon tarkistus ja peruutus ennen tuotantoa, vahvistusviesti omistajalle.
  if (req.query.tehtava === "kayttoonottotesti") {
    const tilaukset = await db`select * from orders where customer_email = 'kassatesti@huumorikauppa.fi' and created_at > now() - interval '2 hours' order by created_at desc limit 5`;
    if (!tilaukset.length) return res.status(404).json({ error: "Ei testitilauksia 2 tunnin ajalta: aja ensin node scripts/kassatesti.mjs" });
    const tulos = { neon: [], stripe: [], printify: null, resend: null, webhook: [] };
    for (const t of tilaukset) {
      tulos.neon.push({ id: t.id.slice(0, 8), status: t.status, total: Number(t.total), shipping: Number(t.shipping),
        rivit: (t.items || []).map((i) => `${i.quantity} x ${i.name} ${i.color || ""}/${i.size || ""} ${i.unit_price} € (variantti ${i.variant_id})`) });
      if (!t.stripe_session_id || !onStripe()) continue;
      try {
        const s = await stripe().checkout.sessions.retrieve(t.stripe_session_id);
        const e = { id: t.id.slice(0, 8), tila: s.status, livemode: s.livemode, summa: (s.amount_total ?? 0) / 100 };
        if (s.status === "open" && !kuiva) e.vanhennettu = (await stripe().checkout.sessions.expire(s.id)).status === "expired";
        tulos.stripe.push(e);
      } catch (e) {
        tulos.stripe.push({ id: t.id.slice(0, 8), virhe: String(e?.message || e) });
      }
    }
    const t = tilaukset[0];
    if (onPrintify() && !kuiva) {
      const r = await luoTilaus({ ...tilausRunko(t), external_id: `${t.id}-testi`, label: "KAYTTOONOTTOTESTI (perutaan)", send_shipping_notification: false });
      if (!r.ok || !r.data?.id) tulos.printify = { luotu: false, virhe: r.virhe || r.status };
      else {
        const id = r.data.id;
        // Printify laskee uutta tilausta hetken (pending), eikä sitä voi perua ennen tilaa on-hold.
        let h = await haeTilaus(id);
        for (let i = 0; i < 10 && h.ok && h.data?.status === "pending"; i++) {
          await new Promise((ok) => setTimeout(ok, 2000));
          h = await haeTilaus(id);
        }
        const v = h.ok ? await tarkistaEnnenTuotantoa(h.data, t, { haePainotalo }) : null;
        let p = await peruTilaus(id);
        for (let i = 0; i < 3 && !p.ok; i++) {
          await new Promise((ok) => setTimeout(ok, 3000));
          p = await peruTilaus(id);
        }
        if (!p.ok) await halytys("Käyttöönottotestin Printify-tilaus jäi perumatta", [`Printify-tilaus ${id}`, "Peru se Printifyn hallinnassa (Orders > Cancel)."]);
        const j = await haeTilaus(id);
        tulos.printify = { luotu: true, id, tila_ennen: h.data?.status, painotalot: v?.rivit.map((x) => `${x.nimi} (${x.maa || "?"}) EU ${x.eu}`),
          tilausvahti: v?.tulos, kulu_ilman_alv: v?.kulut?.kuluIlmanAlv ?? null, peruutus: p.ok ? "ok" : p.virhe || p.status, tila_jalkeen: j.data?.status };
      }
    }
    if (!kuiva) {
      const v = vahvistusViesti(t);
      const r = await laheta({ to: OMISTAJA(), ...v, subject: `[KÄYTTÖÖNOTTOTESTI] ${v.subject}` });
      tulos.resend = { lahetetty: r.ok, vastaanottaja: OMISTAJA(), virhe: r.ok ? null : r.virhe };
      await new Promise((ok) => setTimeout(ok, 8000));
    }
    for (const x of tilaukset) {
      const [n] = await db`select status from orders where id = ${x.id}`;
      const tap = await db`select kind, details from order_events where order_id = ${x.id} order by created_at`;
      tulos.webhook.push({ id: x.id.slice(0, 8), status: n?.status, tapahtumat: tap.map((e) => e.kind + (e.details?.syy ? ` (${e.details.syy})` : "")) });
    }
    return res.status(200).json({ ok: true, kuiva, ...tulos });
  }

  // Lovablessa myynnissä olleet, omasta kaupasta puuttuneet tuotteet (data/lovable-aktiiviset-2026-10-27.json):
  // Printifystä kuluineen kantaan (scripts/lib/eu-kanta.mjs tuoPrintifysta), sitten näkyviin Lovablen slugilla ja hinnalla.
  if (req.query.tehtava === "tuo-aktiiviset") {
    if (!onPrintify()) return res.status(503).json({ error: "Printify-avain puuttuu" });
    const data = JSON.parse(readFileSync(join(euSiirtoKansio() || join(process.cwd(), "data"), "lovable-aktiiviset-2026-10-27.json"), "utf8"));
    const { kulutRivi } = printifyHaut({ apiKey: process.env.PRINTIFY_API_KEY, shopId: process.env.PRINTIFY_SHOP_ID });
    const siirrot = lueEuSiirrot(euSiirtoKansio());
    const tulos = [];
    for (const t of data.tuotteet) {
      if (!aikaa()) { tulos.push({ slug: t.slug, tila: "aika loppui, aja uudelleen" }); continue; }
      const id = String(t.printify_product_id);
      const pf = await fetchPrintifyProductById(id);
      if (!pf) { tulos.push({ slug: t.slug, tila: "ei Printifyssä" }); continue; }
      const r = kuiva ? null : await tuoPrintifysta({ tuotteet: [pf], kanta: postgresKanta(db), siirrot, buildProductRow, kulutRivi, kulut: true, julkaise: false });
      let rivi = (await db`select id, slug, price, is_active from products where printify_product_id = ${id}`)[0];
      if (rivi && !kuiva) {
        const vapaa = rivi.slug === t.slug || !(await db`select 1 from products where slug = ${t.slug}`).length;
        rivi = (await db`update products set is_active = true, price = ${t.lovable_price}, slug = ${vapaa ? t.slug : rivi.slug}, updated_at = now()
          where id = ${rivi.id} returning slug, price, is_active`)[0];
      }
      tulos.push({ slug: t.slug, tuonti: r ? { uusia: r.uusia, paivitetty: r.paivitetty, ohitettu: r.ohitettu + r.ohitettuSiirretty } : null, rivi: rivi ?? null });
    }
    return res.status(200).json({ ok: true, kuiva, tulos });
  }

  if (req.query.tehtava === "eu-siirrot") {
    if (!onPrintify()) return res.status(503).json({ error: "Printify-avain puuttuu" });
    const haut = printifyHaut({ apiKey: process.env.PRINTIFY_API_KEY, shopId: process.env.PRINTIFY_SHOP_ID });
    const r = await ajaEuSiirrot({ kanta: postgresKanta(db), haut, buildProductRow, kuiva, aikaa });
    return res.status(r.ok ? 200 : 500).json(r);
  }

  // 1. Paikkaus Stripestä
  if (onStripe()) {
    const alku = Math.floor(Date.now() / 1000) - 72 * 3600;
    for await (const s of stripe().checkout.sessions.list({ created: { gte: alku }, status: "complete", limit: 100 })) {
      if (s.payment_status !== "paid") continue;
      const id = s.metadata?.order_id || s.client_reference_id;
      const [t] = id ? await db`select status from orders where id = ${id}` : [];
      if (t?.status === "maksettu") continue;
      loki.push(`paikkaus ${s.id}`);
      if (!kuiva) await kasitteleMaksu(s);
    }
  }

  // 2. Printify-uudelleenyritykset
  const yritettavat = await db`select id from orders where status = 'maksettu'
    and printify_status in ('ei_lahetetty', 'luotu', 'virhe') and (next_retry_at is null or next_retry_at <= now())
    order by paid_at limit 20`;
  for (const { id } of yritettavat) {
    if (kuiva) { loki.push(`yritys ${id}`); continue; }
    const r = await lahetaPrintifyyn(id);
    loki.push(`yritys #${tilausnumero(id)}: ${r.ok ? "tuotannossa" : `${r.vaihe}: ${r.viesti}`}`);
  }

  // 2b. Lahjakortit
  const kortitTekematta = await db`select o.* from orders o where o.status = 'maksettu' and o.paid_at > now() - interval '30 days'
    and (
      (select coalesce(sum((e->>'quantity')::int), 0) from jsonb_array_elements(o.items) e where e->>'type' = 'giftcard')
        > (select count(*) from gift_cards g where g.order_id = o.id)
      or exists (select 1 from gift_cards g where g.order_id = o.id and g.emailed_at is null)
      or (o.gift_card_code is not null and o.gift_card_amount > 0 and o.gift_card_charged_at is null
        and not exists (select 1 from order_events v where v.order_id = o.id and v.kind = 'lahjakortti_saldo_ei_riita'))
    )
    order by o.paid_at limit 20`;
  for (const t of kortitTekematta) {
    loki.push(`lahjakortit #${tilausnumero(t.id)}`);
    if (kuiva) continue;
    if (t.gift_card_code && !t.gift_card_charged_at) await veloitaLahjakortti(t);
    await toimitaLahjakortit(t);
  }

  // 2c. Jumissa yli 2 h: hälytys kerran per tilaus (uudelleenyritykset jatkuvat kohdassa 2). Uudet sarakkeet
  // (db/schema.sql) puuttuvat, jos skeemaa ei ole ajettu: vaihe ohitetaan eikä muu valvonta kaadu.
  const jumissa = jumissaYli(await db`select * from orders where status = 'maksettu'
    and printify_status in ('ei_lahetetty', 'luotu', 'virhe') and stuck_alert_sent_at is null order by paid_at limit 50`
    .catch((e) => { loki.push(`jumissa-tarkistus: ${e?.message} (aja db/schema.sql)`); return []; }));
  if (jumissa.length) {
    loki.push(`jumissa yli ${JUMISSA_TUNTIA} h: ${jumissa.length}`);
    if (!kuiva) {
      const r = await halytys(`${jumissa.length} maksettua tilausta ei ole päässyt Printifyn tuotantoon ${JUMISSA_TUNTIA} tunnissa`, [
        ...jumissa.map((t) => `#${tilausnumero(t.id)} ${t.customer_email}: ${t.printify_status === "luotu" ? `Printifyssä on-hold (${t.printify_order_id})` : t.printify_status}, yrityksiä ${t.printify_attempts || 0}${t.printify_error ? `, ${t.printify_error}` : ""}`),
        "Valvonta yrittää send_to_production-kutsua uudelleen automaattisesti. Tarkista Printifyn hallinnasta maksutapa ja tilaus.",
      ]);
      if (r.ok) for (const t of jumissa) await db`update orders set stuck_alert_sent_at = now() where id = ${t.id}`;
    }
  }

  // 3. Seuranta
  if (onPrintify()) {
    const tuotannossa = await db`select * from orders where status = 'maksettu' and printify_status = 'tuotannossa' order by sent_to_production_at limit 40`;
    for (const t of tuotannossa) {
      const r = await haeTilaus(t.printify_order_id);
      if (!r.ok) { loki.push(`seuranta #${tilausnumero(t.id)}: ${r.virhe}`); continue; }
      const l = lahetys(r.data);
      if (l && (l.numero || l.url)) {
        loki.push(`lähetetty #${tilausnumero(t.id)}`);
        if (kuiva) continue;
        await db`update orders set printify_status = 'lahetetty', carrier = ${l.carrier}, tracking_number = ${l.numero},
          tracking_url = ${l.url}, shipped_at = now(), updated_at = now() where id = ${t.id}`;
        if (l.toimitettu) await db`update orders set delivered_at = ${new Date(l.toimitettu)} where id = ${t.id}`.catch(() => {});
        await kirjaaTapahtuma(t.id, "lahetetty", l);
        const p = await laheta({ to: t.customer_email, ...lahetysViesti({ ...t, carrier: l.carrier, tracking_number: l.numero, tracking_url: l.url }) });
        if (p.ok) await db`update orders set shipping_email_sent_at = now() where id = ${t.id}`;
      } else if (printifyTila(r.data?.status) === "uudelleen" && !kuiva) {
        // On-hold tuotantoon lähetyksen jälkeen: takaisin uudelleenyritykseen (send_to_production viiveellä).
        const yrityksia = (t.printify_attempts || 0) + 1;
        const halyta = halytetaanko(t);
        await db`update orders set printify_status = 'luotu', printify_error = ${`Printify ${r.data.status} tuotantoon lähetyksen jälkeen`},
          printify_attempts = ${yrityksia}, next_retry_at = ${seuraavaYritys(yrityksia)}, updated_at = now()
          ${halyta ? db`, alert_sent_at = now()` : db``} where id = ${t.id}`;
        // Hälytys on jo lähetetty: kohta 2c ei hälytä samasta tilauksesta uudelleen.
        if (halyta) await db`update orders set stuck_alert_sent_at = now() where id = ${t.id}`.catch(() => {});
        await kirjaaTapahtuma(t.id, "printify_on_hold", { status: r.data.status });
        if (halyta) {
          await halytys(`Printify-tilaus #${tilausnumero(t.id)} tilassa ${r.data.status}`, [`Printify ${t.printify_order_id}`, `Asiakas ${t.customer_email}`,
            `Valvonta lähettää tilauksen tuotantoon uudelleen ${seuraavaYritys(yrityksia).toISOString()}.`, "Tarkista Printifyn hallinnasta maksutapa ja osoite."]);
        }
        loki.push(`on-hold #${tilausnumero(t.id)}: uudelleenyritys`);
      } else if (printifyTila(r.data?.status) === "halyta" && halytetaanko(t) && !kuiva) {
        await db`update orders set alert_sent_at = now() where id = ${t.id}`;
        await halytys(`Printify-tilaus #${tilausnumero(t.id)} tilassa ${r.data.status}`, [`Printify ${t.printify_order_id}`, `Asiakas ${t.customer_email}`, "Tarkista Printifyn hallinnasta (maksutapa, osoite, tuote)."]);
        loki.push(`hälytys #${tilausnumero(t.id)} ${r.data.status}`);
      }
    }
  }

  // 3c. Pysäytetyt: omistajan päätös Printifyssä (tuotantoon lähetetty) näkyy myös täällä. Ei uudelleenyrityksiä.
  if (onPrintify() && aikaa()) try {
    const pysaytetyt = await db`select id, printify_order_id from orders where status = 'maksettu' and printify_status = 'pysaytetty'
      and printify_order_id is not null order by paid_at limit 20`;
    for (const t of pysaytetyt) {
      if (!aikaa()) break;
      const r = await haeTilaus(t.printify_order_id);
      if (!r.ok || pysaytetynSeuranta(r.data?.status, !!lahetys(r.data)) !== "tuotannossa") continue;
      loki.push(`pysäytetty #${tilausnumero(t.id)}: omistaja lähetti tuotantoon`);
      if (kuiva) continue;
      await db`update orders set printify_status = 'tuotannossa', printify_error = null, sent_to_production_at = now(), updated_at = now()
        where id = ${t.id} and printify_status = 'pysaytetty'`;
      await kirjaaTapahtuma(t.id, "printify_omistaja_lahetti", { status: r.data.status });
    }
  } catch (e) {
    loki.push(`pysäytetyt: ${e?.message || e}`);
  }

  // 3a. Seurantaviesti, jonka lähetys epäonnistui (Resendin virhe): uusi yritys viikon ajan.
  if (onSahkoposti()) {
    const lahettamatta = await db`select * from orders where status = 'maksettu' and printify_status = 'lahetetty'
      and shipping_email_sent_at is null and shipped_at > now() - interval '7 days' and shipped_at < now() - interval '30 minutes'
      order by shipped_at limit 10`;
    for (const t of lahettamatta) {
      loki.push(`seurantaviesti uudelleen #${tilausnumero(t.id)}`);
      if (kuiva) continue;
      const p = await laheta({ to: t.customer_email, ...lahetysViesti(t) });
      if (p.ok) await db`update orders set shipping_email_sent_at = now() where id = ${t.id}`;
    }
  }

  // 3b. Toimituspäivä arviopyyntöä varten (lähetetty yli 2 pv sitten, ei vielä toimitettu).
  if (onPrintify() && aikaa()) try {
    const toimitettavat = await db`select id, printify_order_id from orders where status = 'maksettu' and printify_status = 'lahetetty'
      and delivered_at is null and review_email_sent_at is null and printify_order_id is not null
      and shipped_at < now() - interval '2 days' and shipped_at > now() - interval '30 days' order by shipped_at limit 15`;
    for (const t of toimitettavat) {
      if (!aikaa()) break;
      const r = await haeTilaus(t.printify_order_id);
      const toimitettu = r.ok ? lahetys(r.data)?.toimitettu : null;
      if (toimitettu && !kuiva) await db`update orders set delivered_at = ${new Date(toimitettu)} where id = ${t.id}`;
    }
  } catch (e) {
    loki.push(`toimituspäivä: ${e?.message || e}`);
  }

  // 4. Markkinointi: muistutukset ja arviopyynnöt (lähetysraja, api/_lib/markkinointi.js).
  if (onSahkoposti() && aikaa()) {
    try {
      const m = await ajaMarkkinointi(pgMarkkinointi(db), { laheta, kuiva });
      loki.push(...m.loki);
    } catch (e) {
      // Taulut puuttuvat (schema.sql ajamatta) tai muu virhe: ei kaada tilausvalvontaa.
      loki.push(`markkinointi: ${e?.message || e}`);
    }
  }

  // 5. Päivän yhteenvedon varmistus: klo 7 ajo jäi tekemättä (GitHub Actionsin viive tai virhe).
  const h = helsinki();
  if (h.tunti >= 9 && (await db`select value from kv where key = ${KV_YHTEENVETO}`)[0]?.value !== h.paiva) {
    try {
      const r = await ajaYhteenveto(pgValvonta(db, kaikkiTuotteet, onPrintify() ? { haeTilaus } : {}), { laheta, vastaanottaja: OMISTAJA(), pakota: true, kuiva });
      loki.push(`yhteenveto (myöhässä): ${r.lahetetty ? "lähetetty" : r.syy}`);
    } catch (e) {
      loki.push(`yhteenveto: ${e?.message || e}`);
    }
  }
  return res.status(200).json({ ok: true, kuiva, loki });
}
