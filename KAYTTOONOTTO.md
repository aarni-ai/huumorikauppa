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
| 6 | Ajastimen salaisuus | Vercel (tehty) | - |
| 7 | Testitilaus | testiosoite | - |
| 8 | EU-painotalot (valinnainen, ennen joulua) | Printify | - |
| 9 | Domain ja vanhan webhookin poisto samalla hetkellä | Vercel, Domainhotelli, Stripe | - |
| 13 | Automaatio: schema.sql uudelleen, sähköpostit, valvonta, päivän yhteenveto | oma kone, GitHub | - |

## Tilanne 27.10.2026 klo 21: uusi kassa käytössä huumorikauppa.fi:ssä

**Uusi tausta ja kassa ovat käytössä osoitteessa huumorikauppa.fi ilman DNS-muutosta.** Domain on yhä vanhassa
Vercel-projektissa (tiimi aarni-ais-projects), joka rakentaa GitHubin mainin. Mainin `middleware.ts` välittää siellä
jokaisen pyynnön uuden projektin tuotantoon (`huumorikauppa-five.vercel.app`, tiimi flyapeg-2135s-projects):
sivut ja tiedostot Vercelin rewritellä, rajapinta ja POST-pyynnöt fetchillä (runko mukana). Uudessa projektissa on
`UUSI_TAUSTA=1`, joten se ei välitä. Välitetyt pyynnöt saavat otsakkeen `x-huumorikauppa-proxy`; uusi projekti ei
lisää niihin vercel.app-osoitteiden noindex-otsaketta, ja middlewaren uudelleenohjaukset menevät huumorikauppa.fi:hin.
Tarkistus: `curl -sI https://huumorikauppa.fi/ | grep -i x-huumorikauppa-valitetty` (1 = välitys päällä).

- Kassa: Stripe-tili `acct_1UVAUMPNXkES1q9G` (Uusiku Oy), avain "Full access except sensitive operations",
  webhook `https://huumorikauppa-five.vercel.app/api/stripe-webhook`. Paluu maksun jälkeen huumorikauppa.fi:hin.
- Kuitti: ilman Resendiä kassa asettaa `receipt_email`, jolloin Stripe lähettää kuitin live-tilassa
  sähköpostiasetuksista riippumatta (api/checkout.js). Kun RESEND_API_KEY on käytössä, oma tilausvahvistus korvaa sen.
- Julkaisu uuteen projektiin: `scripts/julkaise-uusi.sh` (vercel.json + ajastukset `vercel.crons.json`). Ajastukset
  ovat erillään, koska vanha projekti rakentaa saman vercel.json-tiedoston, ja tunnin välein ajettavat ajastukset
  estäisivät julkaisun, jos vanha tiimi on Hobby-tasolla. **Mainiin pushaaminen ei julkaise uutta projektia**: aja
  `scripts/julkaise-uusi.sh` mainista (vanha projekti julkaisee välityksen itse GitHubista).
- Lovablen kassa: sivusto ei kutsu sitä enää (ei `create-checkout`-kutsuja tuotannon JavaScriptissä). Vanhan kassan
  Stripe-tili `acct_1THtN1AhUyocG7PO` on ennallaan (ei kosketa).

**Domainin siirto uuteen projektiin (ei kiireellinen, välitys toimii):**
1. Vercelin vahvistustietueet (`_vercel` TXT, alla rivit 14-15) DNS:ään. Nimipalvelimet ovat Cloudflaressa
   (`aria.ns.cloudflare.com`, `huxley.ns.cloudflare.com`). Cloudflare-tilin omistajaa ei voi päätellä DNS:stä eikä
   Vercelistä. Lovablen domainyhteys on aikanaan kirjoittanut tietueita (DMARC-raportit lovable.dev:iin), joten tili on
   todennäköisesti se, jolla Lovablen domainyhteys hyväksyttiin: kokeile dash.cloudflare.com > Forgot password
   osoitteilla flyapeg@gmail.com, huumorikauppa@gmail.com ja flyapegt@gmail.com. Jos tiliä ei löydy: vaihda
   nimipalvelimet Domainhotellissa (rekisteröijä Planeetta Internet Oy) Domainhotellin omiin ja lisää tietueet alla
   olevan taulukon mukaan.
2. Kun Vercel on vahvistanut domainin uudelle projektille, poista välitys: `middleware.ts` (valitysKohde,
   valita, valitaFetch) ja ajastukset takaisin `vercel.json`-tiedostoon, sitten `scripts/julkaise-uusi.sh`.
3. Webhookin osoitteeksi voi silloin vaihtaa `https://huumorikauppa.fi/api/stripe-webhook` (nykyinen toimii myös).

**Resend (asennettu 28.10.2026, ilmainen suunnitelma, RESEND_API_KEY Vercelissä):** odottaa DNS-tietueita 11-13.
Alla oleva asennusohje on tehty. Vercel CLI on kirjautunut käyttäjänä **flyapeg@gmail.com** (tunnus flyapeg-2135, tiimi
flyapeg-2135s-projects). Integraatio vaatii ehtojen hyväksynnän selaimessa:
1. Kirjaudu https://vercel.com/login > "Continue with Email" > flyapeg@gmail.com (kirjautumislinkki tulee siihen
   postilaatikkoon) tai "Continue with Google" samalla Google-tilillä flyapeg@gmail.com.
2. Avaa https://vercel.com/flyapeg-2135s-projects/~/integrations/accept-terms/resend?source=cli
3. Lue ehdot, paina **Accept** / **Continue**, valitse tiimi flyapeg-2135s-projects ja projekti `huumorikauppa`
   (Production), paina **Install** / **Connect**.
4. Kerro, kun valmis: ajan `npx vercel integration add resend`, julkaisen (`scripts/julkaise-uusi.sh`), lisään
   domainin Resendiin (`?tehtava=resend-domain`) ja kirjaan DKIM-arvon taulukon riville 13.

Vaihtoehto ilman Vercelin selainkirjautumista: tili resend.com:iin, API Keys > Create (Sending access), ja tallennus:
`cd ~/huumorikauppa && read -s "K?Resend-avain: " && echo && printf '%s' "$K" | npx vercel env add RESEND_API_KEY production && unset K`

