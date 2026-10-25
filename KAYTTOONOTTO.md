# Huumorikauppa: oman taustan käyttöönotto

Haara `oma-tausta`. Kassa, Stripe-webhook, tilaukset, Printify-siirto, katesääntö ja valvonta toimivat Vercelin
funktioissa, eivätkä tarvitse Lovable Cloudia. Tuotanto (`main`, huumorikauppa.fi) on koskematon, kunnes kohta 9 tehdään.

- Uusi Vercel-projekti: `huumorikauppa` tiimissä `flyapeg-2135s-projects` (sama tili kuin seniorituki).
  Testiosoite: https://huumorikauppa-five.vercel.app (noindex, canonical osoittaa huumorikauppa.fi:hin).
- Projekti ei ole kytketty GitHubiin: julkaisu tehdään komennolla `npx vercel deploy` (esikatselu) ja kohdassa 9
  `npx vercel deploy --prod`.
- Kaikki komennot ajetaan Päätteessä repon kansiossa: `cd ~/huumorikauppa && git checkout oma-tausta`.
- `vercel env add` kysyy arvon: liitä se ja paina Enter. Arvo ei näy ruudulla eikä jää komentohistoriaan.
- Ilman avaimia testiosoite näyttää kaupan (tuotteet repon tilannekuvasta), mutta kassa vastaa "ei vielä käytössä".

## Järjestys

| # | Mitä | Palvelu | Maksaa |
|---|---|---|---|
| 1 | Tietokanta | Neon Vercelin kautta | ilmainen taso |
| 2 | Taulut ja tuotteet | oma kone | - |
| 3 | Printify-avain ja kaupan tunnus | Printify | - |
| 4 | Stripe-avain ja webhook | Stripe | maksutapahtumat kuten ennen |
| 5 | Sähköposti | Resend | ilmainen 3 000 viestiä/kk |
| 6 | Ajastimen salaisuus | Vercel + GitHub | - |
| 7 | Testitilaus | testiosoite | - |
| 8 | EU-painotalot (valinnainen, ennen joulua) | Printify | - |
| 9 | Domain ja vanhan webhookin poisto samalla hetkellä | Vercel, Cloudflare, Stripe | - |

## 1. Tietokanta (Neon, ilmainen)

Vercel > Projects > huumorikauppa > Storage > Create Database > Neon > valitse **Free** > Connect to project
(Production ja Preview). Vercel lisää `DATABASE_URL`:n itse. Tarkista Päätteessä, että muuttuja on olemassa:

```
npx vercel env ls | grep -E "DATABASE_URL|POSTGRES_URL"
```

Jos haluat mieluummin oman Supabase-projektin ilmaistasolla (supabase.com > New project > Free > Settings > Database >
Connection string, Transaction pooler), aseta osoite itse:

```
npx vercel env add DATABASE_URL production
```

## 2. Taulut ja tuotteet

Kun kanta on luotu, komennot tässä järjestyksessä (yksi rivi; `.env.local` ei commitoida). Printify-avain (kohta 3)
tarvitaan EU-siirtoihin, kuluihin ja tarkistukseen:

```
npx vercel env pull .env.local --environment=production --yes && set -a && . ./.env.local && . ./.env.printify.local && set +a && node scripts/aja-schema.mjs && node scripts/tuo-tuotteet.mjs && node scripts/printify-eu-painotalot.mjs --paivita-kanta && node scripts/printify-tuonti.mjs --kulut && node scripts/tarkista-tilattavuus.mjs
```

1. `aja-schema.mjs` luo taulut (turvallinen ajaa uudelleen).
2. `tuo-tuotteet.mjs` tuo 781 tuotetta tilannekuvasta ja siirtää EU-kopion saaneet rivit uusiin Printify-tuotteisiin
   (`data/eu-siirto-*.json`). Slug, nimi, hinta, näkyvyys ja kuvaus säilyvät. Ilman Printify-avainta rivit jäävät
   vanhoihin tuotteisiin (tilattavissa) ja skripti neuvoo ajamaan vaiheen 3 myöhemmin.
3. `--paivita-kanta` vie kaikki kirjatut EU-siirrot kantaan. Idempotentti: jo siirretyt ohitetaan.
4. `printify-tuonti.mjs --kulut` hakee kulut katesääntöä varten. Vanhoja tuotteita, joilla on EU-kopio, ei tuoda, eikä
   EU-kopiosta synny kaksoisriviä (`nimi-1a2b3c`).
