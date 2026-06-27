# Merkkipäivätuotteet – handoff-spec (DRAFT, hyväksyttäväksi)

Generoitu skriptillä. Slugit laskettu täsmälleen `printify-sync.ts`:n `slugify()`-logiikalla,
joten kun Printify-tuotenimi asetetaan sarakkeen **Printify-tuotenimi** mukaan, auto-sync tuottaa
täsmälleen sarakkeen **Slug** mukaisen URL:n (`huumorikauppa.fi/tuote/<slug>`).

**Työnkulku:** designit + tuotteet luodaan Printifyssä → pidetään **draftina** (ei julkaista) →
auto-sync tuo julkaistut Supabaseen → hyväksynnän jälkeen lisään opaslinkit.

- T-paita: 24,90 € · Huppari: 49,90 € · Muki: hinta Printifystä (ei kategoriaylikirjoitusta).
- Tuotteita yhteensä: 26 vitsiä × 3 tyyppiä = 78.


## Opas: lahja miehelle (30/40/50/60v)
→ linkitetään: `/blogi/lahja-miehelle-30v-40v-50v-60v`

| Painoteksti | Tyyppi | Printify-tuotenimi | Slug | SEO-title | Hinta |
|---|---|---|---|---|---|
| 30v – edelleen takuussa | T-paita | 30v – edelleen takuussa \| T-Paita | `30v-edelleen-takuussa-t-paita` | Hauska 30v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 30v – edelleen takuussa | Huppari | 30v – edelleen takuussa \| Huppari | `30v-edelleen-takuussa-huppari` | Hauska 30v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 30v – edelleen takuussa | Muki | 30v – edelleen takuussa \| Muki | `30v-edelleen-takuussa-muki` | Hauska 30v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| Level 30 – selka rusahtaa nyt | T-paita | Level 30 – selka rusahtaa nyt \| T-Paita | `level-30-selka-rusahtaa-nyt-t-paita` | Hauska 30v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| Level 30 – selka rusahtaa nyt | Huppari | Level 30 – selka rusahtaa nyt \| Huppari | `level-30-selka-rusahtaa-nyt-huppari` | Hauska 30v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| Level 30 – selka rusahtaa nyt | Muki | Level 30 – selka rusahtaa nyt \| Muki | `level-30-selka-rusahtaa-nyt-muki` | Hauska 30v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 30 ja liian vanha tyhmyyksiin (teen ne silti) | T-paita | 30 ja liian vanha tyhmyyksiin (teen ne silti) \| T-Paita | `30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita` | Hauska 30v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 30 ja liian vanha tyhmyyksiin (teen ne silti) | Huppari | 30 ja liian vanha tyhmyyksiin (teen ne silti) \| Huppari | `30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-huppari` | Hauska 30v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 30 ja liian vanha tyhmyyksiin (teen ne silti) | Muki | 30 ja liian vanha tyhmyyksiin (teen ne silti) \| Muki | `30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-muki` | Hauska 30v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 40v – kunto kuin 20v, 20 vuotta sitten | T-paita | 40v – kunto kuin 20v, 20 vuotta sitten \| T-Paita | `40v-kunto-kuin-20v-20-vuotta-sitten-t-paita` | Hauska 40v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 40v – kunto kuin 20v, 20 vuotta sitten | Huppari | 40v – kunto kuin 20v, 20 vuotta sitten \| Huppari | `40v-kunto-kuin-20v-20-vuotta-sitten-huppari` | Hauska 40v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 40v – kunto kuin 20v, 20 vuotta sitten | Muki | 40v – kunto kuin 20v, 20 vuotta sitten \| Muki | `40v-kunto-kuin-20v-20-vuotta-sitten-muki` | Hauska 40v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 40 vuotta, henkisesti 18 | T-paita | 40 vuotta, henkisesti 18 \| T-Paita | `40-vuotta-henkisesti-18-t-paita` | Hauska 40v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 40 vuotta, henkisesti 18 | Huppari | 40 vuotta, henkisesti 18 \| Huppari | `40-vuotta-henkisesti-18-huppari` | Hauska 40v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 40 vuotta, henkisesti 18 | Muki | 40 vuotta, henkisesti 18 \| Muki | `40-vuotta-henkisesti-18-muki` | Hauska 40v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 40v – ei keski-ika, klassikko | T-paita | 40v – ei keski-ika, klassikko \| T-Paita | `40v-ei-keski-ika-klassikko-t-paita` | Hauska 40v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 40v – ei keski-ika, klassikko | Huppari | 40v – ei keski-ika, klassikko \| Huppari | `40v-ei-keski-ika-klassikko-huppari` | Hauska 40v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 40v – ei keski-ika, klassikko | Muki | 40v – ei keski-ika, klassikko \| Muki | `40v-ei-keski-ika-klassikko-muki` | Hauska 40v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 50v – puoli vuosisataa, ei naarmuakaan | T-paita | 50v – puoli vuosisataa, ei naarmuakaan \| T-Paita | `50v-puoli-vuosisataa-ei-naarmuakaan-t-paita` | Hauska 50v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 50v – puoli vuosisataa, ei naarmuakaan | Huppari | 50v – puoli vuosisataa, ei naarmuakaan \| Huppari | `50v-puoli-vuosisataa-ei-naarmuakaan-huppari` | Hauska 50v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 50v – puoli vuosisataa, ei naarmuakaan | Muki | 50v – puoli vuosisataa, ei naarmuakaan \| Muki | `50v-puoli-vuosisataa-ei-naarmuakaan-muki` | Hauska 50v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 50 ja paras vasta tulossa | T-paita | 50 ja paras vasta tulossa \| T-Paita | `50-ja-paras-vasta-tulossa-t-paita` | Hauska 50v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 50 ja paras vasta tulossa | Huppari | 50 ja paras vasta tulossa \| Huppari | `50-ja-paras-vasta-tulossa-huppari` | Hauska 50v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 50 ja paras vasta tulossa | Muki | 50 ja paras vasta tulossa \| Muki | `50-ja-paras-vasta-tulossa-muki` | Hauska 50v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 60v – mutta fyysinen kunto kuin 20v | T-paita | 60v – mutta fyysinen kunto kuin 20v \| T-Paita | `60v-mutta-fyysinen-kunto-kuin-20v-t-paita` | Hauska 60v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 60v – mutta fyysinen kunto kuin 20v | Huppari | 60v – mutta fyysinen kunto kuin 20v \| Huppari | `60v-mutta-fyysinen-kunto-kuin-20v-huppari` | Hauska 60v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 60v – mutta fyysinen kunto kuin 20v | Muki | 60v – mutta fyysinen kunto kuin 20v \| Muki | `60v-mutta-fyysinen-kunto-kuin-20v-muki` | Hauska 60v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 60 vuotta nuori | T-paita | 60 vuotta nuori \| T-Paita | `60-vuotta-nuori-t-paita` | Hauska 60v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 60 vuotta nuori | Huppari | 60 vuotta nuori \| Huppari | `60-vuotta-nuori-huppari` | Hauska 60v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 60 vuotta nuori | Muki | 60 vuotta nuori \| Muki | `60-vuotta-nuori-muki` | Hauska 60v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |
| 60v – takuu mennyt, toimii silti | T-paita | 60v – takuu mennyt, toimii silti \| T-Paita | `60v-takuu-mennyt-toimii-silti-t-paita` | Hauska 60v lahja miehelle – T-paita \| Huumorikauppa | 24,90 € |
| 60v – takuu mennyt, toimii silti | Huppari | 60v – takuu mennyt, toimii silti \| Huppari | `60v-takuu-mennyt-toimii-silti-huppari` | Hauska 60v lahja miehelle – Huppari \| Huumorikauppa | 49,90 € |
| 60v – takuu mennyt, toimii silti | Muki | 60v – takuu mennyt, toimii silti \| Muki | `60v-takuu-mennyt-toimii-silti-muki` | Hauska 60v lahja miehelle – Muki \| Huumorikauppa | Printify-maarainen |

