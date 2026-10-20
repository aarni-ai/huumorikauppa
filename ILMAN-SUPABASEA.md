# Huumorikauppa ilman Supabasea: suunnitelma (21.10.2026, ei toteutettu)

## Lähtötilanne

- Supabase-projekti `exhzrrbvipqwhjhjgnxs` on luotu Lovablen kautta (Lovable Cloud): repossa on 930 Lovablen botin (`gpt-engineer-app[bot]`) committia, Lovablen generoima `src/integrations/supabase/client.ts` ja `.env`-malli (`VITE_SUPABASE_PROJECT_ID` jne.), ja sähköposti lähtee Lovablen palvelun kautta (`LOVABLE_API_KEY`, `LOVABLE_SEND_URL`). Aarnilla ei ole projektiin Supabase CLI- eikä dashboard-pääsyä, joten migraatioita, Edge Functioneita, secretejä tai lokeja ei voi hallita itse.
- Kaikki kaupan kriittinen logiikka on Supabasessa: tuotteet ja hinnat (taulu `products`), tilaukset (`orders`), Stripe-webhook ja kassa (`stripe-webhook`, `create-checkout`), Printify-siirto (`_shared/process-order.ts`), valvonta-cronit (`recover-orders`, `check-stuck-orders`, `check-printify-shipments`, `daily-summary`, pg_cron) ja sähköpostit.
- Stripe- ja Printify-avaimet ovat vain Supabasen Edge Function -secreteissä. Vercelissä on vain julkiset Supabase-avaimet.
- Vercel-projekti on tiimissä `aarni-ais-projects` (GitHub-integraatio: push mainiin = tuotantodeploy). Tämän koneen Vercel CLI on kirjautunut eri tiliin (`flyapeg-2135`), joten `vercel env pull` ja lokit eivät toimi tälle projektille ennen kuin CLI kirjataan oikeaan tiimiin.
- 13.10. korjaus (`cf10d4d`: cronien URL-asetukset, `skipped`-tilausten uudelleenyritys) on GitHubissa, mutta sen migraatiota ja funktioita ei ole voitu ajaa Supabaseen. Cronit eivät siis todennäköisesti vieläkään kutsu funktioita.

## Juurisyyt (koodista, ei vahvistettu tilausdatasta)

1. **On hold:** `submitPrintifyOrder` luo tilauksen Printifyyn (tila on-hold) ja kutsuu `send_to_production`. Jos se epäonnistuu (esim. Printifyn maksutapa tai saldo, osoite- tai puhelinnumerovirhe, tuote poistettu), koodi vain kirjaa varoituksen lokiin ja merkitsee tilauksen silti `submitted`. `recover-orders` pitää `submitted`-tilaa valmiina, joten tilaus jää on hold -tilaan pysyvästi eikä hälytystä tule.
2. **Ei Printifyssä ollenkaan:** kassa veloittaa asiakkaan, vaikka Printify-varianttia ei löydy (`create-checkout`: `printifyVariantId` jää tyhjäksi ilman virhettä). Silloin tilaus tallentuu `skipped` ("no printify_items in metadata or DB") eikä mene Printifyyn. Syitä: avain `väri|koko` ei täsmää (yksikokoisilla tuotteilla koko jää tyhjäksi, värin käännös), tuotteen nimi poikkeaa Printifyn otsikosta, jolloin laiska synkka ei löydä tuotetta, tai tuote on poistettu tai luotu uudelleen Printifyssä. Lisäksi jos Stripe-webhook ei ole käsitellyt maksua, tilausriviä ei ole ollenkaan.
3. **Kumpaakaan ei korjata automaattisesti:** valvontacronit (`recover-orders`, `check-stuck-orders`) eivät ole kutsuneet funktioita, koska ajastus luki asetuksia, joita ei ole asetettu (korjattu GitHubissa 13.10., ei ajettu Supabaseen).

## Tavoite

Tilaus, Printify-siirto ja valvonta toimivat Vercelissä (sama tiimi kuin sivusto), avaimet Vercelin ympäristömuuttujissa, ja Supabasesta jää enintään tuotedatan lukulähde siirtymän ajaksi.

## Vaiheet