5. `tarkista-tilattavuus.mjs` tarkistaa, että jokaisen aktiivisen tuotteen jokainen `variant_map`-variantti on
   Printify-tuotteessa käytössä ja saatavilla. Listaa tilaamattomat yhdistelmät syineen ja päättyy koodiin 1, jos niitä
   on. Varoittaa myös riveistä, jotka osoittavat yhä vanhaan tuotteeseen.

## 3. Printify

Printify > oikea yläkulma > My profile > Connections > API tokens > **Generate**. Nimi "huumorikauppa", oikeudet:
shops.read, products.read, products.write, orders.read, orders.write, print_providers.read, catalog.read. Kopioi token.

Tehty 22.10.2026: avain on Vercelissä (`PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID` = 26630629) ja paikallisesti
tiedostossa `.env.printify.local`. Skriptit: `set -a; . ./.env.printify.local; set +a`. Uusi avain samalla tavalla:

```
cd ~/huumorikauppa && read -s "K?Printify-token: " && echo && printf '%s' "$K" | npx vercel env add PRINTIFY_API_KEY production --force && printf 'PRINTIFY_API_KEY=%s\nPRINTIFY_SHOP_ID=26630629\n' "$K" > .env.printify.local && chmod 600 .env.printify.local && unset K && echo tallennettu
```

Kaupan tunnus: komento kysyy tokenin piilotettuna ja näyttää kauppojen `id`- ja `title`-kentät. Ota Huumorikaupan `id`.

```
read -s -p "Printify-token: " K && echo && curl -s https://api.printify.com/v1/shops.json -H "Authorization: Bearer $K" && unset K
```

```
npx vercel env add PRINTIFY_SHOP_ID production
```

Printifyn kulut katesääntöä varten (40 %:n raja tarvitsee tuote- ja toimituskulut; ilman niitä kassa ei ota maksua).
Ensimmäisellä kerralla ne tulevat kohdan 2 komennossa; myöhemmin hintojen muuttuessa, ja sen jälkeen tarkistus:

```
npx vercel env pull .env.local --environment=production --yes && set -a && . ./.env.local && . ./.env.printify.local && set +a && node scripts/printify-tuonti.mjs --kulut && node scripts/tarkista-tilattavuus.mjs
```

Tarkistus: mitkä tuotteet Printifyyn on luotu 21.10.2026 (noin 280 kaupunkimukia). Komento vain listaa:

```
set -a && . ./.env.local && set +a && npx tsx scripts/printify-tuonti.mjs --luotu 2026-10-21
```

Ne pysyvät piilossa: mukit on poistettu myynnistä (`api/_lib/piilotetut.js`), ja Printifystä tuodut uudet tuotteet
tulevat aina piilotettuina (is_active false), ellei tuontia ajeta valinnalla `--julkaise`.

## 4. Stripe

Stripe > Developers > API keys > **Create restricted key**. Oikeudet: Checkout Sessions = Write, Payment Intents =
Read, kaikki muut None. Aloita testitilassa (Test mode -kytkin ylhäällä, avain `rk_test_...`).

Tallenna avain yhdellä komennolla sekä Verceliin että paikalliseen tiedostoon `.env.stripe.local` (git ei ota
tiedostoa mukaan). Komento kysyy avaimen piilotettuna: liitä se ja paina Enter. Arvo ei näy ruudulla eikä jää
komentohistoriaan.

```
cd ~/huumorikauppa && read -s "K?Stripe-avain (rk_...): " && echo && printf '%s' "$K" | npx vercel env add STRIPE_SECRET_KEY production && printf 'STRIPE_SECRET_KEY=%s\n' "$K" > .env.stripe.local && chmod 600 .env.stripe.local && unset K && echo tallennettu
```

Vercel tallentaa avaimen salaisena, eikä sitä voi ladata takaisin (`vercel env pull` kirjoittaa paikalle
`[SENSITIVE]`). Paikalliset skriptit lukevat siksi avaimen tiedostosta: `set -a; . ./.env.stripe.local; set +a`.

Webhook: Stripe > Developers > Webhooks > **Add endpoint**. Testivaiheessa osoite
`https://huumorikauppa-five.vercel.app/api/stripe-webhook`. Valitse tapahtumat `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.expired` > Add endpoint > Signing secret > Reveal.

