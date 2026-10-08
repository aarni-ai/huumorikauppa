# Auli Hurskainen – vastausluonnos

Tilauksen tiedot: haettu SQL-kyselyllä (ks. RUN-IN-SUPABASE.sql).
Korvaa alle merkittyihin kohtiin oikeat tiedot ennen lähettämistä.

----- ALKAA -----
Hei Auli,

kiitos tilauksestasi! Tilaukseesi [TILAUSNUMERO] kuuluva tuote "Olen eläkkeellä" on toimitettu painatukseen. Tilauksesi on nyt matkalla sinulle.

Seurantakoodi: [SEURANTAKOODI]
Seuraa pakettia osoitteessa: [SEURANTAURL]

Paketti saapuu yleensä 3-10 arkipaivassa. Jos tarvitset lisatietoja, voit vastata tahan viestiin.

Terveisin,
Huumorikauppa
----- LOPPUU -----

---

## Tiedot täytetään kun SQL-kysely on ajettu

Aja `RUN-IN-SUPABASE.sql` Supabasen SQL Editorissa.
Korvaa yllä olevat kohdat hakutuloksista:

- **[TILAUSNUMERO]** = `id` (8 ensimmäistä merkkiä isolla, esim. `#AB12CD34`)
- **[SEURANTAKOODI]** = `tracking_number` (jos jo olemassa) tai selvitä Printify-hallintapaneelista
- **[SEURANTAURL]** = `tracking_url` (jos jo olemassa)

Jos tilauksen printify_status on `pending` tai `failed`, se on jumiutunut.
Siinä tapauksessa katso RUN-IN-SUPABASE.sql:n ohjeet manuaalisesta uudelleenyrityksestä.
