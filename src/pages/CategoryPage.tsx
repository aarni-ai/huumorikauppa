import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag, Star, CheckCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOProductsContent, SEOGiftContent } from "@/components/SEOKeywordContent";

const PRIORITY_KEYWORDS = [
  "amatimies", "museo", "eläkkeellä", "eläke", "iskä ei osaa", "isä ei osaa",
  "kalju", "i ❤️ my", "i love my", "i ❤ my"
];

function getPriority(product: { name: string; description: string }): number {
  const t = (product.name + ' ' + product.description).toLowerCase();
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (t.includes(PRIORITY_KEYWORDS[i].toLowerCase())) return i;
  }
  return PRIORITY_KEYWORDS.length + 1;
}

function isCustomTextProduct(name: string, description: string): boolean {
  const t = (name + ' ' + description).toLowerCase();
  return t.includes('oma teksti') || t.includes('oma kuva') || t.includes('custom text') || t.includes('personoi');
}

// Category-specific H1 overrides
const CATEGORY_H1: Record<string, string> = {
  "t-paidat": "Hauskat t-paidat",
  "hupparit": "Hauskat hupparit",
  "mukit": "Hauskat mukit",
  "tarrat": "Hauskat tarrat",
  "bodyt": "Hauskat bodyt pienimmille",
  "peitot": "Hauskat peitot",
  "pipot": "Hauskat pipot",
  "laukut": "Hauskat laukut ja kassit",
  "seinataulut": "Hauskat seinätaulut",
  "koristeet": "Hauskat koristeet",
  "pitkahihaiset": "Hauskat pitkähihaiset paidat",
};

// Category-specific H2 text sections for richer SEO
const CATEGORY_H2_SECTIONS: Record<string, { h2: string; text: string }[]> = {
  "t-paidat": [
    { h2: "Miksi hauska t-paita on paras lahja?", text: "Hauska t-paita on lahja joka naurattaa, ilahduttaa ja tulee oikeasti käyttöön. Se sopii syntymäpäiviin, polttareihin, joululahjaksi ja kaikkeen muuhun. Meiltä löydät satoja erilaisia malleja – meemipaitoja, setähuumoripaitoja, kalastuspaitoja ja paljon muuta." },
    { h2: "Suosituimmat hauskat t-paidat", text: "Valikoimamme suosituimpia ovat setähuumoripaidat, eläkeläispaidat, ammattihuumoripaidat ja meemipaidat. Kaikissa on laadukas DTG-painatus ja mukava istuvuus koissa XS–3XL." },
  ],
  "hupparit": [
    { h2: "Miksi hauska huppari on paras lahja?", text: "Hauska huppari yhdistää lämmön ja huumorin. Se on käytännöllinen, mukava ja hauska – täydellinen lahja kenelle tahansa. Valikoimastamme löydät meemihuppareita, setähuumorihuppareita ja sarkastisia tekstihuppareita." },
    { h2: "Suosituimmat huumorihupparit", text: "Suosituimpia huppareitamme ovat 'Maailman paras' -sarjan hupparit, kalastushupparit ja eläkehuumorihupparit. Laadukas materiaali ja kestävä painatus." },
  ],
  "mukit": [
    { h2: "Miksi hauska muki on paras lahja?", text: "Hauska muki on edullinen, käytännöllinen ja ilahduttaa joka aamu. Se sopii työkavereille, perheenjäsenille ja ystäville. Suosituimpia ovat toimistomukit, ammattilaismukit ja sarkastiset tekstimukit." },
    { h2: "Suosituimmat huumorimukit", text: "Valikoimamme suosituimpia ovat ammattihuumorimukit, setähuumorimukit ja 'Ennen kahvia' -sarjan mukit. Kaikki mukimme ovat konepesuturvallisia." },
  ],
  "tarrat": [
    { h2: "Mihin hauskoja tarroja voi käyttää?", text: "Laadukkaat vinyl-tarramme sopivat läppäriin, vesipulloon, autoon ja jääkaappiin. Ne kestävät säätä, vettä ja kulutusta. Tarrat ovat myös erinomainen pieni lahja tai lisä isomman paketin oheen." },
  ],
  "bodyt": [
    { h2: "Miksi hauska body on paras vauvalahja?", text: "Hauska body on takuuvarma lahja vauvalle ja vanhemmille. Se naurattaa koko perhettä ja on samalla pehmeä ja turvallinen. Bodymme ovat 100% puuvillaa ja konepestäviä." },
  ],
  "peitot": [
    { h2: "Miksi hauska peitto on yllättävä lahja?", text: "Laadukas peitto hauskalla tekstillä pitää lämpimänä ja hymyilyttää. Se on yllättävä ja ikimuistoinen lahja syntymäpäiviin, jouluun tai eläkejuhliin." },
  ],
  "pipot": [
    { h2: "Miksi hauska pipo on paras talvilahja?", text: "Hauska pipo yhdistää käytännöllisyyden ja huumorin – se pitää pään lämpimänä ja tunnelman korkealla. Laadukkaat materiaalit ja hauska brodeeraus tekevät pipostamme täydellisen talvilahjan." },
  ],
  "laukut": [
    { h2: "Miksi hauska kangaskassi on paras lahja?", text: "Hauska kangaskassi on ekologinen, käytännöllinen ja hauska – kolme ominaisuutta jotka tekevät siitä täydellisen lahjan. Kassimme sopivat arkikäyttöön, ostoksille ja kaikkialle muuallekin." },
  ],
  "seinataulut": [
    { h2: "Miksi hauska seinätaulu on paras sisustus?", text: "Hauska seinätaulu piristää kodin seinät ja tuo hymyn huulille joka päivä. Taulumme sopivat olohuoneeseen, makuuhuoneeseen, toimistoon ja WC:hen." },
  ],
  "koristeet": [
    { h2: "Miksi hauska koriste on hyvä lahja?", text: "Hauska koriste tuo huumoria kodin jokaiseen nurkkaan. Se on yllättävä ja persoonallinen lahja joka sopii syntymäpäiviin, tupaantuliaisiin ja jouluun." },
  ],
  "pitkahihaiset": [
    { h2: "Miksi pitkähihainen on paras valinta?", text: "Pitkähihainen hauska paita on erinomainen valinta syksylle ja keväälle. Se toimii myös kerrostettuna takin alla talvella. Laadukas materiaali ja kestävä painatus." },
  ],
};