```
cd ~/huumorikauppa && read -s "K?Webhookin signing secret (whsec_...): " && echo && printf '%s' "$K" | npx vercel env add STRIPE_WEBHOOK_SECRET production && printf 'STRIPE_WEBHOOK_SECRET=%s\n' "$K" >> .env.stripe.local && unset K && echo tallennettu
```

Älä vielä koske vanhaan Lovable-webhookiin (`...supabase.co/functions/v1/stripe-webhook`), se poistetaan kohdassa 9.

## 5. Sähköposti (Resend)

resend.com > Sign up > Domains > **Add Domain** `huumorikauppa.fi` > lisää Resendin näyttämät DNS-tietueet
Cloudflareen (Cloudflare > huumorikauppa.fi > DNS > Add record) > Verify. Sitten API Keys > **Create API Key**
(Sending access).

```
npx vercel env add RESEND_API_KEY production
```

Lähettäjä (oletus `Huumorikauppa <tilaukset@huumorikauppa.fi>`) ja hälytysten vastaanottaja (oletus info@seniorituki.fi)
tarvitsee asettaa vain, jos ne halutaan muuttaa:

```
npx vercel env add EMAIL_FROM production
```

## 6. Ajastimen salaisuus

Valvonta (`/api/cron/tilaukset`): paikkaa webhookilta jääneet maksut, yrittää epäonnistuneet Printify-siirrot
uudelleen, hakee seurantakoodit ja lähettää päivän yhteenvedon. Vercel Cron ajaa sen kerran päivässä (Hobby-tason
raja), ja GitHub Actions (`.github/workflows/tilausvalvonta.yml`, ilmainen) tunnin välein. Sama salaisuus molempiin:

```
S=$(openssl rand -hex 32) && printf %s "$S" | npx vercel env add CRON_SECRET production && printf %s "$S" | pbcopy && unset S && echo "Kopioitu leikepöydälle"
```

Liitä leikepöydän arvo GitHubiin: github.com/aarni-ai/huumorikauppa > Settings > Secrets and variables > Actions >
**New repository secret**, nimi `CRON_SECRET`. GitHubin tuntiajo alkaa vasta, kun haara on yhdistetty mainiin (kohta 9).

## 7. Testitilaus

```
npx vercel deploy --prod
```

(Uuden projektin tuotanto on vain osoite huumorikauppa-five.vercel.app, ei huumorikauppa.fi.)
Tee testiosoitteessa tilaus Stripen testikortilla 4242 4242 4242 4242, 12/34, 123. Tarkista: vahvistusviesti tulee,
Printifyssä näkyy uusi tilaus tuotannossa (peru se Printifyssä heti, jos et halua sitä tuotettavaksi), ja
info@seniorituki.fi saa hälytyksen, jos jokin epäonnistuu. Kun testi on ok, vaihda Stripe-avain ja webhook
tuotantotilaan (kohta 4 uudelleen Live mode -tilassa).

## 8. EU-painotalot (siirrot ajettu 23.-25.10.2026, kanta päivitetään kohdassa 2)

`scripts/printify-eu-painotalot.mjs` siirtää EU:n ulkopuolella tehtävät tuotteet EU-painotaloihin ja säilyttää kuvan
sijainnin, koon ja kulman: mukit OPT OnDemand Ceramic Mug (EU), Monster Digitalin paidat OPT OnDemand Gildan 64000,
body Textildruck Europa Babybugz BZ10, koristeet Harrier Ceramic Ornament (Tšekki), peitot MWW On Demand (Saksa),
seinätaulut Jondo (Espanja). Vanhat tuotteet jäävät Printifyyn (ei poisteta), ja kaupan tuoterivit päivitetään
osoittamaan uusiin. Ensin kuiva-ajo, joka vain näyttää suunnitelman:

```
set -a && . ./.env.local && set +a && npx tsx scripts/printify-eu-painotalot.mjs
```

Kuiva-ajo kertoo jokaisesta tuotteesta nykyisen ja uuden painotalon, yhdistetyt ja pudotettavat variantit sekä
ohitetut tuotteet syineen (esim. jos painotalolla ei ole vastaavaa blueprintia). Seuraavaksi koeajo yhdellä tuotteella:

