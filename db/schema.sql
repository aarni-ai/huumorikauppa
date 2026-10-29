-- Huumorikauppa, oma tausta (21.10.2026). Aja kerran uuteen Postgres-tietokantaan:
--   psql "$DATABASE_URL" -f db/schema.sql
-- Sen jälkeen tuotteet: node scripts/tuo-tuotteet.mjs (tilannekuvasta) tai scripts/printify-tuonti.mjs (Printifystä).

create extension if not exists pgcrypto;

-- Tuotteet: samat sarakkeet kuin vanhassa taustassa (data/products-snapshot.json).
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  humor_type text,
  price numeric(10,2) not null,
  stock integer default 99,
  description text,
  images jsonb default '[]'::jsonb,
  variants jsonb default '{}'::jsonb,
  is_featured boolean default false,
  is_new boolean default false,
  is_gift_idea boolean default false,
  is_active boolean default true,
  supplier text default 'printify',
  aliexpress_url text,
  origin_country text,
  printify_product_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists products_category on products (category);

create table if not exists discount_codes (
  code text primary key,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null,
  is_active boolean default true
);
insert into discount_codes (code, discount_type, discount_value) values
  ('HUUMORI5', 'percent', 5), ('PALAA10', 'percent', 10)
on conflict (code) do nothing;

-- Tilaukset: rivi luodaan ennen maksua (odottaa_maksua), Stripe-sessioon menee vain tilauksen id.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'odottaa_maksua' check (status in ('odottaa_maksua', 'maksettu', 'peruttu')),
  customer_email text not null,
  customer_name text,
  recipient_name text,
  phone text,
  shipping_address jsonb not null,
  items jsonb not null,          -- [{ product_id, slug, name, size, color, custom_text, quantity, unit_price, printify_product_id, variant_id }]
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null,
  discount_code text,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  amount_paid numeric(10,2),
  stripe_session_id text unique,
  stripe_payment_intent text,
  printify_status text not null default 'ei_lahetetty'
    check (printify_status in ('ei_lahetetty', 'luotu', 'tuotannossa', 'lahetetty', 'virhe')),
  printify_order_id text,
  printify_error text,
  printify_attempts integer not null default 0,
  next_retry_at timestamptz,
  alert_sent_at timestamptz,
  sent_to_production_at timestamptz,
  carrier text,
  tracking_number text,
  tracking_url text,
  shipped_at timestamptz,
  shipping_email_sent_at timestamptz,
  confirmation_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists orders_status on orders (status, printify_status);
create index if not exists orders_retry on orders (next_retry_at) where printify_status in ('ei_lahetetty', 'luotu', 'virhe');