## Opas: lahja naiselle (30/40/50/60v)
→ linkitetään: `/blogi/lahja-naiselle-30v-40v-50v-60v`

| Painoteksti | Tyyppi | Printify-tuotenimi | Slug | SEO-title | Hinta |
|---|---|---|---|---|---|
| 30 ja loistossaan | T-paita | 30 ja loistossaan \| T-Paita | `30-ja-loistossaan-t-paita` | Hauska 30v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 30 ja loistossaan | Huppari | 30 ja loistossaan \| Huppari | `30-ja-loistossaan-huppari` | Hauska 30v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 30 ja loistossaan | Muki | 30 ja loistossaan \| Muki | `30-ja-loistossaan-muki` | Hauska 30v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 30v – paranen ian myota kuin viini | T-paita | 30v – paranen ian myota kuin viini \| T-Paita | `30v-paranen-ian-myota-kuin-viini-t-paita` | Hauska 30v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 30v – paranen ian myota kuin viini | Huppari | 30v – paranen ian myota kuin viini \| Huppari | `30v-paranen-ian-myota-kuin-viini-huppari` | Hauska 30v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 30v – paranen ian myota kuin viini | Muki | 30v – paranen ian myota kuin viini \| Muki | `30v-paranen-ian-myota-kuin-viini-muki` | Hauska 30v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 40v – henkisesti 18, tyylilla 40 | T-paita | 40v – henkisesti 18, tyylilla 40 \| T-Paita | `40v-henkisesti-18-tyylilla-40-t-paita` | Hauska 40v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 40v – henkisesti 18, tyylilla 40 | Huppari | 40v – henkisesti 18, tyylilla 40 \| Huppari | `40v-henkisesti-18-tyylilla-40-huppari` | Hauska 40v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 40v – henkisesti 18, tyylilla 40 | Muki | 40v – henkisesti 18, tyylilla 40 \| Muki | `40v-henkisesti-18-tyylilla-40-muki` | Hauska 40v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 40 ja fabulous | T-paita | 40 ja fabulous \| T-Paita | `40-ja-fabulous-t-paita` | Hauska 40v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 40 ja fabulous | Huppari | 40 ja fabulous \| Huppari | `40-ja-fabulous-huppari` | Hauska 40v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 40 ja fabulous | Muki | 40 ja fabulous \| Muki | `40-ja-fabulous-muki` | Hauska 40v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 40v – ei vanha, vintage | T-paita | 40v – ei vanha, vintage \| T-Paita | `40v-ei-vanha-vintage-t-paita` | Hauska 40v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 40v – ei vanha, vintage | Huppari | 40v – ei vanha, vintage \| Huppari | `40v-ei-vanha-vintage-huppari` | Hauska 40v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 40v – ei vanha, vintage | Muki | 40v – ei vanha, vintage \| Muki | `40v-ei-vanha-vintage-muki` | Hauska 40v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 50 vuotta harjoittelua – nyt vasta hyva | T-paita | 50 vuotta harjoittelua – nyt vasta hyva \| T-Paita | `50-vuotta-harjoittelua-nyt-vasta-hyva-t-paita` | Hauska 50v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 50 vuotta harjoittelua – nyt vasta hyva | Huppari | 50 vuotta harjoittelua – nyt vasta hyva \| Huppari | `50-vuotta-harjoittelua-nyt-vasta-hyva-huppari` | Hauska 50v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 50 vuotta harjoittelua – nyt vasta hyva | Muki | 50 vuotta harjoittelua – nyt vasta hyva \| Muki | `50-vuotta-harjoittelua-nyt-vasta-hyva-muki` | Hauska 50v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 50 ja hopeanhohtoinen (vain hiukset) | T-paita | 50 ja hopeanhohtoinen (vain hiukset) \| T-Paita | `50-ja-hopeanhohtoinen-vain-hiukset-t-paita` | Hauska 50v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 50 ja hopeanhohtoinen (vain hiukset) | Huppari | 50 ja hopeanhohtoinen (vain hiukset) \| Huppari | `50-ja-hopeanhohtoinen-vain-hiukset-huppari` | Hauska 50v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 50 ja hopeanhohtoinen (vain hiukset) | Muki | 50 ja hopeanhohtoinen (vain hiukset) \| Muki | `50-ja-hopeanhohtoinen-vain-hiukset-muki` | Hauska 50v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 50v – klassikkomalli | T-paita | 50v – klassikkomalli \| T-Paita | `50v-klassikkomalli-t-paita` | Hauska 50v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 50v – klassikkomalli | Huppari | 50v – klassikkomalli \| Huppari | `50v-klassikkomalli-huppari` | Hauska 50v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 50v – klassikkomalli | Muki | 50v – klassikkomalli \| Muki | `50v-klassikkomalli-muki` | Hauska 50v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 60v – mutta sydan kuin 20v | T-paita | 60v – mutta sydan kuin 20v \| T-Paita | `60v-mutta-sydan-kuin-20v-t-paita` | Hauska 60v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 60v – mutta sydan kuin 20v | Huppari | 60v – mutta sydan kuin 20v \| Huppari | `60v-mutta-sydan-kuin-20v-huppari` | Hauska 60v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 60v – mutta sydan kuin 20v | Muki | 60v – mutta sydan kuin 20v \| Muki | `60v-mutta-sydan-kuin-20v-muki` | Hauska 60v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 60 vuotta nuori ja nokkela | T-paita | 60 vuotta nuori ja nokkela \| T-Paita | `60-vuotta-nuori-ja-nokkela-t-paita` | Hauska 60v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 60 vuotta nuori ja nokkela | Huppari | 60 vuotta nuori ja nokkela \| Huppari | `60-vuotta-nuori-ja-nokkela-huppari` | Hauska 60v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 60 vuotta nuori ja nokkela | Muki | 60 vuotta nuori ja nokkela \| Muki | `60-vuotta-nuori-ja-nokkela-muki` | Hauska 60v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |
| 60v – kokenut, ei vanha | T-paita | 60v – kokenut, ei vanha \| T-Paita | `60v-kokenut-ei-vanha-t-paita` | Hauska 60v lahja naiselle – T-paita \| Huumorikauppa | 24,90 € |
| 60v – kokenut, ei vanha | Huppari | 60v – kokenut, ei vanha \| Huppari | `60v-kokenut-ei-vanha-huppari` | Hauska 60v lahja naiselle – Huppari \| Huumorikauppa | 49,90 € |
| 60v – kokenut, ei vanha | Muki | 60v – kokenut, ei vanha \| Muki | `60v-kokenut-ei-vanha-muki` | Hauska 60v lahja naiselle – Muki \| Huumorikauppa | Printify-maarainen |