```
set -a && . ./.env.local && set +a && npx tsx scripts/printify-eu-painotalot.mjs --toteuta --raja 1
```

Tarkista uusi tuote Printifyssä (My products > uusin): kuvan paikka ja koko mockupissa, hinta ja variantit. Sitten
kaikki, ja kulut päivitetään katesääntöä varten:

```
set -a && . ./.env.local && set +a && npx tsx scripts/printify-eu-painotalot.mjs --toteuta && npx tsx scripts/printify-tuonti.mjs --kulut
```

Jos siirrot ajettiin ennen kuin kanta oli olemassa (23.-25.10.2026 noin 570 tuotetta, kirjaukset `data/eu-siirto-*.json`),
kanta päivitetään kohdan 2 järjestyksessä: `tuo-tuotteet.mjs`, `printify-eu-painotalot.mjs --paivita-kanta`,
`printify-tuonti.mjs --kulut`, `tarkista-tilattavuus.mjs`. `--paivita-kanta` ei luo Printifyyn mitään ja on
turvallinen ajaa uudelleen.

Valinnat: `--vain <Printify-id>` yksi tuote, `--julkaise` julkaisee uudet tuotteet Printifyssä (ei tarvita, koska
kauppa tilaa tuote- ja varianttitunnuksella), `--poista-vanhat-julkaisusta` poistaa vanhat julkaisusta (vanhoja ei
koskaan poisteta). Skripti kirjaa jokaisen siirron tiedostoon `data/eu-siirto-<päivä>.json` ja ohittaa jo siirretyt,
joten sen voi ajaa uudelleen. Katesääntö tarkistetaan uusilla kuluilla: alle 40 %:n tuotteet poistuvat myynnistä
itsestään. Tarkista ennen täyttä ajoa: Jondo-seinätaulut siirtyvät vain, jos Jondolla on sama blueprint; muille
kuiva-ajo kertoo syyn.

## 9. Domain ja vanhan webhookin poisto samalla hetkellä

Tee nämä peräkkäin samalla istunnolla (noin 15 min), ettei sama maksu mene Printifyyn kahdesti eikä tilaus jää
käsittelemättä:

1. Stripe (Live mode) > Developers > Webhooks > lisää uusi endpoint `https://huumorikauppa.fi/api/stripe-webhook`
   (tapahtumat kuten kohdassa 4) ja aseta sen Signing secret: `npx vercel env add STRIPE_WEBHOOK_SECRET production`
   (korvaa testiarvo; komento kysyy, korvataanko).
2. Yhdistä haara ja julkaise uusi tausta:
   ```
   git checkout main && git merge oma-tausta && git push && npx vercel deploy --prod
   ```
3. Vercel > huumorikauppa (uusi projekti) > Settings > Domains > **Add** `huumorikauppa.fi` ja `www.huumorikauppa.fi`.
   Koska domain on vanhassa projektissa, Vercel näyttää TXT-tietueen (`_vercel`): lisää se Cloudflareen
   (DNS > Add record > TXT) ja paina Verify. A- ja CNAME-tietueet osoittavat jo Verceliin, niitä ei muuteta.
4. **Heti kun** `curl -s https://huumorikauppa.fi/api/products?limit=1 -o /dev/null -w '%{http_code}'` palauttaa 200
   (uusi tausta vastaa domainissa): Stripe > Webhooks > vanha endpoint
   `https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/stripe-webhook` > **Disable** (tai Delete).
5. Tarkista: `curl -sI https://huumorikauppa.fi/sitemap.xml`, yksi tuotesivu, ja tee yksi oikea tilaus.
6. GitHubin tuntiajo käynnistyy itse (Actions > Tilausvalvonta > Run workflow ajaa sen heti).

Kohtien 2 ja 4 välillä (muutama minuutti) tulleet maksut käsitellään molemmissa: valvonta paikkaa uudessa taustassa
maksut, joita sille ei tullut, ja vanha tausta voi lähettää saman tilauksen Printifyyn. Tee siirto hiljaisena aikana
(yöllä) ja tarkista Printifystä mahdolliset tuplat.

Vanhat avoimet tilaukset (maksettu ennen siirtoa) ovat Lovable Cloudissa, eikä niihin ole pääsyä: hoida ne
Printifyn hallinnasta käsin.

## 10. Kasvutoiminnot (haara kasvu-oma-tausta)

