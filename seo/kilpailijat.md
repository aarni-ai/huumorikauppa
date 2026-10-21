# Kilpailijat ja aukot (huumorikauppa.fi, joulu 2026)

Tutkittu 21.10.2026. Lähteet: kilpailijoiden sitemapit ja robots.txt (haettu suoraan), hakuehdotukset (Google suggestqueries, Bing osjson, fi-FI), oma koodi (src/App.tsx, src/data/*) ja live-sitemap https://huumorikauppa.fi/sitemap.xml.
Huom: hakuvolyymeja ei ole saatavilla. Prioriteetit perustuvat autocomplete-esiintymiseen (merkki siitä, että haku on yleinen), kilpailijoiden sivurakenteeseen ja tuotteidemme sopivuuteen. Osa avainsanoista (esim. setämiespaita, joulupaita, jouluhuppari) tulee kilpailijarakenteesta eikä autocompletesta, ja ne tulee validoida Search Consolessa.

## Kilpailijat ja rakenne

| Kauppa | Alusta | Kategoria- ja laskeutumissivut (slugit) | Lähde |
|---|---|---|---|
| meemirotta.fi | Shopify | Vain 9 kokoelmaa: t-paidat, colleget, hupparit, mukit, pipot, lippikset, kaikki-tuotteet, uutuudet, kaikki-hauskat-tuotteet. Ei lahja- eikä tilannesivuja. Sivut: koko-opas, juomapelin säännöt. | https://meemirotta.fi/sitemap.xml , https://meemirotta.fi/sitemap_collections_1.xml |
| stuntman.fi | Shopify | Iso vaatekauppa (miesten/naisten/lasten, bändipaidat, army, takit, asusteet). Huumoriin liittyvä: parodia-ja-huumorituotteet, printtipaidat, leffat-ja-sarjat, koirarodut. Ei lahjasivuja. 19 tuotesitemapia. | https://stuntman.fi/sitemap.xml , https://stuntman.fi/sitemap_collections_1.xml |
| hauskatpaidat.com | WordPress/Woo | Vahvin lahjarakenne: joululahjat, lahja-isalle, lahja-aidille, lahja-miehelle, lahja-naiselle, isanpaivalahja, aitienpaivalahja, ystavanpaivalahja, syntymapaivalahja, valmistujaislahja, hauska-lahja-elakelaiselle, 30/40/50/60/70/80-vuotislahja, syntymavuosi-t-paidat, ammattipaidat, inttipaidat, sananmuunnos-paidat, miesten-/naisten-huumoripaidat, hauskat-hupparit (painatus edessä/takana), hauskat-pipot, hauskat-lippikset, hauskat-hatut, hauskat-tarrat, 4-5xl-t-paidat, paidat-toihin (yrityksille), pohjanmaa-sarja, lahjavalitsin, lahjaideat. | https://www.hauskatpaidat.com/page-sitemap.xml , https://www.hauskatpaidat.com/product_cat-sitemap.xml |
| hauskatlahjaideat.fi | WordPress/Woo | Pelkkä lahjarakenne, 12 kategoriaa: joululahjat, lahja-isalle, lahja-aidille, lahja-miehelle, lahja-naiselle, elakelahja, valmistujaislahjat, hauska-syntymapaivalahja, laksiaislahja-tyokaverille, isanpaivalahja, aitienpaivalahja, ystavanpaivalahjat. | https://www.hauskatlahjaideat.fi/page-sitemap.xml , https://www.hauskatlahjaideat.fi/product_cat-sitemap.xml |
| saunazilla.com | WordPress/Woo | Teemat: sauna, suomi (kekkonen, kirottua), talvi, jääkiekko, pelipaidat, kaupunkipaidat (n. 25 kaupunkia), kassit, lahjakortit. Kansainvälinen /en/-haara (sauna-gifts, finland-products). Työkalusivuja (sauna-nimigeneraattori ym.) linkkimagneetteina. | https://saunazilla.com/sitemap_index.xml , https://saunazilla.com/product_cat-sitemap.xml |
| pahis.fi | oma | Asenne-/huumoripaidat (esim. kategoria "asenne-t-paidat", hupipaidat), toiminut vuodesta 1990. Rakenne tarkistettu vain hakutuloksista. | https://www.pahis.fi/category/296/asenne-t-paidat |
| junttipaita.com, munpaita.fi, paitakauppa.net | | Vain hakutuloksista nähty: juntti-huumori, luonto/sauna-teema, syntymäpäivä- ja sanaleikkipaidat. Sitemapeja ei käyty läpi (junttipaita ei palauttanut sitemapia). | https://www.junttipaita.com/category/7/t-paidat , https://munpaita.fi/pages/hauska-ja-laadukas-lahja-miehelle , https://www.paitakauppa.net/hauskat-t-paidat/ |

## Meidän tilanne (oma koodi + live-sitemap)

- Live-sitemapissa 578 URL:ia, joista suurin osa tuote- ja kaupunkisivuja. Lahjasivut: /joululahjat, /hauskat-lahjat-miehelle, /hauskat-lahjat-naiselle, /isanpaiva-lahjat, /aitienpaiva-lahjat, /syntymapaivalahjat, /elakelahjat, /lahja-kaverille, /lahja-tyokaverille, /polttari-lahjat sekä 24 /lahjat/<slug>-sivua (40/50/60 v mies, 50/60 v nainen, opettajalle, hoitajalle, kalastajalle, metsastajalle, kahvinystavalle, isoisalle, isoaidille, vauvalle, joululahjaksi-miehelle/naiselle, ym.).
- Koodissa on enemmän kuin sitemapissa: src/data/situationGifts.ts sisältää mm. joulu, pikkujouluihin, pomolle, alle-20-euroa, alle-30-euroa, valmistujaisiin, saunaan, golfaajalle, koodaajalle, 70-vuotiaalle, puolisolle, lapselle, kollegalle. Reitti /lahjat/:slug palvelee ne, mutta niitä ei ole live-sitemapissa. Tarkista, että ne ovat indeksoitavissa ja sitemapissa.
- /ammatti/:slug (22 ammattia), /harrastus/:slug (12) ja /murre/:slug (6) ovat reiteissä mutta eivät live-sitemapissa. Ammattislugeissa on ä/ö (insinöori, maanviljelijä); suositus ASCII-slugit (insinoori) ja 301-uudelleenohjaus. Sama: situationGiftsissä "isoäidille" vs sitemapin /lahjat/isoaidille.
- Kategoriat (/kategoria/): t-paidat, hupparit, bodyt, pipot, peitot, seinataulut, pitkahihaiset, koristeet, laukut, lippikset, tarrat, sukat, avaimenperat ym. Mukeja ei myydä, joten blogi /blogi/hauskat-mukit-toimistoon-ja-lahjaksi kannattaa tarkistaa (ei ohjata liikennettä tuotteettomalle aiheelle).

## Aukot, jotka voimme voittaa

1. Joulun kohderyhmäsivut puuttuvat kokonaan. Meillä on vain /joululahjat ja kaksi joululahjaksi-miehelle/naiselle -sivua. Autocompletessa toistuvat: joululahja isälle, äidille, vaimolle, kaverille, työkaverille, mummolle, papalle, teinille, "jolla on kaikkea". Hauskatpaidat.com ja hauskatlahjaideat.fi kattavat vain isän, äidin, miehen, naisen ja yleisen joululahjasivun, ei teiniä, kaveria, työkaveria eikä mummoa/pappaa.
2. Hintarajasivut (joululahja alle 10/20/30/50 €). Kukaan tutkituista ei ole rakentanut näitä; meillä on jo alle-20 ja alle-30 koodissa (lisää sitemapiin), alle-10 ja alle-50 uusia.
3. Pikkujoulut ja salainen joulupukki. Autocomplete antaa pikkujoululahja 5/10 e, työpaikan pikkujoulut, pukkilahja. Kilpailijoilla ei omaa sivua (hauskatlahjaideat: laksiaislahja-tyokaverille, mutta ei pikkujoulua).
4. Meemit ja suomalainen huumori. meemirotta.fi on lähin kilpailija mutta sillä ei ole sisältöä tai lahjasivuja (9 kokoelmaa). Voitettavissa sivuilla /meemipaidat, /suomalainen-huumori-paidat, /setamiespaidat.
5. Joulumallisto paidat/hupparit (joulupaita, jouluhuppari, vauvan ensimmäinen joulu body). Hauskatpaidat.com ei näytä omaa joulupaita-sivua. Vaatii tuotteiden tuomisen (tai uudelleenotsikoinnin) ennen sivun julkaisua.
6. Ammatti- ja harrastelahjat jouluna (opettaja, hoitaja, kalastaja, metsästäjä, mökkeilijä, kahvi, sauna, pelaaja). Meillä on jo /lahjat/-sivut, joita ei ole kytketty joulukauteen. Hauskatpaidat.com:lla vain yleinen ammattipaidat. Lisää joulukappale, FAQ ja sisäiset linkit /joululahjat-sivulta.
7. Vauvat: kilpailijoilla (hauskatpaidat, hauskatlahjaideat) ei vauvakategoriaa lainkaan; meillä /kategoria/bodyt ja /lahjat/vauvalle.
8. Rakenteelliset hyödyt: hauskatpaidat.com:in vahvuus on 30-80 v -sivut, joihin meillä vastaa /lahjat/-ikäsivut (puuttuu 40 v nainen, 70 v mies erikseen). Linkkimagneetit (saunazillan työkalusivut) puuttuvat meiltä; voisi tehdä "Mikä joululahja? -lahjavalitsin".

## Rajaukset

- Mukeihin liittyvät haut jätetty pois korkeista prioriteeteista (ei myydä). Mukihakuja ei ole CSV:ssä.
- Kilpailijoiden hintoja ja valikoimaa ei verrattu, vain rakenne.
- Autocomplete-ehdotuksissa näkyy usein vuosi 2025, joten ne ovat edellisvuoden hakukäyttäytymistä.

## Lähde-URLit (käytetyt)

- https://meemirotta.fi/robots.txt , https://meemirotta.fi/sitemap.xml
- https://stuntman.fi/robots.txt , https://stuntman.fi/sitemap.xml
- https://www.hauskatpaidat.com/sitemap_index.xml
- https://www.hauskatlahjaideat.fi/sitemap_index.xml
- https://saunazilla.com/sitemap_index.xml
- https://www.pahis.fi/sitemap.xml , https://www.pahis.fi/sitemap-categories.xml
- https://huumorikauppa.fi/sitemap.xml
- https://suggestqueries.google.com/complete/search?client=firefox&hl=fi&gl=fi&q=... ja https://api.bing.com/osjson.aspx?market=fi-FI&query=... (n. 120 siemenhakua)
