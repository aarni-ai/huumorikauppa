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

## Raha- ja kirjanpitovirta (31.10.2026)

**Pankkitili:** Huumorikaupan oma Holvi-tili (Uusiku Oy), IBAN FI73 7997 **** **** 47. Repo on julkinen, joten
koko IBAN ei ole tässä. Täysi numero on Holvissa ja Aarnilla.

**Myyjä ja kausi:**
- Myynnit ennen 27.10.2026 kuuluvat Tmi Intellerille (vanha Lovable-kassa ja vanha Stripe-tili acct_1THtN1).
- 27.10.2026 alkaen myynnit kuuluvat Uusiku Oy:lle (Y-tunnus 3653666-7, ALV FI36536667), uusi kassa ja Stripe-tili
  acct_1UVAUMPNXkES1q9G.
- Raja on maksupäivä Suomen aikaa (orders.paid_at).

**Rahavirta:**
1. **Asiakas maksaa** uudessa kassassa Stripelle (kortti, Apple Pay, Google Pay, Klarna, MobilePay) tai
   yritystilauksen Stripe-laskulla (maksuaika 14 pv).
2. **Stripe tilittää** myynnit kulujen jälkeen Holvi-tilille. Aarni asettaa tilitystilin: Stripe > Settings > Payouts
   > Bank account, Holvin IBAN.
3. **Printify veloittaa** tuotteet ja toimitukset Huumorikaupan omalta Holvi-kortilta. Aarni asettaa kortin:
   Printify > Billing. Tilaus lähtee painoon vasta maksun jälkeen.
4. **Ostolaskut kirjanpitoon:**
   - Printifyn laskuissa on Suomen ALV 25,5 %, jonka kirjanpitäjä on vahvistanut vähennettäväksi
     (KATTEET.md "Printifyn ALV: päätös 31.10.2026").
   - Stripen kululaskut tulevat Stripen Documents-osiosta kuukausittain.
   - Holvin tiliote täsmäyttää tilitykset.

**Kuukausiraportti kirjanpitoon:**
- **Automaattinen:** Vercel Cron ajaa kuun 2. päivä klo 6 UTC tehtävän
  /api/cron/tilaukset?tehtava=kuukausiraportti&laheta=1. Se lähettää edellisen kuukauden myyntiraportin CSV:nä ja
  PDF:nä omistajalle (OMISTAJA_EMAIL).
- **Käsin:** `node scripts/kuukausiraportti.mjs [ALKU LOPPU]` tallentaa tiedostot kansioon kirjanpito/YYYY-MM/.
  Kansio on .gitignoressa.
- **Sisältö:**
  - tilaukset maksupäivineen ja maksutapoineen
  - myynti ALV:n kanssa ja ilman, ALV 25,5 %, toimitukset
  - myydyt lahjakortit (ei ALV:tä myyntihetkellä)
  - Stripen kulut tilauksittain, palautukset ALV-osuuksineen, kumppaniprovisiot ja Stripe-tilitykset
- **Lähteet:** Neon (orders, order_events) ja Stripe API (payment intents, refunds, payouts).
- **Lokakuu 2026:** Uusiku Oy:n kausi on 27.-31.10. Tiedostot ovat kansiossa kirjanpito/2026-10/.

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
| 9 | Domain suoraan uuteen projektiin (ohje alla: "Domain suoraan uuteen Vercel-projektiin") | Cloudflare, Vercel | - |
| 13 | Automaatio: schema.sql uudelleen, sähköpostit, valvonta, päivän yhteenveto | oma kone, GitHub | - |

## Domain suoraan uuteen Vercel-projektiin (valmisteltu 29.10.2026, EI vielä tehty; ajantasainen suunnitelma kohdassa 24)

**Nykytila 29.10.2026.** huumorikauppa.fi on vanhassa Vercel-projektissa (tiimi aarni-ais-projects), joka välittää
pyynnöt uuteen projektiin `huumorikauppa` (tiimi flyapeg-2135s-projects, `huumorikauppa-five.vercel.app`,
middleware.ts). DNS on Cloudflaressa (nimipalvelimet aria ja huxley, tuntematon tili). Cowork siirtää vyöhykkeen
uudelle Cloudflare-tilille (huumorikauppa@gmail.com, nimipalvelimet annabel ja vick) Domainhotellissa.

Vercelin CLI on kirjautunut vain uuden projektin tiimiin, joten `npx vercel domains inspect huumorikauppa.fi` vastaa
"You don't have access to the domain huumorikauppa.fi under flyapeg-2135s-projects". Odotetut tietueet luettiin
Vercelin rajapinnasta (`GET /v6/domains/<domain>/config` ja `GET /v9/projects/<projekti>/domains`, uuden tiimin oikeuksilla).

| Tietue | Nyt (vanha projekti) | Uusi projekti odottaa |
|---|---|---|
| `huumorikauppa.fi` A | 216.198.79.1 ja 64.29.17.1 julkisista resolvereista (Vercel näkee 216.198.79.65 ja 64.29.17.65) | **216.150.1.1** ja **216.150.16.1** (Vercelin suositus 1; varalla 76.76.21.21) |
| `www` CNAME | 529bd05f3b0cb29b.vercel-dns-017.com | **bffaf7b5fcbd90db.vercel-dns-016.com** (varalla cname.vercel-dns.com) |
| `_vercel` TXT | ei ole | **vc-domain-verify=huumorikauppa.fi,f6db53b10f680ae452fe** |
| `_vercel` TXT (toinen) | ei ole | **vc-domain-verify=www.huumorikauppa.fi,795afe3a11413258ab01** |

Uuteen projektiin on jo lisätty `huumorikauppa.fi` ja `www.huumorikauppa.fi` (www ohjaa 308:lla juureen), tila
"pending_domain_verification". Vercel ei ilmoita konfliktia nykyisten tietueiden kanssa (`misconfigured: false`).

**Tärkeää:** molemmat A-osoitteet ovat Vercelin reunapalvelimia, ja Vercel reitittää pyynnön sen projektin
domainiin, jonka tiimi omistaa domainin. Kun `_vercel`-TXT on lisätty ja Vercel vahvistaa sen, domain siirtyy uuteen
projektiin, vaikka A-tietueet olisivat vielä vanhat. **TXT-tietueen lisääminen on siis itse siirtohetki.** Älä lisää
sitä etukäteen.

**Ennakkoehdot (kaikki):**
1. Uusi Cloudflare-vyöhyke on Active huumorikauppa@gmail.comin tilillä, ja `dig NS huumorikauppa.fi` palauttaa
   annabel ja vick.
2. Resend-domain on vahvistettu ja sähköpostit ovat päällä (SAHKOPOSTI_VAHVISTETTU=1).
3. Aarni on hyväksynyt siirron ajankohdan. Hiljainen aika, ei kampanjaa käynnissä.

**Huomio 29.10.2026 klo 13.48:** `_vercel.huumorikauppa.fi` palauttaa jo kaksi TXT-tietuetta, mutta niiden arvot
ovat eri kuin uuden projektin (`vc-domain-verify=huumorikauppa.fi,63152a5c20797d66be51,dc` ja
`vc-domain-verify=www.huumorikauppa.fi,1cd38cc81b9f3fc95d0a,dc`). Ne ovat vanhan Vercel-tilin varmennuksia. Lisää
uuden projektin kaksi TXT-arvoa näiden rinnalle samalla nimellä `_vercel` (TXT-nimellä voi olla useita arvoja); vanhat
voi poistaa siirron jälkeen.

