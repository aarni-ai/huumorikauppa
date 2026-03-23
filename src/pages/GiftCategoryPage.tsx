import { useLocation, Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { blogPosts } from "@/data/blog";

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
    seoTitle: "Hauskat Lahjat Miehelle – Parhaat Lahjaideat | Huumorikauppa",
    seoDescription: "Etsitkö hauskaa lahjaa miehelle? Parhaat hauskat lahjat isälle, kaverille ja aviomiehelle: t-paidat, hupparit ja mukit. Ilmainen toimitus yli 60 €.",
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

Miehelle lahjan ostaminen ei tarvitse olla vaikeaa. Hauska lahja on aina oikea valinta – se naurattaa, ilahduttaa ja tulee oikeasti käyttöön. Huumorikaupan valikoimasta löydät satoja hauskoja tuotteita miehille: t-paitoja, huppareita, mukeja ja paljon muuta.

## Suosituimmat lahjat miehelle

Kalastuspaidat, setähuumoripaidat ja eläkeläishuumoripaidat ovat suosituimpia lahjojamme miehille. Ne sopivat isälle, kaverille, aviomiehelle, veljelle ja sedälle. Hauska paita tai muki on edullinen mutta persoonallinen lahja joka kertoo "tunnen sinut ja haluan naurattaa sinua".

## Milloin hauska lahja miehelle?

Hauska lahja sopii syntymäpäivään, isänpäivään, jouluun, nimipäivään, valmistujaisiin ja eläkkeelle jäämiseen. Se on myös loistava häälahja bestmanille tai polttarilahja sulhaselle.

## Miksi tilata Huumorikaupasta?

- Ilmainen toimitus yli 60 € tilauksiin
- 14 päivän palautusoikeus
- 3–7 arkipäivän toimitus koko Suomeen
- 100% suomalainen yritys`,
    relatedBlogSlugs: ["parhaat-hauskat-lahjat-miehelle", "hauskat-isanpaivalahjat-opas", "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea"],
  },
  {
    slug: "hauskat-lahjat-naiselle",
    name: "Hauskat Lahjat Naiselle",
    emoji: "💝",
    h1: "Hauskat Lahjat Naiselle",
    seoTitle: "Hauskat Lahjat Naiselle – Parhaat Lahjaideat | Huumorikauppa",
    seoDescription: "Etsitkö hauskaa lahjaa naiselle? Parhaat hauskat lahjat äidille, ystävälle ja puolisolle: hupparit, mukit ja paidat. Ilmainen toimitus yli 60 €.",
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

## Suosituimmat lahjat naiselle

"Maailman paras äiti" -hupparit, söpöt huumorimukit ja hauskat kangaskassit ovat suosituimpia lahjojamme naisille. Ne sopivat äidille, ystävälle, siskolle, puolisolle ja työkavereille.

## Milloin hauska lahja naiselle?

Äitienpäivä, syntymäpäivä, ystävänpäivä, joulu ja pikkujoulut ovat täydellisiä tilaisuuksia antaa hauska lahja naiselle. Myös tupaantuliaisissa ja häissä hauska lahja on oivallinen valinta.

## Miksi tilata Huumorikaupasta?

- Ilmainen toimitus yli 60 € tilauksiin
- 14 päivän palautusoikeus
- 3–7 arkipäivän toimitus koko Suomeen
- Lahjapaketointimahdollisuus`,
    relatedBlogSlugs: ["hauskat-lahjat-naiselle-opas", "hauska-aitienpaivalahja-opas"],
  },
  {
    slug: "polttari-lahjat",
    name: "Polttarilahjat & Polttaripaidat",
    emoji: "🎉",
    h1: "Polttarilahjat & Polttaripaidat",
    seoTitle: "Polttarilahjat & Polttaripaidat – Tilaa Ryhmälle | Huumorikauppa",
    seoDescription: "Etsitkö polttaripaitoja tai polttarilahjoja? Tilaa yhtenäiset hauskat paidat polttareihin. Miesten ja naisten polttarit. Ilmainen toimitus yli 60 €.",
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

Sulhasen paita, bestmanin paita ja ryhmän paidat – tilaa koko porukalle yhtenäiset polttaripaidat hauskalla tekstillä. Suosittuja tekstejä: "Game Over", "Sulhasen viimeinen seikkailu" ja "[Nimi]:n polttarit 2026".

## Polttaripaidat naisten polttareihin 👰

Morsiamen paita, kaason paidat ja "Team Bride" -paidat ovat suosittuja naisten polttareissa. Morsiamen paita erottuu usein värillä – valkoinen tai kultainen on klassikko.

## Polttarilahjat sulhaselle ja morsiamelle

Polttaripaitojen lisäksi löydät meiltä hauskoja polttarilahjoja: mukeja, huppareita ja tarroja polttariteemalla.

## Tilaa polttaripaidat Huumorikaupasta

- Ilmainen toimitus yli 60 € tilauksiin
- 3–7 arkipäivän toimitus
- 14 päivän palautusoikeus
- Ryhmätilaukset helposti – lisää eri koot koriin`,
    relatedBlogSlugs: ["parhaat-polttaripaidat-ja-polttarilahjat-2026"],
  },
];

export function getGiftCategory(slug: string) {
  return giftCategories.find(c => c.slug === slug);
}

export { giftCategories };

import { useProducts } from "@/hooks/use-products";

const GiftCategoryPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');
  const category = giftCategories.find(c => c.slug === slug);
  const { data: allProducts = [], isLoading } = useProducts();

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
    </div>
  );
};

export default GiftCategoryPage;
