
# Hylätyn ostoskorin muistutusautomaatio

## Tärkeä huomio Resendistä
Projektissa on jo oma sähköpostijärjestelmä (help.huumorikauppa.fi, queue + Mailgun, unsubscribe-tokenit, tilausvahvistukset jne.). Käytän sitä **samaa olemassa olevaa infraa** Resendin sijaan — se on:
- Halvempi (et maksa erikseen Resendistä)
- Luotettavampi (sama domain-maine kuin tilausvahvistuksilla → ei päädy roskapostiin)
- Sisältää jo unsubscribe-logiikan, suppression-listan ja queuen

Jos haluat ehdottomasti Resendin, kerro — vaihdan helposti. Muuten etenen olemassa olevalla infralla.

## Mitä rakennetaan

### 1. Tietokantataulu `abandoned_carts`
Kentät: `email`, `cart_items` (jsonb), `cart_total`, `discount_code` (jos käytetty), `recovery_token` (uuid, palaa-linkkiä varten), `status` ('avoin' | 'ostettu' | 'peruttu'), `reminder_1h_sent_at`, `reminder_24h_sent_at`, `reminder_72h_sent_at`, `stripe_session_id`, `unsubscribed_at`, `created_at`, `updated_at`.

RLS: vain service_role pääsee käsiksi (kassan kirjoitus tapahtuu edge functionin kautta).

### 2. Kirjoitus kassasivulta
`CheckoutPage.tsx`: kun käyttäjä antaa sähköpostin (debounce ~800ms, validi email) **ja** korissa on tuotteita → kutsu uutta edge functionia `track-abandoned-cart` joka upsertaa rivin (key: email + open-status). Päivittää myös, jos käyttäjä muuttaa koria.

### 3. Merkintä ostetuksi
`stripe-webhook` (`checkout.session.completed`): merkitse `status='ostettu'` sähköpostin tai `stripe_session_id`:n perusteella.

### 4. Sähköpostimallit (3 kpl)
Lisätään `_shared/transactional-email-templates/`:
- `abandoned-cart-1h` — pehmeä muistutus ("jätit nämä koriin")
- `abandoned-cart-24h` — muistutus + sosiaalinen todiste (4.8★ arviot, tyytyväisten asiakkaiden määrä)
- `abandoned-cart-72h` — viimeinen muistutus + alennuskoodi `PALAA10` (-10 %)

Kaikissa: tuotekuvat, hinta, "Palaa koriin" -nappi → `huumorikauppa.fi/palauta-kori?token={recovery_token}`, peruutuslinkki.

Alennuskoodi `PALAA10` lisätään `discount_codes`-tauluun ja `CheckoutPage`:n `VALID_CODES`-listalle.

### 5. Cron edge function `send-abandoned-cart-reminders`
Ajetaan pg_cronilla joka 15 min. Hakee avoimet korit ja lähettää oikean muistutuksen kun:
- 1h ≤ ikä < 24h ja `reminder_1h_sent_at IS NULL`
- 24h ≤ ikä < 72h ja `reminder_24h_sent_at IS NULL`
- 72h ≤ ikä < 7d ja `reminder_72h_sent_at IS NULL`

Skippaa rivit joissa `unsubscribed_at` tai jotka löytyvät `suppressed_emails`-taulusta. Käyttää olemassa olevaa `send-transactional-email`-funktiota → menee queueen → lähtee. Idempotency-key = `abandoned-{cart_id}-{stage}`.

### 6. Palauta kori -sivu
Uusi reitti `/palauta-kori?token=...` joka:
- Hakee `abandoned_carts`-rivin tokenilla (edge function `restore-cart`)
- Palauttaa tuotteet localStorageen (`useCart`)
- Lisää alennuskoodin automaattisesti jos 72h-viesti
- Ohjaa kassalle

### 7. Peruutuslinkki
Käytetään olemassa olevaa `handle-email-unsubscribe`-flow’ta, mutta lisätään myös merkintä `abandoned_carts.unsubscribed_at` — niin emme lähetä jatkossakaan.

### 8. Suojaukset
- Max 3 viestiä per kori (3 saraketta, ei voi lähettää uudestaan).
- Ei lähetä, jos sama email teki tilauksen 24h sisällä.
- Ei lähetä, jos email löytyy `suppressed_emails`:sta.
- Ei lähetä yli 7 päivää vanhoille koreille.

## Tekniset yksityiskohdat (tekninen osio)

**Edge functionit:**
- `track-abandoned-cart` (uusi, verify_jwt=false): upsert ostoskori sähköpostin perusteella.
- `restore-cart` (uusi, verify_jwt=false): palauttaa korin tokenilla.
- `send-abandoned-cart-reminders` (uusi, verify_jwt=true, cron-kutsuttava): tekee skannauksen + invoke `send-transactional-email`.
- `stripe-webhook` (muokkaus): merkitsee `status='ostettu'`.

**Migraatio:** `abandoned_carts`-taulu + RLS + indexes (`status`, `email`, `recovery_token`) + pg_cron job 15 min välein.

**Frontend:** `CheckoutPage.tsx` (tracking), uusi `RestoreCartPage.tsx`, reitti `App.tsx`:ään.

**Templates:** 3 React Email -tsx-tiedostoa + rekisteröinti `registry.ts`:ään.

## Mitä EI muuteta
- Visuaalinen ilme, layout, värit (memory: NEVER alter visuals).
- Olemassa oleva maksuflow.
- Olemassa olevat sähköpostit (tilausvahvistus jne.).