## Opas: hauskat eläkelahjat
→ linkitetään: `/blogi/hauskat-elakelahjat-opas`

| Painoteksti | Tyyppi | Printify-tuotenimi | Slug | SEO-title | Hinta |
|---|---|---|---|---|---|
| Elakkeella – kiireinen tekemaan ei mitaan | T-paita | Elakkeella – kiireinen tekemaan ei mitaan \| T-Paita | `elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita` | Hauska elakelahja – T-paita \| Huumorikauppa | 24,90 € |
| Elakkeella – kiireinen tekemaan ei mitaan | Huppari | Elakkeella – kiireinen tekemaan ei mitaan \| Huppari | `elakkeella-kiireinen-tekemaan-ei-mitaan-huppari` | Hauska elakelahja – Huppari \| Huumorikauppa | 49,90 € |
| Elakkeella – kiireinen tekemaan ei mitaan | Muki | Elakkeella – kiireinen tekemaan ei mitaan \| Muki | `elakkeella-kiireinen-tekemaan-ei-mitaan-muki` | Hauska elakelahja – Muki \| Huumorikauppa | Printify-maarainen |
| Virallisesti tyoton, epavirallisesti vapaa | T-paita | Virallisesti tyoton, epavirallisesti vapaa \| T-Paita | `virallisesti-tyoton-epavirallisesti-vapaa-t-paita` | Hauska elakelahja – T-paita \| Huumorikauppa | 24,90 € |
| Virallisesti tyoton, epavirallisesti vapaa | Huppari | Virallisesti tyoton, epavirallisesti vapaa \| Huppari | `virallisesti-tyoton-epavirallisesti-vapaa-huppari` | Hauska elakelahja – Huppari \| Huumorikauppa | 49,90 € |
| Virallisesti tyoton, epavirallisesti vapaa | Muki | Virallisesti tyoton, epavirallisesti vapaa \| Muki | `virallisesti-tyoton-epavirallisesti-vapaa-muki` | Hauska elakelahja – Muki \| Huumorikauppa | Printify-maarainen |
| 40 vuotta toita, nyt ikuinen viikonloppu | T-paita | 40 vuotta toita, nyt ikuinen viikonloppu \| T-Paita | `40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita` | Hauska elakelahja – T-paita \| Huumorikauppa | 24,90 € |
| 40 vuotta toita, nyt ikuinen viikonloppu | Huppari | 40 vuotta toita, nyt ikuinen viikonloppu \| Huppari | `40-vuotta-toita-nyt-ikuinen-viikonloppu-huppari` | Hauska elakelahja – Huppari \| Huumorikauppa | 49,90 € |
| 40 vuotta toita, nyt ikuinen viikonloppu | Muki | 40 vuotta toita, nyt ikuinen viikonloppu \| Muki | `40-vuotta-toita-nyt-ikuinen-viikonloppu-muki` | Hauska elakelahja – Muki \| Huumorikauppa | Printify-maarainen |
| Elakelainen – aamuheratys vapaaehtoinen | T-paita | Elakelainen – aamuheratys vapaaehtoinen \| T-Paita | `elakelainen-aamuheratys-vapaaehtoinen-t-paita` | Hauska elakelahja – T-paita \| Huumorikauppa | 24,90 € |
| Elakelainen – aamuheratys vapaaehtoinen | Huppari | Elakelainen – aamuheratys vapaaehtoinen \| Huppari | `elakelainen-aamuheratys-vapaaehtoinen-huppari` | Hauska elakelahja – Huppari \| Huumorikauppa | 49,90 € |
| Elakelainen – aamuheratys vapaaehtoinen | Muki | Elakelainen – aamuheratys vapaaehtoinen \| Muki | `elakelainen-aamuheratys-vapaaehtoinen-muki` | Hauska elakelahja – Muki \| Huumorikauppa | Printify-maarainen |

