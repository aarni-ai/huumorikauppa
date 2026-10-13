# Auli Hurskainen - vastausluonnos

Tilaus: 27.9.2026, t-paita "Olen eläkkeellä", 27,56 e. Vastaanottaja Toini Aro c/o Auli Hurskainen, Tarvasjoentie 619, 21530 Paimio.

Tilauksen tiedot haetaan `RUN-IN-SUPABASE.sql` osiolla OSA A. Korvaa hakasulkeiset kohdat ennen lähettämistä. Älä lähetä, jos jokin kohta on vielä täyttämättä.

----- ALKAA -----
Hei Auli,

pahoittelut, että vastaus on viipynyt. Tässä tilauksesi tilanne.

Tilausnumero on [TILAUSNUMERO]. Paita "Olen eläkkeellä" lähtee painosta [LÄHETYSPÄIVÄ TAI ARVIO] ja on perillä yleensä 3-10 arkipäivässä lähetyksestä.

Paketti on osoitettu nimellä Toini Aro c/o Auli Hurskainen, Tarvasjoentie 619, 21530 Paimio. Jos vastaanottajan nimi pitää olla toisin, kerro se vastauksena tähän viestiin, niin korjaamme ennen lähetystä.

Seurantalinkki: [SEURANTAURL]

Terveisin
Huumorikauppa
----- LOPPUU -----

## Täyttöohje

- [TILAUSNUMERO] = OSA A -kyselyn `tilausnumero` (8 merkkiä isolla, esim. AB12CD34)
- [LÄHETYSPÄIVÄ TAI ARVIO] = `shipped_at` jos lähetetty, muuten Printifyn tuotantoarvio (Printify > Orders > tilaus)
- [SEURANTAURL] = `tracking_url`; jos ei vielä seurantaa, poista koko Seurantalinkki-rivi ja sen tyhjä rivi
- Jos paketti on jo lähtenyt, vaihda lause muotoon "lähti painosta [PVM]" ja jätä nimenkorjauskappale pois