## Go-live: tarkistuslista (tilanne 27.10.2026 illalla)

Valmiina Vercel-projektissa `huumorikauppa` (Pro, testiosoite huumorikauppa-five.vercel.app): Neon-kanta ja tuotteet
(EU-kopiot), PRINTIFY_API_KEY, PRINTIFY_SHOP_ID, CRON_SECRET (myös `.env.cron.local`, chmod 600),
MARKKINOINTI_SALAISUUS, OMISTAJA_EMAIL ja **MYYJA=uusiku** (asetettu 27.10., testiosoite näyttää jo Uusiku Oy:n).
Kassa perii 6,90 € ja toimitus on ilmainen 79 eurosta (`api/_lib/vakiot.js`). Ajastetut työt ovat **Vercel Cronissa**
(`vercel.json`: valvonta tunnin välein, päivän yhteenveto klo 7, varianttien saatavuus aamuisin, katetarkistus
maanantaisin). Vercel lähettää CRON_SECRETin itse, joten GitHubin salaisuuksia ei tarvita. GitHubiin jäävät vain
linkki- ja sivujen saatavuustarkistus, jotka eivät tarvitse salaisuuksia.

Puuttuu vain kolme avainta. Kun ne ovat Vercelissä, yksi komento julkaisee ja tarkistaa kaiken:

1. **Stripe (Uusiku Oy:n uusi tili)**: Developers > API keys > Create restricted key (Checkout Sessions = Write,
   Payment Intents = Read, muut None). Aloita testitilassa (`rk_test_...`). Tallenna:
   `cd ~/huumorikauppa && read -s "K?Stripe-avain: " && echo && printf '%s' "$K" | npx vercel env add STRIPE_SECRET_KEY production && unset K`
2. **Stripe-webhook**: Developers > Webhooks > Add endpoint `https://huumorikauppa-five.vercel.app/api/stripe-webhook`
   (testivaihe; domainin siirron jälkeen `https://huumorikauppa.fi/api/stripe-webhook`), tapahtumat
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`.
   Signing secret: `read -s "K?whsec: " && echo && printf '%s' "$K" | npx vercel env add STRIPE_WEBHOOK_SECRET production && unset K`
3. **Resend Vercel Marketplacen kautta**: Vercel > Integrations > Marketplace > Resend > Install, yhdistä projektiin
   `huumorikauppa` (Production). Integraatio lisää `RESEND_API_KEY`:n itse.
4. **Julkaisu ja tarkistus yhdellä komennolla**:
   `cd ~/huumorikauppa && git checkout oma-tausta && git pull && scripts/kayttoonotto.sh`.
   Skripti tarkistaa avaimet, ajaa testit, julkaisee (uusi tausta, kassa 6,90 € / 79 €, MYYJA=uusiku, Vercel Cron)
   ja tarkistaa sivut kolmella User-Agentilla, kassan (`scripts/kassatesti.mjs`: Stripe-sessio molemmilla
   toimitussäännöillä), valvonnan ja Resend-domainin. Testiavaimella tee yksi tilaus Stripen sivulla kortilla
   4242 4242 4242 4242 ja tarkista vahvistusviesti; sitten Live mode -avain ja -webhook kohtien 1 ja 2 komennoilla ja
   `scripts/kayttoonotto.sh` uudelleen.
5. **DNS Domainhotelliin** (alla, "DNS: Domainhotelli"): nimipalvelimet Domainhotelliin ja tietueet, myös Resendin.
   Resendissä Verify.
6. **Domain huumorikauppa.fi tähän projektiin**: lisätty valmiiksi 27.10. (odottaa vahvistusta). Vercelin
   `_vercel`-TXT-tietue lisätään vasta käyttöönoton hetkellä (kohta 9), koska se siirtää domainin uuteen projektiin.
7. **Vanha kassa kiinni**: ohje alla, "Vanhan kassan sulkeminen". Uuden taustan koodi ei kutsu Lovablen kassaa
   missään (testi `src/test/vanhaKassa.test.ts`), ja vanhan Vercel-projektin osoitteet (`*.aarni-ais-projects.vercel.app`)
   ohjautuvat huumorikauppa.fi:hin.
8. **Yhdistä haara mainiin** (`git checkout main && git merge oma-tausta && git push`). Mainin väliaikainen
   tappioesto (`api/_lib/lovable-kassa-tappio.js`, piilottaa 3XL-5XL-koot ja lisämyynnin tarran Lovablen kassan
   takia) on oma-tausta-haarassa tyhjä, joten koot ja tarra palaavat yhdistämisessä.

### DNS: Domainhotelli (huumorikauppa.fi)

**Tilanne 27.10.2026:** domain on rekisteröity Domainhotellissa (whois: Planeetta Internet Oy), mutta nimipalvelimiksi
on asetettu Cloudflare (`aria.ns.cloudflare.com`, `huxley.ns.cloudflare.com`). Siksi Domainhotellin DNS-paneelin
tietueet eivät ole käytössä, ennen kuin nimipalvelimet vaihdetaan Domainhotellin omiin. Tietueet on luettu julkisesta
DNS:stä 27.10.2026; Cloudflaren koko vyöhykettä ei nähty. Jos Cloudflaren tunnukset löytyvät, tarkista sieltä (DNS >
Records > Export), ettei listasta puutu mitään.

**Vaihe A: nimipalvelimet (milloin tahansa ennen käyttöönottoa, hiljaisena aikana).**
Domainhotellin hallintapaneeli > huumorikauppa.fi > Nimipalvelimet, vaihda nimipalvelimiksi
`ns1.domainhotelli.fi`, `ns2.domainhotelli.fi`, `ns3.domainhotelli.com`. Lisää heti perään DNS-hallintaan kaikki
alla olevat tietueet (paitsi `_vercel`). Muutos leviää .fi-rekisterissä tunneissa; sinä aikana osa kävijöistä näkee
vielä Cloudflaren tietueet, jotka ovat samat, joten sivusto ja Zohon sähköposti toimivat koko ajan.

| # | Tyyppi | Nimi (isäntä) | Arvo | Prio | Huom. |
|---|---|---|---|---|---|
| 1 | A | `@` (huumorikauppa.fi) | `216.150.1.1` | | Vercel |
| 2 | A | `@` | `216.150.16.1` | | Vercel |
| 3 | CNAME | `www` | `bffaf7b5fcbd90db.vercel-dns-016.com.` | | Vercel; uusi projekti ohjaa www:n juureen (308) |
| 4 | MX | `@` | `mx3.zoho.eu` | 50 | nykyinen Zoho, ennallaan |
| 5 | TXT | `@` | `v=spf1 +a +mx +ip4:31.217.196.126 +ip4:31.217.196.127 ~all` | | nykyinen SPF, ennallaan |
| 6 | TXT | `@` | `google-site-verification=snmSsxmak4jKGwNYWtq5kkJJVBo7vaI0oQMG_hp-5BA` | | Search Console |
| 7 | TXT | `@` | `google-site-verification=Afupwj3flTopFzNZiTu01DXMDlJWGkKOpddZzvTHkL4` | | Search Console |
| 8 | TXT | `@` | `trustpilot-one-time-verification-id=f57afbee-a2c3-4d50-94c3-3ff988b0d193` | | Trustpilot |
| 9 | TXT | `default._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvePedSMPgTEzGLkrq3P/qjOQVFMbxMWvD8k1LR4390ZmNnGUrpNtgKYXpiUmXRsn2TTaPy9Zv52OexJqJAcfkJU7tQ0MXlHlPidAdSGxv28GjGiVCdrjceyaWOVm+B4RYqL6i226MCVHIClTZ4wwKMSpf5vEzD5r3pL2EDpW4+dJJ2F7g2BINBtY5cJ88EgygGlVYuaztumKg4Oqccp0I3UGtMl3Nj7G571Jhca8j7mlUWHTwz7QK+2ti9vVAVoJPc2qmVriuhJYPgGgj4mpg00+vzfwpWyG3mgvFJ+Q3dWAcLO2ybJOwI5ieDh5DWMIIxJXAyZ15Rfozt9m5mhE1QIDAQAB` | | nykyinen DKIM, ennallaan |
| 10 | TXT | `_dmarc` | `v=DMARC1; p=none; pct=100; rua=mailto:huumorikauppa@gmail.com` | | korvaa lovable.dev-osoitteen |
| 11 | MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 | Resend (palautukset) |
| 12 | TXT | `send` | `v=spf1 include:amazonses.com ~all` | | Resend SPF |
| 13 | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUF9+bjHNQ5hAgzDsFGX1wp7BSE29aR3LATlC5vLJ4LSzDc408WZTQ9uZOyZFFSoVhOLXzz0/lCeSDghDgu9uLFNdHNj/5my88gnI6l+fyRwrWF77D5RCglNTYBEiiCQlLCynfYzU0sIjNUx88gT4i9stracQxMLXZ7kb37Q9OfwIDAQAB` | | Resend DKIM (luotu 28.10.2026, alue eu-west-1) |
| 14 | TXT | `_vercel` | `vc-domain-verify=huumorikauppa.fi,f6db53b10f680ae452fe` | | **vasta käyttöönotossa (kohta 9)** |
| 15 | TXT | `_vercel` | `vc-domain-verify=www.huumorikauppa.fi,795afe3a11413258ab01` | | **vasta käyttöönotossa (kohta 9)** |

