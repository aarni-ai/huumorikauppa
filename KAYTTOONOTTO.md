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

Hakee muuttujat paikalliseen `.env.local`-tiedostoon (ei commitoida), luo taulut ja tuo 781 tuotetta tilannekuvasta:

```
npx vercel env pull .env.local && set -a && . ./.env.local && set +a && node scripts/aja-schema.mjs && node scripts/tuo-tuotteet.mjs
```

## 3. Printify

Printify > oikea yläkulma > My profile > Connections > API tokens > **Generate**. Nimi "huumorikauppa", oikeudet:
shops.read, products.read, products.write, orders.read, orders.write, print_providers.read, catalog.read. Kopioi token.

```
npx vercel env add PRINTIFY_API_KEY production
```

Kaupan tunnus: komento kysyy tokenin piilotettuna ja näyttää kauppojen `id`- ja `title`-kentät. Ota Huumorikaupan `id`.

```
read -s -p "Printify-token: " K && echo && curl -s https://api.printify.com/v1/shops.json -H "Authorization: Bearer $K" && unset K
```

```
npx vercel env add PRINTIFY_SHOP_ID production
```

Printifyn kulut katesääntöä varten (40 %:n raja tarvitsee tuote- ja toimituskulut; ilman niitä kassa ei ota maksua):

```
npx vercel env pull .env.local && set -a && . ./.env.local && set +a && npx tsx scripts/printify-tuonti.mjs --kulut
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

```
npx vercel env add STRIPE_SECRET_KEY production
```

Webhook: Stripe > Developers > Webhooks > **Add endpoint**. Testivaiheessa osoite
`https://huumorikauppa-five.vercel.app/api/stripe-webhook`. Valitse tapahtumat `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.expired` > Add endpoint > Signing secret > Reveal.

```
npx vercel env add STRIPE_WEBHOOK_SECRET production
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

## 8. EU-painotalot (ei ajettu vielä)

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

## Mitä jää vielä Lovable Cloudiin

Uutiskirjeen tilaus (MailerLite), hylätyn ostoskorin muistutus ja palautus, ylläpitopaneelin kirjautuminen ja
sähköpostien peruutuslinkki. Ne lakkaavat toimimasta, jos Lovable sulkee projektin; kauppa ja tilaukset toimivat silti.