create table if not exists order_events (
  id bigserial primary key,
  order_id uuid references orders(id) on delete cascade,
  kind text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Ajastimen tila (päivän yhteenveto kerran päivässä).
create table if not exists kv (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Kasvu (kasvu-oma-tausta): lahjakortit ja pakettialennus. Kaikki lauseet voi ajaa uudelleen.
-- Lahjakorttitilaus ei mene Printifyyn: printify_status 'ei_tarvita'.
-- Tilausvahti (26.10.2026, api/_lib/tilausvahti.js): 'pysaytetty' = ei lähetetty tuotantoon (EU:n ulkopuolinen painotalo
-- tai Printifyn kulu yli myynnin alv 0), omistaja päättää. Sama ehto tässä, jotta lauseen uudelleenajo ei hylkää
-- pysäytettyjä rivejä.
alter table orders drop constraint if exists orders_printify_status_check;
alter table orders add constraint orders_printify_status_check
  check (printify_status in ('ei_lahetetty', 'luotu', 'tuotannossa', 'lahetetty', 'virhe', 'ei_tarvita', 'pysaytetty'));
alter table orders add column if not exists bundle_discount numeric(10,2) not null default 0;
alter table orders add column if not exists gift_card_code text;
alter table orders add column if not exists gift_card_amount numeric(10,2) not null default 0;
alter table orders add column if not exists gift_card_charged_at timestamptz;

-- Digitaaliset lahjakortit: koodi luodaan maksun jälkeen jokaiselle ostetulle kappaleelle (order_id, item_index,
-- unit_index), saldo vähenee käytön mukaan. Voimassa 24 kuukautta.
create table if not exists gift_cards (
  code text primary key,
  initial_value numeric(10,2) not null check (initial_value > 0),
  balance numeric(10,2) not null check (balance >= 0),
  order_id uuid references orders(id) on delete set null,
  item_index integer not null default 0,
  unit_index integer not null default 0,
  buyer_email text not null,
  recipient_email text,
  recipient_name text,
  message text,
  expires_at timestamptz not null,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists gift_cards_order_unit on gift_cards (order_id, item_index, unit_index);

-- Lahjakortin käytöt (tilaus, summa). Yksi käyttö per tilaus.
create table if not exists gift_card_redemptions (
  id bigserial primary key,
  code text not null references gift_cards(code),
  order_id uuid not null unique references orders(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- Varianttien saatavuus (saatavuus-oma). Päivittäinen Printify-tarkistus (api/_lib/saatavuus.js) kirjoittaa
-- variant_map-avaimet ("Väri|Koko"), joita ei voi juuri nyt valmistaa. /api/products piilottaa ne ja kassa hylkää ne.
-- Kaikki lauseet voi ajaa uudelleen.
alter table products add column if not exists unavailable_variants jsonb not null default '[]'::jsonb;
alter table products add column if not exists availability_checked_at timestamptz;

-- Automaatio (26.10.2026): sähköpostimarkkinointi ja valvonta. Kaikki lauseet voi ajaa uudelleen.
-- Uutiskirjeen tilaajat: suostumuksen aika, teksti ja lähde (lomake). Ensitilauksen koodi yksi per osoite.
create table if not exists subscribers (
  email text primary key,                 -- pienillä kirjaimilla
  consent_at timestamptz not null,
  consent_text text not null,
  source text not null,
  discount_code text unique,
  discount_percent numeric(5,2),
  welcome_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Peruutukset (uutiskirje, muistutukset ja arviopyynnöt). Osoitteeseen ei lähetetä markkinointia.
create table if not exists email_optouts (
  email text primary key,
  source text,
  created_at timestamptz not null default now()
);

-- Keskeneräiset tilaukset, joista asiakas pyysi kassalla muistutuksen (suostumus). Yksi kori per osoite.
create table if not exists abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  items jsonb not null,                   -- [{ slug, name, price, quantity, size, color, customText }]
  total numeric(10,2) not null default 0,
  consent_at timestamptz not null,
  consent_text text not null,
  source text not null default 'kassa',
  reminder1_sent_at timestamptz,
  reminder2_sent_at timestamptz,
  recovered_order_id uuid references orders(id) on delete set null,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Arviot arviopyynnön linkistä (tarkistetaan ennen julkaisua).
create table if not exists reviews (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  product_name text not null,
  stars integer not null check (stars between 1 and 5),
  body text,
  customer_name text,
  status text not null default 'odottaa' check (status in ('odottaa', 'julkaistu', 'hylatty')),
  created_at timestamptz not null default now(),
  unique (order_id, product_name)
);

alter table orders add column if not exists delivered_at timestamptz;
alter table orders add column if not exists review_email_sent_at timestamptz;
alter table orders add column if not exists printify_created_at timestamptz;
alter table orders add column if not exists stuck_alert_sent_at timestamptz;
create index if not exists orders_email on orders (lower(customer_email));

-- Tilausvahti: Printifyn todellinen kulu euroina (tilauksen haku ennen tuotantoa), päivän yhteenvedon toteutunut kate.
alter table orders add column if not exists printify_cost numeric(10,2);
alter table orders add column if not exists printify_cost_ex_tax numeric(10,2);
-- Printifyn tuotekulu (total_price) euroina: Printify Premium -laskelma (20 % alennus vain tuotekulusta).
alter table orders add column if not exists printify_product_cost numeric(10,2);

-- Hintahistoria (29.10.2026): t-paitojen päivittäiset hinnat 30 päivän alimman hinnan näyttöä varten
-- (kuluttajansuojalaki 2:6 a §, Black Friday). Kirjoittaa api/cron/tilaukset.js ?tehtava=hintatarkistus.
create table if not exists hintahistoria (
  paiva date not null,
  slug text not null,
  price numeric(10,2) not null,
  original_price numeric(10,2),
  primary key (paiva, slug)
);

-- Yrityssivun tarjouspyynnöt (29.10.2026, /yritykset, api/sahkoposti.js action tarjouspyynto).
create table if not exists tarjouspyynnot (
  id bigserial primary key,
  yritys text not null,
  nimi text not null,
  email text not null,
  puhelin text,
  maara integer,
  viesti text,
  created_at timestamptz not null default now()
);
