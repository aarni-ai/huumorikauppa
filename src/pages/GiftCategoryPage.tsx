import { useLocation, Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { blogPosts } from "@/data/blog";
import { useProducts } from "@/hooks/use-products";
import { SEOGiftContent, SEOTargetGroupContent, SEOLongTailContent } from "@/components/SEOKeywordContent";

interface GiftCategory {
  slug: string;
  name: string;
  emoji: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  filterFn: (product: { name: string; description: string; category: string }) => boolean;
  seoText: string;
  relatedBlogSlugs: string[];
}

const giftCategories: GiftCategory[] = [
  {
    slug: "hauskat-lahjat-miehelle",
    name: "Hauskat Lahjat Miehelle",
    emoji: "🎁",
    h1: "Hauskat Lahjat Miehelle",
    seoTitle: "Hauskat lahjat miehelle – Parhaat ideat | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat miehelle – Ideat joita hän ei odota! T-paidat, mukit ja paljon muuta. 🎯",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("isä") || t.includes("iskä") || t.includes("mies") ||
        t.includes("setä") || t.includes("amatimies") || t.includes("kalamies") ||
        t.includes("kalastus") || t.includes("eläke") || t.includes("museo") ||
        t.includes("kalju") || t.includes("paras isä") ||
        p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit"
      );
    },
    seoText: `## Hauskat lahjat miehelle – lahjaideat isälle, kaverille ja aviomiehelle

Miehelle lahjan ostaminen on tunnetusti vaikeaa – mutta hauska lahja on aina oikea valinta. Se naurattaa, ilahduttaa ja tulee oikeasti käyttöön. Huumorikaupan valikoimasta löydät satoja hauskoja tuotteita miehille: t-paitoja, huppareita, mukeja ja paljon muuta.

## Hauska lahja miehelle ikävuosittain

**Lahja miehelle 30v** – Meemipaidat, sarkasmipaidat ja hauskat mukit sopivat 30-vuotiaalle miehelle joka arvostaa internet-huumoria ja itseironiaa.

**Lahja miehelle 40v** – Setähuumoripaidat alkavat puhutella 40-vuotiasta miestä. Kalastuspaidat, ammattihuumoripaidat ja "elämäni parhaassa iässä" -hupparit ovat hyviä valintoja.

**Lahja miehelle 50v** – "Museo-kappale" -paidat, eläkkeelle valmistautumishuumori ja harrastusaiheiset paidat ovat täydellisiä 50-vuotiaalle.

**Lahja miehelle 60v** – Eläkeläishuumori on kuningas! "Eläkkeellä ja nautinnossa" -tuotteet ja mukavat peitot sohvalle ovat suosituimpia.

## Suosituimmat lahjat miehelle

Kalastuspaidat, setähuumoripaidat ja eläkeläishuumoripaidat ovat suosituimpia lahjojamme miehille. Ne sopivat isälle, kaverille, aviomiehelle, veljelle ja sedälle.

## Lahja miehelle jolla on jo kaikkea

Miehelle jolla on jo kaikkea, hauska paita tai muki on täydellinen lahja – se on jotain mitä hänellä ei varmasti vielä ole. Persoonallinen huumori tekee lahjasta erityisen.

## Miksi tilata Huumorikaupasta?

- Ilmainen toimitus yli 60 € tilauksiin
- 14 päivän palautusoikeus
- 3–7 arkipäivän toimitus koko Suomeen
- 100% suomalainen yritys`,
    relatedBlogSlugs: ["parhaat-hauskat-lahjat-miehelle", "hauskat-isanpaivalahjat-opas", "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea", "lahja-miehelle-30v-40v-50v-60v"],
  },
  {
    slug: "hauskat-lahjat-naiselle",
    name: "Hauskat Lahjat Naiselle",
    emoji: "💝",
    h1: "Hauskat Lahjat Naiselle",
    seoTitle: "Hauskat lahjat naiselle – Ideat joita hän ei odota | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat naiselle – Persoonalliset ideat kaikille naisille. Nopea toimitus. 🌸",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("äiti") || t.includes("nainen") || t.includes("naiselle") ||
        t.includes("maailman paras äiti") || t.includes("viini") ||
        p.category === "hupparit" || p.category === "mukit" || p.category === "laukut"
      );
    },
    seoText: `## Hauskat lahjat naiselle – lahjaideat äidille, ystävälle ja puolisolle

Hauska lahja naiselle on raikas vaihtoehto kukille ja suklaalle. Se osoittaa persoonallisuutta ja huumorintajua – ominaisuuksia joita jokainen nainen arvostaa lahjan antajassa.

## Hauska lahja naiselle ikävuosittain

**Lahja naiselle 30v** – Meemihupparit, hauskat kangaskassit ja söpöt kahvimukit sopivat 30-vuotiaalle naiselle. Itseironia ja arjen huumori puhuttelevat.

**Lahja naiselle 40v** – "Maailman paras äiti" -tuotteet, viinihuumorimukit ja rennot huumorihupparit ovat suosituimpia 40-vuotiaan naisen lahjoja.

**Lahja naiselle 50v** – Laadukkaat peitot, söpöt seinätaulut ja premium-hupparit ilahduttavat 50-vuotiasta naista.

**Lahja naiselle 60v** – Eläkeläishuumorituotteet, mukavat peitot ja lämpimät hupparit ovat täydellisiä 60-vuotiaalle.

## Suosituimmat lahjat naiselle

"Maailman paras äiti" -hupparit, söpöt huumorimukit ja hauskat kangaskassit ovat suosituimpia lahjojamme naisille. Ne sopivat äidille, ystävälle, siskolle, puolisolle ja työkavereille.

## Miksi tilata Huumorikaupasta?

- Ilmainen toimitus yli 60 € tilauksiin
- 14 päivän palautusoikeus
- 3–7 arkipäivän toimitus koko Suomeen
- Lahjapaketointimahdollisuus`,
    relatedBlogSlugs: ["hauskat-lahjat-naiselle-opas", "hauska-aitienpaivalahja-opas", "lahja-naiselle-30v-40v-50v-60v"],
  },
  {
    slug: "polttari-lahjat",
    name: "Polttarilahjat & Polttaripaidat",
    emoji: "🎉",
    h1: "Polttarilahjat & Polttaripaidat",
    seoTitle: "Polttarilahjat – Hauskat ideat morsiamelle ja sulhaselle | Huumorikauppa.fi",
    seoDescription: "Parhaat polttarilahjat morsiamelle ja sulhaselle! Hauskat ja muistamattomat ideat. Toimitus nopeasti. 🥂",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("polttari") || t.includes("sulhanen") || t.includes("morsian") ||
        t.includes("bride") || t.includes("game over") ||
        p.category === "t-paidat" || p.category === "hupparit"
      );
    },
    seoText: `## Polttarilahjat ja polttaripaidat – tilaa ryhmälle

Polttarit ovat ikimuistoinen juhla, ja polttaripaidat tekevät niistä vieläkin hauskemmat. Yhtenäiset paidat ryhmälle yhdistävät porukan, naurattavat ohikulkijoita ja jäävät muistoksi.

## Polttaripaidat miesten polttareihin 🤵

Sulhasen paita, bestmanin paita ja ryhmän paidat – tilaa koko porukalle yhtenäiset polttaripaidat. Suosittuja tekstejä: "Game Over", "Viimeinen vapaa ilta" ja "[Nimi]:n polttarit 2026".

## Polttaripaidat naisten polttareihin 👰

Morsiamen paita, kaason paidat ja "Team Bride" -paidat. Morsiamen paita erottuu usein värillä – valkoinen tai kultainen on klassikko.

## Polttarilahjat sulhaselle ja morsiamelle

Polttaripaitojen lisäksi löydät meiltä hauskoja polttarilahjoja: mukeja, huppareita ja tarroja.

## Tilaa polttaripaidat Huumorikaupasta

- Ilmainen toimitus yli 60 € tilauksiin
- 3–7 arkipäivän toimitus
- Ryhmätilaukset helposti – lisää eri koot koriin`,
    relatedBlogSlugs: ["parhaat-polttaripaidat-ja-polttarilahjat-2026"],
  },
  {
    slug: "isanpaiva-lahjat",
    name: "Isänpäivälahjat",
    emoji: "👨",
    h1: "Hauskat Isänpäivälahjat",
    seoTitle: "Isänpäivälahjat – 20 hauskaa lahjaa isälle | Huumorikauppa.fi",
    seoDescription: "Mitä antaa isälle? 20+ hauskaa ideaa isänpäivään. T-paidat, mukit ja paljon muuta. Tilaa nyt! 👨",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("isä") || t.includes("iskä") || t.includes("paras isä") ||
        t.includes("kalastus") || t.includes("kalamies") || t.includes("setä") ||
        t.includes("amatimies") || t.includes("eläke") ||
        p.category === "t-paidat" || p.category === "mukit" || p.category === "hupparit"
      );
    },
    seoText: `## Hauskat isänpäivälahjat – lahjoja jotka saavat isän hymyilemään

Isänpäivä on marraskuun toinen sunnuntai. Se on päivä jolloin isä ansaitsee parhaan – ja hauskimman – lahjan. Huumorikaupan valikoimasta löydät satoja hauskoja lahjoja isälle.

## Suosituimmat isänpäivälahjat

**Kalastuspaidat** – Suomen suosituin isänpäivälahja kalastusta harrastavalle isälle. "Kalamies" -paidat ovat klassikko.

**"Maailman paras isä" -tuotteet** – Hupparit, mukit ja paidat jotka kertovat isälle hänen olevan paras.

**Setähuumorimukit** – Isän aamukahvi ansaitsee hauskan mukin. Edullinen ja käytännöllinen isänpäivälahja.

## Isänpäivälahja budjetin mukaan

- **Alle 20 €** – Hauska muki tai tarra-arkki
- **20–30 €** – Hauska t-paita tai pipo
- **30–50 €** – Hauska huppari tai peitto
- **Yli 50 €** – Huppari + muki -combo

## Tilaa isänpäivälahja ajoissa

Tilaa viimeistään 2 viikkoa ennen isänpäivää. Toimitamme 3–7 arkipäivässä koko Suomeen.`,
    relatedBlogSlugs: ["hauskat-isanpaivalahjat-opas", "parhaat-hauskat-lahjat-miehelle"],
  },
  {
    slug: "aitienpaiva-lahjat",
    name: "Äitienpäivälahjat",
    emoji: "💐",
    h1: "Hauskat Äitienpäivälahjat",
    seoTitle: "Äitienpäivälahjat – Hauskat lahjat äidille | Huumorikauppa.fi",
    seoDescription: "Hae inspiraatiota äitienpäivälahjaan! Hauskat ideat äidille. Tilaa helposti verkosta. 💐",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("äiti") || t.includes("maailman paras äiti") || t.includes("nainen") ||
        p.category === "hupparit" || p.category === "mukit" || p.category === "laukut"
      );
    },
    seoText: `## Hauskat äitienpäivälahjat – lahjoja jotka saavat äidin hymyilemään

Äitienpäivä on toukokuun toinen sunnuntai. Äiti ansaitsee lahjan joka naurattaa ja lämmittää sydäntä. Unohda tylsät kukat – anna äidille lahja joka ilahduttaa joka päivä!

## Suosituimmat äitienpäivälahjat

**"Maailman paras äiti" -huppari** – Myydyin äitienpäivälahja. Pehmeä, lämmin ja hauska.

**Hauska kahvimuki äidille** – Aamukahvi maistuu paremmalta hauskasta mukista.

**Söpö huumoripaita** – Hienovaraisen hauska paita jota äiti käyttää oikeasti.

## Äitienpäivälahja budjetin mukaan

- **Alle 20 €** – Hauska muki tai kangaskassi
- **20–30 €** – Hauska t-paita
- **30–50 €** – Hauska huppari
- **Yli 50 €** – Huppari + muki -combo

## Tilaa äitienpäivälahja ajoissa

Tilaa viimeistään 2 viikkoa ennen äitienpäivää.`,
    relatedBlogSlugs: ["hauska-aitienpaivalahja-opas", "hauskat-lahjat-naiselle-opas"],
  },
  {
    slug: "joululahjat",
    name: "Hauskat Joululahjat",
    emoji: "🎄",
    h1: "Hauskat Joululahjat",
    seoTitle: "Joululahjat 2025 – Parhaat hauskat ideat | Huumorikauppa.fi",
    seoDescription: "Parhaat joululahjat 2025! Hauskat ja yllättävät ideat koko perheelle. Osta ajoissa – nopea toimitus. 🎄",
    filterFn: (p) => {
      return p.category === "t-paidat" || p.category === "hupparit" || 
             p.category === "mukit" || p.category === "tarrat" || 
             p.category === "pipot" || p.category === "peitot";
    },
    seoText: `## Hauskat joululahjat – naurua joulukuusen alle

Joulu on Suomen suurin lahjanantosesonki. Hauska joululahja on aina oikea valinta – se naurattaa, ilahduttaa ja erottuu muista lahjoista. Huumorikaupasta löydät hauskan joululahjan kaikille.

## Joululahjat miehelle 🎅

Setähuumoripaidat, kalastusmukit ja meemihupparit ovat suosituimpia joululahjoja miehelle.

## Joululahjat naiselle 🎄

"Maailman paras äiti" -hupparit, söpöt mukit ja hauskat kangaskassit ovat suosituimpia joululahjoja naiselle.

## Pikkujoululahjat alle 20 € 🎉

Hauska muki, tarra-arkki tai pipo ovat täydellisiä pikkujoululahjoja työkavereille.

## Joululahja budjetin mukaan

- **Alle 10 €** – Tarrat tai joulukoristeet
- **Alle 20 €** – Hauska muki tai pipo
- **Alle 30 €** – Hauska t-paita
- **Alle 50 €** – Hauska huppari tai peitto

## Milloin tilata joululahjat?

Tilaa viimeistään joulukuun alussa. Toimitamme 3–7 arkipäivässä.`,
    relatedBlogSlugs: ["parhaat-joululahjat-ja-pikkujoululahjat-2026"],
  },
  {
    slug: "syntymapaivaLahjat",
    name: "Hauskat Syntymäpäivälahjat",
    emoji: "🎂",
    h1: "Hauskat Syntymäpäivälahjat",
    seoTitle: "Syntymäpäivälahjat – Hauskat ja unohtumattomat ideat | Huumorikauppa.fi",
    seoDescription: "Hauska syntymäpäivälahja? Löydä täydellinen idea kaikille. Nopea toimitus koko Suomeen. 🎂",
    filterFn: (p) => {
      return p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit";
    },
    seoText: `## Hauskat syntymäpäivälahjat – lahjat jotka naurattavat

Syntymäpäivälahjan pitää olla hauska, persoonallinen ja mieleenpainuva. Huumorikaupasta löydät täydellisen hauskan syntymäpäivälahjan jokaiselle ikäluokalle.

## Syntymäpäivälahja ikävuosittain

**Lahja 18v** – Meemipaidat ja internet-huumori
**Lahja 25v** – Sarkasmipaidat ja hauskat mukit
**Lahja 30v** – Ammattihuumori ja meemihupparit
**Lahja 40v** – Setähuumori alkaa puhutella
**Lahja 50v** – "Museo-kappale" ja eläkehuumori
**Lahja 60v** – Eläkeläishuumori ja mukavat peitot

## Syntymäpäivälahja miehelle vs. naiselle

**Miehelle:** Kalastuspaidat, setähuumorimukit, meemihupparit
**Naiselle:** "Maailman paras äiti" -hupparit, söpöt mukit, kangaskassit`,
    relatedBlogSlugs: ["mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea", "lahja-miehelle-30v-40v-50v-60v", "hauskat-syntymapaivaLahjat-opas"],
  },
  {
    slug: "elakelahjat",
    name: "Hauskat Eläkelahjat",
    emoji: "🏖️",
    h1: "Hauskat Eläkelahjat",
    seoTitle: "Eläkeläislahjat – Hauskat muistot eläkkeelle siirtyvälle | Huumorikauppa.fi",
    seoDescription: "Eläkeläislahja joka muistetaan! Parhaat hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti. 🎉",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("eläke") || t.includes("eläkkeellä") || t.includes("museo") ||
        t.includes("vapaa") || t.includes("legenda") ||
        p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit"
      );
    },
    seoText: `## Hauskat eläkelahjat – juhli uutta vapautta huumorilla

Eläkkeelle siirtyminen on yksi elämän suurimmista virstanpylväistä. Vuosikymmenten työ on takana ja edessä on vapaus. Hauska eläkelahja juhlistaa tätä hetkeä tyylillä.

## Suosituimmat eläkelahjat

**"Eläkkeellä ja nautinnossa" -paita** – Suosituin eläkelahja
**"Virallisesti vapaa" -huppari** – Käytännöllinen ja hauska
**Eläkeläishuumorimuki** – Joka-aamuinen muistutus vapaudesta

## Kenelle eläkelahja?

- Työkavereille eläkejuhliin
- Isälle tai äidille
- Puolisolle
- Ystävälle`,
    relatedBlogSlugs: ["hauskat-elakelahjat-opas", "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea"],
  },
  {
    slug: "lahja-kaverille",
    name: "Hauskat Lahjat Kaverille",
    emoji: "🤝",
    h1: "Hauskat Lahjat Kaverille",
    seoTitle: "Hauska lahja kaverille – Parhaat ideat | Huumorikauppa.fi",
    seoDescription: "Hauska lahja kaverille – 15+ ideaa jotka varmasti toimii. Nopea toimitus. Osta nyt! 🎁",
    filterFn: (p) => {
      return p.category === "t-paidat" || p.category === "mukit" || p.category === "tarrat" || p.category === "hupparit";
    },
    seoText: `## Hauskat lahjat kaverille – lahjaideat parhaalle ystävälle

Kaverin lahja saa olla hauska, typerä ja mieleenpainuva. Sisäpiirin vitsit, meemit ja sarkasmi – kaveri arvostaa lahjaa joka naurattaa. Huumorikaupasta löydät täydellisen hauskan lahjan parhaalle kaverille.

## Suosituimmat lahjat kaverille

**Meemipaidat** – Internet-huumori puhuu kaverin kieltä
**Sarkasmimmukit** – "Tämä palaveri olisi voinut olla sähköposti"
**Hauska tarra-arkki** – Edullinen ja hauska lisälahja
**Hauska huppari** – Käytännöllinen ja hauska combo

## Lahja kaverin synttäreille

Kaverin syntymäpäivälahjan ei tarvitse olla kallis – huumori riittää. Alle 30 eurolla saat loistavan hauskan lahjan.`,
    relatedBlogSlugs: ["hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat", "parhaat-hauskat-lahjat-miehelle"],
  },
  {
    slug: "lahja-tyokaverille",
    name: "Lahjat Työkavereille",
    emoji: "💼",
    h1: "Hauskat Lahjat Työkavereille",
    seoTitle: "Lahjat työkavereille – Hauskat toimistolahjat | Huumorikauppa.fi",
    seoDescription: "Hauska toimistolahja työkavereille – Ideat, jotka saavat kaikki nauramaan. Tilaa nyt! 💼",
    filterFn: (p) => {
      return p.category === "mukit" || p.category === "tarrat" || p.category === "pipot";
    },
    seoText: `## Hauskat lahjat työkavereille – pikkujoululahjat ja toimistolahjat

Työkaverin lahja saa olla hauska mutta sopiva. Pikkujoululahja, syntymäpäivälahja tai läksiäislahja – Huumorikaupasta löydät sopivan hauskan lahjan jokaiselle kollegalle.

## Pikkujoululahjat alle 20 €

**Hauska muki** – Toimistohuumorimuki on pikkujoululahjojen kuningas
**Tarra-arkki** – Meemitarrat läppäriin
**Hauska pipo** – Talvipipo hauskalla tekstillä

## Lahja pomolle ja esimiehelle

Pomollekin voi antaa hauskan lahjan – kunhan huumori on sopivaa. Ammattihuumorimukit ja neutraalit sarkasmipaidat ovat turvallisia valintoja.

## Lahja eläkkeelle jäävälle työkavereille

Eläkkeelle jäävä työkaveri ansaitsee hauskan eläkelahjan. "Eläkkeellä ja nautinnossa" -tuotteet ovat suosituimpia.`,
    relatedBlogSlugs: ["hauskat-mukit-toimistoon-ja-lahjaksi", "parhaat-joululahjat-ja-pikkujoululahjat-2026"],
  },
];

