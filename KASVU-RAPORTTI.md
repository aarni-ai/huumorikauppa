# Huumorikauppa: kasvuraportti

Tavoite 3 000 €/kk nettokate, alkaen joulusesongista 2026. Sisältö- ja SEO-muutokset menevät `main`-haaraan
(tuotanto), kassa-, tilaus-, maksu- ja tietokantamuutokset vain `oma-tausta`-haaraan.

## Muutokset

| Pvm | Muutos | Haara / commit | Vaikutus | Seuraavaksi |
|---|---|---|---|---|
| 21.10. | Merchant-syöte: toimitushinta kassan säännöllä (6,90 €, ilmainen 79 €:sta; ennen syötteessä aina 0,00 €), shipping_label, product_type, identifier_exists=no, custom_label_1 sesonki. Syötteen hinnat tarkistettu: 490/490 täsmää tietokannan hintoihin. | main | Poistaa Merchant Centerin toimitushintaristiriidan (hylkäysriski), mahdollistaa Shopping-kampanjan jaon sesongin ja tuotetyypin mukaan | custom_label_0 (kate) kun Printify-kulut tunnetaan (oma tausta) |