Rivit 1-3: Vercelin suosittelemat arvot uudelle projektille (API `domains/config`, 27.10.2026). Nykyiset A-arvot
(`216.198.79.65`, `64.29.17.65`) ovat myös Vercelin, joten kumpikin toimii; uudet ovat Vercelin ensisijaiset.
Vercel ohjaa liikenteen sen projektin sivulle, jolle domain on vahvistettu, ei IP-osoitteen perusteella.

Rivit 14-15 siirtävät domainin vanhasta Vercel-projektista (tiimi aarni-ais-projects) uuteen heti, kun Vercel ne
näkee. Siksi ne lisätään vasta kohdassa 9, kun avaimet on testattu. Vanhan tiimin `_vercel`-tietueita
(`...1cd38cc81b9f3fc95d0a`, `...63152a5c20797d66be51`) ei tarvita.

Rivi 10: DMARC-raportit menevät huumorikauppa@gmail.com-osoitteeseen. Osa raportoijista lähettää raportit toiseen
domainiin vain, jos vastaanottava domain sen erikseen sallii (gmail.com ei salli). Jos raportteja ei tule, käytä
osoitetta omassa domainissa (esim. `dmarc@huumorikauppa.fi` Zohossa).

Rivi 13: Resend loi domainin 28.10.2026 Vercelin Resend-integraation kautta (ilmainen suunnitelma, 3 000 viestiä/kk,
alue eu-west-1); arvo yllä. Tila `not_started`, kunnes tietueet 11-13 ovat DNS:ssä. Siihen asti Resend ei lähetä
huumorikauppa.fi-osoitteesta (403 "domain is not verified"), joten kassa pyytää Stripen kuitin. Kun domain on
`verified`: `printf '1' | npx vercel env add SAHKOPOSTI_VAHVISTETTU production` ja `scripts/julkaise-uusi.sh`,
jolloin oma tilausvahvistus korvaa Stripen kuitin. Tietueet ovat domainikohtaisia ja ne voi tarkistaa uudelleen: Kun `RESEND_API_KEY` on Vercelissä ja
projekti julkaistu, tämä lisää domainin Resendiin (alue EU) ja tulostaa kaikki tietueet tarkkoine arvoineen:

```
cd ~/huumorikauppa && curl -s -H "Authorization: Bearer $(cut -d= -f2- .env.cron.local)" "https://huumorikauppa-five.vercel.app/api/cron/tilaukset?tehtava=resend-domain" | python3 -m json.tool
```

Kun tietueet on lisätty, sama komento loppuun `&vahvista=1` pyytää Resendiä tarkistamaan ne (tila `verified`).
Tarkistus komentoriviltä: `dig +short NS huumorikauppa.fi` (Domainhotelli), `dig +short TXT resend._domainkey.huumorikauppa.fi`.

### Vanhan kassan sulkeminen (ohje, ei vielä tehty)

