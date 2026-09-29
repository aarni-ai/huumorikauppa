# Huumorikauppa.fi - Tilannekatsaus 2026-09-30

---

## 1. Myyntiluvut (VAIHE 2)

Stripe- ja Printify-API-avaimia ei ole saatavilla lokaalisessiossa. Luvut
haettava suoraan Stripes-hallintapaneelista tai Supabase-adminissa
webhook_logs-taulusta.

| Mittari | Arvo |
|---|---|
| 90 pv liikevaihto | haettava Stripesta |
| 30 pv liikevaihto | haettava Stripesta |
| Tilauksia 90 pv | haettava Stripesta |
| Keskiostos | haettava Stripesta |
| 20 myydyinta tuotetta | haettava Stripesta / orders-taulusta |

---

## 2. Hinnat: ennen ja jalkeen (2026-09-29)

| Kategoria | Hinta ennen | Hinta nyt |
|---|---|---|
| T-paidat | 24,90 EUR | 34,90 EUR |
| Hupparit | 49,90 EUR | 64,90 EUR |
| Pitkahihaiset | 39,90 EUR | 39,90 EUR (ei muutosta) |
| Bodyt | 24,90 EUR | 29,90 EUR |
| Mukit | ~22,95 EUR (Printify-hinta) | min. 39,90 EUR |
| Pipot / lippikset | ei alarajaa | min. 32,90 EUR |
| Laukut / kassit | ei alarajaa | min. 32,90 EUR |
| Seinataulu | ei alarajaa | min. 49,90 EUR |
| Peitot | ei alarajaa | min. 69,90 EUR |
| Koristeet | ei alarajaa | min. 24,90 EUR |
| Tarrat | ei alarajaa | min. 7,90 EUR |
| Toimitusmaksu | 3,90 EUR | 6,90 EUR |
| Ilmainen toimitus raja | 60 EUR | 79 EUR |

Hinnat paivitetty sync-logiikkaan (printify-sync.ts). Olemassa olevat
DB-tuotteet paivittyvat kun sync-printify ajataan admin-paneelista.

Vertailuhintanaytto (yliviivattu "vanha hinta") poistettu kokonaan
2026-09-29 Omnibus-direktiivin vuoksi.

---

## 3. Kate-arvio (laskettu ilman todelliset Printify-kustannukset)

Printify-kustannukset Suomeen (arvio perustuen julkiseen hinnastoon):

| Kategoria | Myyntihinta | Arvio Printify+toimitus | ALV 25,5% | Stripe 1,5%+0,25 | Nettomarginaali |
|---|---|---|---|---|---|
| T-paita | 34,90 EUR | ~10,50 EUR | ~7,10 EUR | ~0,77 EUR | ~16,53 EUR / ~47% |
| Huppari | 64,90 EUR | ~19,00 EUR | ~13,22 EUR | ~1,22 EUR | ~31,46 EUR / ~48% |
| Muki | 39,90 EUR | ~9,50 EUR | ~8,12 EUR | ~0,85 EUR | ~21,43 EUR / ~54% |
| Tarra | 7,90 EUR | ~3,00 EUR | ~1,61 EUR | ~0,37 EUR | ~2,92 EUR / ~37% |

Huom: kaikki luvut ovat arvioita. Tarkka kate lasketaan Printify API:lla
kun avaimet ovat kaytettavissa.

Tarra saattaa jaada alle 40%:n - tarkista Printify-hinnastosta.

---

## 4. SEO: ennen ja jalkeen

### Ennen (SPA ilman botti-injektiota)
- Kaikki sivut palauttivat saman HTML:n: title "Huumorikauppa", canonical etusivulle
- "0 tuotetta" metadata
- Ei Product JSON-LD

### Jalkeen (Vercel Edge Middleware)
Tarkistettu curlilla Googlebot-UA:lla (x-bot-served: true):

| Sivu | Tila | Title | Canonical | Schema |
|---|---|---|---|---|
| / | OK | "Hauskat lahjat ja huumorituotteet" | https://huumorikauppa.fi/ | WebSite + Speakable |
| /kaikki-tuotteet | OK | "Kaikki hauskat tuotteet" | .../kaikki-tuotteet | - |
| /kategoria/mukit | OK | "Hauskat Mukit - Huumorimukit" | .../kategoria/mukit | ItemList + FAQ + Speakable |
| /kategoria/t-paidat | OK | "Hauskat T-paidat - Huumoripaitat" | .../kategoria/t-paidat | ItemList + FAQ |
| /toimitusehdot | OK | "Toimitusehdot" | .../toimitusehdot | - |
| /tuote/saatanan-tunarit-t-paita | OK | tuotteen nimi + kategoria | .../tuote/... | Product (hinta+saatavuus) |

