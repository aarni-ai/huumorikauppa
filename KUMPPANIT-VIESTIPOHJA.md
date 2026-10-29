# Kumppanuusohjelma: viestipohjat sisällöntuottajille (Cowork)

Käyttö: korvaa [hakasulkeissa] olevat kohdat. Lähetä osoitteesta huumorikauppa@gmail.com. Kun sisällöntuottaja
suostuu, lisää hänet kumppaniksi (Claude tai cron-kutsu `?tehtava=kumppani-lisaa&koodi=<koodi>&nimi=<nimi>&email=<email>`)
ja lähetä viesti 2. Sääntö ja esimerkit vastaavat sivua https://huumorikauppa.fi/kumppanit.

Älä lupaa muuta kuin tässä lukee: ei kiinteää palkkiota, ei ilmaisia tuotteita, ei alennuskoodia seuraajille.

---

## Viesti 1: ensimmäinen yhteydenotto

**Aihe:** Yhteistyö: Huumorikaupan kumppanuusohjelma

Hei [nimi],

olemme Huumorikauppa, suomalainen verkkokauppa, joka myy hauskoja t-paitoja ja huppareita suomalaisella huumorilla
(esimerkiksi Tonnin seteli, Amatimies ja ikävuosipaidat). Seuraamme [kanava] ja ajattelimme, että huumorimme sopisi
yleisöllesi.

Tarjoamme kumppanuutta: saat oman linkin ja kumppanikoodin, ja maksamme provision tilauksista, jotka tulevat sinun
kauttasi.

- Provisio on 10 % tilauksen tuotteiden arvosta (ilman arvonlisäveroa ja toimituskuluja) tilauksista, joista
  kaupalle jää provision jälkeen vähintään 5,00 € katetta. Jos kate ei riitä täyteen 10 %:iin, provisio on pienempi,
  ja jos tilauksen kate on 5,00 € tai alle, provisiota ei makseta.
- Esimerkkejä: yksi t-paita (24,90 €) = 1,98 €, kaksi t-paitaa = 3,77 €, huppari (49,99 €) = 2,86 €.
- Tilitys kerran kuussa edellisen kuukauden tilauksista, kun 14 päivän palautusaika on päättynyt. Saat
  kuukausiraportin tilauksittain.
- Seuraajasi maksavat tavallisen hinnan. Kumppanikoodi ei ole alennuskoodi.

Lisätiedot: https://huumorikauppa.fi/kumppanit

Kiinnostaako? Vastaa tähän viestiin, niin lähetämme koodisi.

Terveisin
[allekirjoitus]
Huumorikauppa (Uusiku Oy, Y-tunnus 3653666-7)
huumorikauppa@gmail.com

---

## Viesti 2: tervetuloa ja kumppanikoodi

**Aihe:** Kumppanikoodisi: [koodi]

Hei [nimi],

tervetuloa Huumorikaupan kumppaniksi!

- Kumppanikoodisi: **[koodi]**
- Linkkisi: https://huumorikauppa.fi/?ref=[koodi]
  (Koodin voi lisätä minkä tahansa sivun perään, esimerkiksi https://huumorikauppa.fi/tonnin-seteli-paita?ref=[koodi].)

Tilaus kirjataan sinulle, kun ostaja tulee linkistäsi ja tilaa samalla käynnillä, tai kun ostaja kirjoittaa koodisi
kassan kenttään Kumppanikoodi. Pyydä seuraajia kirjoittamaan koodi kassalla, niin tilaus kirjautuu varmasti.

Muistathan merkitä julkaisut mainonnaksi, esimerkiksi "Kaupallinen yhteistyö: Huumorikauppa".

Provisio: 10 % tuotteiden arvosta ilman arvonlisäveroa ja toimituskuluja tilauksista, joista kaupalle jää vähintään
5,00 € katetta (pienempi tai 0, jos kate ei riitä). Tilitys kerran kuussa edellisen kuukauden tilauksista.

Kiitos ja hauskaa yhteistyötä!

[allekirjoitus]
huumorikauppa@gmail.com

---

## Viesti 3: kuukausiraportti

**Aihe:** Kumppaniraportti [kuukausi]: [tilauksia] tilausta, provisio [summa] €

Hei [nimi],

[kuukausi] kumppanikoodillasi [koodi] tehtiin [tilauksia] tilausta. Provisio yhteensä: [summa] €.

[tilaukset: tilausnumero, päivä, tuotteiden arvo, provisio]

Tilitämme provision [maksutapa ja päivä, sovittu kumppanin kanssa]. Palautetuista ja perutuista tilauksista ei
makseta provisiota.

Terveisin
[allekirjoitus]

Raportin tiedot: cron `?tehtava=kumppanit&kuukausi=YYYY-MM` (kumppanit, tilaukset, provisio ja peruste).