### 0. Edellytykset (Aarni, noin 15 min)
1. Vercel CLI kirjautuu tiimiin `aarni-ais-projects` (`vercel login`, `vercel link`), tai Aarni antaa tämän koneen tilille pääsyn tiimiin.
2. Uudet avaimet suoraan palveluista Vercelin ympäristömuuttujiin: Stripe (`STRIPE_SECRET_KEY`, uusi webhook-salaisuus `STRIPE_WEBHOOK_SECRET`), Printify (`PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID`), sähköposti (Resend tai vastaava, `RESEND_API_KEY`), `CRON_SECRET`, `ADMIN_EMAIL`. Supabasen secretejä ei tarvitse saada ulos.
3. Tietokanta: Vercel Postgres (Neon) tai Supabase-projekti Aarnin omalle tilille. Suositus: Neon Vercelin Marketplacesta, koska se on samassa tilissä ja laskulla.

### 1. Tuotteet ja hinnat
- Vienti: julkinen REST-luku (`/rest/v1/products`, anon-avain) toimii ilman pääsyä, joten koko tuotetaulu saadaan ulos skriptillä JSONiksi ja uuteen kantaan.
- Lähde jatkossa: Printify on tuotteiden ja varianttien lähde, hinnat ja näkyvyys omassa kannassa (kategoriapohjat nyt koodissa `printify-sync.ts`). Synkka Vercel Cron -funktiona (`/api/cron/printify-sync`, kerran yössä).
- Frontendin `use-products.ts` lukee uutta `/api/products`-funktiota (välimuisti 5 min) Supabase-asiakkaan sijaan.

### 2. Kassa ja tilaukset
- `/api/checkout` (nykyinen `create-checkout`): hinnat kannasta, Stripe Checkout Session. **Uusi sääntö:** kassa hylätään, jos Printify-tuotteen varianttia ei löydy (`variant_map`), jotta maksettu tilaus ei voi jäädä ilman Printify-riviä (juurisyy 2 alla).
- `/api/stripe-webhook`: allekirjoituksen tarkistus, tilausrivi kantaan, Printify-siirto, vahvistusviesti. Idempotenssi `stripe_session_id`:llä kuten nyt.
- Printify-siirto (`process-order.ts` siirrettynä): `send_to_production`-virhe merkitään tilaan `on_hold` eikä `submitted`, ja se yritetään uudelleen (juurisyy 1).

### 3. Valvonta (Vercel Cron)
- `/api/cron/recover-orders` (tunnin välein): Stripen maksetut sessiot ilman tilausriviä, ja tilat `pending`, `failed`, `skipped`, `on_hold` uudelleen Printifyyn.
- `/api/cron/printify-tila` (tunnin välein): Printify-tila (on-hold, in-production, shipped), seurantakoodi, lähetysviesti asiakkaalle.
- `/api/cron/paivan-yhteenveto` (kerran päivässä): yhteenveto info@-osoitteeseen, mukana jumissa olevat (on-hold yli 24 h, ei lähetystä 10 pv).
- Vercel Cron on Pro-tilillä tarkka ja luotettava, ja lokit näkyvät Vercelissä samassa paikassa kuin sivusto.

### 4. Siirtymä
1. Rinnakkaisajo: uusi webhook-osoite Stripeen toiseksi endpointiksi testitilassa, sitten tuotannossa, vanha pois vasta kun 5 tilausta on mennyt uutta reittiä.
2. Sähköpostipohjat (`supabase/functions/_shared/transactional-email-templates`) siirretään sellaisinaan (React Email).
3. Lovable: jatkossa muutokset tehdään GitHubiin, Lovablea ei tarvita.

## Arvio

Järkevä vaihtoehto, koska nykyisellä mallilla kauppaa ei voi korjata eikä valvoa (ei pääsyä kantaan, lokeihin, secreteihin eikä croneihin), ja juuri valvonnan puute on pitänyt tilaukset jumissa. Työmäärä noin 2-3 työpäivää, joista suurin osa on olemassa olevan Deno-koodin siirtoa Node-funktioiksi. Riski: siirtymän aikana kaksi webhookia, joten idempotenssi on pidettävä. Nopeampi vaihtoehto, jos Lovable antaa pääsyn: pyydä Lovablelta projektin siirto omalle Supabase-tilille (Lovable Cloud -projektin "transfer"), jolloin nykyinen koodi ja 13.10. korjaukset voidaan ajaa sellaisenaan.
