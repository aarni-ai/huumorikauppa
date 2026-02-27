
# Huumorikauppa.fi – Suomen hauskin verkkokauppa 🚀😂

## Vaihe 1: Design System & Layout
- Tumma teema (#0a0a0a pohja) + neon-aksentit (lime, hot-pink, cyan)
- Impact/Anton otsikkofontti + Inter body-fontti (min 16px)
- Custom komponentit: MemeButton, ProductCard, TrustBadge, CategoryCard
- Header: logo, hakupalkki, kategoriat-navigaatio, ostoskori-ikoni (kelluva badge)
- Footer: yhteystiedot, FAQ-linkki, some-linkit, newsletter, luottamusmerkit
- Trust-banneri joka sivulla: "Ilmainen toimitus yli 60€", "14pv palautus", "Suomalainen perheyritys"
- Cookie consent -banneri (GDPR)

## Vaihe 2: Supabase-tietokanta & Auth
- **products**-taulu: id, name, slug, category, price, stock, description, images[], variants (koko/väri JSON)
- **orders**-taulu: id, user_id (nullable), items (JSON), total, status, stripe_session_id, created_at
- **user_roles**-taulu: user_id, role (admin/user) – erillinen taulu turvallisuussyistä
- RLS: tuotteet julkisia, tilaukset vain omat, admin näkee kaikki (has_role-funktio)
- Supabase Auth: rekisteröityminen + kirjautuminen
- Supabase Storage: tuotekuvat

## Vaihe 3: Etusivu
- Hero-banneri: "Hauskimmat meemit nyt paidassa, housuissa ja mukissa 😂" + CTA "Selaa tuotteita"
- Featured/bestsellerit-ruudukko (4 tuotetta)
- Uutuudet-karuselli
- Kategoriakortit isoina (T-paidat, Housut, Mukit, Tarrat, Digitaaliset meemit, Hupparit)
- "Miksi Huumorikauppa?" -osio hauskoin ikonein: "Yli 2000 tyytyväistä setää", "Naapurit kateellisia", "Mummokin tilasi mukin"
- Newsletter-osio: "Tilaa ja saat 10% koodin + viikoittaisen meemi-iskun"

## Vaihe 4: Tuoteselaus & Kategoriasivut
- Ruudukko: 2 saraketta mobiili, 4 desktop
- Suodattimet: hinta, väri, koko, huumorityyppi (Setähuumori / Äitihuumori / Perusmulkku)
- Hakutoiminto yläpalkissa
- "Näytä kaikki" -napit per kategoria
- 15–20 esimerkkituotetta kaikista kategorioista (mock-kuvat placeholder.svg:llä)

## Vaihe 5: Tuotesivu
- Iso tuotekuva + kuvakaruselli (zoom)
- Hauska, sarkastinen tuotekuvaus
- Hinta, koko/väri-valinnat
- Varastosaldo: "Vain 3 jäljellä – tilaa nyt tai itke myöhemmin 😭"
- Iso vihreä "Lisää koriin" -nappi
- Koko-opas (cm-taulukko) vaatteille
- "Lahjaidea?" -badge + lahjapaperi-optio
- Jako-napit: WhatsApp, Facebook, kopioi linkki
- Trust-signaalit

## Vaihe 6: Ostoskori
- Kelluva ostoskori-ikoni (kuten Sneak.fi)
- Tallentuu localStorage + synkronoituu Supabaseen kirjautuneille
- Slide-over panel tuotteineen, määrä +/-, poista
- "Jatka kassalle" iso nappi
- Alennuskoodi-kenttä

## Vaihe 7: Kassa & Stripe-maksu
- 3-vaiheinen checkout: Tiedot → Toimitus → Maksu
- Guest checkout + kirjautumisvaihtoehto
- Stripe Checkout -integraatio (Lovable Stripe -työkalu)
- Idempotentti (ei tuplamaksuja)
- Selkeät virheilmoitukset suomeksi
- Loading-spinnerit joka vaiheessa

## Vaihe 8: Tilauksen jälkeen & Extra
- Kiitossivu hauskalla viestillä + "Jaa tilaus kaverille 😂"
- "Seuraa tilaustasi" -linkki
- FAQ-sivu accordion-komponentilla (hauskat vastaukset)
- Toimitusehdot & tietosuojakäytäntö -sivut (virallinen suomi)
- SEO meta-tagit suomeksi
- Yhteydenotto-osio: puhelin, email

## Mock-tuotteet (15–20kpl, kaikki suomeksi)
Esimerkkejä per kategoria:
- T-paidat: "Oispa kaljaa", "Setämies loading...", "Äiti tietää parhaiten (paitsi Googlessa)", "Perusmulkku Premium Edition"
- Housut: "Netflix & Chill -colleget", "Sohvaperunan virallinen univormu"
- Mukit: "Kahvia ja katkeruutta", "Pomo vuoden – itseni", "En ole aamuilhminen"
- Tarrat: "Setähuumori Starter Pack", "Passiivis-aggressiivinen tarrapaketti"
- Digitaaliset: "Meemipaketti – 50 parasta setämeemiä"