**Millä tilillä Lovablen kassa toimii (selvitetty 27.10.2026):** Lovablen create-checkout loi live-session
(`cs_live_...`, ei maksettu), jonka Stripe-sivu kertoo myyjän tiedot: tili **`acct_1THtN1AhUyocG7PO`**, nimi
"Huumorikauppa", tukiosoite huumorikauppa@gmail.com, osoite huumorikauppa.fi, tiliotemerkintä HUUMORIKAUPPA, maa FI.
Tili ei siis ole inteller.info. Se on joko toinen kahdesta "Huumorikauppa"-tilistä samalla kirjautumisella tai tili
toisella kirjautumisella (todennäköisesti huumorikauppa@gmail.com). Tarkistus: Stripe > tilinvaihtaja > kukin
Huumorikauppa-tili > Settings > Business > Account details > Account ID. Uusiku Oy:n uusi tili ei saa olla
`acct_1THtN1AhUyocG7PO`; jos on, Lovablen kassa ja uusi kassa ovat samalla tilillä, eikä avaimen kiertoa (vaihe 3)
saa tehdä, vaan vain vanhan webhookin poisto (vaihe 2).

Testisessio vanhenee itsestään 24 tunnissa. Lovable voi kirjata sen keskeneräiseksi tilaukseksi
(kassatesti@huumorikauppa.fi).

**Vanhan kassan reitti (selvitetty 28.10.2026 klo 12).** Vanhan Lovable-kassan maksufunktio
(`exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/create-checkout`, Lovable Cloud) luo yhä live-sessioita tilille
`acct_1THtN1AhUyocG7PO`: testipyyntö 28.10. sai `cs_live_`-session. Session oli maksamaton, vanhenee 24 tunnissa eikä
näy uuden tilin sessioissa. Sitä kutsuu vain vanha sivuston JavaScript, eli selainvälilehti, joka on avattu ennen
27.10. klo 20.30. Vanhat osoitteet eivät enää tarjoa vanhaa sovellusta:
- `huumorikauppa.lovable.app`: 302 -> huumorikauppa.fi
- `huumorikauppa-aarni-ais-projects.vercel.app` ja `-git-main-`: 307 -> huumorikauppa.fi
- www: 307 -> huumorikauppa.fi
- Wayback Machinessa ei ole kassasivua, ja Googlen välimuistia ei enää ole.

Reitin sulkeminen vaatii Lovable- tai vanhan Stripe-tilin pääsyn, eikä tätä voi tehdä koodista. Tee jompikumpi:
1. **Lovable (suositus):** projekti > Cloud > Edge Functions > `create-checkout` > poista tai poista käytöstä.
   Vaihtoehtoisesti Cloud > Secrets > tyhjennä `STRIPE_SECRET_KEY`. Vanha webhook ja tilin maksut, palautukset ja
   riita-asia toimivat edelleen.
2. **Vanha Stripe-tili `acct_1THtN1AhUyocG7PO`:** Developers > API keys > Secret key > Roll key, vanhentuminen "now".
   Lovablen kassa ei sen jälkeen voi luoda sessioita. Dashboardin palautukset ja 3.11. riita-asia toimivat ennallaan,
   koska ne eivät käytä avainta. Tiliä ei suljeta.

Tarkistus sulkemisen jälkeen: vanhan create-checkoutin kutsu (KASVU-RAPORTTI.md 28.10.2026, "Vanha kassa") ei saa palauttaa
`cs_live_`-osoitetta, ja `node scripts/kassatesti.mjs --url https://huumorikauppa.fi --salli-live` luo session
tilille `acct_1UVAUMPNXkES1q9G`.

**Vanhan kassan webhookin sulkeminen (päivitetty 28.10.2026). Saa tehdä vasta, kun ensimmäinen oikea tilaus on
mennyt uuden kassan läpi.** Uusi kassa on ollut käytössä huumorikauppa.fi:ssä 27.10.2026 alkaen (välitys), eikä
sivusto kutsu Lovablen kassaa. Vanhan tilin webhook on vielä päällä, joten mahdollinen suora maksu vanhaan kassaan
käsitellään edelleen.

Ennakkoehto (kaikki täytyttävä):
- Omistajalle on tullut viesti "[Huumorikauppa] Uusi tilaus #...", ja Stripen tilillä `acct_1UVAUMPNXkES1q9G`
  (Uusiku Oy) näkyy maksu tilassa Succeeded.
- Tilaus on Printifyssä tilassa "In production" tai myöhemmin (viestin rivi "Printify: tuotannossa").
- Vanhaan tiliin `acct_1THtN1AhUyocG7PO` ei ole tullut uusia maksuja 27.10.2026 jälkeen (Payments, suodatin
  Date > 27.10.2026).

Toimenpiteet vanhalla tilillä `acct_1THtN1AhUyocG7PO` (Live mode):
1. Developers > Webhooks > endpoint `https://exhzrrbvipqwhjhjgnxs.supabase.co/functions/v1/stripe-webhook` >
   ... > **Disable endpoint**. Älä poista sitä (Disable riittää ja on peruttavissa).
2. Tarkista samasta näkymästä, että endpointin tila on Disabled eikä tapahtumia lähde.
3. **Älä sulje tiliä, älä kierrä avaimia äläkä muuta tilin asetuksia.** Tilillä hoidetaan avoin riita-asia
   3.11.2026, ja sen maksut, palautukset ja tilitykset tarvitaan. Avainten kierron voi harkita vasta, kun riita on
   ratkaistu ja palautusaika viimeisestä vanhan kassan tilauksesta on kulunut.
4. Kirjaa KASVU-RAPORTTI.md:hen päivä ja kellonaika.

Tarkistus sulkemisen jälkeen: tee uusi testisessio huumorikauppa.fi:ssä (`node scripts/kassatesti.mjs --url
https://huumorikauppa.fi --salli-live`) ja varmista, että se syntyy tilille `acct_1UVAUMPNXkES1q9G`.

## 1. Tietokanta (Neon, ilmainen)