## SEO-meta descriptions (per tuote)

- **30v-edelleen-takuussa-t-paita**: 30v – edelleen takuussa – hauska 30-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30v-edelleen-takuussa-huppari**: 30v – edelleen takuussa – hauska 30-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30v-edelleen-takuussa-muki**: 30v – edelleen takuussa – hauska 30-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **level-30-selka-rusahtaa-nyt-t-paita**: Level 30 – selka rusahtaa nyt – hauska 30-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **level-30-selka-rusahtaa-nyt-huppari**: Level 30 – selka rusahtaa nyt – hauska 30-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **level-30-selka-rusahtaa-nyt-muki**: Level 30 – selka rusahtaa nyt – hauska 30-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita**: 30 ja liian vanha tyhmyyksiin (teen ne silti) – hauska 30-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-huppari**: 30 ja liian vanha tyhmyyksiin (teen ne silti) – hauska 30-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-muki**: 30 ja liian vanha tyhmyyksiin (teen ne silti) – hauska 30-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-kunto-kuin-20v-20-vuotta-sitten-t-paita**: 40v – kunto kuin 20v, 20 vuotta sitten – hauska 40-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-kunto-kuin-20v-20-vuotta-sitten-huppari**: 40v – kunto kuin 20v, 20 vuotta sitten – hauska 40-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-kunto-kuin-20v-20-vuotta-sitten-muki**: 40v – kunto kuin 20v, 20 vuotta sitten – hauska 40-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-vuotta-henkisesti-18-t-paita**: 40 vuotta, henkisesti 18 – hauska 40-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-vuotta-henkisesti-18-huppari**: 40 vuotta, henkisesti 18 – hauska 40-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-vuotta-henkisesti-18-muki**: 40 vuotta, henkisesti 18 – hauska 40-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-ei-keski-ika-klassikko-t-paita**: 40v – ei keski-ika, klassikko – hauska 40-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-ei-keski-ika-klassikko-huppari**: 40v – ei keski-ika, klassikko – hauska 40-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-ei-keski-ika-klassikko-muki**: 40v – ei keski-ika, klassikko – hauska 40-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50v-puoli-vuosisataa-ei-naarmuakaan-t-paita**: 50v – puoli vuosisataa, ei naarmuakaan – hauska 50-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50v-puoli-vuosisataa-ei-naarmuakaan-huppari**: 50v – puoli vuosisataa, ei naarmuakaan – hauska 50-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50v-puoli-vuosisataa-ei-naarmuakaan-muki**: 50v – puoli vuosisataa, ei naarmuakaan – hauska 50-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-ja-paras-vasta-tulossa-t-paita**: 50 ja paras vasta tulossa – hauska 50-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-ja-paras-vasta-tulossa-huppari**: 50 ja paras vasta tulossa – hauska 50-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-ja-paras-vasta-tulossa-muki**: 50 ja paras vasta tulossa – hauska 50-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-mutta-fyysinen-kunto-kuin-20v-t-paita**: 60v – mutta fyysinen kunto kuin 20v – hauska 60-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-mutta-fyysinen-kunto-kuin-20v-huppari**: 60v – mutta fyysinen kunto kuin 20v – hauska 60-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-mutta-fyysinen-kunto-kuin-20v-muki**: 60v – mutta fyysinen kunto kuin 20v – hauska 60-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60-vuotta-nuori-t-paita**: 60 vuotta nuori – hauska 60-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60-vuotta-nuori-huppari**: 60 vuotta nuori – hauska 60-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60-vuotta-nuori-muki**: 60 vuotta nuori – hauska 60-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-takuu-mennyt-toimii-silti-t-paita**: 60v – takuu mennyt, toimii silti – hauska 60-vuotislahja miehelle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-takuu-mennyt-toimii-silti-huppari**: 60v – takuu mennyt, toimii silti – hauska 60-vuotislahja miehelle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-takuu-mennyt-toimii-silti-muki**: 60v – takuu mennyt, toimii silti – hauska 60-vuotislahja miehelle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30-ja-loistossaan-t-paita**: 30 ja loistossaan – hauska 30-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30-ja-loistossaan-huppari**: 30 ja loistossaan – hauska 30-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30-ja-loistossaan-muki**: 30 ja loistossaan – hauska 30-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30v-paranen-ian-myota-kuin-viini-t-paita**: 30v – paranen ian myota kuin viini – hauska 30-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30v-paranen-ian-myota-kuin-viini-huppari**: 30v – paranen ian myota kuin viini – hauska 30-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **30v-paranen-ian-myota-kuin-viini-muki**: 30v – paranen ian myota kuin viini – hauska 30-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-henkisesti-18-tyylilla-40-t-paita**: 40v – henkisesti 18, tyylilla 40 – hauska 40-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-henkisesti-18-tyylilla-40-huppari**: 40v – henkisesti 18, tyylilla 40 – hauska 40-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-henkisesti-18-tyylilla-40-muki**: 40v – henkisesti 18, tyylilla 40 – hauska 40-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-ja-fabulous-t-paita**: 40 ja fabulous – hauska 40-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-ja-fabulous-huppari**: 40 ja fabulous – hauska 40-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-ja-fabulous-muki**: 40 ja fabulous – hauska 40-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-ei-vanha-vintage-t-paita**: 40v – ei vanha, vintage – hauska 40-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-ei-vanha-vintage-huppari**: 40v – ei vanha, vintage – hauska 40-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40v-ei-vanha-vintage-muki**: 40v – ei vanha, vintage – hauska 40-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-vuotta-harjoittelua-nyt-vasta-hyva-t-paita**: 50 vuotta harjoittelua – nyt vasta hyva – hauska 50-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-vuotta-harjoittelua-nyt-vasta-hyva-huppari**: 50 vuotta harjoittelua – nyt vasta hyva – hauska 50-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-vuotta-harjoittelua-nyt-vasta-hyva-muki**: 50 vuotta harjoittelua – nyt vasta hyva – hauska 50-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-ja-hopeanhohtoinen-vain-hiukset-t-paita**: 50 ja hopeanhohtoinen (vain hiukset) – hauska 50-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-ja-hopeanhohtoinen-vain-hiukset-huppari**: 50 ja hopeanhohtoinen (vain hiukset) – hauska 50-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50-ja-hopeanhohtoinen-vain-hiukset-muki**: 50 ja hopeanhohtoinen (vain hiukset) – hauska 50-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50v-klassikkomalli-t-paita**: 50v – klassikkomalli – hauska 50-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50v-klassikkomalli-huppari**: 50v – klassikkomalli – hauska 50-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **50v-klassikkomalli-muki**: 50v – klassikkomalli – hauska 50-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-mutta-sydan-kuin-20v-t-paita**: 60v – mutta sydan kuin 20v – hauska 60-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-mutta-sydan-kuin-20v-huppari**: 60v – mutta sydan kuin 20v – hauska 60-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-mutta-sydan-kuin-20v-muki**: 60v – mutta sydan kuin 20v – hauska 60-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60-vuotta-nuori-ja-nokkela-t-paita**: 60 vuotta nuori ja nokkela – hauska 60-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60-vuotta-nuori-ja-nokkela-huppari**: 60 vuotta nuori ja nokkela – hauska 60-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60-vuotta-nuori-ja-nokkela-muki**: 60 vuotta nuori ja nokkela – hauska 60-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-kokenut-ei-vanha-t-paita**: 60v – kokenut, ei vanha – hauska 60-vuotislahja naiselle. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-kokenut-ei-vanha-huppari**: 60v – kokenut, ei vanha – hauska 60-vuotislahja naiselle. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **60v-kokenut-ei-vanha-muki**: 60v – kokenut, ei vanha – hauska 60-vuotislahja naiselle. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita**: Elakkeella – kiireinen tekemaan ei mitaan – hauska elakelahja. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **elakkeella-kiireinen-tekemaan-ei-mitaan-huppari**: Elakkeella – kiireinen tekemaan ei mitaan – hauska elakelahja. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **elakkeella-kiireinen-tekemaan-ei-mitaan-muki**: Elakkeella – kiireinen tekemaan ei mitaan – hauska elakelahja. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **virallisesti-tyoton-epavirallisesti-vapaa-t-paita**: Virallisesti tyoton, epavirallisesti vapaa – hauska elakelahja. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **virallisesti-tyoton-epavirallisesti-vapaa-huppari**: Virallisesti tyoton, epavirallisesti vapaa – hauska elakelahja. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **virallisesti-tyoton-epavirallisesti-vapaa-muki**: Virallisesti tyoton, epavirallisesti vapaa – hauska elakelahja. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita**: 40 vuotta toita, nyt ikuinen viikonloppu – hauska elakelahja. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-vuotta-toita-nyt-ikuinen-viikonloppu-huppari**: 40 vuotta toita, nyt ikuinen viikonloppu – hauska elakelahja. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **40-vuotta-toita-nyt-ikuinen-viikonloppu-muki**: 40 vuotta toita, nyt ikuinen viikonloppu – hauska elakelahja. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **elakelainen-aamuheratys-vapaaehtoinen-t-paita**: Elakelainen – aamuheratys vapaaehtoinen – hauska elakelahja. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **elakelainen-aamuheratys-vapaaehtoinen-huppari**: Elakelainen – aamuheratys vapaaehtoinen – hauska elakelahja. pehmea puuvilla-polyesterisekoite. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
- **elakelainen-aamuheratys-vapaaehtoinen-muki**: Elakelainen – aamuheratys vapaaehtoinen – hauska elakelahja. 11 oz keraaminen muki. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.
