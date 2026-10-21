# Huumorikauppa: kasvuraportti

Tavoite 3 000 €/kk nettokate, alkaen joulusesongista 2026. Sisältö- ja SEO-muutokset `main`-haarassa (tuotanto),
kassa-, tilaus-, maksu- ja tietokantamuutokset vain `oma-tausta`-haarassa. Päivitetty 21.10.2026 (ilta: konversio ja isänpäivä).

## Tilanne lyhyesti

**Tuotannossa (huumorikauppa.fi), tarkistettu curlilla tavallisella, Googlebot- ja tyhjällä User-Agentilla:**
- Jokainen indeksoitava sivu palauttaa ilman JavaScriptiä oman titlen, kuvauksen, canonicalin, H1:n, sisällön ja
  rakenteisen datan (730 esirenderöityä sivua, 487 tuotesivua). Ennen kaikki sivut antoivat etusivun canonicalin.
- 42 laskeutumissivua (joululahjat vastaanottajan, budjetin ja tilanteen mukaan), Joululahjat-valikko, joulun
  viimeisten tilauspäivien sivu ja banneri (20.11.2026), 10 opasartikkelia, 100 tuotteen omat kuvaukset ja UKK:t.
- Virheelliset väitteet korjattu (ei "painettu Suomessa", ei 14.12.-lupausta, ehtojen mukaiset toimitus-, palautus-
  ja maksutiedot), mukit poissa myynnistä kaikkialla (myös kolme väärään kategoriaan kirjattua).
- Merchant-syöte: oikea toimitushinta, product_type, identifier_exists, sesonki; 484 tuotetta, kaikki linkit 200.
- Sivukartta 652 osoitetta, kaikki 200 ilman ohjauksia. Tuntematon tuote palauttaa oikean 404:n (noindex).
- robots.txt sallii tekoälybotit, llms.txt ja llms-full.txt generoituvat buildissa.
- Kuvat WebP-muodossa (pääkuva -60 %, korttikuva -92 %).

**Odottaa `oma-tausta`-haarassa (käyttöön KAYTTOONOTTO.md:n mukaan, kun avaimet on luotu):**
- Oma kassa, Stripe-webhook, tilaukset ja Printify-siirto Vercelissä; ei maksua tuotteesta ilman Printify-varianttia;
  on hold -tilaukset yritetään uudelleen ja omistaja saa hälytyksen heti.
- Katesääntö: myynti estetään alle 40 %:n nettokatteella (Printify-kulut + Stripe + ALV 25,5 %).
- Ostoskorin "X € ilmaiseen toimitukseen" ja suositukset, paketit (10 % etu vain, jos kate pysyy 40 %:ssa),
  digitaalinen lahjakortti, tuotesivun toimitusarvio ja "Ehtii jouluksi" -merkki (Printifyn takarajojen mukaan).
- GitHub Actions: tuntivalvonta, viikoittainen linkki- ja sivukarttatarkistus, viikoittainen katetarkistus,
  päivittäinen saatavuustarkistus. EU-painotalosiirron skripti (ei ajettu).

## 21.10. ilta: konversio, isänpäivä ja toimituslinja

Tavoite: konversio 0,2 %:sta vähintään 1 %:iin ja isänpäivän myynti.

**Tuotannossa (tarkistettu curlilla tavallisella, Googlebot- ja tyhjällä User-Agentilla):**
- Isänpäivä: /isanpaivalahja (44 tuotetta, ideat isän tyypin mukaan) ja /hauska-isanpaivalahja (21 tuotetta,
  isävitsit). Päällekkäiset /isanpaiva-lahjat ja /lahjat/isanpaiva ohjataan 301:llä /hauska-isanpaivalahja-sivulle.
  Isänpäivä-valikko työpöydällä ja mobiilissa.