neon.tech > **Sign up** (Google- tai GitHub-tunnuksella) > Create project: nimi `huumorikauppa`, Postgres-versio
oletus, alue **AWS Europe Central (Frankfurt)** > Create. Plan: **Free** (ei maksukorttia). Projektin etusivulla
**Connect** > valitse **Pooled connection** > kopioi connection string (`postgresql://...`).

Tallenna se yhdellä komennolla sekä Verceliin että paikalliseen tiedostoon `.env.database.local`:

```
cd ~/huumorikauppa && read -s "K?Neon connection string: " && echo && printf '%s' "$K" | npx vercel env add DATABASE_URL production && printf 'DATABASE_URL=%s\n' "$K" > .env.database.local && chmod 600 .env.database.local && unset K && echo tallennettu
```

## 2. Taulut ja tuotteet

Kun kanta on luotu, komennot tässä järjestyksessä (yksi rivi; `.env.local` ei commitoida). Printify-avain (kohta 3)
tarvitaan EU-siirtoihin, kuluihin ja tarkistukseen:

```
cd ~/huumorikauppa && set -a && . ./.env.database.local && . ./.env.printify.local && set +a && node scripts/aja-schema.mjs && node scripts/tuo-tuotteet.mjs && node scripts/printify-eu-painotalot.mjs --paivita-kanta && node scripts/printify-tuonti.mjs --kulut && node scripts/tarkista-tilattavuus.mjs
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

**Ajettu 27.10.2026** Neon-kantaan (Vercel-projekti `huumorikauppa`) Vercel-funktion kautta, koska Marketplace-
integraation DATABASE_URL on Sensitive eikä sitä saa koneelle (väliaikainen tehtävä, poistettu ajon jälkeen; sama
kirjastokoodi `scripts/lib/eu-kanta.mjs`). Tulos: taulut 11; tuotu 781 tuotetta (781 aktiivista); EU-siirrot 692/692
riviä EU-kopioihin, 0 virhettä, vanhaan tuotteeseen osoittavia rivejä 0; kulut: Printifystä 1 521 tuotetta,
päivitetty 791, ohitettu vanhana (EU-kopio korvaa) 697, uusia piilotettuja rivejä 33 (kannassa nyt 814 riviä, kaikilla
`variants.costs`); tilattavuus: 781 tuotetta, 8 317 avainta, ei tilattavissa 162 (kaikki `ei_saatavilla`, lähinnä
huppareiden 3XL-5XL ja muutama t-paidan Hiekka-väri). Saatavuustehtävä (`?tehtava=saatavuus`) ajettiin perään
loppuun (jaljella 0), joten nämä yhdistelmät on kirjattu `unavailable_variants`-kenttään eivätkä näy kaupassa.
Uudelleenajo koneelta onnistuu, kun Neonin connection string on `.env.database.local`-tiedostossa (kohta 1).

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

Printifyn kulut katesääntöä varten (myynnin raja 20 %, `api/_lib/kate.js` KATE_RAJA; raja tarvitsee tuote- ja toimituskulut; ilman niitä kassa ei ota maksua).
Ensimmäisellä kerralla ne tulevat kohdan 2 komennossa; myöhemmin hintojen muuttuessa, ja sen jälkeen tarkistus:

```
cd ~/huumorikauppa && set -a && . ./.env.database.local && . ./.env.printify.local && set +a && node scripts/printify-tuonti.mjs --kulut && node scripts/tarkista-tilattavuus.mjs
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

resend.com > **Sign up** > Free-taso (3 000 viestiä/kk, 100/pv, ei maksukorttia). API Keys > **Create API Key**:
nimi `huumorikauppa`, Permission **Sending access** > Add > kopioi avain (`re_...`).

```
cd ~/huumorikauppa && read -s "K?Resend-avain (re_...): " && echo && printf '%s' "$K" | npx vercel env add RESEND_API_KEY production && printf 'RESEND_API_KEY=%s\n' "$K" > .env.resend.local && chmod 600 .env.resend.local && unset K && echo tallennettu
```

Lähetysosoite `tilaukset@huumorikauppa.fi` vaatii domainin vahvistuksen Resendissä (Domains > Add Domain, DNS-tietueet).
Se tehdään domainin siirron yhteydessä (kohta 9). Siihen asti Resend lähettää vain tilin omaan osoitteeseen, joten
asiakasviestit eivät vielä lähde.

## 6. Ajastimen salaisuus (tehty 27.10.2026)

Valvonta (`/api/cron/tilaukset`): paikkaa webhookilta jääneet maksut, yrittää epäonnistuneet Printify-siirrot
uudelleen, hakee seurantakoodit, lähettää muistutukset ja arviopyynnöt sekä päivän yhteenvedon (kohta 13). Vercel Cron
(Pro) ajaa sen tunnin välein ja lähettää otsakkeen `Authorization: Bearer CRON_SECRET` itse. CRON_SECRET on Vercelissä
(production) ja tiedostossa `.env.cron.local` (chmod 600) käsiajoja varten. GitHubiin ei tarvita salaisuutta.
Ajastimet alkavat toimia projektin tuotantojulkaisusta (testiosoite), eivät vasta domainin siirrosta.

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
joten sen voi ajaa uudelleen. Katesääntö tarkistetaan uusilla kuluilla: alle 20 %:n tuotteet poistuvat myynnistä
itsestään. Tarkista ennen täyttä ajoa: Jondo-seinätaulut siirtyvät vain, jos Jondolla on sama blueprint; muille
kuiva-ajo kertoo syyn.

**27.10.2026: EU-reitityksen piilottamat 35 riviä.** 24:llä oli EU-kopio (23.10.). Loput 11: luotu 8
(`data/eu-siirto-2026-10-27.json`: 4 t-paitaa OPT OnDemand CZ, 4 hupparia Textildruck Europa DE) valinnoilla
`--tekstitasot-kuviksi --pudota-paikat neck --vain <id,...>`. Tekstitasot piirrettiin PNG:ksi (Pillow, Google Fonts
-fontit `tools/printify-merkkipaiva/renderer/fonts`) samaan kohtaan ja kokoon; Printify Choicen kaulaetiketti jätettiin
pois (Textildruck laskuttaa sen erikseen). Ei tehty 3: keraamiset koristeet (2) ja lippis, koska Printifyn
katalogissa ei ole niille EU-painotaloa. Kanta päivitetään julkaisun jälkeen funktiolla (DATABASE_URL on Sensitive):