Lahjakortit, paketit, ostoskorin suositukset, toimitusarvio ja kolme valvontaa GitHub Actionsissa.

**Taulut.** Lahjakortit tarvitsevat uudet taulut (`gift_cards`, `gift_card_redemptions`) ja sarakkeet tilauksiin.
`db/schema.sql` on turvallinen ajaa uudelleen:

```
npx vercel env pull .env.local --environment=production --yes && set -a && . ./.env.local && . ./.env.printify.local && set +a && node scripts/aja-schema.mjs
```

**Lahjakortit** (`/lahjakortti`, 25/50/75/100 €): ei Printifyä eikä toimitusmaksua; koodi luodaan maksun jälkeen ja
lähtee ostajalle (ja saajalle, jos osoite annettiin) Resendillä, joten kohta 5 (RESEND_API_KEY) tarvitaan. Kassan kenttä
"Lahjakortin koodi" vähentää saldoa maksun jälkeen; jos kortti kattaa koko summan, tilaus vahvistetaan ilman Stripeä.
Stripe-avaimeen ei tarvita uusia oikeuksia.

**Paketit** (`/paketit`): määritykset generoidaan tuotteista, kun tuotteet muuttuvat:

```
node scripts/generoi-paketit.mjs
```

Pakettialennus (10 %) annetaan kassalla vain, kun paketin kate alennuksen jälkeen on vähintään 40 %. Ennen kuin
Printifyn kulut on tuotu (kohta 3, `--kulut`), alennusta ei anneta eikä sitä näytetä sivuilla.

**Toimitusarvio** tuotesivulla käyttää varovaisia oletusaikoja (`src/config/toimitusajat.ts`), joita tarkennetaan
myöhemmin painotalokohtaisiksi.

**GitHub Actions** (ilmainen, ajetaan vain mainista, eli kun haara on yhdistetty):

| Työnkulku | Milloin | Salaisuudet |
|---|---|---|
| Linkkitarkistus (`linkkitarkistus.yml`) | maanantaisin | ei tarvita |
| Saatavuus (`saatavuus.yml`) | päivittäin | sivut ja kassa: ei tarvita; varianttien saatavuus: `CRON_SECRET` (kohta 12) |
| Katetarkistus (`katetarkistus.yml`) | maanantaisin | `RESEND_API_KEY` (sähköposti), valinnainen `DATABASE_URL` |

Lisää salaisuudet: github.com/aarni-ai/huumorikauppa > Settings > Secrets and variables > Actions > **New repository
secret**. `RESEND_API_KEY` on sama arvo kuin Vercelissä (kohta 5). `DATABASE_URL` (Vercel > Storage > Neon >
`.env.local`-tiedoston arvo) antaa katetarkistuksen nähdä myös jo piilotetut alle 40 %:n tuotteet; ilman sitä tuotteet
haetaan sivuston `/api/products`-rajapinnasta. Ilman `RESEND_API_KEY`:tä katetarkistus päättyy virheeseen ja
yhteenveto näkyy Actionsin lokissa. Kaikki työnkulut voi ajaa heti: Actions > työnkulku > **Run workflow**.

Huom: niin kauan kuin kaikkien tuotteiden Printify-kulut ovat tuntemattomat, katetarkistus raportoi ne joka viikko.

## 11. Uudet tuotteet tekstilistasta (EU-painotalot)

`scripts/printify-uudet-tuotteet.mjs` tekee tekstilistasta uusia Printify-tuotteita EU-painotaloille: t-paidat,
hupparit, tarrat (Kiss-Cut Stickers) ja keraamiset joulukoristeet. Listat ovat kansiossa `data/uudet-tuotteet/`
(`joulupaidat.json` 10 joulupaitaa, `alle-20.json` 10 alle 20 €:n tarraa). Uuden listan voi tehdä kopioimalla toisen:
jokaisella tuotteella on painorivit, tyyppi, värit, valinnainen hinta, tagit ja teema, ja otsikko ja kuvaus tulevat
listan pohjista. Ajatusviivoja (en- ja em-viiva) ei hyväksytä, eikä otsikkoa, jonka kauppa luokittelisi väärään kategoriaan.

Skripti ei koskaan julkaise mitään: tuotteet luodaan Printifyyn, ja kauppaan ne tuodaan vain piilotettuina
(is_active false), kunnes hyväksyt ne.

