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
 * ?tehtava=hintatarkistus: t-paitojen todelliset myyntihinnat (api/_lib/kokohinnat.js) päivittäin tauluun hintahistoria ja
 * 30 päivän alimman hinnan näyttö (Black Friday). Hälyttää, jos kampanjaan kuuluva t-paita (suora vertailu) ei ole 24,90 €.
 * ?tehtava=alennuskoodit[&poista=KOODI]: kannan alennuskoodit ja niiden käyttö maksetuissa tilauksissa.
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
import { haeTilaus, lahetys, onPrintify, haeTuote, haeKatalogiVariantit, luoTilaus, tilausRunko, peruTilaus, haePainotalo, listaaTilaukset, listaaTuotteet, haeToimitusajat } from "../_lib/printify.js";
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
import { buildProductRow as buildProductRowPrintify } from "../_lib/printify-sync.generated.js";
import { korjaaNimi, nimiKorjattava } from "../_lib/tuotenimi.js";
import { ga4Viikot, ga4Suppilo } from "../_lib/ga4.js";

// Printifyn otsikoissa voi olla ajatusviivoja; kantaan tuotaessa nimi siistitään samalla tavalla kuin 28.10.2026 korjatut.
const buildProductRow = (...a) => {
  const rivi = buildProductRowPrintify(...a);
  return rivi && typeof rivi === "object" && "name" in rivi ? { ...rivi, name: korjaaNimi(rivi.name) } : rivi;
};
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

  // Hintatarkistus (Black Friday, kuluttajansuojalaki 2:6 a §): tallentaa t-paitojen hinnat päivittäin tauluun
  // hintahistoria ja raportoi 30 päivän alimman hinnan näytön: nykyiset hinnat, luonti- ja päivitysajat,
  // maksettujen tilausten t-paitarivien hinnat ja hintahistoria. Hälyttää, jos kampanjan t-paidan hinta poikkeaa
  // kampanjan kappalehinnasta 30 päivää ennen kampanjaa tai sen aikana (TPAITAPARI_KAMPANJA).
  if (req.query.tehtava === "hintatarkistus") {
    const { TPAITAPARI_KAMPANJA: K } = await import("../_lib/vakiot.js");
    await db`create table if not exists hintahistoria (paiva date not null, slug text not null, price numeric(10,2) not null,
      original_price numeric(10,2), primary key (paiva, slug))`;
    const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
    // Todellinen myyntihinta (perushinta, S-2XL) kokohinnat.js:n säännöillä, ei tuotetaulun price-saraketta (29.10.2026).
    const { onSuoraVertailu } = await import("../_lib/kokohinnat.js");
    const paidat = (await kaikkiTuotteet()).filter((t) => t.category === K.kategoria && t.is_active !== false && !t.variants?.personoitu);
    if (!kuiva && paidat.length) {
      const slugit = paidat.map((t) => t.slug);
      const hinnat = paidat.map((t) => Number(t.price));
      await db`insert into hintahistoria (paiva, slug, price)
        select ${paiva}::date, s, h from unnest(${slugit}::text[], ${hinnat}::numeric[]) as u(s, h)
        on conflict (paiva, slug) do update set price = excluded.price`;
    }
    const ryhmat = new Map();
    for (const t of paidat) {
      const k = `${Number(t.price)}|${onSuoraVertailu(t) ? "kampanja" : "muu"}`;
      ryhmat.set(k, (ryhmat.get(k) || 0) + 1);
    }
    const nyt = [...ryhmat].map(([k, tuotteita]) => ({ price: Number(k.split("|")[0]), ryhma: k.split("|")[1], tuotteita }));
    const ikkunaAlku = new Date(Date.parse(`${K.alku}T00:00:00+02:00`) - 30 * 864e5).toISOString().slice(0, 10);
    const myydyt = await db`select to_char(o.paid_at at time zone 'Europe/Helsinki', 'YYYY-MM-DD') as paiva, (i->>'unit_price')::float as hinta,
        count(*)::int as riveja
      from orders o, jsonb_array_elements(o.items) i
      where o.status = 'maksettu' and o.customer_email <> 'kassatesti@huumorikauppa.fi' and i->>'slug' like '%t-paita%'
        and o.paid_at >= now() - interval '60 days'
      group by 1, 2 order by 1`;
    const historia = await db`select paiva::text, min(price)::float as alin, max(price)::float as ylin, count(*)::int as tuotteita
      from hintahistoria group by paiva order by paiva`;
    // Kampanjaan kuuluvat vain suoran vertailun t-paidat (24,90 €); muut t-paidat 27,90 € eivät kuulu kampanjaan.
    const poikkeavat = nyt.filter((r) => r.ryhma === "kampanja" && Math.abs(r.price - K.kappalehinta) > 0.001);
    const valvontaaika = paiva >= ikkunaAlku && paiva <= K.loppu;
    if (valvontaaika && poikkeavat.length && !kuiva && onSahkoposti()) {
      await halytys("T-paidan hinta poikkeaa Black Friday -kampanjan hinnasta", [
        `Kampanja ${K.alku}-${K.loppu}: kampanjan t-paitojen hinta ${K.kappalehinta} € ja 30 päivän alin hinta ${K.alinHinta30pv} € markkinoinnissa.`,
        ...poikkeavat.map((r) => `${r.tuotteita} kampanjan t-paitaa hinnalla ${r.price} €`),
        "Palauta hinta tai päivitä alinHinta30pv (api/_lib/vakiot.js) ennen kampanjaa.",
      ]);
    }
    return res.status(200).json({ ok: true, kuiva, paiva, ikkuna: { alku: ikkunaAlku, kampanja: `${K.alku}-${K.loppu}` },
      kaikkiKampanjahinnassa: poikkeavat.length === 0, nyt, myydyt, historia });
  }

  // Katetaulu (29.10.2026): yhden tuotteen tilauksen nettokate euroina jokaiselle myytävälle variantille (asiakas maksaa
  // toimituksen), ryhmittäin heikoin ja keskiarvo sekä alle 7 €:n variantit. KATTEET.md "Hinnoittelu 29.10.2026".
  if (req.query.tehtava === "katetaulu") {
    const { laskeTilauksenNettokate } = await import("../_lib/kate.js");
    const { rivinHinta, onSuoraVertailu } = await import("../_lib/kokohinnat.js");
    const { myynnissa } = await import("../_lib/tuotteet.js");
    const { TOIMITUS, ILMAINEN_TOIMITUS_RAJA, LISATUOTE_KATEGORIAT } = await import("../_lib/vakiot.js");
    const ryhmat = {};
    const alle7 = [];
    for (const t of (await kaikkiTuotteet()).filter((x) => x.is_active !== false && myynnissa(x))) {
      const piilo = new Set(t.unavailable_variants || []);
      for (const [avain, id] of Object.entries(t.variants?.variant_map || {})) {
        if (piilo.has(avain)) continue;
        const koko = avain.split("|")[1] || "";
        const hinta = rivinHinta(t, koko);
        const k = laskeTilauksenNettokate([{ tuote: t, varianttiId: id, maara: 1, yksikkohinta: hinta }], hinta >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUS);
        if (!k.tunnettu) continue;
        const nimi = `${t.category}${t.category === "t-paidat" ? (onSuoraVertailu(t) ? " 24,90" : " 27,90") : ""}${/^(3|4|5|6)XL$/i.test(koko) ? " 3XL+" : ""}`;
        const r = (ryhmat[nimi] ||= { hinta, heikoin: Infinity, heikoinTuote: null, summa: 0, n: 0, alle7: 0 });
        if (k.nettokate < r.heikoin) { r.heikoin = k.nettokate; r.heikoinTuote = `${t.slug} ${avain}`; }
        r.summa += k.nettokate; r.n += 1;
        if (k.nettokate < 7) { r.alle7 += 1; if (!LISATUOTE_KATEGORIAT.includes(t.category)) alle7.push({ slug: t.slug, avain, hinta, nettokate: k.nettokate }); }
      }
    }
    const taulu = Object.entries(ryhmat).sort().map(([ryhma, r]) => ({ ryhma, hinta: r.hinta, heikoin: r.heikoin, heikoinTuote: r.heikoinTuote,
      keskiarvo: Math.round((r.summa / r.n) * 100) / 100, variantteja: r.n, alle7: r.alle7 }));
    return res.status(200).json({ ok: true, taulu, alle7: alle7.sort((a, b) => a.nettokate - b.nettokate).slice(0, 100) });
  }

  // Alennuskoodit (katepäätös 29.10.2026): kannan discount_codes ja käyttö maksetuissa tilauksissa.
  // &poista=KOODI asettaa koodin pois käytöstä (is_active = false), rivi säilyy historiaa varten.
  if (req.query.tehtava === "alennuskoodit") {
    if (req.query.poista && !kuiva) {
      await db`update discount_codes set is_active = false where upper(code) = ${String(req.query.poista).toUpperCase()}`;
    }
    const koodit = await db`select code, discount_type, discount_value, is_active from discount_codes order by code`;
    const kaytto = await db`select upper(discount_code) as koodi, count(*)::int as tilauksia, sum(discount)::float as alennukset,
        max(paid_at) as viimeksi from orders where status = 'maksettu' and discount_code is not null group by 1 order by 2 desc`;
    return res.status(200).json({ ok: true, kuiva, koodit, kaytto });
  }

  // Kumppanit (kumppanuusohjelma, api/_lib/kumppani.js): lisäys ja poisto käytöstä.
  //   ?tehtava=kumppani-lisaa&koodi=anna-k&nimi=Anna%20K.&email=...  (päivittää, jos koodi on jo olemassa)
  //   ?tehtava=kumppani-poista&koodi=anna-k                          (aktiivinen = false, tilaushistoria säilyy)
  if (req.query.tehtava === "kumppani-lisaa" || req.query.tehtava === "kumppani-poista") {
    const { kumppaniKoodinMuoto, varmistaKumppanitaulu } = await import("../_lib/kumppani.js");
    const koodi = kumppaniKoodinMuoto(req.query.koodi);
    if (!koodi) return res.status(400).json({ ok: false, virhe: "koodi: pienet kirjaimet, numerot ja väliviiva, 2-40 merkkiä" });
    await varmistaKumppanitaulu(db);
    if (req.query.tehtava === "kumppani-poista") {
      const r = await db`update kumppanit set aktiivinen = false where koodi = ${koodi} returning koodi`;
      return res.status(r.length ? 200 : 404).json({ ok: r.length > 0, koodi });
    }
    const nimi = String(req.query.nimi || "").trim().slice(0, 100);
    if (!nimi) return res.status(400).json({ ok: false, virhe: "nimi puuttuu" });
    const email = String(req.query.email || "").trim().slice(0, 200) || null;
    await db`insert into kumppanit (koodi, nimi, email) values (${koodi}, ${nimi}, ${email})
      on conflict (koodi) do update set nimi = excluded.nimi, email = coalesce(excluded.email, kumppanit.email), aktiivinen = true`;
    const pohja = (process.env.KAUPPA_URL || "https://huumorikauppa.fi").replace(/\/$/, "");
    return res.status(200).json({ ok: true, koodi, nimi, linkki: `${pohja}/?ref=${koodi}` });
  }

  // Kumppaniraportti kuukaudelta (&kuukausi=YYYY-MM, oletus kuluva kuukausi Suomen aikaa): tilaukset kumppaneittain,
  // myynti, kate Printifyn todellisilla kuluilla, provisio ja sen peruste (api/_lib/kumppani.js provisioJaTila).
  // Tilitys kerran kuussa edellisen kuukauden raportista, kun palautusaika (14 pv) on päättynyt.
  if (req.query.tehtava === "kumppanit") {
    const { provisioJaTila, varmistaKumppanitaulu, PROVISIOSAANTO } = await import("../_lib/kumppani.js");
    const { KUMPPANUUS } = await import("../_lib/vakiot.js");
    await varmistaKumppanitaulu(db);
    const kk = /^\d{4}-\d{2}$/.test(String(req.query.kuukausi || "")) ? req.query.kuukausi
      : new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date()).slice(0, 7);
    const rivit = await db`select o.id, o.paid_at, o.total, o.shipping, o.printify_order_id, e.details->>'koodi' as koodi
      from orders o join order_events e on e.order_id = o.id and e.kind = 'kumppani'
      where o.status = 'maksettu' and o.customer_email <> 'kassatesti@huumorikauppa.fi'
        and to_char(o.paid_at at time zone 'Europe/Helsinki', 'YYYY-MM') = ${kk}
      order by o.paid_at`;
    const nimet = new Map((await db`select koodi, nimi, email, aktiivinen from kumppanit`).map((k) => [k.koodi, k]));
    const kumppanit = new Map();
    for (const t of rivit) {
      const myynti = Number(t.total) || 0;
      const tuotteet = myynti - (Number(t.shipping) || 0);
      let kate = null;
      if (t.printify_order_id && onPrintify()) {
        const h = await haeTilaus(t.printify_order_id);
        if (h.ok && h.data && h.data.status !== "canceled") {
          kate = myynti / 1.255 - ((Number(h.data.total_price) || 0) + (Number(h.data.total_shipping) || 0)) / 100 - (myynti * 0.015 + 0.25);
        }
      }
      const p = provisioJaTila(tuotteet, kate ?? NaN);
      const k = kumppanit.get(t.koodi) || { koodi: t.koodi, nimi: nimet.get(t.koodi)?.nimi ?? null, email: nimet.get(t.koodi)?.email ?? null,
        tilauksia: 0, myynti: 0, provisio: 0, tilaukset: [] };
      k.tilauksia++;
      k.myynti = Math.round((k.myynti + myynti) * 100) / 100;
      k.provisio = Math.round((k.provisio + p.provisio) * 100) / 100;
      k.tilaukset.push({ tilaus: tilausnumero(t.id), maksettu: t.paid_at, myynti, tuotteet: Math.round(tuotteet * 100) / 100,
        kate: kate == null ? null : Math.round(kate * 100) / 100, provisio: p.provisio, peruste: p.tila });
      kumppanit.set(t.koodi, k);
    }
    return res.status(200).json({ ok: true, kaytossa: KUMPPANUUS.kaytossa, kuukausi: kk, saanto: PROVISIOSAANTO,
      kumppaneita: [...nimet.values()].filter((k) => k.aktiivinen).length, kumppanit: [...kumppanit.values()],
      yhteensa: { tilauksia: rivit.length, provisio: Math.round([...kumppanit.values()].reduce((s, k) => s + k.provisio, 0) * 100) / 100 } });
  }

  // Personoidun t-paidan polkutesti: kassan laskenta (laskeTilaus) ja tilausrunko testiosoitteella, painokuvan haku ja
  // Printify-tilaus lennosta luotavalla tuotteella. Tilausta EI lähetetä tuotantoon: se perutaan heti (peruTilaus).
  // &nimi=..&ika=..&malli=..&vari=..&koko=..
  if (req.query.tehtava === "personointitesti") {
    const { laskeTilaus } = await import("../_lib/kassa.js");
    const { personointiTeksti, tarkistaPersonointi } = await import("../_lib/personoitu.js");
    const pers = tarkistaPersonointi({ malli: req.query.malli || "kokenut", nimi: req.query.nimi || "Marja", ika: req.query.ika || "50" });
    if (!pers.ok) return res.status(400).json({ ok: false, virhe: pers.virhe });
    const osoite = { address: "Testikatu 1", zip: "00100", city: "Helsinki", phone: "0401234567" };
    const laskettu = laskeTilaus({ items: [{ slug: "personoitu-ikapaita-t-paita", quantity: 1, size: req.query.koko || "L", color: req.query.vari || "Musta",
      customText: personointiTeksti(pers) }], customerEmail: "kassatesti@huumorikauppa.fi", shippingAddress: osoite }, [], null);
    const runko = tilausRunko({ id: `testi-${Date.now().toString(36)}-0000`, customer_email: "kassatesti@huumorikauppa.fi", customer_name: "Kassa Testi",
      shipping_address: osoite, items: laskettu.rivit });
    const kuva = runko.line_items[0].print_areas.front;
    const kuvaVastaus = await fetch(kuva).then((r) => ({ status: r.status, tyyppi: r.headers.get("content-type"), koko: Number(r.headers.get("content-length")) || null })).catch((e) => ({ virhe: String(e) }));
    if (kuiva || !onPrintify()) return res.status(200).json({ ok: true, kuiva, laskettu: { total: laskettu.total, rivit: laskettu.rivit }, rivi: runko.line_items[0], kuvaVastaus });
    const luotu = await luoTilaus(runko);
    const id = luotu.data?.id;
    // Printify käsittelee painokuvan ensin (pending); peruutus onnistuu vasta, kun tila on on-hold.
    let tila = id ? await haeTilaus(id) : null;
    for (let k = 0; id && k < 8 && tila?.data?.status === "pending"; k++) {
      await new Promise((r) => setTimeout(r, 3000));
      tila = await haeTilaus(id);
    }
    let peruttu = id ? await peruTilaus(id) : null;
    if (id && !peruttu?.ok) { await new Promise((r) => setTimeout(r, 5000)); peruttu = await peruTilaus(id); }
    return res.status(200).json({ ok: !!luotu.ok, kuvaVastaus, total: laskettu.total, printify: { id, luotu: luotu.ok, virhe: luotu.virhe ?? null,
      tila: tila?.data?.status ?? null, kulut: tila?.data ? { tuote: tila.data.total_price / 100, toimitus: tila.data.total_shipping / 100 } : null,
      rivit: (tila?.data?.line_items || []).map((l) => ({ pp: l.print_provider_id, blueprint: l.blueprint_id, variantti: l.variant_id, tila: l.status, kulu: l.cost / 100 })),
      peruttu: peruttu?.ok ?? false, peruttuTila: peruttu?.data?.status ?? null } });
  }

  // Arvioiden moderointi: ?tehtava=arviot listaa odottavat; &julkaise=<id> tai &hylkaa=<id> vaihtaa tilan.
  // Tuotesivu näyttää vain julkaistut (api/sahkoposti.js ?arviot=<slug>).
  if (req.query.tehtava === "arviot") {
    const store = pgMarkkinointi(db);
    const id = Number(req.query.julkaise || req.query.hylkaa);
    if (Number.isInteger(id) && id > 0) {
      const ok = kuiva || await store.asetaArvionTila(id, req.query.julkaise ? "julkaistu" : "hylatty");
      return res.status(ok ? 200 : 404).json({ ok, kuiva, id, tila: req.query.julkaise ? "julkaistu" : "hylatty" });
    }
    return res.status(200).json({ ok: true, odottavat: await store.odottavatArviot() });
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
      // ?vastaanottaja=huumorikauppa: kaupan oma osoite; muuten OMISTAJA_EMAIL. Ei muita osoitteita.
      const vastaanottaja = req.query.vastaanottaja === "huumorikauppa" ? "huumorikauppa@gmail.com" : OMISTAJA();
      const r = await laheta({ to: vastaanottaja, ...v, subject: `[KÄYTTÖÖNOTTOTESTI] ${v.subject}` });
      tulos.resend = { lahetetty: r.ok, vastaanottaja, virhe: r.ok ? null : r.virhe };
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
    // ?tiedosto=uudet-tuotteet-2026-10-28 (vain data/-hakemiston nimetyt tuontitiedostot), oletus Lovablen lista.
    const nimi = /^(lovable-aktiiviset|uudet-tuotteet)-\d{4}-\d{2}-\d{2}$/.test(String(req.query.tiedosto || "")) ? req.query.tiedosto : "lovable-aktiiviset-2026-10-27";
    const data = JSON.parse(readFileSync(join(euSiirtoKansio() || join(process.cwd(), "data"), `${nimi}.json`), "utf8"));
    const { kulutRivi } = printifyHaut({ apiKey: process.env.PRINTIFY_API_KEY, shopId: process.env.PRINTIFY_SHOP_ID });
    const siirrot = lueEuSiirrot(euSiirtoKansio());
    const tulos = [];
    for (const t of data.tuotteet) {
      if (!aikaa()) { tulos.push({ slug: t.slug, tila: "aika loppui, aja uudelleen" }); continue; }
      const id = String(t.printify_product_id);
      // Jo tuotu ja näkyvissä: ohitetaan, jotta uusinta-ajo etenee isoissa erissä funktion aikarajan yli.
      const valmis = (await db`select slug, price, is_active from products where printify_product_id = ${id} and is_active = true`)[0];
      if (valmis && !kuiva && req.query.pakota !== "1") { tulos.push({ slug: t.slug, tuonti: null, rivi: valmis, ohitettu: true }); continue; }
      const h = await haeTuote(id);
      const pf = h.ok ? h.data : null;
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

  // Maksetut tilaukset (uusin ensin), ilman henkilötietoja: ensimmäisen oikean tilauksen seuranta.
  if (req.query.tehtava === "maksetut") {
    const rivit = await db`select id, paid_at, amount_paid, total, shipping, items, printify_status, printify_order_id, printify_error,
        sent_to_production_at, confirmation_email_sent_at from orders where status = 'maksettu' and customer_email <> 'kassatesti@huumorikauppa.fi'
        order by paid_at desc nulls last limit 10`;
    const tulos = [];
    for (const t of rivit) {
      const tap = await db`select kind from order_events where order_id = ${t.id} order by created_at`;
      let painotalot = null;
      if (t.printify_order_id && onPrintify()) {
        const h = await haeTilaus(t.printify_order_id);
        if (h.ok) painotalot = { tila: h.data?.status, rivit: (h.data?.line_items || []).map((r) => `${r.metadata?.title || r.product_id} / ${r.print_provider_id} ${r.metadata?.country || ""}`) };
      }
      tulos.push({ id: tilausnumero(t.id), maksettu: t.paid_at, summa: Number(t.amount_paid ?? t.total), kpl: (t.items || []).reduce((a, i) => a + (i.quantity || 0), 0),
        printify: t.printify_status, virhe: t.printify_error, tuotantoon: t.sent_to_production_at, vahvistus: !!t.confirmation_email_sent_at, painotalot, tapahtumat: tap.map((e) => e.kind) });
    }
    return res.status(200).json({ ok: true, maara: tulos.length, tilaukset: tulos });
  }

  // Printify-tilaukset ilman henkilötietoja (nimestä vain nimikirjaimet, osoitteesta maa): maksureitin selvitys ja
  // toteutuneet tuotanto- ja toimitusajat (joulun takaraja). &sivut=N (oletus 4, 50 tilausta sivulla).
  if (req.query.tehtava === "printify-tilaukset") {
    if (!onPrintify()) return res.status(503).json({ error: "Printify-avain puuttuu" });
    const sivut = Math.min(Number(req.query.sivut) || 4, 20);
    const tilaukset = [];
    for (let sivu = 1; sivu <= sivut && aikaa(); sivu++) {
      const r = await listaaTilaukset(sivu, 50);
      if (!r.ok) return res.status(502).json({ error: r.virhe, tilaukset });
      for (const o of r.data?.data || []) {
        const a = o.address_to || {};
        tilaukset.push({ id: o.id, label: o.metadata?.shop_order_label || o.app_order_id || null, external_id: o.external_id || null,
          tyyppi: o.metadata?.order_type || null, kanava: o.sales_channel || null, nimikirjaimet: `${(a.first_name || "")[0] || ""}${(a.last_name || "")[0] || ""}`,
          maa: a.country || null, tila: o.status, luotu: o.created_at, tuotantoon: o.sent_to_production_at || null, valmis: o.fulfilled_at || null,
          toimitus: o.total_shipping, hinta: o.total_price, toimitustapa: o.shipping_method,
          rivit: (o.line_items || []).map((l) => ({ tuote: l.product_id, nimi: l.metadata?.title || null, variantti: l.metadata?.variant_label || null,
            blueprint: l.blueprint_id ?? null, painotalo: l.print_provider_id, maara: l.quantity, tila: l.status, tuotantoon: l.sent_to_production_at || null, valmis: l.fulfilled_at || null })),
          lahetykset: (o.shipments || []).map((x) => ({ kuljetus: x.carrier, lahetetty: x.shipped_at || null, perilla: x.delivered_at || null })) });
      }
      if (!r.data?.next_page_url) break;
    }
    return res.status(200).json({ ok: true, maara: tilaukset.length, tilaukset });
  }

  // Printifyn ilmoittamat tuotanto- ja toimitusajat Suomeen kaupan tuotteiden blueprint/painotalo-pareille (joulun
  // takaraja, kun toteutunutta dataa on vähän). Ensimmäinen variantti, jolla Suomi tai Eurooppa on mukana.
  if (req.query.tehtava === "toimitusajat") {
    if (!onPrintify()) return res.status(503).json({ error: "Printify-avain puuttuu" });
    const parit = new Map();
    // &parit=441/30,443/30 ohittaa tuotelistauksen.
    for (const k of String(req.query.parit || "").split(",").filter(Boolean)) {
      const [blueprint, painotalo] = k.split("/").map(Number);
      parit.set(k, { blueprint, painotalo, tuotteita: null, esimerkki: null });
    }
    const annetut = parit.size > 0;
    for (let sivu = 1; !annetut && sivu <= 20 && Date.now() - alku < 30000; sivu++) {
      const r = await listaaTuotteet(sivu, 50);
      if (!r.ok) return res.status(502).json({ error: r.virhe });
      for (const t of r.data?.data || []) {
        const k = `${t.blueprint_id}/${t.print_provider_id}`;
        const v = parit.get(k) || { blueprint: t.blueprint_id, painotalo: t.print_provider_id, tuotteita: 0, esimerkki: t.title };
        v.tuotteita++; parit.set(k, v);
      }
      if (!r.data?.next_page_url) break;
    }
    const tulos = [];
    for (const v of parit.values()) {
      if (!aikaa()) { tulos.push({ ...v, kesken: true }); continue; }
      const r = await haeToimitusajat(v.blueprint, v.painotalo);
      const rivit = (r.data?.data || []).map((x) => x.attributes || x);
      const fi = rivit.find((a) => a.country?.code === "FI") || rivit.find((a) => /REST_OF_THE_WORLD|EU/i.test(a.country?.code || ""));
      tulos.push({ ...v, ok: r.ok, maa: fi?.country?.code || null, kasittely: fi?.handlingTime || null, kuljetus: fi?.shippingTime || fi?.shipping_time || null,
        kentat: fi ? Object.keys(fi) : null, virhe: r.ok ? null : r.virhe?.slice(0, 200) });
    }
    return res.status(200).json({ ok: true, parit: tulos.sort((a, b) => b.tuotteita - a.tuotteita) });
  }

  // Tuotteen nimen korjaus (&slug=...&nimi=...): vain nimi, slug ja muut tiedot ennallaan. Ilman &kuiva=0 vain näyttää.
  // Viikkomittarit (KASVU-RAPORTTI.md): maksetut tilaukset ilman kassatestejä ISO-viikoittain Helsingin ajassa,
  // myynti, keskiostos ja kate alv 0 Printifyn todellisilla kuluilla (tuote + toimitus) ja Stripen maksulla.
  // Kävijät, istunnot ja ostot GA4 Data API:sta (api/_lib/ga4.js), kun avaimet on asetettu. &alku=YYYY-MM-DD (oletus 8 viikkoa taaksepäin).
  if (req.query.tehtava === "viikkomittarit") {
    const alku = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.alku || "")) ? req.query.alku : new Date(Date.now() - 56 * 864e5).toISOString().slice(0, 10);
    const rivit = await db`select id, paid_at, total, printify_order_id,
        to_char(paid_at at time zone 'Europe/Helsinki', 'IYYY-"W"IW') as viikko
      from orders where status = 'maksettu' and customer_email <> 'kassatesti@huumorikauppa.fi' and paid_at >= ${alku}
      order by paid_at`;
    const viikot = new Map();
    for (const t of rivit) {
      const myynti = Number(t.total) || 0;
      let kulu = null;
      if (t.printify_order_id && onPrintify()) {
        const h = await haeTilaus(t.printify_order_id);
        if (h.ok && h.data && h.data.status !== "canceled") kulu = ((Number(h.data.total_price) || 0) + (Number(h.data.total_shipping) || 0)) / 100;
      }
      const v = viikot.get(t.viikko) || { viikko: t.viikko, tilauksia: 0, myynti: 0, kate: 0, kateTuntematon: 0 };
      v.tilauksia++;
      v.myynti += myynti;
      if (kulu == null) v.kateTuntematon++;
      else v.kate += myynti / 1.255 - kulu - (myynti * 0.015 + 0.25);
      viikot.set(t.viikko, v);
    }
    // Kävijät ja konversio GA4 Data API:sta, kun GA4_PROPERTY_ID ja GA4_PALVELUTILI on asetettu (api/_lib/ga4.js).
    let ga4 = null, ga4Virhe = null;
    // Ostosuppilo (view_item -> add_to_cart -> begin_checkout -> purchase) samasta lähteestä.
    let suppilo = null;
    try { ga4 = await ga4Viikot(alku); suppilo = await ga4Suppilo(alku); } catch (e) { ga4Virhe = String(e.message || e).slice(0, 200); }
    const tulos = [...viikot.values()].map((v) => ({ ...v, myynti: Math.round(v.myynti * 100) / 100, kate: Math.round(v.kate * 100) / 100,
      keskiostos: v.tilauksia ? Math.round((v.myynti / v.tilauksia) * 100) / 100 : 0, ga4: ga4?.[v.viikko] ?? null, suppilo: suppilo?.[v.viikko] ?? null }));
    return res.status(200).json({ ok: true, alku, viikot: tulos, ga4Viikot: ga4, ga4Suppilo: suppilo, ga4Lahde: ga4 ? "GA4 Data API" : ga4Virhe || "ei asetettu" });
  }

  // Kaikki ajatusviivalliset ja luonnottoman kaksoispisteen nimet kerralla (api/_lib/tuotenimi.js korjaaNimi). Slug ei muutu. Oletuksena kuiva ajo, &kuiva=0 tallentaa.
  if (req.query.tehtava === "tuotenimet-viivat") {
    const rivit = (await db`select id, slug, name from products where name ~ '[–—:]' order by slug`).filter((r) => nimiKorjattava(r.name));
    const muutokset = rivit.map((r) => ({ id: r.id, slug: r.slug, vanha: r.name, uusi: korjaaNimi(r.name) }));
    const virheet = muutokset.filter((m) => !m.uusi || /[–—]/.test(m.uusi));
    if (virheet.length) return res.status(500).json({ error: "muunnos jätti ajatusviivan", virheet: virheet.slice(0, 5) });
    if (req.query.kuiva === "0") {
      for (const m of muutokset) await db`update products set name = ${m.uusi}, updated_at = now() where id = ${m.id} and name = ${m.vanha}`;
    }
    const jaljella = req.query.kuiva === "0" ? (await db`select name from products where name ~ '[–—:]'`).filter((r) => nimiKorjattava(r.name)).length : null;
    return res.status(200).json({ ok: true, kuiva: req.query.kuiva !== "0", maara: muutokset.length, jaljella,
      esimerkit: muutokset.slice(0, 8).map(({ slug, vanha, uusi }) => ({ slug, vanha, uusi })) });
  }

  if (req.query.tehtava === "tuotenimi") {
    const [rivi] = await db`select id, name from products where slug = ${req.query.slug}`;
    if (!rivi) return res.status(404).json({ error: "tuotetta ei löydy" });
    const nimi = String(req.query.nimi || "").trim();
    if (!nimi || /[–—]/.test(nimi)) return res.status(400).json({ error: "nimi puuttuu tai sisältää ajatusviivan" });
    if (req.query.kuiva !== "0") return res.status(200).json({ ok: true, kuiva: true, vanha: rivi.name, uusi: nimi });
    await db`update products set name = ${nimi}, updated_at = now() where id = ${rivi.id}`;
    return res.status(200).json({ ok: true, vanha: rivi.name, uusi: nimi });
  }

  // Uuden tilin maksutapojen tila (oletuskonfiguraatio ja tilin capabilityt): mitä sivustolla saa luvata.
  if (req.query.tehtava === "maksutavat") {
    if (!onStripe()) return res.status(503).json({ error: "Stripe-avain puuttuu" });
    const tavat = ["card", "apple_pay", "google_pay", "klarna", "mobilepay"];
    const konf = (await stripe().paymentMethodConfigurations.list({ limit: 20 })).data.map((c) => ({ nimi: c.name, oletus: c.is_default, aktiivinen: c.active,
      tavat: Object.fromEntries(tavat.map((t) => [t, c[t] ? { saatavilla: c[t].available, valinta: c[t].display_preference?.value } : null])) }));
    const tili = await stripe().accounts.retrieve();
    const kyvyt = Object.fromEntries(Object.entries(tili.capabilities || {}).filter(([k]) => /card|klarna|mobilepay/.test(k)));
    return res.status(200).json({ ok: true, tili: tili.id, konfiguraatiot: konf, kyvyt });
  }

  // Uuden tilin (STRIPE_SECRET_KEY) Checkout-sessiot aikavälillä &alku=ISO&loppu=ISO, ilman henkilötietoja.
  if (req.query.tehtava === "stripe-sessiot") {
    if (!onStripe()) return res.status(503).json({ error: "Stripe-avain puuttuu" });
    const gte = Math.floor(Date.parse(req.query.alku) / 1000), lte = Math.floor(Date.parse(req.query.loppu) / 1000);
    const tili = await stripe().accounts.retrieve().catch(() => null);
    const sessiot = [];
    for await (const s of stripe().checkout.sessions.list({ created: { gte, lte }, limit: 100 })) {
      sessiot.push({ luotu: new Date(s.created * 1000).toISOString(), tila: s.status, maksu: s.payment_status, summa: s.amount_total / 100,
        toimitus: (s.shipping_cost?.amount_total ?? 0) / 100, tilaus: s.metadata?.order_id || null, testi: s.customer_details?.email === "kassatesti@huumorikauppa.fi" });
    }
    return res.status(200).json({ ok: true, tili: tili?.id || null, maara: sessiot.length, sessiot });
  }

  // Omistajan ilmoituksen testi (OMISTAJA_EMAIL): sama reitti kuin uuden tilauksen ilmoitus (halytys).
  if (req.query.tehtava === "ilmoitustesti") {
    const r = await halytys("Testi: uuden tilauksen ilmoitus", ["Tämä on testiviesti. Oikea ilmoitus lähtee, kun maksu tulee."]);
    return res.status(200).json({ ok: r.ok, vastaanottaja: r.vastaanottaja || OMISTAJA(), virhe: r.ok ? null : r.virhe });
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