```
S=$(cut -d= -f2- .env.cron.local); curl -s -m 90 -H "Authorization: Bearer $S" "https://huumorikauppa-five.vercel.app/api/cron/tilaukset?tehtava=eu-siirrot&kuiva=1"; curl -s -m 90 -H "Authorization: Bearer $S" "https://huumorikauppa-five.vercel.app/api/cron/tilaukset?tehtava=eu-siirrot"; unset S
```

Vastauksen `euReititys` kertoo piilotettujen rivien tilan (`euKopiossa` 32, `vanhassa` vain 3 yllä mainittua).
Idempotentti; jos `kesken` > 0, aja uudelleen. Perään `?tehtava=saatavuus` (siirto tyhjentää `unavailable_variants`).

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
   Tehty valmiiksi 27.10.2026 (odottaa vahvistusta, www ohjaa juureen 308). Lisää Domainhotellin DNS-hallintaan
   `_vercel`-TXT-tietueet (taulukon rivit 14-15, "DNS: Domainhotelli") ja paina Vercelissä Verify. Domain siirtyy
   uuteen projektiin heti vahvistuksen jälkeen.
4. **Heti kun** `curl -s https://huumorikauppa.fi/api/products?limit=1 -o /dev/null -w '%{http_code}'` palauttaa 200
   (uusi tausta vastaa domainissa): vanha kassa kiinni ohjeen "Vanhan kassan sulkeminen" mukaan (Stripe-tili
   `acct_1THtN1AhUyocG7PO`: vanha webhook Disable ja salainen avain Roll).
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
cd ~/huumorikauppa && set -a && . ./.env.database.local && . ./.env.printify.local && set +a && node scripts/aja-schema.mjs
```

**Lahjakortit** (`/lahjakortti`, 25/50/75/100 €): ei Printifyä eikä toimitusmaksua; koodi luodaan maksun jälkeen ja
lähtee ostajalle (ja saajalle, jos osoite annettiin) Resendillä, joten kohta 5 (RESEND_API_KEY) tarvitaan. Kassan kenttä
"Lahjakortin koodi" vähentää saldoa maksun jälkeen; jos kortti kattaa koko summan, tilaus vahvistetaan ilman Stripeä.
Stripe-avaimeen ei tarvita uusia oikeuksia.

**Paketit** (`/paketit`): määritykset generoidaan tuotteista, kun tuotteet muuttuvat:

```
node scripts/generoi-paketit.mjs --kulut katteet.json
```

`--kulut` (scripts/katteet.mjs-tuloste, `{ slug, kulu, toimitus }`) valitsee paketeittain suurimman alennuksen
10..5 %, jolla paketin kate pysyy vähintään 30 %:ssa; muuten paketti jää määrityksiin `kaytossa: false` ja syy
kommenttina. Tonnin seteli (t-paita + huppari) on aina ensimmäisenä. 26.10.2026 kuluilla yksikään pari ei yllä 30 %:iin
(t-paita + huppari 74,80 €: kate 5 %:n alennuksella -2,6 %, vaatisi parin hinnaksi noin 111 €), joten kaikki
pakettialennukset ovat pois käytöstä.

Pakettialennus (5-10 %, paketeittain) annetaan kassalla vain, kun paketin kate alennuksen jälkeen on vähintään 30 %
(`PAKETTI_KATE_RAJA`). Ennen kuin
Printifyn kulut on tuotu (kohta 3, `--kulut`), alennusta ei anneta eikä sitä näytetä sivuilla.

**Toimitusarvio** tuotesivulla käyttää varovaisia oletusaikoja (`src/config/toimitusajat.ts`), joita tarkennetaan
myöhemmin painotalokohtaisiksi.

**GitHub Actions** (ilmainen, ajetaan vain mainista, eli kun haara on yhdistetty):

| Työnkulku | Milloin | Salaisuudet |
|---|---|---|
| Linkkitarkistus (`linkkitarkistus.yml`) | maanantaisin | ei tarvita |
| Saatavuus (`saatavuus.yml`, sivut ja kassa) | päivittäin | ei tarvita |

Varianttien saatavuus, katetarkistus ja päivän yhteenveto ajetaan Vercel Cronilla (kohta 13), eivät GitHubissa.

Lisää salaisuudet: github.com/aarni-ai/huumorikauppa > Settings > Secrets and variables > Actions > **New repository
secret**. `RESEND_API_KEY` on sama arvo kuin Vercelissä (kohta 5). `DATABASE_URL` (Vercel > Storage > Neon >
`.env.local`-tiedoston arvo) antaa katetarkistuksen nähdä myös jo piilotetut alle 20 %:n tuotteet; ilman sitä tuotteet
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

**Hinta.** Pienin x,90 €:n hinta, jolla nettokate on vähintään 40 % (hinnoittelun tavoite `HINNOITTELU_KATE`;
myynnin raja on erikseen 20 %; sama kaava kuin kassalla, `api/_lib/kate.js`),
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
`--ei-kuvia` jättää kuiva-ajossa kuvat tekemättä. Saman voi kirjoittaa listaan (oletuksiin tai tuotteelle):
`"painotalo": "Textildruck Europa", "blueprint": 145`; komentorivi ohittaa listan.

**Joulu ja eläke 2026** (`joulu-elake-2026.json`, 15 t-paitaa). Luotu Printifyyn 26.10.2026 (`luotu-2026-10-26.json`)
Textildruck Europalle (DE), Gildan Softstyle 64000 (blueprint 145), koot S-2XL: kulu 9,28 €, toimitus Suomeen 7,29 €.
Nykyinen kauppa tuo ne seuraavana yönä aktiivisina 24,90 €:lla (kate 31,7 % toimitusmaksulla 6,90 €). Uudelleen
luontia ei tarvita (kirjaus ohittaa ne). Oma tausta: jos tilannekuva (`tuo-tuotteet.mjs`) on otettu ennen niiden
synkkaa, kohdan 2 `printify-tuonti.mjs --kulut` tuo ne piilotettuina t-paitojen pohjahinnalla 34,90 €. Aseta silloin
hinta samaksi kuin muilla paidoilla ja hyväksy (tunnukset: `luotu-2026-10-26.json`, lista "Joulu ja eläke 2026"):

```
set -a && . ./.env.database.local && . ./.env.printify.local && set +a && psql "$DATABASE_URL" -c "update products set price = 24.90 where printify_product_id in ('6adfb9a53f77a7875b0fba8a', '6adfb9c1260c17a8ff05ef05', '6adfb9c7260c17a8ff05ef11', '6adfb9cf260c17a8ff05ef1e', '6adfb9d9250930614e0f78e1', '6adfb9dec392daed65010411', '6adfb9e73f77a7875b0fbabe', '6adfb9ee250930614e0f78ef', '6adfb9fb260c17a8ff05ef31', '6adfba065ea6b5c9cd0aecbd', '6adfba1087d17f67bf09e9e0', '6adfba1987d17f67bf09e9ed', '6adfba27be06878c900359f6', '6adfba3587d17f67bf09ea06', '6adfba43c60cddcb060142a6')" && node scripts/printify-uudet-tuotteet.mjs --hyvaksy 6adfb9a53f77a7875b0fba8a,6adfb9c1260c17a8ff05ef05,6adfb9c7260c17a8ff05ef11,6adfb9cf260c17a8ff05ef1e,6adfb9d9250930614e0f78e1,6adfb9dec392daed65010411,6adfb9e73f77a7875b0fbabe,6adfb9ee250930614e0f78ef,6adfb9fb260c17a8ff05ef31,6adfba065ea6b5c9cd0aecbd,6adfba1087d17f67bf09e9e0,6adfba1987d17f67bf09e9ed,6adfba27be06878c900359f6,6adfba3587d17f67bf09ea06,6adfba43c60cddcb060142a6
```

Huom: 5,90 €:n
toimitusmaksulla kate on 29,6 % (yli myynnin rajan 20 %, alle 30 %:n tavoitteen); 30 % vaatisi 25,90 €, joka on yli
kilpailijoiden hintakaton 24,99 €. Hupparit ja mukit jätettiin pois: millään EU-painotalolla ne eivät yllä 30 %:iin
kilpailijoiden hintakatossa (luvut listan kentässä `eiToteutettavissa` ja KATTEET.md:ssä).

**4. Hyväksyntä myyntiin.** Katso piilotetut tuotteet Printifyssä tai kirjauksesta, ja julkaise kaupassa kaikki tämän
skriptin tuomat tai vain valitut (Printify-tunnukset pilkulla eroteltuina):

```
set -a && . ./.env.local && set +a && node scripts/printify-uudet-tuotteet.mjs --hyvaksy kaikki
```

```
set -a && . ./.env.local && set +a && node scripts/printify-uudet-tuotteet.mjs --hyvaksy 6712abc,6712abd
```

Hyväksyntä tarkistaa ensin, että kulut ovat tiedossa, kate on vähintään myynnin raja 20 % ja tuotteella on kuvat; muuten se kertoo
syyn eikä julkaise. Tuotteet näkyvät kaupassa noin 5 minuutin kuluessa (tuotelistan välimuisti).

## 12. Varianttien saatavuus (Printify)

Joka aamu Vercel Cron (`vercel.json`) kutsuu suojattua osoitetta
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
Käsiajo komentoriviltä (lisää `&kuiva=1`, niin mitään ei tallenneta):

```
curl -H "Authorization: Bearer $CRON_SECRET" "https://huumorikauppa.fi/api/cron/tilaukset?tehtava=saatavuus"
```

Vastauksessa `jaljella` kertoo, montako tuotetta on vielä tarkistamatta; aja uudelleen, kunnes se on 0.

## 13. Automaatio: sähköpostit, valvonta ja päivän yhteenveto (haara automaatio)

Ei uusia maksullisia palveluita: Resendin ilmaistaso (3000 viestiä kuukaudessa, 100 päivässä), GitHub Actions ja
Vercel Hobby (funktioita nyt 11/12, Vercel Cron edelleen yksi).

**Taulut.** Aja `db/schema.sql` uudelleen ennen käyttöönottoa (kaikki lauseet ovat toistettavia):
`subscribers` (uutiskirje: suostumuksen aika, teksti ja lähde, ensitilauksen koodi), `email_optouts` (peruutukset),
`abandoned_carts` (kassan muistutuspyynnöt), `reviews` (arviot, tila `odottaa` ennen julkaisua) sekä tauluun `orders`
sarakkeet `delivered_at`, `review_email_sent_at`, `printify_created_at` ja `stuck_alert_sent_at`.

```
psql "$DATABASE_URL" -f db/schema.sql
```

**Ympäristömuuttujat** (Vercel, kaikki valinnaisia):

| Muuttuja | Oletus | Käyttö |
|---|---|---|
| `MARKKINOINTI_SALAISUUS` | `CRON_SECRET` | peruutus-, kori- ja arviolinkkien allekirjoitus; vaihtaminen mitätöi vanhat linkit |
| `KAUPPA_URL` | `https://huumorikauppa.fi` | linkit sähköposteissa |
| `MARKKINOINTI_RAJA_AJO` | 20 | markkinointiviestejä enintään yhdessä ajossa |
| `MARKKINOINTI_RAJA_PAIVA` | 60 | markkinointiviestejä päivässä (40 jää tilausvahvistuksille Resendin 100:n päivärajasta) |
| `KATE_TAVOITE_KK` | 3000 | kuukauden katetavoite euroina päivän yhteenvedossa |