const CategoryPage = () => {
  const { slug } = useParams();
  const category = categories.find(c => c.slug === slug);
  const { data: allProducts = [], isLoading } = useProducts();
  const categoryProducts = allProducts.filter(p => p.category === slug);
  const nonCustomProducts = categoryProducts.filter(p => !isCustomTextProduct(p.name, p.description));
  const products = (nonCustomProducts.length > 0 ? nonCustomProducts : categoryProducts)
    .sort((a, b) => getPriority(a) - getPriority(b));

  useEffect(() => {
    if (!isLoading && allProducts.length > 0) {
      window.prerenderReady = true;
    }
  }, [isLoading, allProducts]);

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Kategoriaa ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const otherCategories = categories.filter(c => c.slug !== slug);
  const crossLinkCategories = otherCategories
    .filter(c => allProducts.some(p => p.category === c.slug))
    .slice(0, 5);

  const h1Text = CATEGORY_H1[slug || ""] || `Hauskat ${category.name}`;
  const h2Sections = CATEGORY_H2_SECTIONS[slug || ""] || [];

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category.name, url: `https://huumorikauppa.fi/kategoria/${slug}` },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": h1Text,
    "description": category.seoDescription || category.description,
    "url": `https://huumorikauppa.fi/kategoria/${slug}`,
    "isPartOf": { "@type": "WebSite", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
        "image": p.images[0] || "/placeholder.svg",
      })),
    },
  };

  // FAQ JSON-LD — quotable answers for AI Overviews / ChatGPT / Perplexity
  const catLower = category.name.toLowerCase();
  const catSingular = catLower.replace(/t$/, "");
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `Kuinka nopeasti ${catLower} toimitetaan?`,
        "acceptedAnswer": { "@type": "Answer", "text": "Toimitamme tilaukset 3–7 arkipäivässä koko Suomeen. Yli 60 € tilauksiin toimitus on ilmainen." },
      },
      {
        "@type": "Question",
        "name": `Voiko ${catLower} palauttaa?`,
        "acceptedAnswer": { "@type": "Answer", "text": "Kyllä. Sinulla on 14 päivää aikaa palauttaa tuotteet. Palautusoikeus koskee kaikkia tuotteitamme." },
      },
      {
        "@type": "Question",
        "name": `Sopiiko hauska ${catSingular} lahjaksi?`,
        "acceptedAnswer": { "@type": "Answer", "text": `Ehdottomasti. Hauskat ${catLower} ovat yksi suosituimmista huumorilahjaideoista — täydellisiä syntymäpäiviin, jouluun, isänpäivään, äitienpäivään ja työkavereille.` },
      },
      {
        "@type": "Question",
        "name": `Mistä ${catLower} on tehty?`,
        "acceptedAnswer": { "@type": "Answer", "text": "Käytämme laadukkaita materiaaleja ja kestäviä DTG- tai sublimaatiopainatuksia. Kaikki tuotteet painetaan ja toimitetaan EU:sta." },
      },
    ],
  };

  const combinedJsonLd = { "@context": "https://schema.org", "@graph": [itemListJsonLd, faqJsonLd] };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={category.seoTitle || `${h1Text} | Huumorikauppa.fi`}
        description={category.seoDescription || `${category.description}. Ilmainen toimitus yli 60 € tilauksiin!`}
        canonical={`https://huumorikauppa.fi/kategoria/${slug}`}
        jsonLd={combinedJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={products[0]?.images[0]}
      />

      {/* Trust bar */}
      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-1.5"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen yritys</div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>4.8/5 <span className="hidden md:inline">(200+ arvostelua)</span></span>
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.emoji} {category.name}</span>
        </nav>

        {/* H1 */}
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {h1Text} {category.emoji}
        </h1>
        <p className="text-muted-foreground mb-4">{category.description} – {products.length} tuotetta</p>

        {/* DIRECT ANSWER BLOCK — visuaalisesti piilossa, indeksoitavissa SEO/GEO:lle */}
        <div className="sr-only" aria-hidden="false">
          <p>
            <strong>{h1Text}</strong> ovat yksi Suomen suosituimmista huumorilahjaideoista.
            Huumorikauppa.fi:stä löydät {products.length}+ erilaista hauskaa {category.name.toLowerCase()} —
            täydellisiä lahjoja töihin, kaverille, perheelle tai itsellesi. Toimitus 3–7 arkipäivässä koko Suomeen,
            ilmainen yli 60 € tilauksiin.
          </p>
        </div>

        {/* Trust badges inline */}
        <div className="flex flex-wrap gap-3 mb-8 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="h-3.5 w-3.5" /> Varastossa
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="h-3.5 w-3.5" /> Toimitus 3–7 arkipäivässä
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Star className="h-3.5 w-3.5 fill-yellow-500" /> 4.8/5 arvosana
          </span>
        </div>

        {/* Product grid */}
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
            <p className="text-xl text-muted-foreground">Ei tuotteita tässä kategoriassa vielä 😅</p>
          </div>
        )}

        {/* H2 SEO sections - these give Google additional headings to index */}
        {h2Sections.length > 0 && (
          <section className="mt-12 max-w-3xl space-y-6">
            {h2Sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-display text-xl md:text-2xl text-foreground mb-2">{section.h2}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
              </div>
            ))}
          </section>
        )}

        {/* SEO Category Text */}
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
                return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
              })}
            </div>

            {/* Cross-links */}
            <nav className="mt-8 pt-6 border-t border-border" aria-label="Tutustu muihin kategorioihin">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tutustu myös muihin kategorioihin:</h3>
              <div className="flex flex-wrap gap-2">
                {crossLinkCategories.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/kategoria/${cat.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    {cat.emoji} {cat.name}
                  </Link>
                ))}
              </div>
            </nav>
          </section>
        )}

        {/* FAQ section for category - gives Google extra headings */}
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Usein kysyttyä – {category.name}</h2>
          <div className="space-y-4">
            <details className="group border border-border rounded-lg">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                Kuinka nopeasti {category.name.toLowerCase()} toimitetaan?
              </summary>
              <p className="px-4 pb-3 text-sm text-muted-foreground">Toimitamme tilaukset 3–7 arkipäivässä koko Suomeen. Ilmainen toimitus yli 60 € tilauksiin.</p>
            </details>
            <details className="group border border-border rounded-lg">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                Voiko {category.name.toLowerCase()} palauttaa?
              </summary>
              <p className="px-4 pb-3 text-sm text-muted-foreground">Kyllä! Sinulla on 14 päivää aikaa palauttaa tuotteet. Palautusoikeus koskee kaikkia tuotteitamme.</p>
            </details>
            <details className="group border border-border rounded-lg">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                Sopiiko hauska {category.name.toLowerCase().replace(/t$/, '')} lahjaksi?
              </summary>
              <p className="px-4 pb-3 text-sm text-muted-foreground">Ehdottomasti! Hauskat {category.name.toLowerCase()} ovat suosittuja lahjoja syntymäpäiviin, jouluun, isänpäivään ja muihin tilaisuuksiin.</p>
            </details>
          </div>
        </section>
      </div>
      <SEOProductsContent />
      <SEOGiftContent />
    </div>
  );
};

export default CategoryPage;