export function getGiftCategory(slug: string) {
  return giftCategories.find(c => c.slug === slug);
}

export { giftCategories };

const GiftCategoryPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');
  const category = giftCategories.find(c => c.slug === slug);
  const { data: allProducts = [], isLoading } = useProducts();
  usePrerenderReady(!isLoading && allProducts.length > 0);

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Kategoriaa ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const products = allProducts.filter(p => category.filterFn(p));
  const relatedPosts = category.relatedBlogSlugs
    .map(s => blogPosts.find(b => b.slug === s))
    .filter(Boolean);

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category.name, url: `https://huumorikauppa.fi/${category.slug}` },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.h1,
    "description": category.seoDescription,
    "url": `https://huumorikauppa.fi/${category.slug}`,
    "isPartOf": { "@type": "WebSite", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
      })),
    },
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={category.seoTitle}
        description={category.seoDescription}
        canonical={`https://huumorikauppa.fi/${category.slug}`}
        jsonLd={itemListJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={products[0]?.images[0]}
      />

      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen yritys</div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.emoji} {category.name}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {category.h1} {category.emoji}
        </h1>
        <p className="text-muted-foreground mb-8">{products.length} tuotetta</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Tuotteita tulossa pian 😅</p>
          </div>
        )}

        {/* SEO Text */}
        {category.seoText && (
          <section className="mt-12 max-w-3xl">
            <div className="prose prose-sm text-muted-foreground space-y-4">
              {category.seoText.split('\n\n').map((paragraph, i) => {
                const trimmed = paragraph.trim();
                if (trimmed.startsWith('## ')) {
                  return <h2 key={i} className="font-display text-xl text-foreground mt-6 mb-2">{trimmed.replace('## ', '')}</h2>;
                }
                if (trimmed.startsWith('### ')) {
                  return <h3 key={i} className="font-semibold text-foreground mt-4 mb-1">{trimmed.replace('### ', '')}</h3>;
                }
                if (trimmed.startsWith('- ')) {
                  return (
                    <ul key={i} className="space-y-1 ml-1">
                      {trimmed.split('\n').map((line, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{line.replace(/^- /, '')}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
              })}
            </div>
          </section>
        )}

        {/* Related blog posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 pt-6 border-t border-border max-w-3xl">
            <h3 className="font-display text-xl text-foreground mb-4">📝 Aiheeseen liittyvät artikkelit</h3>
            <div className="space-y-3">
              {relatedPosts.map((post) => post && (
                <Link
                  key={post.slug}
                  to={`/blogi/${post.slug}`}
                  className="block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors bg-card"
                >
                  <h4 className="font-medium text-foreground hover:text-primary transition-colors mb-1">
                    {post.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross-link other gift categories */}
        <nav className="mt-8 pt-6 border-t border-border max-w-3xl" aria-label="Muut lahjaideat">
          <h3 className="text-sm font-semibold text-foreground mb-3">Katso myös:</h3>
          <div className="flex flex-wrap gap-2">
            {giftCategories.filter(c => c.slug !== slug).map(cat => (
              <Link
                key={cat.slug}
                to={`/${cat.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      <SEOGiftContent />
      <SEOTargetGroupContent />
      <SEOLongTailContent />
    </div>
  );
};

export default GiftCategoryPage;
