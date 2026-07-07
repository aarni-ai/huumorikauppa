# AliExpress-dropship – CSV-import

Tuot tuotteet CSV:llä + lataamalla kuvatiedostot. Import tallentaa kuvat **Supabase
Storageen** (bucket `product-images`) — AliExpressin CDN-linkkejä ei käytetä (ne hajoavat
hotlinkatessa). Tuotteet luodaan **draftina** (`is_active = false`) eli piilossa kaupasta,
kunnes hyväksyt ne.

## Työnkulku
1. Täytä `template.csv` (yksi rivi per tuote).
2. Nimeä kuvatiedostot täsmälleen kuten `image_files`-sarakkeessa.
3. Admin → AliExpress-import: valitse CSV + kuvatiedostot → import lataa kuvat Storageen,
   laskee hinnan ja luo tuotteet draftina.
4. Tarkista tuote → hyväksy (aseta näkyväksi). Ensimmäinen testituote hyväksytään ennen loppuja.

## Sarakkeet

| Sarake | Pakollinen | Selitys |
|---|---|---|
| `name` | kyllä | Tuotteen nimi kaupassa. |
| `description` | ei | Kuvausteksti. |
| `category` | kyllä | Yksi arvoista: `t-paidat, hupparit, pitkahihaiset, bodyt, mukit, tarrat, seinataulut, peitot, pipot, laukut, koristeet, housut`. Valitse lähin. |
| `cost_price_eur` | kyllä | AliExpress-ostohinta €:na (esim. `6.49`). |
| `sell_price_eur` | ei | Manuaalinen myyntihinnan ohitus. **Tyhjä = lasketaan automaattisesti.** |
| `variants` | ei | Muoto: `Attribuutti: A \| B \| C ; Toinen: X \| Y`. Esim. `Koko: S \| M \| L ; Väri: Musta \| Valkoinen`. |
| `aliexpress_url` | kyllä | Lähde-URL — tallennetaan fulfillmentia varten (et näytä sitä asiakkaalle). |
| `image_files` | kyllä | Pilkulla erotellut kuvatiedostojen nimet, jotka lataat importissa (esim. `keskisormi-1.jpg, keskisormi-2.jpg`). Ensimmäinen = pääkuva. |
| `origin_country` | ei | Oletus `CN`. ALV/IOSS-raportointia varten. |

## Hinnoittelusääntö (automaattinen)
`myyntihinta = max(ostohinta × 3, 6,90 €)`, pyöristettynä **ylös lähimpään X,90**.
Esim. ostohinta 6,49 € → 19,90 € · 4,95 € → 14,90 € · 17,26 € → 51,90 €.
`sell_price_eur`-sarakkeella voit ohittaa tämän per tuote.

## Toimitusaika
AliExpress-tuotteille näytetään automaattisesti: **"Toimitusaika n. 2–4 vk, toimitetaan
erikseen."** Printify-tuotteet säilyttävät nopean toimitusaikansa. Sekakorissa asiakkaalle
kerrotaan että tuotteet toimitetaan eri paketeissa.
