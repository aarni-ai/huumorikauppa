/**
 * Tilausvalvonta. GitHub Actions kutsuu tunnin välein (tilausvalvonta.yml) ja Vercel Cron kerran päivässä
 * (vercel.json). Authorization: Bearer CRON_SECRET.
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
 *  3b. Toimituspäivä (delivered_at) lähetetyille arviopyyntöä varten.
 *  4. Markkinointi: keskeneräisen tilauksen muistutukset ja arviopyynnöt (api/_lib/markkinointi.js, lähetysraja).
 *  5. Päivän yhteenvedon varmistus: jos klo 7 ajo jäi tekemättä, lähetetään klo 9 jälkeen.
 * ?kuiva=1 listaa vain, mitä tehtäisiin.
 *
 * ?tehtava=yhteenveto: päivän yhteenveto (api/_lib/valvonta.js). GitHub Actions (paivayhteenveto.yml) kutsuu 04:00 ja
 * 05:00 UTC; vain Helsingin kello 7 -ajo lähettää (kesä- ja talviaika), kv estää toisen lähetyksen. &pakota=1 ohittaa
 * kellonajan.
 *
 * ?tehtava=saatavuus: Printify-varianttien saatavuustarkistus (api/_lib/saatavuus.js) yhtenä eränä (noin 35 s, 5
 * kutsua sekunnissa). GitHub Actions (saatavuus.yml) kutsuu kerran päivässä uudelleen, kunnes vastauksen jaljella on 0.
 * Erillinen tehtävä samassa funktiossa, koska Vercel Hobby rajaa funktioiden ja Vercel Cronien määrää.
 */
import { onTietokanta, sql, kirjaaTapahtuma } from "../_lib/db.js";
import { onStripe, stripe } from "../_lib/stripe.js";
import { kasitteleMaksu, lahetaPrintifyyn, halytetaanko, seuraavaYritys } from "../_lib/tilaus.js";
import { haeTilaus, lahetys, onPrintify, haeTuote, haeKatalogiVariantit } from "../_lib/printify.js";
import { laheta, lahetysViesti, halytys, tilausnumero, OMISTAJA, onSahkoposti } from "../_lib/sahkoposti.js";
import { ajaSaatavuus, pgVarasto, teeKuristin, muutosRivit } from "../_lib/saatavuus.js";
import { toimitaLahjakortit, veloitaLahjakortti } from "../_lib/lahjakortti-db.js";
import { kaikkiTuotteet } from "../_lib/tuotteet.js";
import { helsinki, printifyTila, jumissaYli, ajaYhteenveto, pgValvonta, KV_YHTEENVETO, JUMISSA_TUNTIA } from "../_lib/valvonta.js";
import { ajaMarkkinointi } from "../_lib/markkinointi.js";
import { pgMarkkinointi } from "../_lib/markkinointi-db.js";

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
    const r = await ajaYhteenveto(pgValvonta(db, kaikkiTuotteet), { laheta, vastaanottaja: OMISTAJA(), pakota: req.query.pakota === "1", kuiva });
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

  // 2c. Jumissa yli 2 h: hälytys kerran per tilaus (uudelleenyritykset jatkuvat kohdassa 2).
  const jumissa = jumissaYli(await db`select * from orders where status = 'maksettu'
    and printify_status in ('ei_lahetetty', 'luotu', 'virhe') and stuck_alert_sent_at is null order by paid_at limit 50`);
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
          tracking_url = ${l.url}, shipped_at = now(), delivered_at = ${l.toimitettu ? new Date(l.toimitettu) : null}, updated_at = now() where id = ${t.id}`;
        await kirjaaTapahtuma(t.id, "lahetetty", l);
        const p = await laheta({ to: t.customer_email, ...lahetysViesti({ ...t, carrier: l.carrier, tracking_number: l.numero, tracking_url: l.url }) });
        if (p.ok) await db`update orders set shipping_email_sent_at = now() where id = ${t.id}`;
      } else if (printifyTila(r.data?.status) === "uudelleen" && !kuiva) {
        // On-hold tuotantoon lähetyksen jälkeen: takaisin uudelleenyritykseen (send_to_production viiveellä).
        const yrityksia = (t.printify_attempts || 0) + 1;
        const halyta = halytetaanko(t);
        await db`update orders set printify_status = 'luotu', printify_error = ${`Printify ${r.data.status} tuotantoon lähetyksen jälkeen`},
          printify_attempts = ${yrityksia}, next_retry_at = ${seuraavaYritys(yrityksia)}, updated_at = now()
          ${halyta ? db`, alert_sent_at = now(), stuck_alert_sent_at = now()` : db``} where id = ${t.id}`;
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
  if (onPrintify() && aikaa()) {
    const toimitettavat = await db`select id, printify_order_id from orders where status = 'maksettu' and printify_status = 'lahetetty'
      and delivered_at is null and review_email_sent_at is null and printify_order_id is not null
      and shipped_at < now() - interval '2 days' and shipped_at > now() - interval '30 days' order by shipped_at limit 15`;
    for (const t of toimitettavat) {
      if (!aikaa()) break;
      const r = await haeTilaus(t.printify_order_id);
      const toimitettu = r.ok ? lahetys(r.data)?.toimitettu : null;
      if (toimitettu && !kuiva) await db`update orders set delivered_at = ${new Date(toimitettu)} where id = ${t.id}`;
    }
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
    const r = await ajaYhteenveto(pgValvonta(db, kaikkiTuotteet), { laheta, vastaanottaja: OMISTAJA(), pakota: true, kuiva });
    loki.push(`yhteenveto (myöhässä): ${r.lahetetty ? "lähetetty" : r.syy}`);
  }
  return res.status(200).json({ ok: true, kuiva, loki });
}
