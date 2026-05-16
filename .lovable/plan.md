# Huumorikauppa.fi – optimointisuunnitelma

Pyyntö on todella laaja (kymmeniä tunteja työtä ja yli 20 tiedostoa). Jaan sen **6 vaiheeseen**, joista jokainen toimitetaan erikseen ja on itsenäisesti production-valmis. Aloitamme vaiheesta 1 vahvistuksesi jälkeen.

**Säilytetään ehdottomasti:** dark theme + neon-aksentit, fontit, hinnoittelutyyli, arvostelujen "aidot kirjoitusvirheet", Prerender.io-integraatio, hero-banneri, karusellit. (Mem://constraints/visual-integrity)

---

## Vaihe 1 — Äitienpäivä piiloon (säilytetään sivu)

- **Header.tsx / Footer.tsx**: poista äitienpäivä-linkit navigaatiosta ja footer-listasta.
- **Index.tsx**: poista mahdollinen äitienpäivä-bannerikomponentti / hero-CTA / kategoriatile.
- **CategoryPage.tsx, GiftCategoryPage.tsx, SEOKeywordContent.tsx, productCopy.ts**: poista kaudelliset äitienpäivä-CTA:t ja tekstipätkät, korvaa evergreen-fraaseilla ("hauska lahja naiselle", "syntymäpäivälahja").
- **App.tsx**: säilytä `/aitienpaiva` ja `/aitienpaiva-lahjat`-reitit (sivu pysyy indeksoitavissa).
- **MothersDayPage.tsx**: lisää `noindex` vain jos haluat (oletuksena säilytetään indeksoituna ensi vuotta varten).
- **sitemap.xml & supabase/functions/sitemap**: säilytä `/aitienpaiva`.
- **FAQ.tsx, blog.ts, situationGifts.ts, products.ts**: poista hero-mainokset / kausitagit ("äitienpäivätarjous"), säilytä historialliset blogiartikkelit.

## Vaihe 2 — SEO-perusta (technical SEO)

- **index.html**: tarkista title/description-pituudet, lisää `Store`-schemaan `openingHoursSpecification` ja `LocalBusiness`-fallback.
- **SEOHead.tsx**: laajenna tukemaan `Product`, `FAQPage`, `Article`, `BreadcrumbList` -schemoja ja `og:image` per route.
- **robots.txt**: korjaa duplikaattisisältö (tiedostossa on tällä hetkellä kaksi blokkia peräkkäin).
- **Per-route helmet**: varmista että jokainen sivu (FAQ, About, Contact, Category, Product, Blog, GiftCategory, Search, kaikki policy-sivut) asettaa uniikin `title`+`description`+`canonical`.
- **Breadcrumbs**: lisää näkyvät murupolut Category/Product/Blog-sivuille + BreadcrumbList JSON-LD.

## Vaihe 3 — GEO / AI-search -optimointi

- **FAQ.tsx**: laajenna 15→25 kysymykseen, FAQPage JSON-LD koko listalle.
- **Mini-FAQ-blokit**: lisää CategoryPage- ja ProductPage-pohjiin 3–5 kysymyksen FAQ JSON-LD:n kanssa.
- **Entity-rikastus**: Index- ja kategoriasivuille `Speakable`+`mainEntity`-rakenne, selkeät H2-otsikot ("Mitä huumorilahjat ovat?", "Mille tilanteille?").
- **llms.txt**: päivitä kategorialista, lisää aiheklusterit ("toimistohuumori", "nörttilahjat", "polttarilahjat").

## Vaihe 4 — Etusivun konversio + sisältö

- **Index.tsx**: hero-CTA + arvostelut + trust-badges + 3 trending-tuotetta + suosituimmat kategoriat + FAQ-snippet (5 kpl) + SEO-sisältöblokki + sisäiset linkit + bloghighlights + uutiskirje. Käytä olemassa olevaa dark-theme-tyyliä.
- **Sticky add-to-cart**: ProductPage mobiili.
- **Related products**: ProductPage-pohjaan (3–4 saman kategorian tuotetta).
- **Trust-elementit**: tilausvahvistuksessa ja checkoutissa (PostNord, 14 päivän palautus, suomalainen, SSL).

## Vaihe 5 — Suorituskyky

- **Code splitting**: tarkista että kaikki reitit ovat `lazy()`-ladattuja.
- **Image optimization**: varmista `OptimizedImage`-käyttö kaikissa karuselleissa, aseta `width`/`height` joka kuvalle CLS:n estämiseksi.
- **Preload**: vain LCP-hero (jo paikalla), poista turhat `preconnect`-tagit.
- **Bundle**: `manualChunks` Vitessä (vendor / router / supabase erikseen).
- **Critical CSS**: tarkista että Tailwind purge toimii.

## Vaihe 6 — Blogi + sisältöpyörät

Kirjoita 6 uutta täyspitkää (1500+ sanaa) SEO-blogia:
1. "Parhaat hauskat lahjat 2026 – 50 ideaa"
2. "Lahja ihmiselle jolla on jo kaikkea"
3. "Parhaat kahvimukit töihin"
4. "Toimiston hauskimmat lahjat"
5. "Parhaat meemilahjat suomalaisille"
6. "Suomalaiset huumorilahjat – käsikirja"

Sisäiset linkitykset toisiinsa + tuotekategorioihin, Article-schema, päivämäärät retroaktiivisesti.

---

## Tekninen huomio

- React-helmet-async on jo asennettu (mem://tech/stack).
- Käytössä on Prerender.io + Vercel Edge Middleware → meta-tagit pitää asettaa ennen `window.prerenderReady = true` -laukaisua.
- Visuaalista layoutia ei kosketa (vain SEO-/perf-/konversiomuutokset, jotka eivät muuta ulkoasua).
- En tee plain-text recapeja; jokaisen vaiheen lopussa kerron vain mitä testata.

**Aloitanko vaiheesta 1 (äitienpäivä piiloon) heti hyväksynnän jälkeen?**
