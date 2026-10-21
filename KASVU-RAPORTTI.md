# Huumorikauppa: kasvuraportti

Tavoite 3 000 €/kk nettokate, alkaen joulusesongista 2026. Sisältö- ja SEO-muutokset `main`-haarassa (tuotanto),
kassa-, tilaus-, maksu- ja tietokantamuutokset vain `oma-tausta`-haarassa. Päivitetty 21.10.2026.

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
/lahjat/tyokaverille, /isanpaiva-lahjat, /hauskat-lahjat-miehelle, /hauskat-lahjat-naiselle, /syntymapaivalahjat.
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
6. **Maksutavat:** footer ja kassa mainitsevat Klarnan ja MobilePayn, ehdot eivät. Tarkista Stripestä ja yhtenäistä.
7. **Tuotenimet:** tietokannan nimissä on ajatusviivoja (393 titleä); korjaus oman taustan tietokannassa.
8. **Middleware-metat** yhdestä lähteestä (osa ei-esirenderöityjen sivujen bottimetoista on kömpelöitä).
9. Blogiartikkeleihin kuvat; tuotesivun pääkuvalle srcset.

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