**Stripen webhook-osoite:** pidetään osoitteessa `https://huumorikauppa-five.vercel.app/api/stripe-webhook`. Se ei
riipu DNS:stä eikä Cloudflaresta, joten nimipalvelin- tai tietuevirhe ei katkaise maksujen käsittelyä. Vaihto
osoitteeseen `https://huumorikauppa.fi/api/stripe-webhook` ei toisi hyötyä, koska molemmat osuvat samaan projektiin.

**Vanhan projektin välitys (middleware.ts `valitysKohde`):** uudessa projektissa välitys on pois päältä
(UUSI_TAUSTA=1), joten koodi ei vaikuta siihen. Kun domain on vahvistettu uuteen projektiin ja sivut, kassa ja
webhook on tarkistettu, välityskoodin voi poistaa seuraavassa julkaisussa. Vanha projekti (toinen Vercel-tili, ei
Aarnin hallussa) jää ilman liikennettä.

**Tietuemuutokset Coworkille uudessa Cloudflaressa (DNS > Records), tässä järjestyksessä:**
1. Lisää TXT, nimi `_vercel`, sisältö `vc-domain-verify=huumorikauppa.fi,f6db53b10f680ae452fe`, TTL Auto.
2. Lisää toinen TXT, nimi `_vercel`, sisältö `vc-domain-verify=www.huumorikauppa.fi,795afe3a11413258ab01`, TTL Auto.
3. Muokkaa juuren A-tietueet: poista 216.198.79.1 ja 64.29.17.1 (tai .65-arvot), lisää A `@` 216.150.1.1 ja
   A `@` 216.150.16.1. **Proxy status: DNS only (harmaa pilvi).**
4. Muokkaa `www` CNAME -> `bffaf7b5fcbd90db.vercel-dns-016.com`, **DNS only**.
5. Älä koske Resendin kolmeen tietueeseen (resend._domainkey, send MX ja send TXT), DMARCiin (`_dmarc`,
   rua=mailto:huumorikauppa@gmail.com) äläkä muihin tietueisiin.