**Sähköpostit** (`api/_lib/markkinointi.js`, rajapinta `/api/sahkoposti`):
- Uutiskirje: ponnahdusikkunassa erillinen suostumusruutu (ei valmiiksi valittu) ja tietosuojalinkki. Tervetuloviesti
  kerran per osoite. Ensitilauksen koodi (`TERVE-XXXXXX`, yksi per osoite, vain ensimmäinen maksettu tilaus samalla
  osoitteella) on pois käytöstä: `ENSITILAUS_ALENNUS_PROSENTTI = 0` (api/_lib/vakiot.js), koska t-paidan (24,90 €)
  kate on jo ilman alennusta 26 %. 5 %:n koodi vaatii t-paidan hinnaksi 28,90 € ja 10 %:n 29,90 €. Kassa hylkää koodin
  silti aina, jos tilauksen kate alennuksen jälkeen jäisi alle 30 %.
- Keskeneräinen tilaus: kassan ensimmäisessä vaiheessa valinta "Lähetä minulle muistutus, jos tilaus jää kesken"
  (ei valmiiksi valittu). Muistutus 1 h ja 24 h viimeisestä korin muutoksesta, loppuu kun samalla osoitteella maksetaan.
- Arviopyyntö kerran per tilaus: 7 pv Printifyn toimituspäivästä, tai 10 pv lähetyksestä, jos toimituspäivää ei tule.
  Arviot tallentuvat tauluun `reviews` tilaan `odottaa`; sivustolla niitä ei näytetä automaattisesti.
