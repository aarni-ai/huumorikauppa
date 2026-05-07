# Huumorikauppa.fi – Finnish Backlink Strategy

_Documentation only. No runtime logic._

Goal: build a defensible backlink moat in Finland for the
"hauskat lahjat" niche, fueled by viral humor assets and
non-spammy outreach.

---

## A) Finnish backlink sources

### Lifestyle blogs (FI)
- Lily.fi (kolumnit, lifestyle)
- Olivia (lifestyle, lahjaideat)
- Trendi (nuoret aikuiset)
- Anna.fi (kotitalous, lahjat)
- Image (kulttuuri, huumori)

### Humor blogs / sites
- Aamulehti Moro (huumoripalsta)
- City-lehti
- Suomi Finland Perkele -tyyppiset meemiverkot
- Pieni paha susi -blogi
- Henkilökohtaiset huumoriblogit (etsi `humor blog finland`)

### Parenting blogs
- Vauva.fi
- Kaksplus
- Perheaikaa.fi
- Kotiliesi
- Yksittäiset äiti-/isäbloggaajat (esim. Pinkkuelämää, Isä Arska)

### Workplace / culture blogs
- Duunitori-blogi
- Monster.fi blogi
- Talouselämä työelämä-osio
- Kauppalehti Optio
- HR-konsulttien blogit (esim. Eezy, Barona)

### Reddit Finland communities
- r/Suomi
- r/arkisuomi
- r/Suomipelit (mukit/paidat lahjana)
- r/perakammari
- r/Helsinki, r/Tampere (kaupunkikohtaiset)

### Facebook groups
- "Lahjaideat Suomi"
- "Huumoria arkeen"
- "Työelämän vitsit"
- "Polttarit & häät Suomi"
- "Joululahjavinkit Suomi"

### TikTok / Instagram micro-influencers
- Hoitajat (esim. @sairaanhoitaja_arki)
- Opettajat (esim. @opettajanelama)
- Rakennusala
- Sauna- ja kalastusyhteisöt
- Stand-up koomikot (alle 50k seuraajaa)

---

## B) Linkable assets (5 viral)

1. **Workplace memes TOP 50**
   - URL: `/suomalaiset-tyopaikkameemit-top-50`
   - Format: list page, share + copy buttons, ItemList JSON-LD
   - Distribution: Reddit r/Suomi, Facebook työelämäryhmät, LinkedIn

2. **Printable office notes**
   - URL: `/hauskimmat-tyopaikkalaput-2026`
   - Format: tulostettavat post-it -vitsit kategorioittain
   - Distribution: HR-blogit, esimieskoulutusblogit, Pinterest

3. **Gift idea personality guides** _(roadmap)_
   - URL pattern: `/lahjaopas/persoonallisuus/:type`
   - Format: 8 persoonallisuustyyppiä × suositellut lahjat
   - Distribution: lifestyle-blogit, naistenlehdet, koulutusblogit

4. **Funny gift fail stories** _(roadmap)_
   - URL: `/blogi/lahjafailit-suomi`
   - Format: käyttäjien lähettämät epäonnistumistarinat + opetus
   - Distribution: Vauva.fi-keskustelut, Reddit r/Suomi, Iltalehti vinkit

5. **Seasonal gift hubs**
   - URLs: `/lahjat/joulu`, `/lahjat/isanpaiva`, `/lahjat/aitienpaiva`,
     `/lahjat/pikkujouluihin`, `/lahjat/ystavanpaiva`
   - Format: kausittain päivitettävä hub + FAQ + ItemList
   - Distribution: PR-pitch sesongin alussa (6 vk ennen)

---

## C) Outreach strategy

**Sävy:** rento, suomalainen, ei myyvä. Tarjoamme jaettavaa sisältöä,
emme tuotelinkkejä. Linkit syntyvät kun sisältö on aidosti hyvä.

### Template 1 – Meme list pitch (blog/Reddit moderator)

> Moi! Kasattiin tähän 50 osuvinta suomalaista työpaikkameemiä – aikalailla
> kaikki, mitä omassa toimistossa on viimeisen vuoden aikana kuultu.
>
> Linkki: https://huumorikauppa.fi/suomalaiset-tyopaikkameemit-top-50
>
> Ei painostusta jakaa, mutta jos osuu kohdalleen niin voi heittää eteenpäin.
> Palaute otetaan myös vastaan – mitä klassikkoja jäi puuttumaan?
>
> – [Etunimi], Huumorikauppa

### Template 2 – Lifestyle/parenting blog (gift guide swap)

> Hei [Etunimi],
>
> Luin sun [vuoden 2025 äitienpäiväpostauksen] ja tykkäsin etenkin
> [konkreettinen yksityiskohta]. Meiltä julkaistiin juuri päivitetty
> äitienpäivän lahjaopas, jossa on muutama selvästi erilainen idea kuin
> tyypillisissä listoissa. Voisin lähettää testituotteen, jos haluat
> tutustua tai mainita lyhyesti omassa postauksessa.
>
> Ei kiirettä, ja ihan ok jos ei sovi.
>
> Kiitos – [Etunimi], Huumorikauppa

### Template 3 – Micro-influencer collab

> Hei [Etunimi]!
>
> Seurattu sun sisältöjä jonkin aikaa – etenkin [konkreettinen viittaus]
> osui. Tehdään suomalaista huumoria t-paitoihin, mukeihin ja
> huppareihin, ja mietittiin että voitaisiinko lähettää sulle yksi
> tuote ihan vaan testattavaksi. Jaa Storyssa tai pidä omana – ei
> sopimusta, ei pakkoa.
>
> Jos kiinnostaa, vastaa pelkkä postiosoite niin lähetetään.
>
> – [Etunimi], Huumorikauppa

### Säännöt
- Aina henkilökohtainen aloitus (yksi konkreettinen viittaus)
- Ei "Dear Sir/Madam"
- Ei tuotelinkki ennen 2. viestiä
- Ei seuraa-uppia useammin kuin kerran
- Tarjoa aina jotakin (sisältö, tuote, datapointti)

---

## D) Viral loop system

### UX-komponentit (jo toteutettu)
- **Copy link button** — `/suomalaiset-tyopaikkameemit-top-50` ja
  `/hauskimmat-tyopaikkalaput-2026` käyttävät `navigator.clipboard`-fallbackia.
- **Share API fallback** — `navigator.share` ensisijaisena,
  clipboard toissijaisena. Toimii myös desktopissa.
- **Tulostus** — `/hauskimmat-tyopaikkalaput-2026` tukee `window.print`,
  `print:bg-white` -tyylit varmistavat selkeän tulosteen.

### CTA-blokit
- "Jaa kollegalle 😂"
- "Tunnistitko itsesi?"
- "Lähetä kaverille, joka tarvitsee tämän"
- "Tulosta toimiston jääkaappiin"

### Sisäinen ohjaus
Jokainen viraalisivu päättyy 4–6 sisäiseen linkkiin relevanteille
`/lahjat/*` -hubeille (ei tuotesivuille suoraan). Näin viraaliliikenne
muuttuu kaupallisiksi sessioiksi ilman aggressiivista myyntiä.

### Mittarit
| Metric | Tavoite Q1 | Tavoite Q4 |
|--------|-----------|-----------|
| Share-painike klikit / sivu / kk | 50 | 500 |
| Referring domains uusilta viraalisivuilta | +5 | +30 |
| Reddit/Facebook impressions | 5 000 | 50 000 |
| Viraalisivu → /lahjat/* CTR | 8 % | 15 % |