**Claude tekee samalla hetkellä:**
1. Vahvistaa domainit uudessa projektissa (`POST /v9/projects/<projekti>/domains/huumorikauppa.fi/verify` ja www).
2. Palauttaa ajastukset `vercel.json`-tiedostoon (scripts/julkaise-uusi.sh: "Kun domain on uudessa projektissa,
   ajastukset voi palauttaa"), tarkistaa `KAUPPA_URL`:n ja julkaisee.
3. Tarkistaa: `dig A huumorikauppa.fi`, `dig CNAME www.huumorikauppa.fi`, HTTPS-varmenne, sivut kolmella
   User-Agentilla, `/api/products`, kassatesti (`node scripts/kassatesti.mjs --url https://huumorikauppa.fi`),
   Stripe-webhook (`huumorikauppa-five.vercel.app/api/stripe-webhook` toimii ennallaan) ja Search Consolen sivukartta.
4. Kirjaa KASVU-RAPORTTI.md:hen.

**Vanha projekti siirron jälkeen:** jätetään paikalleen viikoksi ilman domainia, eikä sitä poisteta. Välitys
(middleware.ts) ei enää saa liikennettä.

**Palautus:** jos sivusto ei vastaa 10 minuutin kuluessa, poista kaksi `_vercel`-TXT-tietuetta ja palauta A-tietueet
216.198.79.1 ja 64.29.17.1 sekä www CNAME 529bd05f3b0cb29b.vercel-dns-017.com. Domain on silloin vahvistettu
uudessa tiimissä, joten palautus vaatii myös domainin poiston uudesta projektista (Claude tekee rajapinnalla).

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

**Tilanne 29.10.2026:** vanhan tilin `acct_1THtN1AhUyocG7PO` salainen avain kierrettiin 29.10.2026 klo 01.43
Pakistanin aikaa (28.10. klo 22.43 Suomen aikaa, 20.43 UTC) vanhentumisella "now", joten Lovablen kassa ei voi enää
luoda maksuja. Ennen kiertoa luodut Stripe Checkout -sessiot vanhenevat viimeistään 24 tunnin kuluttua luonnista,
eli viimeistään 29.10. klo 22.43 Suomen aikaa. Webhook pidetään päällä siihen asti, jotta mahdollinen viimeinen
maksu käsitellään. **Webhookin saa poistaa käytöstä 31.10.2026 tai myöhemmin** alla olevilla ohjeilla.

**Vanhan kassan webhookin sulkeminen (päivitetty 29.10.2026). Saa tehdä aikaisintaan 31.10.2026 ja vasta, kun
ensimmäinen oikea tilaus on mennyt uuden kassan läpi.** Uusi kassa on ollut käytössä huumorikauppa.fi:ssä 27.10.2026 alkaen (välitys), eikä
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
3. **Älä sulje tiliä äläkä muuta tilin asetuksia.** Tilillä hoidetaan avoin riita-asia 3.11.2026, ja sen maksut,
   palautukset ja tilitykset tarvitaan. Salainen avain on jo kierretty (29.10.2026); Dashboardin palautukset ja
   riita-asia eivät käytä avainta.
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

## 14. Google Shopping -mainokset (valmisteltu 1.11.2026, EI käynnistetty)

**Mitään maksullista ei käynnistetä ilman Aarnin hyväksyntää.** Cowork tekee kaiken valmiiksi niin, että kampanja
jää tilaan **Keskeytetty**. Maksutiedot ja kampanjan käynnistyksen tekee Aarni itse, kun hän on hyväksynyt budjetin.

### Valinta: Standard Shopping (ei Performance Max aluksi)

| | Standard Shopping | Performance Max |
|---|---|---|
| Missä näkyy | vain Google-haun ostostulokset | haku, YouTube, Display, Gmail, Discover |
| Hakusanat näkyvissä ja estettävissä | kyllä | rajoitetusti |
| Tarvitsee konversiohistoriaa | ei | oppii vasta noin 30 konversiosta / 30 pv |
| Hinta per klikki hallittavissa | kyllä (enimmäis-CPC) | ei |

Kaupalla on alle 5 tilausta 30 päivässä, joten PMax ei pysty oppimaan, ja 10 €/pv valuisi helposti YouTubeen ja
Displayhin. Aloitetaan Standard Shoppingilla, ja PMaxiin siirrytään vasta, kun Google Ads näyttää vähintään 30
konversiota 30 päivässä.

### Kannattavuusraja (lasketaan ennen käynnistystä)

Mittarin luvut 1.11.2026: kate per tilaus 9,51 € (oletus, kunnes tilauksia on vähintään 5), konversio 0,58 % (GA4).

| Konversio mainoskävijöillä | Kannattavuusraja per klikki (kate per tilaus × konversio) |
|---|---|
| 0,58 % (koko sivuston nykyinen) | 0,06 € |
| 1,0 % | 0,10 € |
| 1,5 % | 0,14 € |

Tilaus kannattaa vain, jos kustannus per tilaus jää alle katteen per tilaus (9,51 €). Siksi enimmäis-CPC aloitetaan
0,10 €:sta ja nostetaan vain, jos toteutunut kustannus per tilaus jää alle 9,51 €.

### Kampanjan rakenne

- Kampanja: **HK Shopping FI**, tyyppi Myynti, Standard Shopping, Merchant Center -tili 5759809345 (huumorikauppa.fi)
- Myyntimaa Suomi; sijainti Suomi, vaihtoehto "Läsnäolo: ihmiset, jotka ovat kohdesijainneissa tai käyvät niissä säännöllisesti"
- Kieli: suomi
- Päiväbudjetti **10 €**; hakukumppanit pois; Display-verkosto pois
- Hintatarjous: Manuaalinen CPC, "Tehostettu CPC" pois
- Kampanjan prioriteetti: Matala; paikallisen myymälän tuotteet pois
- Aloitus- ja lopetuspäivä: aloitus jätetään tyhjäksi; kampanja tallennetaan **Keskeytetty**-tilaan
- Mainosryhmä **Kaikki tuotteet**, tuoteryhmät (custom_label-tiedot tulevat syötteestä, api/_lib/syote-lisakentat.js):

| Tuoteryhmä | Ehto | Enimmäis-CPC |
|---|---|---|
| Myydyimmät | Mukautettu tunniste 4 = top50 | 0,12 € |
| Kate 30-40 % | Tunniste 4 = muut ja Mukautettu tunniste 0 = kate-30-40 | 0,10 € |
| Kate 20-30 % | Tunniste 4 = muut ja tunniste 0 = kate-20-30 | 0,07 € |
| Kate alle 20 % | tunniste 0 = kate-alle-20 | Poissuljettu |
| Kaikki muu | jäljelle jäävät | 0,07 € |

- Kampanjatason poissulkevat hakusanat (laaja haku): ilmainen, ilmaiseksi, käytetty, tori, kirpputori, kaava, ohje,
  diy, itse tehty, tukku, printify, työpaikka, rekry, vuokra

### Konversioseuranta GA4:n purchase-tapahtumasta

Sivusto lähettää GA4:ään purchase-tapahtuman palvelimen vahvistamasta tilauksesta (G-8FJ58JNKGK, src/lib/analytics.ts,
kerran tilausta kohden, arvo ja valuutta mukana). Consent Mode v2: tapahtuma lähtee vain analytiikkasuostumuksella;
Google mallintaa loput.

1. GA4 (analytics.google.com, omaisuus huumorikauppa.fi) > Ylläpito > Tuotelinkit > Google Ads -linkit > Linkitä >
   valitse Google Ads -tili > ota käyttöön "Mukautettu mainonta" ja "Automaattinen tagien lisääminen" > Lähetä.
2. GA4 > Ylläpito > Tapahtumat: varmista, että `purchase` on merkitty avaintapahtumaksi (Avaintapahtuma päällä).
3. Google Ads > Tavoitteet > Konversiot > Yhteenveto > Uusi konversiotoiminto > Tuo > Google Analytics 4 -omaisuudet >
   Verkko > valitse `purchase` (huumorikauppa.fi) > Tuo ja jatka.
4. Avaa tuotu konversio: Tavoite **Osto**, toiminnon optimointi **Ensisijainen**, Arvo "Käytä eri arvoja kullekin
   konversiolle", Laskenta **Jokainen**, konversioaika 30 päivää. Tallenna.
5. Google Ads > Ylläpito > Tilin asetukset > Automaattinen tagien lisääminen: päällä. (Oma käyntilaskuri tunnistaa
   gclid-parametrin ja kirjaa lähteeksi google-ads, api/_lib/kaynnit.js.)
6. Merchant Center (merchants.google.com, tili 5759809345) > Asetukset > Linkitetyt tilit > Google Ads > linkitä sama
   Google Ads -tili. Hyväksy pyyntö Google Adsissa (Ylläpito > Linkitetyt tilit > Google Merchant Center).

### Coworkin vaiheet Chromessa

1. Avaa ads.google.com Aarnin Google-tilillä. Jos tiliä ei ole, valitse "Vaihda asiantuntijatilaan" heti
   ensimmäisessä näkymässä ja "Luo tili ilman kampanjaa". Maa Suomi, aikavyöhyke (GMT+02:00) Helsinki, valuutta EUR.
   **Pysähdy laskutustietoihin**: niitä ei täytetä, vaan Aarni tekee sen itse.
2. Tee yllä olevat konversioseurannan kohdat 1-6.
3. Luo kampanja: Kampanjat > + > Uusi kampanja > Myynti > Shopping > Merchant Center -tili 5759809345, maa Suomi >
   Standard Shopping -kampanja. Täytä asetukset yllä olevan rakenteen mukaan.
4. Tee tuoteryhmät: Mainosryhmä > Tuoteryhmät > jaa "Kaikki tuotteet" ensin Mukautettu tunniste 4 -arvon mukaan, sitten
   "muut" Mukautettu tunniste 0 -arvon mukaan. Aseta enimmäis-CPC taulukon mukaan ja sulje pois kate-alle-20.
5. Lisää poissulkevat hakusanat: Hakusanat > Poissulkevat hakusanat > kampanjataso.
6. Tallenna kampanja **Keskeytetty**-tilaan. Jos Google Ads ei anna tallentaa ilman maksutapaa, jätä luonnokseksi.
7. Kirjaa KASVU-RAPORTTI.md:hen: kampanjan nimi, tila (Keskeytetty), konversion tila Google Adsissa ("Ei viimeaikaisia
   konversioita" on normaali ennen ensimmäistä ostoa).
8. Aarni hyväksyy budjetin, lisää maksutavan ja käynnistää kampanjan.

### Kokeilun seuranta (kampanjan käynnistyttyä)

- Cowork kirjaa joka aamu edellisen päivän kulut, klikit ja konversiot Google Adsista (Kampanjat, päivämäärä "Eilen")
  mittarin lomakkeelle /hallinta/mittarit (kohta Mainonta) tai rajapintaan:
  `POST /api/sahkoposti { action: "mainoskulut", avain, paiva, kanava: "google-ads", kulut, klikit, konversiot }`
  (avain = mittarisivun avain päivän yhteenvetoviestistä). Mittari näyttää mainoskulut, kustannuksen per tilaus ja
  katteen mainoskulujen jälkeen; sama rivi on päivän yhteenvetoviestissä.
- Päätössäännöt 14 päivän tai 140 €:n jälkeen (kumpi ensin):
  - kustannus per tilaus yli katteen per tilaus (9,51 €): kampanja keskeytetään, hakusanaraportti läpi, uusi yritys
    pienemmällä CPC:llä tai parempien tuotteiden rajauksella
  - kustannus per tilaus alle 9,51 € ja vähintään 5 tilausta: jatketaan, CPC +0,02 € kerrallaan
  - vähintään 30 konversiota 30 päivässä: PMax-kokeilu omana kampanjanaan tavoite-ROAS:lla

## 15. Search Console huumorikauppa@gmail.comilla (Cowork, 2.11.2026)

Sivustolla on jo Search Consolen HTML-vahvistustagi (`<meta name="google-site-verification" ...>` index.html:ssä).
Tagi on sidottu siihen Google-tiliin, joka sen loi, joten toimi näin:

1. Kirjaudu Chromessa osoitteeseen search.google.com/search-console tilillä **huumorikauppa@gmail.com**.
2. Lisää ominaisuus > **URL-etuliite** > `https://huumorikauppa.fi/` > Jatka.
3. Valitse vahvistustavaksi **HTML-tagi** ja paina **Vahvista**.
   - Jos vahvistus onnistuu: siirry kohtaan 4.
   - Jos ei onnistu, tagi kuuluu toiselle tilille. Kopioi Search Consolen näyttämä `content="..."`-arvo ja lähetä se
     Aarnille: Claude lisää toisen meta-tagin index.html:ään ja julkaisee, minkä jälkeen paina Vahvista uudelleen.
     Vaihtoehto: nykyinen omistaja lisää huumorikauppa@gmail.comin (Asetukset > Käyttäjät ja oikeudet > Lisää
     käyttäjä > Omistaja).
4. **Sivukartat** > Lisää uusi sivukartta: `sitemap.xml` > **Lähetä**. Tila "Onnistui" näkyy muutaman minuutin päästä.
5. **URL-tarkistus**: tarkista ja pyydä indeksointia uusille sivuille: /joulu, /joululahja-anopille, /hauska-joululahja,
   /pikkujoululahja-alle-30-euroa, /40-vuotislahja, /50-vuotislahja, /60-vuotislahja ja /lahjaopas-media.
6. Kirjaa KASVU-RAPORTTI.md:hen: ominaisuuden tila, sivukartan tila ja indeksointipyynnöt.

Ohje on myös hallintalinkkiviestissä (api/_lib/hallinta.js).

## 16. Lahjaopas medialle (Cowork, maanantaista 2.11.2026)

Sivu **https://huumorikauppa.fi/lahjaopas-media**: 20 lahjaideaa (10 klassikkoa, 10 joulumalliston 2026 mallia),
jokaisesta pystykuva 1000 x 1500 ja vaakakuva 1500 x 1000 ladattavina, hinnat, lyhyet kuvaukset, yhteystiedot ja
sama sisältö PDF:nä (sivun painike "Lataa lahjaopas PDF:nä"). Tuotelinkeissä `utm_source=media`, joten mediasta tulleet
käynnit näkyvät mittarissa (Liikenne: Media). Päivitys: muokkaa `data/lahjaopas-media.json` ja aja
`scripts/lahjaopas-media.mjs` ja `scripts/lahjaopas-media-pdf.mjs` (BLOB_READ_WRITE_TOKEN), sitten julkaisu.

## 17. Merchant Center: ilmainen toimitus kahdesta tuotteesta (Cowork, 2.11.2026)

Syötteen tuotekohtainen g:shipping kertoo yhden tuotteen tilauksen toimitusmaksun (6,90 €, 0 € vähintään 79 €:n
tuotteille) ja g:free_shipping_threshold 79 €:n rajan. Kappalemäärään perustuvaa sääntöä ei voi ilmaista tuotteen
tiedoissa, joten se asetetaan Merchant Centerin toimitusasetuksiin. Ilmaista, ei mainoskuluja.

1. Merchant Center > Asetukset > Toimitus ja palautukset > Toimituspalvelut > Lisää palvelu: maa Suomi, valuutta EUR,
   nimi "Posti kotiinkuljetus".
2. Käsittelyaika 1-3 arkipäivää, kuljetusaika 3-12 arkipäivää (2.11.2026 alkaen; sama kuin syötteessä ja sivustolla:
   t-paidat perillä 4-15 ja hupparit 5-15 arkipäivässä). Jos palvelu on jo luotu arvoilla 1-4 ja 2-6, muokkaa ne.
3. Toimitusmaksu: "Tilauksen tuotemäärän mukaan" (Number of items): 1 tuote 6,90 €, 2 tai enemmän 0 €.
   Lisäksi "Ilmainen toimitus tilauksille, joiden arvo on vähintään" 79 €.
4. Tallenna. Syötteen tuotekohtainen hinta (6,90 €) ohittaa tilin asetuksen yksittäisen tuotteen kohdalla, joten
   Googlen näyttämä hinta pysyy oikeana yhdelle tuotteelle ja tilin sääntö kertoo kahden tuotteen ilmaisen toimituksen.

## 18. Merchant Center: 25 käsin lisättyä tuotetta ilman saatavuutta (Cowork, 2.11.2026) — TEHTY

**Tehty 2.11.2026:** Cowork poisti Kauppiaskeskus-lähteen ja sen 25 tuotetta. Merchantin 651 tuotetta selittyy
klo 3.00 haulla: 120 uutta tuotetta luotiin 2.11. klo 7.35-7.40, eli 651 + 120 = 771, joka on syötteen nykyinen määrä.
Syötteessä ei ole rajausta, joka pudottaisi niitä. Seuraava haku 3.11. klo 3.00 tuo ne.


Tarkistettu Merchant Centeristä 2.11.2026. Syötteen haku on kunnossa: ensisijainen lähde "PRODUCTS SOURCE 3" hakee
oikean osoitteen https://huumorikauppa.fi/product-feed.xml joka päivä klo 3.00. Viimeisin haku 2.11. klo 3.00 toi 651
tuotetta. Syötteessä on nyt 771 tuotetta, ja kaikilla on g:availability. Vanhaa syöteosoitetta tai välimuistia ei käytetä.

Ne 25 tuotetta, joilta saatavuus puuttuu, tulevat toisesta lähteestä: "Kauppiaskeskus", eli lähde "Lisätty
Kauppiaskeskuksessa", kielenä englanti. Tuotteet on lisätty käsin Merchant Centerissä 27.–28.10.2026. Niiden tunnisteita
ei ole kummassakaan syötteessä, ja hinnat ovat vanhoja (t-paita 24,90 €, huppari 49,99 €; nyt 27,90 € ja 52,90 €). Samat
mallit ovat syötteessä oikeilla tiedoilla. Esimerkkejä: "Kinkkukooma alkaa klo 14 | T-paita jouluun",
"Olen eläkkeellä | Huppari" ja "Saatanan Tunarit | T-paita".

1. Merchant Center > Asetukset > Datalähteet > Sinun lisäämäsi > rivi "Kauppiaskeskus" > Tuotteet (25).
2. Valitse kaikki 25 ja poista ne. Älä koske lähteeseen "PRODUCTS SOURCE 3" äläkä Googlen löytämään lähteeseen.
3. Valinnainen: "PRODUCTS SOURCE 3" > Päivitä. Silloin uudet 120 tuotetta tulevat heti eivätkä vasta 3.11. klo 3.00.
4. Diagnostiikka päivittyy 1–3 vuorokaudessa. Sen jälkeen saatavuusvirheitä ei pitäisi olla.

## 19. Microsoft Clarity (ilmainen; Aarni luo tilin, Cowork lisää tunnisteen)

Clarity tallentaa sivun käytön (klikkaukset, vierityksen ja lämpökartat) ilman lomakkeisiin kirjoitettua tekstiä. Koodi
on valmiina, mutta se on pois päältä. Skripti latautuu vain, jos kävijä hyväksyy analytiikkaevästeet
(src/lib/clarity.ts), ja hallintasivuilla sitä ei ladata. Tietosuojaseloste mainitsee Clarityn automaattisesti, kun
tunniste on asetettu.

1. **Aarni:** clarity.microsoft.com > kirjaudu Microsoft- tai Google-tilillä (ilmainen) > New project: nimi
   Huumorikauppa, osoite https://huumorikauppa.fi, kategoria E-commerce.
2. **Cowork:** Settings > Overview > kopioi Project ID (noin 10 merkkiä, kirjaimia ja numeroita).
3. **Cowork:** Vercel > projekti huumorikauppa (uusi projekti, ei vanha) > Settings > Environment Variables > Add:
   nimi `VITE_CLARITY_ID`, arvo Project ID, ympäristö Production > Save. Tämän jälkeen julkaisu tarvitaan: kirjaa
   KASVU-RAPORTTI.md:hen tai kerro Aarnille, niin seuraava ajo julkaisee. Vaihtoehto: lähetä Project ID Aarnille, joka
   kirjoittaa sen tiedostoon src/config/clarity.ts (CLARITY_PROJEKTI).
4. **Cowork:** Clarity > Settings > Setup: älä asenna koodia uudelleen (se on sivustolla). Masking: Strict.
5. Tarkistus: hyväksy evästeet huumorikauppa.fi:ssä ja avaa muutama sivu. Clarity näyttää ensimmäiset tallenteet
   noin 2 tunnin kuluttua.

## 20. Hallinnan aktivointilinkki Coworkin Chromeen (taikalinkki, 2.11.2026)

Avaa linkki Chromen profiilissa "Huumorikauppa". Avaus antaa 90 päivän pääsyn sivuille /hallinta/mittarit, /hallinta/some
ja /hallinta/tarjoukset, eikä koodia tarvitse syöttää. Linkki toimii kerran ja vanhenee 48 tunnissa. Sama selain jätetään
pois kävijäluvuista.

- Linkki lähtee cron-tehtävällä `?tehtava=aktivointilinkki-viesti` (oletusvastaanottaja huumorikauppa@gmail.com). Kunnes
  huumorikauppa.fi on vahvistettu Resendissä, viesti menee Resendin testilähettäjällä vain osoitteeseen flyapeg@gmail.com.
  **Aarni:** välitä viesti "Hallinnan aktivointilinkki Coworkille" osoitteeseen huumorikauppa@gmail.com.
- Päivän yhteenveto lisää uuden linkin automaattisesti, kun edellisestä aktivoinnista on kulunut yli 80 päivää.
- Testi: `PLAYWRIGHT=<polku>/playwright/index.mjs node scripts/aktivointilinkki-testi.mjs`. Se käyttää oman
  testilinkkinsä eikä tulosta sitä.

## 21. Resend: hallinnan viestit suoraan osoitteeseen huumorikauppa@gmail.com (Domainhotellin nimipalvelinmuutoksen jälkeen)

**Miksi viestit menevät nyt osoitteeseen flyapeg@gmail.com:** Resend lähettää huumorikauppa.fi-osoitteesta vasta, kun
domain on vahvistettu. Domain on Resendissä tilassa "failed", koska sen kolmea DNS-tietuetta ei ole vielä
nimipalvelimissa (tarkistettu 2.11.2026, `?tehtava=resend-domain&kuiva=1`). Siihen asti ainoa toimiva lähettäjä on
Resendin testiosoite onboarding@resend.dev. Se toimittaa vain Resend-tilin omaan osoitteeseen, joka on
flyapeg@gmail.com, joten viestiä ei voi ohjata osoitteeseen huumorikauppa@gmail.com koodilla. Ilmaisia
vaihtoehtoja ilman domainia ei ole: toinen lähetyspalvelu vaatisi samoin vahvistetun domainin.
Koodi ei vaadi muutoksia: api/_lib/sahkoposti.js `lahetaVarareitilla` yrittää ensin tavallista reittiä osoitteeseen
OMISTAJA_EMAIL (oletus huumorikauppa@gmail.com) ja käyttää testilähettäjää vain, jos Resend vastaa "domain is not
verified". Heti kun domain on vahvistettu, päivän yhteenveto, hälytykset ja aktivointilinkit menevät osoitteeseen
huumorikauppa@gmail.com.

**Domainhotellin nimipalvelinmuutoksen jälkeen (Cowork tai Aarni lisää tietueet, Claude tekee loput):**
1. Lisää nimipalvelimen DNS-hallintaan kolme tietuetta (arvot Resendistä, Domains > huumorikauppa.fi, tai
   `?tehtava=resend-domain&kuiva=1`):
   - TXT, nimi `resend._domainkey`, arvo `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUF9+...` (koko arvo Resendistä)
   - MX, nimi `send`, arvo `feedback-smtp.eu-west-1.amazonses.com`, prioriteetti 10
   - TXT, nimi `send`, arvo `v=spf1 include:amazonses.com ~all`
2. **Claude:** aja `?tehtava=resend-domain&vahvista=1` suoraan osoitteeseen huumorikauppa-five.vercel.app. Toista
   tunnin välein, kunnes tila on `verified` (DNS leviää yleensä alle tunnissa).
3. **Claude:** tarkista, että Vercelin OMISTAJA_EMAIL on huumorikauppa@gmail.com tai tyhjä (oletus), ja lähetä testiviesti
   (`?tehtava=ilmoitustesti`). Viestin vastaanottajan on oltava huumorikauppa@gmail.com eikä otsikossa saa lukea
   "kunnes domain vahvistetaan".
4. **Claude:** aseta Vercelin SAHKOPOSTI_VAHVISTETTU=1 (oma tilausvahvistus korvaa Stripen kuitin) ja julkaise. Aja
   kassatesti ja tarkista, että vahvistusviesti tulee.
5. Kirjaa KASVU-RAPORTTI.md:hen.


## 22. Somevideot Blobiin (2.11.2026) — TEHTY 3.11.2026, ei Aarnin tehtävä

Claude latasi 53 uutta videota ja kansikuvat kaupan palvelimen kautta:
- `node scripts/some-blob.mjs --palvelin --uudet`
- Lataustoken tulee osoitteesta POST /api/cron/tilaukset?tehtava=blob-lataus (CRON_SECRET, api/_lib/blob-lataus.js).
- Blob-avainta ei tarvita koneella.

`node scripts/some-tarkistus.mjs` tulostaa OK: 55 videota julkaisulistan järjestyksessä. Seuraavat lataukset tehdään
samalla komennolla.


## 23. Gmail-sovellussalasana: sähköpostit Gmailin kautta ennen domainin vahvistusta (Aarni, 3.11.2026)

**Miksi:** Domainhotelli ei ole vielä lisännyt Resendin DNS-tietueita (kohta 21), joten Resend ei lähetä asiakkaille.
Väliaikaisreitti lähettää kaikki viestit Gmailin SMTP:llä tililtä huumorikauppa@gmail.com (api/_lib/sahkoposti.js,
Nodemailer, ilmainen):
- tilausvahvistukset (korvaavat Stripen kuitin)
- lahjakorttien viestit PDF-liitteineen
- ryhmätilausten viestit
- hallinnan viestit, hälytykset, päivän yhteenveto ja kuukausiraportti
- korimuistutukset ja uutiskirje vain suostumuksen antaneille (peruutuslinkki ja List-Unsubscribe mukana)

Markkinointiviestejä lähtee yhteensä enintään 100 Helsingin päivässä (api/_lib/markkinointi.js
MARKKINOINTI_PAIVAKATTO, laskuri tietokannan kv-taulussa).

**Aarni, yksi komento Macin Päätteessä:**

    bash ~/huumorikauppa/scripts/gmail-salasana.sh

Skripti neuvoo luomaan sovellussalasanan osoitteessa https://myaccount.google.com/apppasswords. Luo se tilille
huumorikauppa@gmail.com; se vaatii kaksivaiheisen tunnistuksen. Liitä salasana kysyttäessä: se ei näy ruudulla. Skripti
kokeilee kirjautumista ja tallentaa salasanan Verceliin (GMAIL_APP_PASSWORD, production, salainen) ja tiedostoon
.env.gmail.local (gitignoroitu). Älä liitä salasanaa chattiin.

**Claude seuraavalla ajolla:**
1. Julkaise (scripts/julkaise-uusi.sh).
2. Tarkista, että `?tehtava=sahkopostireitti` näyttää `"reitti":"gmail"` ja `"markkinointi":true`.
3. Lähetä testi `?tehtava=ilmoitustesti`; vastauksessa `"reitti":"gmail"`.

**Paluu Resendiin on automaattinen:** reitti valitaan joka lähetyksellä. Kun Resend kertoo huumorikauppa.fi:n
vahvistetuksi (tarkistus tunnin välein) tai Vercelissä on SAHKOPOSTI_VAHVISTETTU=1, viestit lähtevät taas Resendillä
osoitteesta tilaukset@huumorikauppa.fi. Sen jälkeen GMAIL_APP_PASSWORD poistetaan Vercelistä
(`npx vercel env rm GMAIL_APP_PASSWORD production --yes`) ja sovellussalasana Googlelta.


## 24. Nimipalvelinvaihto uuteen Cloudflareen ja domain uuteen Vercel-projektiin (valmisteltu 4.11.2026)

**Tilanne 4.11.2026 klo 11.** Rekisteröijä on Domainhotelli (whois: Planeetta Internet Oy, voimassa 27.2.2027 asti,
DNSSEC pois päältä). .fi-rekisterin nimipalvelimet ovat `aria`/`huxley.ns.cloudflare.com` (tuntematon vanha
Cloudflare-tili), TTL 21600 s (6 h). Uusi vyöhyke huumorikaupan omalla Cloudflare-tilillä (`annabel`/`vick`) on jo
olemassa ja vastaa. `node scripts/dns-vertailu.mjs` vertasi molempia vyöhykkeitä suoraan nimipalvelimilta, eikä
estäviä eroja löytynyt:

| Nimi | Tyyppi | Vanha vyöhyke (julkinen DNS nyt) | Uusi vyöhyke (annabel/vick) | Tarvitaan |
|---|---|---|---|---|
| `@` | A | 216.198.79.1, 64.29.17.1 | 216.198.79.65, 64.29.17.65 | kyllä, Vercel (kaikki Vercelin osoitteita, toimivat samoin) |
| `@` | AAAA, CAA | ei ole | ei ole | ei. **Älä lisää CAA:ta**; jos joskus lisätään, siinä pitää olla `letsencrypt.org` (Vercelin varmenteet) |
| `@` | MX | 50 mx3.zoho.eu | sama | kyllä, nykyinen Zoho-posti ennallaan |
| `@` | TXT | v=spf1 +a +mx +ip4:31.217.196.126 +ip4:31.217.196.127 ~all | sama | kyllä, juuren SPF ennallaan (Resend käyttää alidomainia `send`) |
| `@` | TXT | google-site-verification=Afupwj3f... ja =snmSsxma... | sama | kyllä, **Search Consolen vahvistus** (molemmat arvot) |
| `@` | TXT | trustpilot-one-time-verification-id=f57afbee... | sama | ei haittaa |
| `www` | CNAME | 529bd05f3b0cb29b.vercel-dns-017.com | sama | kyllä, vaihe 2 vaihtaa |
| `_vercel` | TXT | vanhan Vercel-tiimin kaksi vc-domain-verify-arvoa | sama | kyllä vaiheeseen 2 asti |
| `default._domainkey` | TXT | v=DKIM1; k=rsa; p=MIIBIjAN... | sama | kyllä (vanhan postipalvelun DKIM) |
| `_acme-challenge` | TXT | YYDIo6w20V8U7UINBGCVtj4VOBocrJ1ILvqp_l5cLk8 | sama | ei haittaa (Vercel käyttää http-01:tä) |
| `_dmarc` | TXT | v=DMARC1; p=none; pct=100; rua=mailto:dmarcreports@lovable.dev | rua=mailto:huumorikauppa@gmail.com | kyllä, uusi arvo |
| `resend._domainkey` | TXT | ei ole | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUF9+... | kyllä, Resend DKIM |
| `send` | MX | ei ole | 10 feedback-smtp.eu-west-1.amazonses.com | kyllä, Resend |
| `send` | TXT | ei ole | v=spf1 include:amazonses.com ~all | kyllä, Resend |

Muita alidomaineja ei löytynyt (yleisimmät nimet kysytty, jokerimerkkiä ei ole). Uuden vyöhykkeen A- ja CNAME-tietueet
palauttavat Vercelin osoitteet eivätkä Cloudflaren, joten ne ovat oikein **DNS only** (harmaa pilvi). Oranssi pilvi
rikkoisi Vercelin varmenteen ja www-ohjauksen.

**DMARC:** gmail.com ei hyväksy toisen domainin DMARC-raportteja, joten raportteja ei todennäköisesti tule. Ilmainen
korjaus: Cloudflare > huumorikauppa.fi > Email > DMARC Management > Enable. Cloudflare antaa osoitteen
`...@dmarc-reports.cloudflare.net` ja lisää sen `_dmarc`-tietueeseen. Pidä `p=none`, kunnes raporteissa näkyy
Resendin DKIM-läpäisy kahden viikon ajan.

### Vaihtosuunnitelma (ei katkoa)

Periaate: vyöhykkeet ovat samat, joten vaihdon aikana ei ole väliä, kumman kävijän resolveri näkee. Domain siirretään
uuteen Vercel-projektiin vasta, kun nimipalvelimet ovat vaihtuneet ja tarkistukset ovat menneet läpi. Älä poista
mitään vanhalta Cloudflare-tililtä; se on palautustie.

**Vaihe 0 (ennen vaihtoa, Claude tai Cowork):**
`node scripts/dns-vertailu.mjs`: on oltava "Ei estäviä eroja". Jos uuteen vyöhykkeeseen tehdään muutoksia, aja uudelleen.

**Vaihe 1: nimipalvelimet (Cowork, Domainhotelli, arkiaamuna klo 7-9, ei kampanjapäivänä):**
1. Domainhotelli > huumorikauppa.fi > Nimipalvelimet. Kirjoita ylös nykyiset arvot (`aria.ns.cloudflare.com`,
   `huxley.ns.cloudflare.com`).
2. Vaihda tilalle täsmälleen ne kaksi, jotka uusi Cloudflare näyttää (Overview > "Replace your nameservers"):
   `annabel.ns.cloudflare.com` ja `vick.ns.cloudflare.com`. Älä ota DNSSECiä käyttöön kummassakaan päässä.
3. Cloudflare > Overview > **Check nameservers now**. Tila muuttuu Activeksi yleensä alle tunnissa.
4. Tarkistukset (Claude, heti ja 1 h ja 6 h kuluttua):
   - `dig +short NS huumorikauppa.fi @a.fi`: annabel ja vick
   - `curl -sI https://huumorikauppa.fi | head -1`: 200
   - `curl -sI https://www.huumorikauppa.fi | head -3`: ohjaus juureen
   - `node scripts/sahkoposti-tila.mjs`: DNS-rivit ok
   - Zohon posti: lähetä testiviesti Zoho-osoitteeseen, jos sellaista käytetään
   Vanhoja nimipalvelimia välimuistissaan pitävät resolverit (enintään 6 h) saavat samat vastaukset vanhasta vyöhykkeestä.

**Vaihe 2: sähköposti Resendiin (Claude, kun vaihe 1 on Active):**
1. `curl ... "https://huumorikauppa-five.vercel.app/api/cron/tilaukset?tehtava=resend-domain&vahvista=1"`
   (CRON_SECRET). Toista tunnin välein, kunnes tila on `verified`.
2. Vaihto on automaattinen: `lahetysreitti` ja `omaVahvistusKaytossaNyt` (api/_lib/sahkoposti.js) ottavat Resendin
   käyttöön tunnin kuluessa vahvistuksesta. Silloin kaikki viestit lähtevät osoitteesta tilaukset@huumorikauppa.fi, ja
   kassa lakkaa pyytämästä Stripen kuittia. Viestit ovat tilausvahvistukset, lähetysilmoitukset, lahjakortit,
   korimuistutukset, uutiskirje, arvostelupyynnöt ja hallinnan viestit.
3. `node scripts/sahkoposti-tila.mjs --testi`: yksi TESTI-viesti kustakin tyypistä osoitteeseen
   huumorikauppa@gmail.com. Tarkista Gmailissa, ettei yksikään ole roskapostissa, ja katso Näytä alkuperäinen:
   `dkim=pass header.d=huumorikauppa.fi` ja `dmarc=pass`.
4. `printf '1' | npx vercel env add SAHKOPOSTI_VAHVISTETTU production` (varmistus, ei pakollinen) ja julkaisu.
5. Jos Gmail-sovellussalasana on asetettu: `npx vercel env rm GMAIL_APP_PASSWORD production --yes` ja salasanan poisto
   Googlelta.

**Vaihe 3: domain uuteen Vercel-projektiin ja www 308 (Cowork + Claude samaan aikaan, vaiheen 2 jälkeen):**
Uudessa projektissa on jo `huumorikauppa.fi` ja `www.huumorikauppa.fi` (www ohjaa 308:lla juureen), tila
pending_domain_verification. Arvot tarkistettiin Vercelin API:sta 4.11.2026.
1. Cowork, Cloudflare > DNS > Records, lisää kaksi TXT-tietuetta nimellä `_vercel` (vanhat jäävät rinnalle):
   - `vc-domain-verify=huumorikauppa.fi,f6db53b10f680ae452fe`
   - `vc-domain-verify=www.huumorikauppa.fi,795afe3a11413258ab01`
   **Tämä on siirtohetki**: Vercel siirtää domainin uuteen projektiin heti vahvistettuaan sen.
2. Claude vahvistaa heti: `POST /v9/projects/<projekti>/domains/huumorikauppa.fi/verify` ja sama www:lle.
3. Cowork muuttaa: juuren A-tietueet 216.150.1.1 ja 216.150.16.1 (poista .65-arvot) ja `www` CNAME
   `bffaf7b5fcbd90db.vercel-dns-016.com`, kaikki DNS only.
4. Claude tarkistaa:
   - `node scripts/dns-vertailu.mjs --vaihe 2`
   - `curl -sI https://www.huumorikauppa.fi`: **308** ja `location: https://huumorikauppa.fi/`
   - kassatesti `node scripts/kassatesti.mjs --url https://huumorikauppa.fi`
   - `/api/products`, sivukartta ja Search Consolen URL-tarkistus
5. Kun kaikki on kunnossa, Claude:
   - poistaa välityskoodin (middleware.ts `valitysKohde`)
   - palauttaa ajastukset `vercel.json`-tiedostoon (scripts/julkaise-uusi.sh)
   - julkaisee
   Vanhaa Vercel-projektia ei enää tarvita. Viikon kuluttua Cowork poistaa vanhan tiimin kaksi `_vercel`-arvoa.

**Palautus:**
- Vaihe 1 epäonnistuu (sivu tai posti ei toimi 15 minuutissa): Domainhotellissa nimipalvelimet takaisin `aria` ja
  `huxley`. Vanha vyöhyke on koskematon.
- Vaihe 3 epäonnistuu:
  1. Claude poistaa domainin uudesta projektista API:lla.
  2. Cowork poistaa uudet `_vercel`-arvot ja palauttaa A-tietueet .65-arvoihin ja www CNAME
     `529bd05f3b0cb29b.vercel-dns-017.com`.
  Vanhan tiimin varmennus on yhä DNS:ssä.
Stripen webhook on koko ajan `huumorikauppa-five.vercel.app`-osoitteessa, joten maksut eivät katkea missään vaiheessa.

**Search Console:** domain-ominaisuus pysyy vahvistettuna, koska molemmat google-site-verification-arvot ovat uudessa
vyöhykkeessä. Tarkista vaiheen 1 jälkeen Search Console > Asetukset > Omistajuuden vahvistus.

**Coworkin vaiheet lyhyesti:**
1. (valmiina) Uuden Cloudflaren vyöhyke. Lisäksi Email > DMARC Management > Enable.
2. Domainhotelli: nimipalvelimet annabel ja vick, arkiaamuna. Cloudflare: Check nameservers.
3. Ilmoita Claudelle, kun Cloudflare näyttää Active.
4. Clauden pyynnöstä vaiheen 3 kohdat 1 ja 3.
5. Viikon päästä vanhat `_vercel`-arvot pois.

## 25. Kumppanikoodit itse: /hallinta/kumppanit (Cowork, 4.11.2026)

Cowork luo kumppanikoodit ja /k/-linkit itse ilman Claudea. Sivu: `huumorikauppa.fi/hallinta/kumppanit`
(src/pages/PartnerAdminPage.tsx, rajapinta api/sahkoposti.js `?kumppanit=`, `kumppani-luo`, `kumppani-tila`).

**Pääsy (kerran):** avaa linkki "Kumppanikoodit ja /k/-linkit (hallinta)" päivän yhteenvetoviestistä tai
"Hallintalinkit Coworkille" -viestistä Coworkin Chromessa (profiili "Huumorikauppa"). Sivu tallentaa pääsyn
evästeeseen 90 päiväksi, ja sen jälkeen `huumorikauppa.fi/hallinta/kumppanit` aukeaa suoraan. Aiemmat aktivoinnit
(ennen 4.11.2026) eivät kata tätä sivua, koska jokaisella hallintasivulla on oma eväste. Jos sivu sanoo "Ei pääsyä",
pyydä Claudea lähettämään uudet linkit: cron `?tehtava=hallintalinkit-viesti` (kaikki neljä hallintalinkkiä) tai
`?tehtava=aktivointilinkki-viesti` (taikalinkki, joka avaa nyt kaikki hallintasivut kerralla).

**Kierros 3 (22 kumppania):**
1. Avaa Drivessä taulukko `huumorikauppa-kumppanit-kierros3`.
2. Kopioi nimet ja mallit muodossa `Nimi; malli`, yksi kumppani per rivi. Malli on `1` (provisio 10 %) tai `2`
   (ostaja saa 5 % alennuksen, kumppani 5 % provision). Sarakkeet voi kopioida suoraan taulukosta (sarakkeet nimi
   ja malli vierekkäin); sarkain, puolipiste ja pilkku käyvät erottimiksi, ja otsikkorivi "Nimi" ohitetaan. Oman
   koodin voi antaa muodossa `Nimi; koodi; malli`, ja sähköpostin voi lisätä mihin tahansa sarakkeeseen nimen jälkeen.
3. Liitä rivit kenttään "Monta kerralla" ja paina **Esikatsele**. Esikatselu näyttää jokaisen koodin ja tiedon "uusi"
   tai "päivitetään". Virheelliset rivit näkyvät punaisella rivinumeron kanssa; korjaa ne ja esikatsele uudelleen.
4. Paina **Luo kaikki**. Enintään 100 riviä kerralla.
5. Paina **Kopioi taulukko** ja liitä tulos taulukon uudelle välilehdelle tai vapaisiin sarakkeisiin. Sarakkeet:
   nimi, koodi, malli, linkki (/k/), raportti (kumppanin oma raporttilinkki).
6. Lähetä viestit (KUMPPANIT-VIESTIPOHJA.md) niin, että jokaisessa on kumppanin oma /k/-linkki ja raporttilinkki.

**Koodit:** ilman annettua koodia koodi tehdään nimestä: pienet kirjaimet, ä ja å -> a, ö -> o, muut merkit
väliviivaksi, enintään 30 merkkiä (esim. "Äijä Öljynen" -> `aija-oljynen`). Jos koodi on jo toisella kumppanilla,
loppuun tulee `-2`, `-3` jne. Sama nimi uudelleen päivittää saman koodin (malli vaihtuu vain, jos se annetaan), joten
saman listan liittäminen kahdesti ei tee kaksoiskappaleita. Annettu koodi luodaan tai päivitetään aina sellaisenaan.

**Yksittäinen kumppani:** lomake "Uusi kumppani" (nimi pakollinen, koodi ja sähköposti valinnaisia, malli 1 tai 2).
Tulos näyttää koodin, /k/-linkin ja raporttilinkin kopiointipainikkeineen.

**Seuranta (lista "Kumppanit"):**
- **Ensimmäinen käynti:** aika, jolloin joku avasi kumppanin /k/-linkin ensimmäisen kerran. "ei vielä" tarkoittaa,
  ettei linkkiä ole avattu. Botit, linkkien esikatselut (WhatsApp, Facebook ym.) ja hallintaselaimet (Coworkin oma
  Chrome) eivät merkitse käyntiä, joten oman linkin testiavaus ei sotke tietoa.
- **Klikit:** /k/-linkin ja ?ref=-linkin avaukset yhteensä (botit pois).
- **Tilaukset:** maksetut tilaukset kumppanin koodilla. Asiakastietoja sivulla ei näy.
- Linkit-sarakkeesta saa /k/-linkin ja raporttilinkin uudelleen milloin tahansa (raporttilinkkiä ei tallenneta,
  vaan se muodostetaan joka kerta samaksi).

**Poisto käytöstä:** paina rivin **Poista käytöstä**. Koodi ei enää toimi kassalla eikä /k/-sivulla, mutta
tilaushistoria säilyy. **Aktivoi** palauttaa sen. Myös uudelleenluonti samalla koodilla aktivoi kumppanin.

**Vanha tapa toimii yhä:** cron `?tehtava=kumppani-lisaa&koodi=...&nimi=...&malli=alennus` ja
`?tehtava=kumppani-poista&koodi=...` (CRON_SECRET) käyttävät samaa luontia (api/_lib/kumppanihallinta.js) ja
palauttavat samat linkit.

## 26. Syöte Claudelle: /hallinta/syote (Cowork, 5.11.2026)

**Mihin:** Cowork välittää Claudelle raportteja, joita Claude ei itse saa (Search Console, Merchant Center, somen
tilastot). Sivu on suojattu kuten muut hallintasivut: Coworkin Chromen hallintaeväste avaa sen suoraan osoitteesta
https://huumorikauppa.fi/hallinta/syote. Jos sivu sanoo "Ei pääsyä", avaa aktivointilinkki (kohta 20).

**Näin liität:**
1. Kirjoita otsikko. Käytä aina samaa otsikkoa samalle raportille, jotta viikot voi verrata:
   - **Search Console 28 pv:** Search Console > Tehokkuus > Hakutulokset, aikaväli 28 päivää, välilehti Kyselyt, Vie > Lataa
     CSV (tai kopioi taulukko). Sarakkeet: kysely, klikkaukset, näyttökerrat, CTR, sijainti. **Joka maanantai.**
   - **Search Console sivut 28 pv:** sama, välilehti Sivut. Joka maanantai.
   - **Merchant klikit:** Merchant Center > Tehokkuus (Performance) > tuotteittain, 28 päivää, sarakkeet tuotteen nimi,
     tuotetunnus, klikkaukset ja näyttökerrat. Joka maanantai.
   - **Instagram tilastot**, **TikTok tilastot**, **Pinterest tilastot:** vapaa teksti tai taulukko, kun on uutta.
2. Liitä sisältö tekstikenttään (CSV-tiedoston sisältö, kopioitu taulukko tai teksti). Voit myös valita tiedoston,
   jos selain sallii sen; sivu lukee tiedoston tekstikenttään.
3. Paina **Tallenna.** Sivu näyttää "Tallennettu (#id, muoto, rivit)", ja merkintä näkyy Uusimmat-listassa.
   Sarkain-, puolipiste- ja pilkkuerotellut taulukot tunnistetaan automaattisesti. Enintään 1 000 000 merkkiä kerralla.

**Claudelle (kone):**
- `node scripts/syote-lue.mjs`: uusimmat merkinnät (otsikko, aika, alku).
- `--otsikko "search" --maara 10`, `--id 12 --koko` ja `--tallenna` (kansioon .cowork/syote/, ei repoon).
- `node scripts/syote-lue.mjs --analyysi`:
  - Search Consolen hakulausekkeet sijainnilla 5-30 näyttökertojen mukaan, ja sijainti viikoittain kaikista
    "Search Console 28 pv" -merkinnöistä.
  - Merchantin tuotteet, joilla on vähintään 100 näyttöä ja klikkausprosentti alle puolet keskiarvosta.
- **Toimenpiteet datan tultua:**
  - Hakulausekkeet sijainnilla 5-30: vastaavan sivun title, meta description, H1, sisältö ja sisäiset linkit; jos
    sopivaa sivua ei ole, uusi sivu.
  - Merchant: tuotteiden otsikot (api/_lib/hakuotsikko.js) ja ensimmäinen kuva.
  - Muutokset ja sijainnit kirjataan KASVU-RAPORTTI.md:hen.
- Tekniikka: taulu hallinta_syote (Neon), api/_lib/hallintasyote.js, api/sahkoposti.js `?syote=` ja POST
  `syote-tallenna`, cron `?tehtava=syote` (CRON_SECRET).