**Mitä tarvitaan.** Printify-avain ja kaupan tunnus kohdasta 3 (`PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID`). Avaimella
pitää olla myös oikeudet **uploads.read** ja **uploads.write** (kuvien lataus): jos kohdan 3 avaimesta ne puuttuvat,
tee uusi avain, jossa ovat kohdan 3 oikeudet ja nämä kaksi, ja vaihda se Verceliin (`npx vercel env add
PRINTIFY_API_KEY production`, korvaa vanha). Kuvat tehdään koneella Pythonilla ja Pillowlla (`pip3 install pillow`).
Kauppaan tuonti ja hyväksyntä tarvitsevat `DATABASE_URL`:n (kohta 1).

**Hinta.** Pienin x,90 €:n hinta, jolla nettokate on vähintään 40 % (sama kaava kuin kassalla, `api/_lib/kate.js`),
yhden kappaleen tilauksena: Printifyn tuotekulu (kallein valittu variantti) ja Suomen toimituskulu sekä asiakkaan
toimitusmaksu. Hinta ei ole koskaan alle kategorian pohjahinnan (paita 34,90 €, huppari 64,90 €, koriste 24,90 €,
tarra 7,90 €). Oletuksena lasketaan **suunnitellulla toimitusmaksulla 5,90 €, ilmainen 60 €:sta**. Kauppa perii nyt
**6,90 € ja ilmainen toimitus alkaa 79 €:sta** (`api/_lib/vakiot.js`). Suunnitellulla maksulla laskettu hinta täyttää
aina myös nykyisen säännön, ja ajo näyttää katteen molemmilla. Nykyisellä maksulla laskeminen:
`--toimitusmaksu 6,90 --ilmainen-raja 79`. `alle-20.json`-listan tuotteet saavat maksaa enintään 19,90 €: jos
40 %:n kate tai pohjahinta vaatii enemmän, tuote raportoidaan "ei toteutettavissa" eikä sitä luoda (hintaa ei
koskaan lasketa katerajan alle; koristeet ja paidat eivät mahdu tähän rajaan pohjahintojen takia).

Printify kertoo tuotekulun vasta, kun tuote on luotu. Kuiva-ajo käyttää siksi arviota (merkitty "ARVIO"), ja
toteutus lukee luodun tuotteen oikeat kulut ja päivittää hinnan niiden mukaan. Jos alle 20 €:n tuote osoittautuu
oikeilla kuluilla liian kalliiksi, se jää Printifyyn hinnalla, joka täyttää katteen, merkitään kirjaukseen tilalla
`yli-enimmaishinnan` eikä sitä tuoda kauppaan (poista se Printifystä käsin, jos et halua sitä).

**1. Kuiva-ajo** (ei kirjoita mitään). Näyttää jokaisesta tuotteesta painotalon ja maan, blueprintin, variantit,
kulut, hinnan, katteen ja kuvatiedostot (`data/uudet-tuotteet/kuvat/`, voit katsoa ne ennen luontia):

```
set -a && . ./.env.local && set +a && node scripts/printify-uudet-tuotteet.mjs
```

Ilman avainta ajo käyttää viimeksi haettua katalogia (`data/uudet-tuotteet/.katalogi-valimuisti.json`) tai
esimerkkikatalogia (`katalogi-esimerkki.json`, keksityt painotalot ja hinnat) ja sanoo sen ensimmäisellä rivillä.
Vain yksi lista: `--lista data/uudet-tuotteet/alle-20.json`.

**2. Koeajo yhdellä tuotteella:**

```
set -a && . ./.env.local && set +a && node scripts/printify-uudet-tuotteet.mjs --toteuta --raja 1
```

Tarkista Printifyssä (My products > uusin): teksti ja sen paikka mockupissa jokaisella värillä (tummissa valkoinen,
vaaleissa musta teksti), värit ja koot, hinta ja painotalo. Tuote ei ole julkaistu, eikä sen kuulu olla.

**3. Kaikki ja tuonti kauppaan piilotettuina:**

```
set -a && . ./.env.local && set +a && node scripts/printify-uudet-tuotteet.mjs --toteuta --tuo && npx tsx scripts/printify-tuonti.mjs --kulut
```