- Jokaisessa viestissä peruutuslinkki (`/unsubscribe`) ja `List-Unsubscribe` + `List-Unsubscribe-Post` (yhden
  klikkauksen peruutus). Peruutus lopettaa uutiskirjeen, muistutukset ja arviopyynnöt.

**Valvonta** (`/api/cron/tilaukset`, tunnin välein): maksettu tilaus, joka ei ole Printifyn tuotannossa, yritetään
uudelleen kasvavin välein (15 min ... 4 h), myös kun Printify palauttaa tilauksen on-holdiin tuotantoon lähetyksen
jälkeen. Hälytys osoitteeseen info@seniorituki.fi heti ensimmäisestä virheestä ja erikseen, kun tilaus on ollut
jumissa yli 2 h. Seurantalinkki asiakkaalle, kun Printify ilmoittaa lähetyksen (epäonnistunut viesti yritetään
uudelleen viikon ajan).

**Ajastukset:**

| Vercel Cron | Milloin (UTC) | Tehtävä |
|---|---|---|
| `/api/cron/tilaukset` | joka tunti :17 | valvonta, muistutukset, arviopyynnöt, yhteenvedon varmistus klo 9 jälkeen |
| `?tehtava=yhteenveto` | 04:00 ja 05:00 | päivän yhteenveto; lähtee vain, kun Helsingissä on kello 7 (kesä 04, talvi 05), kerran päivässä |
| `?tehtava=saatavuus` | 05:00-06:55 viiden minuutin välein | Printify-varianttien saatavuus erissä; kun kaikki on tarkistettu, loput ajot eivät tee mitään |
| `?tehtava=katetarkistus` | maanantaisin 05:07 | alle 20 %:n katteen ja tuntemattomien kulujen tuotteet sähköpostilla |

Kaikki ovat Vercel Cronissa (`vercel.json`, Pro-taso). Käsiajo:
`curl -H "Authorization: Bearer $(cut -d= -f2- .env.cron.local)" "https://huumorikauppa-five.vercel.app/api/cron/tilaukset?tehtava=yhteenveto&pakota=1"`.

Yhteenveto: eilisen maksetut tilaukset, myynti ja kate euroina (Printify-kulu tilaushetkeltä), jumissa olevat
tilaukset, kuukauden kate tavoitteeseen nähden prosentteina ja tarvittava kate päivässä. Käsiajo (lähettää heti, jos
tänään ei ole lähetetty): yllä oleva curl-komento.

## Mitä jää vielä Lovable Cloudiin

Ylläpitopaneelin kirjautuminen ja MailerLite-synkronointi (uutiskirjeen tilaajat ovat nyt omassa taulussa
`subscribers`). Uutiskirje, muistutukset, korin palautus, peruutuslinkki ja arviot toimivat omalla taustalla.

## GA4 Data API: kävijät ja konversio viikkotaulukkoon (ilmainen, ei uutta tiliä)

Tehtävä `viikkomittarit` hakee kävijät, istunnot ja ostot GA4:stä ISO-viikoittain, kun kaksi ympäristömuuttujaa on
asetettu (api/_lib/ga4.js). GA4 Data API on maksuton eikä vaadi laskutustiliä. Kirjaudu samalla Google-tilillä,
jolla GA4-property G-8FJ58JNKGK on.

1. https://console.cloud.google.com > valitse olemassa oleva projekti tai **New project** (nimi esim. huumorikauppa).
   Laskutusta ei tarvitse ottaa käyttöön.
2. **APIs & Services > Library** > hae "Google Analytics Data API" > **Enable**.
3. **IAM & Admin > Service Accounts > Create service account**, nimi `ga4-lukija`, rooleja ei tarvita > **Done**.
   Avaa tili > **Keys > Add key > Create new key > JSON**. Tiedosto latautuu koneelle.
4. Kopioi palvelutilin sähköpostiosoite (`ga4-lukija@...iam.gserviceaccount.com`).
5. https://analytics.google.com > **Ylläpito > Propertyn käyttöoikeuksien hallinta > + > Lisää käyttäjiä**:
   liitä osoite, rooli **Lukija**, poista ruksi sähköposti-ilmoituksesta > **Lisää**.
6. **Ylläpito > Propertyn tiedot**: kopioi **propertyn tunnus** (pelkkiä numeroita, ei G-...).
7. Päätteessä repon kansiossa (arvot eivät näy ruudulla):
   ```
   npx vercel env add GA4_PROPERTY_ID production      # liitä numerotunnus
   npx vercel env add GA4_PALVELUTILI production < ~/Downloads/<ladattu-avain>.json
   ```
   Poista ladattu JSON-tiedosto koneelta tämän jälkeen. Julkaise: `scripts/julkaise-uusi.sh`.
8. Tarkistus: `viikkomittarit`-tehtävän vastauksessa `ga4Lahde` on "GA4 Data API" ja jokaisella viikolla on
   `ga4: { kavijat, istunnot, ostot, konversio }`.

Jos organisaation käytäntö estää JSON-avaimen luonnin (kohta 3), Cowork kirjaa viikkoluvut GA4:n käyttöliittymästä
(Raportit > Hankinta > Liikenteen hankinta) ja taulukon lähde-sarakkeeseen merkitään "Cowork GA4".
