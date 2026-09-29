# Huumorikauppa.fi — Muutosraportti 2026-09-29

Tämä raportti kattaa tänään tehdyt muutokset ennen ja jälkeen -tilanteen sekä avoimet toimenpiteet.

---

## 1. Hintojen päivitys (VAIHE 3)

Vanhat hinnat tallennettu: `prices-before-2026-09-29.csv`

| Kategoria | Hinta ennen | Hinta nyt |
|---|---|---|
| T-paidat | 24,90 € | 34,90 € |
| Hupparit | 49,90 € | 64,90 € |
| Pitkähihaiset | 39,90 € | 39,90 € (ei muutos) |
| Bodyt | 24,90 € | 29,90 € |
| Mukit | ~22,95 € | min. 39,90 € |
| Pipot / lippikset | — | min. 32,90 € |
| Laukut / kassit | — | min. 32,90 € |
| Seinätaulut | — | min. 49,90 € |
| Peitot | — | min. 69,90 € |
| Koristeet | — | min. 24,90 € |
| Tarrat | — | min. 7,90 € |

Muutos vaikuttaa **uusiin synkronointeihin** Printifystä. Olemassa olevat tuotteet tietokannassa päivittyvät seuraavan sync-ajon yhteydessä tai kun ajat Supabasessa sync-printify-funktion.

---

## 2. Toimitusmaksun päivitys (VAIHE 4)

| | Ennen | Nyt |
|---|---|---|
| Toimitusmaksu | 3,90 € | 6,90 € |
| Ilmainen toimitus raja | 60 € | 79 € |

Päivitetty kohteissa:
- `supabase/functions/create-checkout/index.ts` (palvelinpuoli, autoritatiivinen)
- `src/pages/CartPage.tsx` ja `CheckoutPage.tsx` (UI-logiikka)
- `middleware.ts` (SEO-meta)
- `src/data/blog.ts`, `src/data/faq-data.ts`, `src/data/products.ts`, `src/data/professions.ts`, `src/data/situationGifts.ts`
- `src/pages/Index.tsx`, `CategoryPage.tsx`, `ProductPage.tsx`, `FAQ.tsx`, `Terms.tsx`, `AboutPage.tsx`, `AllProducts.tsx`, `BlogPost.tsx`, `GiftCategoryPage.tsx`, `HobbyPage.tsx`, `MothersDayPage.tsx`, `MunicipalityPage.tsx`, `ProfessionPage.tsx`, `SituationGiftPage.tsx`, `DialectPage.tsx`
- `src/components/layout/Header.tsx`, `Footer.tsx`, `ReviewsCarousel.tsx`, `GuideProductRecommendations.tsx`
- `src/lib/productCopy.ts`, `giftGuideContent.ts`

---

## 3. Vertailuhinnat poistettu (VAIHE 5 — Omnibus)

`src/hooks/use-products.ts`: `getOriginalPrice()` palauttaa nyt aina `undefined`.

Aiemmin funktio generoi väärennettyjä yliviivattuja hintoja (esim. t-paita "oli 34,90 €, nyt 24,90 €"). Omnibus-direktiivin mukaan vertailuhinta täytyy olla alin toteutunut myyntihinta viimeiseltä 30 päivältä — keksitty hinta on lainvastainen.

---

## 4. SEO-tarkistus (VAIHE 6)

Middleware toimii oikein: Googlebot-UA saa per-sivu canonical, title, description ja Product JSON-LD. Todettu toimivaksi aiemmassa sessiossa curl-testillä.

Middleware päivitetty:
- Homepage description: "Yli 200 tuotetta" → "Yli 700 tuotetta"
- Kaikki shipping-maininnat: 60 € → 79 €, 3,90 € → 6,90 €

---

## 5. Tekstikorjaukset (VAIHE 7)

- "Suomen johtava huumorilahjojen verkkokauppa" → "Suomen hauskin lahjakauppa" (oli jo muutettu)
- Tuotemäärä middleware.ts: "Yli 700 tuotetta" (Index.tsx laskee dynaamisesti tuotantokannan mukaan)
- Y-tunnus 3583677-2 löytyy Footer.tsx ja AboutPage.tsx — ok

---

## 6. Build & deploy

```
npm run build  →  ✓ built in 1.72s (33 tiedostoa muutettu)
git push origin main  →  ca193d1
```

Vercel deployaa automaattisesti main-haarasta.

---

## 7. Avoimet toimenpiteet

### Kriittinen: Supabase-migraatiot

Seuraavat sarakkeet puuttuvat tuotanto-DB:stä ja estävät Printify-syncin:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier text NOT NULL DEFAULT 'printify';
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_country text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS aliexpress_url text;
```

**Toimenpide:** Aja yllä oleva SQL Supabasen SQL-editorissa (supabase.com → SQL Editor).

### Tärkeä: Tuotteiden hinnat DB:ssä

Sync-logiikan uudet minimihinnat vaikuttavat **seuraavan synkronoinnin** jälkeen. Olemassa olevien tuotteiden hinnat DB:ssä eivät päivity automaattisesti — ne päivittyvät kun ajat sync-printify-funktion admin-paneelista.

### Stripe shipping rates

Jos Stripeen on luotu erillisiä "shipping rate" -objekteja (ei vain line item), ne pitää päivittää manuaalisesti Stripe-dashboardissa: 3,90 € → 6,90 €.

### Seuranta

- Tarkista Vercel-deployment Vercel-dashboardista
- Aja Printify-sync admin-paneelista migraatioiden jälkeen
- Tarkista muutama tuotesivu selaimessa (hinnat, toimitus, ei yliviivattuja hintoja)
