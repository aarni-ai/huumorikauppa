/**
 * Markkinoinnin tietovarasto Postgresissa (db/schema.sql: subscribers, email_optouts, abandoned_carts, reviews,
 * orders.review_email_sent_at). Sama rajapinta kuin testien muistivarastolla (src/test/markkinointi.test.ts).
 */
export function pgMarkkinointi(db) {
  return {
    lueKv: async (k) => (await db`select value from kv where key = ${k}`)[0]?.value ?? null,
    kirjoitaKv: async (k, v) => {
      await db`insert into kv (key, value) values (${k}, ${v}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    },
    haeTilaaja: async (email) => (await db`select * from subscribers where email = ${email}`)[0] ?? null,
    haeTilaajaKoodilla: async (koodi) => (await db`select * from subscribers where upper(discount_code) = ${String(koodi).toUpperCase()}`)[0] ?? null,
    tallennaTilaaja: async (t) => {
      await db`insert into subscribers (email, consent_at, consent_text, source, discount_code, discount_percent)
        values (${t.email}, ${t.consent_at}, ${t.consent_text}, ${t.source}, ${t.discount_code}, ${t.discount_percent})
        on conflict (email) do update set consent_at = excluded.consent_at, consent_text = excluded.consent_text,
          source = excluded.source, discount_code = coalesce(subscribers.discount_code, excluded.discount_code),
          discount_percent = coalesce(subscribers.discount_percent, excluded.discount_percent), updated_at = now()`;
    },
    merkitseTervetulo: async (email, aika) => {
      await db`update subscribers set welcome_sent_at = ${aika}, updated_at = now() where email = ${email}`;
    },
    maksettujaTilauksia: async (email) =>
      Number((await db`select count(*)::int as n from orders where lower(customer_email) = ${email} and status = 'maksettu'`)[0].n),
    koodiKaytetty: async (koodi) =>
      (await db`select 1 from orders where upper(discount_code) = ${String(koodi).toUpperCase()} and status = 'maksettu' limit 1`).length > 0,
    onKielto: async (email) => (await db`select 1 from email_optouts where email = ${email}`).length > 0,
    lisaaKielto: async (email, lahde, aika) => {
      await db`insert into email_optouts (email, source, created_at) values (${email}, ${lahde}, ${aika}) on conflict (email) do nothing`;
      await db`update abandoned_carts set stopped_at = coalesce(stopped_at, ${aika}), updated_at = now() where email = ${email}`;
    },
    poistaKielto: async (email) => {
      await db`delete from email_optouts where email = ${email}`;
    },
    tallennaKori: async (k) => {
      // Uusi tai muuttunut kori aloittaa muistutukset alusta, jos edellinen kori on jo käsitelty.
      await db`insert into abandoned_carts (email, items, total, consent_at, consent_text, source)
        values (${k.email}, ${db.json(k.items)}, ${k.total}, ${k.consent_at}, ${k.consent_text}, ${k.source})
        on conflict (email) do update set items = excluded.items, total = excluded.total, consent_at = excluded.consent_at,
          consent_text = excluded.consent_text, source = excluded.source, updated_at = now(),
          created_at = case when abandoned_carts.recovered_order_id is not null or abandoned_carts.stopped_at is not null
            or abandoned_carts.reminder2_sent_at is not null then now() else abandoned_carts.created_at end,
          reminder1_sent_at = case when abandoned_carts.recovered_order_id is not null or abandoned_carts.stopped_at is not null
            or abandoned_carts.reminder2_sent_at is not null then null else abandoned_carts.reminder1_sent_at end,
          reminder2_sent_at = null, recovered_order_id = null, stopped_at = null`;
    },
    poistaKori: async (email) => {
      await db`delete from abandoned_carts where email = ${email}`;
    },
    haeKori: async (id) => (await db`select * from abandoned_carts where id = ${id}`)[0] ?? null,
    muistutettavatKorit: async () => db`select * from abandoned_carts where stopped_at is null and recovered_order_id is null
      and reminder2_sent_at is null and updated_at > now() - interval '7 days' order by updated_at limit 200`,
    maksettuTilausSitten: async (email, aika) =>
      (await db`select id from orders where lower(customer_email) = ${email} and status = 'maksettu' and paid_at >= ${aika} order by paid_at limit 1`)[0]?.id ?? null,
    merkitseKori: async (id, kentat) => {
      if (kentat.recovered_order_id) await db`update abandoned_carts set recovered_order_id = ${kentat.recovered_order_id}, updated_at = now() where id = ${id}`;
      if (kentat.stopped_at) await db`update abandoned_carts set stopped_at = ${kentat.stopped_at} where id = ${id}`;
      if (kentat.reminder1_sent_at) await db`update abandoned_carts set reminder1_sent_at = ${kentat.reminder1_sent_at} where id = ${id}`;
      if (kentat.reminder2_sent_at) await db`update abandoned_carts set reminder2_sent_at = ${kentat.reminder2_sent_at} where id = ${id}`;
    },
    /** Maksun jälkeen: osoitteen kori ei saa enää muistutuksia. */
    lopetaKoriMaksettuna: async (email, tilausId) => {
      await db`update abandoned_carts set recovered_order_id = ${tilausId}, updated_at = now()
        where email = ${email} and recovered_order_id is null and stopped_at is null`;
    },
    arvostelupyyntoEhdokkaat: async () => db`select * from orders where status = 'maksettu' and review_email_sent_at is null
      and delivered_at is not null and delivered_at > now() - interval '60 days' order by delivered_at limit 100`,
    merkitseArvostelupyynto: async (id, aika) => {
      await db`update orders set review_email_sent_at = ${aika} where id = ${id}`;
    },
    haeTilaus: async (id) => (await db`select * from orders where id = ${id}`)[0] ?? null,
    arvostellut: async (tilausId) => (await db`select product_name from reviews where order_id = ${tilausId}`).map((r) => r.product_name),
    /** Yrityssivun tarjouspyyntö (/yritykset). Taulu luodaan tarvittaessa (db/schema.sql tarjouspyynnot). */
    tallennaTarjouspyynto: async (t) => {
      await db`create table if not exists tarjouspyynnot (id bigserial primary key, yritys text not null, nimi text not null,
        email text not null, puhelin text, maara integer, viesti text, created_at timestamptz not null default now())`;
      // Laskuri ja aikataulu (30.10.2026): paketti, malli, koot, hinta ja kate (arvio, vain sisäisesti), toivottu päivä.
      await db`alter table tarjouspyynnot add column if not exists paketti text, add column if not exists malli text,
        add column if not exists koot jsonb, add column if not exists hinta numeric(10,2), add column if not exists kate numeric(10,2),
        add column if not exists toivottu_paiva date, add column if not exists ehtii boolean, add column if not exists jouluun boolean,
        add column if not exists ytunnus text, add column if not exists tila text not null default 'uusi'`;
      return (await db`insert into tarjouspyynnot (yritys, nimi, email, puhelin, maara, viesti, paketti, malli, koot, hinta, kate,
          toivottu_paiva, ehtii, jouluun, ytunnus)
        values (${t.yritys}, ${t.nimi}, ${t.email}, ${t.puhelin}, ${t.maara}, ${t.viesti}, ${t.paketti ?? null}, ${t.malli ?? null},
          ${t.koot ? db.json(t.koot) : null}, ${t.hinta ?? null}, ${t.kate ?? null}, ${t.toivottu_paiva ?? null}, ${t.ehtii ?? null},
          ${t.jouluun ?? null}, ${t.ytunnus ?? null}) returning id`)[0].id;
    },
    /** /hallinta/tarjoukset: tarjouspyynnöt uusimmasta (kate vain täällä). */
    tarjouspyynnot: async () => db`select * from tarjouspyynnot order by created_at desc limit 300`,
    asetaTarjousTila: async (id, tila) => db`update tarjouspyynnot set tila = ${tila} where id = ${id} returning id`,
    /** Tuotesivun arviot: vain julkaistut arviot maksetuista tilauksista, joissa arvioitu rivi on tämä tuote. */
    julkaistutArviot: async (slug) => db`select r.stars, r.body, r.customer_name, r.created_at from reviews r
      join orders o on o.id = r.order_id
      where r.status = 'julkaistu' and o.status = 'maksettu'
        and exists (select 1 from jsonb_array_elements(o.items) i where i->>'name' = r.product_name and i->>'slug' = ${slug})
      order by r.created_at desc limit 20`,
    /** Moderointi (cron ?tehtava=arviot): odottavat arviot ja tilan vaihto. */
    odottavatArviot: async () => db`select r.id, r.product_name, r.stars, r.body, r.customer_name, r.created_at from reviews r
      where r.status = 'odottaa' order by r.created_at`,
    asetaArvionTila: async (id, tila) => (await db`update reviews set status = ${tila} where id = ${id} returning id`).length > 0,
    tallennaArvio: async (a) =>
      (await db`insert into reviews (order_id, product_name, stars, body, customer_name)
        values (${a.order_id}, ${a.product_name}, ${a.stars}, ${a.body}, ${a.customer_name})
        on conflict (order_id, product_name) do nothing returning id`).length > 0,
  };
}