- Kausibanneri (src/data/campaignSchedule.ts, Suomen aika): isänpäivä 28.10.2026 klo 23.59.59 asti ("Tilaa
  viimeistään keskiviikkona 28.10.2026"), 29.10. alkaen joulun viimeinen tilauspäivä 20.11.2026, 21.11. alkaen piilossa.
  Vaihtuu itsestään myös avoimella sivulla. Testattu vaihtohetket.
- Tuotesivu: toimitusaika ja -hinta suoraan hinnan alla, 14 päivän palautusoikeus (personoiduille tuotteille oikea
  poikkeusteksti), "Lisää koriin" ensinäkymässä 360x740 ja 390x844, täysleveä pääkuva (srcset 480/800/1200),
  kiinteä ostopalkki mobiilissa, evästeilmoitus ohut palkki eikä koko ruudun ikkuna.
- Maksutavat: vain Visa ja Mastercard. Kassa (create-checkout) ei rajaa maksutapoja, joten muita ei luvata;
  Klarna, MobilePay, Apple Pay ja Google Pay poistettu alatunnisteesta, tuotesivulta ja kassasta.
- Alatunniste: Huumorikauppa (Inteller), Y-tunnus 3583677-2, Helsinki, huumorikauppa@gmail.com, ehdot.
- Kokoapu jokaiselle vaatteelle: keksityt senttimitat poistettu. Mittataulukko näytetään vain, jos tuotteen omassa
  kuvauksessa on mitat; muuten koot ja mittausohje. Yhdelläkään 484 vaatteesta ei ole mittoja kuvauksessa.
- Arviot: kaikki ennen ensimmäistä tilausta (25.3.2026) päivätyt ja päiväämättömät arviot piilotettu (64 tuotearviota,
  59 karusellin arviota, 3 äitienpäiväsivun arviota) ja siirretty tiedostoon src/data/arvostelut-arkisto.ts
  palautusohjeineen. Väitteet "4.8/5 (200+ arvostelua)" ja "Tuhansia tyytyväisiä asiakkaita" poistettu. Rakenteisessa
  datassa ei ole aggregateRatingia eikä Review-objekteja (testi valvoo).
- Toimitusehdot yhdessä tiedostossa src/config/toimitus.ts (noin 390 tekstiä 40 tiedostossa lukee sen). Testi
  estää kovakoodatut toimitushinnat. Mainissa 6,90 € / ilmainen 79 €:sta, koska nykyinen kassa veloittaa niin.
- Tarrat-kategoria: tosiasiaan perustuva teksti (oma teksti- tai kuvatarra, koot), /tarrat ja /hupparit 301.
- Suorituskyky: hero-kuva 2,6 Mt PNG -> WebP 37-258 kt (srcset), fontit eivät estä renderöintiä, tuotekuvan preload,
  tuotesivu hakee oman tuotteensa ennen koko luetteloa.

**Lighthouse mobiili, tuotanto, 3 ajon mediaani:**

| Sivu | Suorituskyky | Saavutettavuus | Parhaat käytännöt | SEO | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Etusivu ennen | 56 | 87 | 79 | 100 | 25,8 s | 6,3 s | 74 ms | 0 |
| Etusivu jälkeen | 81 | 90 | 100 | 100 | 3,8 s | 3,4 s | 119 ms | 0 |
| Tuotesivu ennen | 58 | 85 | 79 | 100 | 12,3 s | 7,5 s | 0 ms | 0 |
| Tuotesivu jälkeen | 68 | 89 | 100 | 100 | 7,3 s | 4,1 s | 70 ms | 0,035 |

Tuotesivu: /tuote/saatanan-tunarit-t-paita. Tuotesivun LCP on yhä Printifyn kuva kuvaproxyn kautta; seuraava askel on
näyttää esirenderöity sisältö heti (nyt piilossa JavaScriptin latautumiseen asti).

**Miksi tarrat ja hupparit puuttuivat Googlesta:**
1. 21.10. asti jokaisen osoitteen HTML:ssä oli etusivun canonical (`https://huumorikauppa.fi/`) ja etusivun title.
   Google tulkitsi kategoriasivut etusivun kaksoiskappaleiksi. Korjattu esirenderöinnillä (5fb0063): sivuilla on
   nyt oma canonical, title ja sisältö kaikille käyttäjäagenteille, ja ne ovat sivukartassa.
2. Tarrat-kategoriassa on vain yksi myynnissä oleva tuote (oma teksti/kuva -tarra), ja sivun teksti lupasi
   valikoimaa ja kestoväitteitä, joita ei ollut. Ohut sivu ei nouse. Teksti korjattu; uudet tarrat tulevat
   skriptillä scripts/printify-uudet-tuotteet.mjs (oma-tausta, 10 tarraa alle 20 €).
3. Hupparit (164 tuotetta) kilpaili samasta hausta laskeutumissivun /hauskat-hupparit kanssa; molemmilla on nyt oma
   canonical ja ne linkittävät toisiinsa.
Omistaja: Search Consolessa URL-tarkistus ja indeksointipyyntö /kategoria/tarrat ja /kategoria/hupparit.

**oma-tausta-haarassa (testisivu https://huumorikauppa-five.vercel.app, noindex):**
- Kaikki yllä oleva yhdistetty, 449 testiä läpi, tarkistettu curlilla.
- Toimitus 5,90 €, ilmainen 60 €:sta: kassa (api/_lib/vakiot.js), sivuston tekstit, rakenteinen data ja
  Merchant-syöte (testisivun syötteessä 5.90 EUR). Testi varmistaa, että kassa, syöte ja tekstit ovat samat.
- Uusien tuotteiden skripti scripts/printify-uudet-tuotteet.mjs: tekstilistasta Printify-tuotteet EU-painotaloille
  (10 joulupaitaa ja -hupparia, 10 tarraa alle 20 €), hinta 40 %:n katesäännöllä, tuodaan kauppaan piilotettuina.
  Ei ajettu (Printify-avain puuttuu). Ohje KAYTTOONOTTO.md kohta 11.
- Huomio katteesta: 5,90 € / 60 € laskee katetta. 34,90 € t-paidan nettokate 15,93 € -> 15,15 € (46,6 %); noin
  50 € hinnoiteltu tuote, jonka Printify-kulut ovat noin 26 €, putoaa alle 40 %:n ja katesääntö estää sen myynnin.
  Katetarkistus (GitHub Actions) näyttää nämä, kun Printify-kulut on tuotu.

**Isänpäivän toimituslupaus:** 28.10. viimeinen tilauspäivä on omistajan päätös. Printifyn tuotanto (2-5 arkipäivää)
ja kuljetus Suomeen (Yhdysvaltain painotaloista 7-12 arkipäivää) eivät aina ehdi 8.11. mennessä. EU-painotalojen
tuotteilla ehtii. Päivä on yhdessä paikassa (src/data/campaignSchedule.ts), jos sitä halutaan aikaistaa.

## inteller.info (sähköposti aarni@inteller.info)

Selvitetty RDAP:lla ja dig:llä 21.10.2026:
- Rekisteröijä GoDaddy.com, LLC. Rekisteröity 4.12.2025, **voimassa 4.12.2026 asti**. Tila: siirto-, poisto-,
  päivitys- ja uusimislukko (clientRenewProhibited: uusiminen vaatii GoDaddyn tilin).
- Nimipalvelimet Cloudflare (weston.ns.cloudflare.com, gracie.ns.cloudflare.com).
- MX: Google Workspace (aspmx.l.google.com + alt1-4), SPF include:_spf.google.com. Posti oli Google Workspacessa;
  aiemmin Zoho (TXT-vahvistus jäljellä).
- Lovable-, Vercel- ja Cloudflare-tilit ovat todennäköisesti tällä osoitteella, joten osoitteen palautus on kiireellinen.

Omistajan seuraava askel (maksuton reitti):
1. Kirjaudu GoDaddyyn (salasanan palautus puhelinnumerolla tai varasähköpostilla). Uusi domain ennen 4.12.2026.
2. Jos Cloudflare-tili aukeaa toista kautta: Cloudflare Email Routing (ilmainen) -> lähetä aarni@inteller.info
   Gmailiin. Cloudflare vaihtaa MX-tietueet itse.
3. Jos Cloudflare ei aukea: vaihda GoDaddyssa nimipalvelimet GoDaddyn omiin ja käytä GoDaddyn ilmaista
   sähköpostin edelleenlähetystä. Huom: tämä katkaisee Cloudflaren kautta kulkevat tietueet (A-tietueet
   tarkistettava ensin).
4. Kun posti kulkee: palauta Lovable-, Vercel- ja Cloudflare-tilien salasanat ja vaihda tilien sähköposti
   osoitteeseen, joka ei riipu yhdestä domainista.
5. Google Workspace (jos tilaus jäi maksamatta): palautus vaatii DNS-pääsyn TXT-vahvistukseen.

## Uudet ja uudistetut sivut

Joululahjat: /joululahjat, /joululahja-miehelle-jolla-on-kaikki, /joululahja-isalle, /joululahja-aidille,
/joululahja-vaimolle, /joululahja-kaverille, /joululahja-tyokaverille, /joululahja-mummolle, /joululahja-papalle,
/joululahja-teinille, /joululahja-alle-50-euroa, /salainen-joulupukki-lahja, /lahjat/joululahjaksi-miehelle,
/lahjat/joululahjaksi-naiselle, /lahjat/pomolle, /lahjat/alle-30-euroa, /lahjat/pikkujouluihin,
/joulun-viimeiset-tilauspaivat.
Tuotteet ja teemat: /meemipaidat, /suomalainen-huumori-paidat, /setamiespaidat, /ammattipaidat, /hauskat-t-paidat,
/hauskat-hupparit.
Lahjat: /lahjat/isoaidille, /lahjat/harrastajalle, /lahjat/40-vuotiaalle-miehelle, /lahjat/50-vuotiaalle-miehelle,
/lahjat/60-vuotiaalle-miehelle, /lahjat/70-vuotiaalle, /lahjat/50-vuotiaalle-naiselle, /lahjat/60-vuotiaalle-naiselle,
/elakelahjat, /lahjat/isoisalle, /lahjat/siskolle, /lahjat/veljelle, /lahjat/puolisolle, /lahja-kaverille,
/lahjat/tyokaverille, /isanpaivalahja, /hauska-isanpaivalahja, /hauskat-lahjat-miehelle, /hauskat-lahjat-naiselle, /syntymapaivalahjat.
Blogi: /blogi/hauskat-joululahjaideat-miehelle-2026, /blogi/pikkujoululahja-alle-20-euroa,
/blogi/lahja-miehelle-jolla-on-kaikki, /blogi/elakelahja-joka-naurattaa, /blogi/mita-ostaa-tyokaverille-jouluksi,
/blogi/joululahja-isalle-hauskat-ideat, /blogi/salaisen-joulupukin-lahja-10-20-30-euroa,
/blogi/hauska-lahja-teinille-jouluksi, /blogi/lahja-kalastajalle-metsastajalle-mokkeilijalle,
/blogi/joululahjan-viimeiset-tilauspaivat-2026.
Yhdistetyt (301): alle 20 € -> alle 30 €, kalastus/metsästys/videopelit -> harrastajalle, opettaja/hoitaja ->
ammattipaidat, sauna -> suomalainen huumori, /lahja-tyokaverille -> /lahjat/tyokaverille. Ei luotu (alle 8 tuotetta):
alle 10 €, joulupaidat, jouluhupparit, vauvan ensimmäinen joulu, saunapaidat, mökkeilijälle.

## Vaikutusarvio

Lähtötietoja (Search Consolen liikenne, Stripen myynti) ei ollut käytettävissä, joten arvio on suuntaa antava.
- Indeksoitavuuskorjaus on suurin yksittäinen muutos: aiemmin Google näki sivujen sisällön vain renderöinnin jälkeen
  ja muut hakukoneet ja tekoälybotit eivät lainkaan. Vaikutus näkyy 2-6 viikossa, eli joulusesonkiin.
- 42 laskeutumissivua kattavat ostoaikeiset joulu- ja vastaanottajahaut, joissa kilpailijoilla ei ole sivuja
  (seo/kilpailijat.md: vastaanottaja-, budjetti- ja salaisen joulupukin sivut puuttuvat kaikilta).
- Laskelma tavoitteeseen: keskiostos noin 35-45 €, nettokate 40-50 % -> 15-20 € per tilaus. 3 000 €/kk vaatii noin
  150-200 tilausta kuukaudessa. Joulukuun alun konversiolla 1,5-2 % se tarkoittaa noin 8 000-13 000 kävijää
  kuukaudessa.

## Seuraavaksi (prioriteettijärjestys)

1. **Omistaja: KAYTTOONOTTO.md kohdat 1-7** (Printify-, Stripe- ja Resend-avaimet). Printify-kulujen tuonti avaa
   katesäännön, Shopping-kampanjan kateluokat (custom_label_0) ja tarkemmat jouluajat. Tavoite: domain uuteen
   taustaan ennen 27.11. (Black Friday), koska vanhan taustan on hold -ongelma kaataa tilauksia.
2. **Search Console ja Merchant Center:** lähetä sivukartta uudelleen, pyydä indeksointi joulusivuille, tarkista
   syötteen hylkäykset (toimitushinta korjattu).
3. **Shopping-kampanja** jaettuna custom_label_1 = joulu ja product_type mukaan, budjetti katteen mukaan.
4. **Joulutuotteet:** joulupaidat, jouluhupparit ja vauvan joulubody EU-painotaloihin (kysyntä ilman tarjontaa).
5. **Alle 20 € tuotteet** pikkujouluihin ja salaiseen joulupukkiin (nyt vain tarrat ja koristeet).
6. **Maksutavat:** nyt vain Visa ja Mastercard. Jos Stripen Dashboardissa on päällä muita (MobilePay, Klarna), lisää ne ehtoihin ja PaymentIcons-komponenttiin.
7. **Tuotenimet:** tietokannan nimissä on ajatusviivoja (393 titleä); korjaus oman taustan tietokannassa.
8. **Middleware-metat** yhdestä lähteestä (osa ei-esirenderöityjen sivujen bottimetoista on kömpelöitä).
9. Blogiartikkeleihin kuvat. Tuotteiden kuvauksiin mittataulukot (tai blueprint-tieto tietokantaan), jotta kokoapu näyttää mitat.
10. **Esirenderöity sisältö näkyviin heti** (nyt piilossa JS:n latautumiseen asti): tuotesivun LCP 7,3 s -> tavoite alle 2,5 s.
11. **Arviot:** kerää todelliset arviot tilausten jälkeen (Google-asiakasarviot ovat käytössä); palauta arkistosta vain todennettavat.

## Muutokset

| Pvm | Muutos | Haara / commit | Vaikutus | Seuraavaksi |
|---|---|---|---|---|
| 21.10. | Merchant-syöte: toimitushinta kassan säännöllä (6,90 €, ilmainen 79 €:sta; ennen syötteessä aina 0,00 €), shipping_label, product_type, identifier_exists=no, custom_label_1 sesonki. Syötteen hinnat tarkistettu: 490/490 täsmää tietokannan hintoihin. | main | Poistaa Merchant Centerin toimitushintaristiriidan (hylkäysriski), mahdollistaa Shopping-kampanjan jaon sesongin ja tuotetyypin mukaan | custom_label_0 (kate) kun Printify-kulut tunnetaan (oma tausta) |
| 21.10. | Joulun viimeinen tilauspäivä 14.12. -> 20.11.2026 (UKK ja botin UKK). 14.12. ei olisi pitänyt: Printifyn 2025 Eurooppa-takarajat olivat 27.11.-9.12. ja Suomeen kuljetus lisää päiviä (seo/toimitusajat.md). | main | Ei lupausta, jota ei voi pitää; vähentää jouluviikon reklamaatioita | Painotalokohtainen päivä tuotesivulle, kun Printify-tiedot saatavilla; tarkista Printifyn 2026-takarajat (julkaistaan lokakuussa) |
| 21.10. | Staattinen esirenderöinti: 712 sivua (490 tuotesivua, kategoriat, lahjasivut, blogi, UKK) palauttavat ilman JavaScriptiä oman titlen, kuvauksen, canonicalin, H1:n, sisällön ja JSON-LD:n kaikille käyttäjäagenteille. Ennen jokainen sivu antoi tavalliselle selaimelle ja tyhjälle agentille etusivun titlen ja canonicalin `https://huumorikauppa.fi/`. Rakenteinen data: Organization, WebSite + SearchAction, Product + Offer (toimitus 6,90 €/ilmainen 79 €:sta, palautus 14 pv), BreadcrumbList, FAQPage. robots.txt: tekoälybotit sallittu samoilla rajauksilla. llms.txt ja llms-full.txt generoidaan buildissa. Keksitty aggregateRating poistettu (Googlen ohjeiden vastainen). | main 5fb0063 | Indeksoitavuus: Google ja muut hakukoneet näkevät jokaisen sivun oman sisällön; tekoälyhaut saavat faktat llms.txt:stä | Tuntematon tuote palauttaa 200 (soft 404); ä/ö-osoitteet; yli 60 merkin titlet |
| 21.10. | 10 joulun opasartikkelia (1040-1141 sanaa, Article + FAQPage, sisäiset linkit laskeutumissivuille ja tuotteisiin), esim. /blogi/lahja-miehelle-jolla-on-kaikki, /blogi/joululahjan-viimeiset-tilauspaivat-2026, /blogi/pikkujoululahja-alle-20-euroa | main ad17882 | Pitkän hännän joulu- ja lahjahaut, sisäinen linkitys rahasivuille | Lisää kuvat artikkeleihin |
| 21.10. | Sisältökorjaukset: virheellinen väite "painettu Suomessa" poistettu kaikkialta (tuotteet painetaan tilauksesta painokumppaneilla ulkomailla), noin 900 mukimainintaa poistettu, UKK:n ristiriidat korjattu ehtojen mukaisiksi (PostNord -> Posti tai Matkahuolto, hyvitys 14 pv, ei erillistä vaihtoa, toimitus 3-10 arkipäivää, maksutavat ehtojen mukaan), 92 yli 60 merkin titleä lyhennetty, UKK uudelleen (suora vastaus ensimmäisessä virkkeessä, tekoälyhakujen kysymykset), 100 tuotteen uniikit kuvaukset ja FAQ:t (src/data/productContent.ts), kuvaavat alt-tekstit kaikille tuotekuville. | main c5cc99c | Kuluttajansuojariski pienenee (harhaanjohtava alkuperäväite), parempi osuvuus ja CTR, rikkaampi tuotesivu | Tuotteiden nimissä yhä ajatusviivoja (tietokannassa); Footer ja kassa listaavat Klarna/MobilePay, joita ehdot eivät mainitse: tarkista Stripestä |
| 21.10. | Kolme mukia oli tietokannassa t-paidat-kategoriassa (koko 11oz) ja näkyi myynnissä ja syötteessä t-paitoina: piilotettu tuotetasoisella säännöllä (src/lib/hiddenCategories.ts onPiilotettuTuote), 301-ohjaukset. Syötteessä 487 tuotetta. | main 291d93e | Ei myydä tuotetta, jota ei tarjota; syöte ei näytä mukia t-paitana | |
| 21.10. | Kuvat: kuvaproxy palauttaa WebP:n tukeville selaimille (Vary: Accept), korttikuvat 480 px, CDN-välimuisti 7 pv. Mitattu tuotannossa: pääkuva 53,4 kt -> 21,5 kt (WebP), korttikuva 53,4 kt -> 4,1 kt. Ilman WebP-tukea ja Googlebot-Imagelle JPEG kuten ennen. | main 23bc65d | Nopeampi LCP ja vähemmän siirrettävää listasivuilla (Core Web Vitals) | srcset tuotesivun pääkuvalle |
| 21.10. | 42 laskeutumissivua, Joululahjat-valikko, /joulun-viimeiset-tilauspaivat + banneri (näkyy 20.11.2026 asti), oikea 404 tuntemattomille tuotteille, ASCII-osoitteet ä/ö-sivuille (301), sivukarttaan laskeutumis- ja kaupunkisivut. | main 31c7c81 | Ostoaikeiset joulu- ja vastaanottajahaut | Lisää joulutuotteita, alle 20 € valikoima |
| 21.10. | Bottien metatiedoista pois ajatusviivat, superlatiivit ja virheväitteet; sivukartta ja syöte ilman ohjautuvia tuotekaksoiskappaleita (652 + 484 linkkiä, kaikki 200). | main 5ce880e | Siistit hakutulokset, ei 308-linkkejä Merchantissa | |
| 21.10. | Isänpäivä: /isanpaivalahja ja /hauska-isanpaivalahja, 301 vanhoilta, valikko, kausibanneri (isänpäivä 28.10. asti, joulu 29.10.-20.11.). | main 66e8881, c1d12e4 | Isänpäivän ostoaikeiset haut, banneri ohjaa ostamaan ennen takarajaa | Isänpäivän jälkeen sivut jäävät (ikivihreä sisältö) |
| 21.10. | Tarrat-kategorian teksti tosiasioiden mukaan, /tarrat ja /hupparit 301. | main 36d552d | Ohut ja virheellinen sivu korjattu | Lisää tarroja (skripti valmis) |
| 21.10. | Konversio: toimitusehdot yhdestä tiedostosta, arviot arkistoon, tuotesivu mobiili edellä, kokoapu, alatunnisteen kauppiastiedot, vain taatut maksutavat, suorituskyky (Lighthouse etusivu 56 -> 81, tuotesivu 58 -> 68). | main d794550-7c6c523, 026e0b4 | Ostopolku lyhyempi ja luotettavampi; LCP 25,8 s -> 3,8 s etusivulla | Esirenderöity sisältö näkyviin heti |
| 21.10. | oma-tausta: toimitus 5,90 € / ilmainen 60 €:sta (kassa, syöte, tekstit), uusien tuotteiden Printify-skripti (ei ajettu). | oma-tausta 10d6a11, cf9f98c | Valmis domainin siirtoon | Printify-avain, sitten skripti --toteuta --raja 1 |