Jälkimmäinen komento hakee Printifyn mockup-kuvat (ne valmistuvat Printifyssä vasta luonnin jälkeen) ja kulut
uusille riveille. Älä aja tuontia valinnalla `--hinnat`: se palauttaisi paitojen ja huppareiden hinnaksi kiinteän
pohjahinnan, vaikka kate vaatisi enemmän (katesääntö piilottaa silloin tuotteen myynnistä).

Skripti kirjaa luodut tiedostoon `data/uudet-tuotteet/luotu-<päivä>.json` ja ohittaa seuraavalla ajolla tekstit,
jotka on jo luotu (sama teksti ja tuotetyyppi), joten keskeytyneen ajon voi ajaa uudelleen. Muut valinnat:
`--blueprint tyyppi=id` ja `--painotalo tyyppi=id|nimi` pakottavat valinnan (esim. `--painotalo huppari=OPT`),
`--ei-kuvia` jättää kuiva-ajossa kuvat tekemättä.

**4. Hyväksyntä myyntiin.** Katso piilotetut tuotteet Printifyssä tai kirjauksesta, ja julkaise kaupassa kaikki tämän
skriptin tuomat tai vain valitut (Printify-tunnukset pilkulla eroteltuina):

```
set -a && . ./.env.local && set +a && node scripts/printify-uudet-tuotteet.mjs --hyvaksy kaikki
```

```
set -a && . ./.env.local && set +a && node scripts/printify-uudet-tuotteet.mjs --hyvaksy 6712abc,6712abd
```

Hyväksyntä tarkistaa ensin, että kulut ovat tiedossa, kate on vähintään 40 % ja tuotteella on kuvat; muuten se kertoo
syyn eikä julkaise. Tuotteet näkyvät kaupassa noin 5 minuutin kuluessa (tuotelistan välimuisti).

## 12. Varianttien saatavuus (Printify)

Kerran päivässä (`saatavuus.yml`, työ `variantit`) GitHub kutsuu suojattua osoitetta
`/api/cron/tilaukset?tehtava=saatavuus` (`CRON_SECRET`, kohta 6). Se hakee Printifystä jokaisen myynnissä olevan
tuotteen (5 hakua sekunnissa, 429-vastauksella uusi yritys) ja painotalon katalogin ja merkitsee tuoteriville
(`unavailable_variants`) väri/koko-yhdistelmät, joita ei voi juuri nyt valmistaa (pois käytöstä, loppu tai poistunut
valikoimasta). Yksi kutsu tarkistaa noin 35 sekunnin erän; työ toistaa kutsua, kunnes kaikki on tarkistettu.

- Tuotesivu ja listat (`/api/products`) eivät näytä värejä ja kokoja, joilla ei ole yhtään saatavaa yhdistelmää.
- Kassa hylkää saatavuudettoman yhdistelmän ennen maksua ("Valitsemaasi kokoa tai väriä ei voi juuri nyt valmistaa.
  Valitse toinen koko tai väri.") ja tarkistaa korin tuotteet vielä Printifystä (enintään 3 s, virheessä käytetään
  päivän tietoa).
- Tuote, jonka yksikään variantti ei ole saatavilla, piilotetaan (`is_active` false) ja palautetaan myyntiin, kun jokin
  variantti palaa. Käsin piilotettuihin ei kosketa.
- Muutoksista tulee yksi yhteenveto sähköpostiin (`OMISTAJA_EMAIL`), vain jos jotain muuttui.

Uudet sarakkeet tulevat ajamalla `node scripts/aja-schema.mjs` uudelleen (kohta 2, turvallinen ajaa monta kertaa).
Käsiajo: Actions > Saatavuus > **Run workflow**, tai komentoriviltä (lisää `&kuiva=1`, niin mitään ei tallenneta):

```
curl -H "Authorization: Bearer $CRON_SECRET" "https://huumorikauppa.fi/api/cron/tilaukset?tehtava=saatavuus"
```

Vastauksessa `jaljella` kertoo, montako tuotetta on vielä tarkistamatta; aja uudelleen, kunnes se on 0.

## Mitä jää vielä Lovable Cloudiin

Uutiskirjeen tilaus (MailerLite), hylätyn ostoskorin muistutus ja palautus, ylläpitopaneelin kirjautuminen ja
sähköpostien peruutuslinkki. Ne lakkaavat toimimasta, jos Lovable sulkee projektin; kauppa ja tilaukset toimivat silti.