sitemap.xml: dynaaminen, sisaltaa kaikki tuotteet Supabasesta + kategoriat + blogit
robots.txt: kaikki sivut sallittu paitsi /admin, /ostoskori, /kassa (oikein)

---

## 5. Automaation tila

### Tilauksen kulku (koko ketju)
1. Asiakas maksaa -> Stripe -> checkout.session.completed
2. stripe-webhook -> processCheckoutSession:
   - Luo orders-rivi Supabaseen
   - Lahettaa tilauksen Printifyyn tuotantoon
   - Lahettaa asiakkaalle tilausvahvistussahkopostin (Mailgun/Lovable)
   - Lahettaa admin-ilmoituksen (huumorikauppa@gmail.com)
3. Varapolku: payment_intent.succeeded (jos webhook-toimitus epaonnistui)
4. Itseparantava: /tilaus-vahvistettu-sivu kutsuu get-order-by-session

### Cron-ajastukset
| Cron | Aikataulu | Tarkoitus |
|---|---|---|
| recover-orders-hourly | joka tunti :05 | Kaypi Stripe-tilaukset 14 pv:lta, prosessoi epaonnistuneet uudelleen |
| check-stuck-orders-daily | 07:05 UTC | Ilmoittaa adminille jos >5 pv vanha tilaus jumissa Printifyssa |
| site-health-check-daily | 06:00 UTC | Tarkistaa etusivu, mukit, kassa - sahkoposti jos ei vastaa |
| send-abandoned-cart-reminders | joka 15 min | Hylatyt ostoskorit |
| process-email-queue | ajastettu | Lahettaa jonossa olevat sahkopostit |
| send-monthly-newsletter | kuukausittain | Uutiskirje |

### Sahkopostikaytanto
- Tilausvahvistus asiakkaalle: order-confirmation template
- Uusi tilaus adminille: new-order-admin template -> huumorikauppa@gmail.com
- Stuck-order-havinto: admin-alert template -> huumorikauppa@gmail.com
- Sivuterveyshavanno: admin-alert template -> huumorikauppa@gmail.com

---

## 6. Build ja deployment

```
npm run build -> OK (1.61s, ei virheita)
git push origin main -> OK (commit 7122442)
```

Vercel deployaa automaattisesti main-haarasta.

---

## 7. Avoimet toimenpiteet (omistajan kasiteltava)

### Kriittinen - Supabase-migraatiot (tekematta)
Aja Supabase SQL Editor -editorissa:

```sql
-- Puuttuvat sarakkeet (estaa sync-printify-funktion)
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier text NOT NULL DEFAULT 'printify';
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_country text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS aliexpress_url text;
```

Sitten aja myos cron-migraatio:
```sql
-- Aseta ensin muuttujat:
SELECT set_config('app.settings.supabase_url', 'https://exhzrrbvipqwhjhjgnxs.supabase.co', false);
SELECT set_config('app.settings.service_role_key', '<SERVICE_ROLE_KEY>', false);
```
...ja aja sitten tiedosto `20260930070000_schedule_automation_crons.sql` SQL-editorissa.

### Tarkeaa - Printify-sync hintojen paivittamiseksi
Aja sync-printify admin-paneelista migraatioiden jalkeen. Olemassa olevien
tuotteiden hinnat DB:ssa eivat paivitu automaattisesti - vain uudet synkronoinnit
kayttavat uusia kategoriamiNimeja.

### Stripe-hinnasto
Jos Stripeen on luotu erillisia "shipping rate" -objekteja (ei vain line item),
paivita ne manuaalisesti Stripe-hallintapaneelissa: 3,90 EUR -> 6,90 EUR.

### Printify-toimitusongelmat
Tarkista onko viimeisen 90 pv aikana maksettuja tilauksia jotka eivat ole
menneet Printifyyn: Supabase -> Table Editor -> orders -> filter
`printify_status = 'pending' OR printify_status = 'failed'`.
Vaihtoehtoisesti aja recover-orders-funktio admin-paneelista parametrilla `?days=90`.

### Myyntiluvut
Hae Stripes-hallintapaneelista tai Supabase orders-taulusta.

### Testitilaus (suositeltava)
Tee Stripen testitilassa testitilaus (kayta korttia 4242 4242 4242 4242)
ja varmista etta tilausvahvistussahkoposti saapuu ja tilaus nakyy Supabase
orders-taulussa printify_status = 'submitted'.
