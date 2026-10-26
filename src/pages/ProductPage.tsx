import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { categories } from "@/data/products";
import { useProduct, piilotetutSlugit } from "@/hooks/use-products";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { sortSizes } from "@/lib/sortSizes";
import { availableColors, availableSizes, isVariantAvailable } from "@/lib/variantAvailability";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeliveryBadge } from "@/components/DeliveryBadge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Share2, Copy, MessageCircle, ChevronDown, Star } from "lucide-react";
import { PurchaseFacts } from "@/components/PurchaseFacts";
import { SizeGuide } from "@/components/SizeGuide";
import { PaymentIcons } from "@/components/PaymentIcons";
import { isClothingCategory } from "@/lib/sizeChart";
import { PRODUCT_IMAGE_SIZES, productImageSources } from "@/lib/productImages";
import { formatPriceFi } from "@/seo/site";
import { ProductCard } from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { buildProductJsonLd } from "@/seo/structuredData";
import { buildProductFaqs, mergeFaqs } from "@/seo/pageFaqs";
import { getProductContent } from "@/data/productContent";
import { productImageAlt } from "@/lib/productNames";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductCopy, isGenericDescription, sanitizeProductDescription, truncateAtWord } from "@/lib/productCopy";
import { isCustomTextProduct } from "@/lib/customProduct";
import { situationGifts } from "@/data/situationGifts";
import { blogPosts } from "@/data/blog";
import { proxiedImage } from "@/lib/imageProxy";

import { getProductReviews } from "@/lib/productReviews";
import { CityProductsSection } from "@/components/CityProductsSection";
import { ComplementaryProducts } from "@/components/ComplementaryProducts";


function parseDescription(description: string) {
  const sectionHeaders = [
    "TUOTTEEN OMINAISUUDET",
    "Tuotteen ominaisuudet",
    "Product features",
    "HOITO-OHJEET",
    "Hoito-ohjeet",
    "Care instructions",
    "MATERIAALI",
    "Materiaali",
  ];

  let text = description;

  // 1. Insert newlines BEFORE known section headers that are glued to preceding text
  for (const header of sectionHeaders) {
    // Match header glued to previous text (no newline before it)
    text = text.replace(new RegExp(`(?<![\\n])(?=${escapeRegex(header)})`, "gi"), "\n\n");
  }

  // 2. Insert newline AFTER section header if content is glued to it
  for (const header of sectionHeaders) {
    text = text.replace(new RegExp(`(${escapeRegex(header)})([A-Z0-9•\\-–])`, "gi"), "$1\n$2");
  }

  // 3. Split inline bullets: •text or • text → newline before •
  text = text.replace(/([^\n])(\s*•\s*)/g, "$1\n•");

  // 4. Split glued label:value pairs (e.g., "30 °C)Rumpukuivain:" or "keskilämpöSilitys")
  // Common care/feature labels that may be glued
  const careLabels = [
    "Pesukone", "Rumpukuivain", "Silitys", "Höyry", "Ei kemiallista",
    "Ei klooripohjaista", "PESUKONE", "RUMPUKUIVAIN", "SILITYS",
    "EI KEMIALLISTA", "EI KLOORIPOHJAISTA", "Konepesu", "Käsinpesu",
  ];
  for (const label of careLabels) {
    text = text.replace(new RegExp(`([^\\n])(?=${escapeRegex(label)})`, "gi"), "$1\n");
  }

  // 5. Split lines like "...viimeistelyKaksinkertainen" (lowercase/digit/paren followed by Uppercase start of new word)
  text = text.replace(/([a-zäöåü\)°])([A-ZÄÖÅ][a-zäöåü])/g, "$1\n$2");

  // 6. Standard bullet split for "- " or "– " after sentence-ending chars
  text = text.replace(/([.!?a-zäöå])(\s*[-–]\s+)/gi, "$1\n$2");

  // Split paragraphs
  const rawParagraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0);

  type Section = { type: "heading"; text: string } | { type: "paragraph"; text: string } | { type: "bullets"; items: string[] };
  const sections: Section[] = [];

  for (const block of rawParagraphs) {
    const lines = block.split(/\n/).filter(l => l.trim().length > 0);
    const isHeader = sectionHeaders.some(h => block.trim().toLowerCase().startsWith(h.toLowerCase()));

    if (isHeader) {
      sections.push({ type: "heading", text: lines[0].trim() });
      const restLines = lines.slice(1);
      if (restLines.length > 0) {
        const bulletLines: string[] = [];
        const textLines: string[] = [];
        for (const l of restLines) {
          if (/^[\s]*[•\-–]/.test(l)) {
            bulletLines.push(l.replace(/^[\s]*[•\-–]\s*/, "").trim());
          } else {
            // Could be an ALLCAPS instruction line → treat as bullet
            if (/^[A-ZÄÖÅ\s:()°%\/,\-–0-9]+$/.test(l.trim()) && l.trim().length > 5) {
              bulletLines.push(l.trim());
            } else {
              textLines.push(l.trim());
            }
          }
        }
        if (bulletLines.length > 0) {
          sections.push({ type: "bullets", items: bulletLines });
        }
        for (const t of textLines) {
          sections.push({ type: "paragraph", text: t });
        }
      }
    } else {
      // Check if block has bullets
      const lines2 = block.split(/\n/).filter(l => l.trim().length > 0);
      const bulletItems: string[] = [];
      const paragraphTexts: string[] = [];

      for (const l of lines2) {
        if (/^[\s]*[•]/.test(l)) {
          bulletItems.push(l.replace(/^[\s]*[•]\s*/, "").trim());
        } else {
          paragraphTexts.push(l.trim());
        }
      }

      if (bulletItems.length > 0 && paragraphTexts.length > 0) {
        for (const t of paragraphTexts) sections.push({ type: "paragraph", text: t });
        sections.push({ type: "bullets", items: bulletItems });
      } else if (bulletItems.length > 0) {
        sections.push({ type: "bullets", items: bulletItems });
      } else {
        sections.push({ type: "paragraph", text: block.trim() });
      }
    }
  }

  return sections;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ProductDescription({ description, expanded, onToggle }: { description: string; expanded: boolean; onToggle: () => void }) {
  const isLong = description.length > 200;
  const sections = parseDescription(description);

  const renderSections = (secs: ReturnType<typeof parseDescription>) => (
    <div className="space-y-4">
      {secs.map((sec, i) => {
        if (sec.type === "heading") {
          return <h3 key={i} className="font-semibold text-foreground text-base mt-2">{sec.text}</h3>;
        }
        if (sec.type === "bullets") {
          return (
            <ul key={i} className="space-y-1.5 ml-1">
              {sec.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="text-sm leading-relaxed">{sec.text}</p>;
      })}
    </div>
  );

  if (!isLong) {
    return <div className="text-muted-foreground">{renderSections(sections)}</div>;
  }

  const shortText = description.slice(0, 200) + "…";

  return (
    <div className="text-muted-foreground">
      {expanded ? (
        <>
          {renderSections(sections)}
          <button onClick={onToggle} className="mt-3 text-primary font-medium text-sm hover:underline inline-flex items-center gap-1">
            Näytä vähemmän <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed">{shortText}</p>
          <button onClick={onToggle} className="mt-3 text-primary font-medium text-sm hover:underline inline-flex items-center gap-1">
            Lue lisää <ChevronDown className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}



const NO_SIZE_CATEGORIES = ["mukit", "tarrat", "seinataulut", "peitot", "koristeet"];

// Build a same-origin proxied URL for a Printify image so Googlebot
// (which is blocked by Printify CDN) can fetch it via our domain.
// Only used in JSON-LD + og:image; <img> tags keep the original CDN URL.
function toProxiedImage(url: string): string {
  if (!url) return url;
  const abs = url.startsWith("http") ? url : `https://huumorikauppa.fi${url}`;
  return proxiedImage(abs, { absolute: true });
}

const ProductPage = () => {
  const { slug } = useParams();
  const { product, products: allProducts = [], isLoading } = useProduct(slug);
  const { addItem } = useCartContext();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [customText, setCustomText] = useState("");

  const addToCartBtnRef = useRef<HTMLButtonElement>(null);
  const variantSectionRef = useRef<HTMLDivElement>(null);
  const stickyEndRef = useRef<HTMLDivElement>(null);
  const [buttonOutOfView, setButtonOutOfView] = useState(false);
  const [pageEndReached, setPageEndReached] = useState(false);
  // Kiinteä ostopalkki näkyy vain, kun sivun oma Lisää koriin -painike ei ole näkyvissä, ja
  // piiloutuu tuotesisällön lopussa, jottei se peitä alatunnistetta.
  const showStickyBar = buttonOutOfView && !pageEndReached;

  useEffect(() => {
    const el = addToCartBtnRef.current;
    const end = stickyEndRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      // Palkki näkyy myös, jos painike on vain osittain näkyvissä (esim. kaksirivinen tuotenimi).
      ([entry]) => setButtonOutOfView(entry.intersectionRatio < 1),
      { threshold: [0, 1] }
    );
    observer.observe(el);
    const endObserver = end
      ? new IntersectionObserver(([entry]) => setPageEndReached(entry.isIntersecting || entry.boundingClientRect.top < 0), { threshold: 0 })
      : null;
    if (end) endObserver?.observe(end);
    return () => {
      observer.disconnect();
      endObserver?.disconnect();
    };
  }, [product?.id]);

  const variantImages = useMemo(() => {
    return (product?.variants?.variant_images as Record<string, string[]>) || {};
  }, [product]);

  // Printifyn valmistettavat värit (src/lib/variantAvailability.ts): väri näkyy, jos sillä on vähintään yksi koko.
  const sellableColors = useMemo(
    () =>
      product
        ? availableColors(product, (product.variants.colors || []) as string[], (product.variants.sizes || []) as string[])
        : [],
    [product],
  );

  useEffect(() => {
    if (!product) return;
    // Oletusvalinta on aina valmistettava väri; valmistamaton valinta vaihdetaan.
    if (!selectedColor || !sellableColors.includes(selectedColor)) {
      const defaultColor = product.variants.default_color as string | undefined;
      const next = defaultColor && sellableColors.includes(defaultColor) ? defaultColor : sellableColors[0];
      if (next && next !== selectedColor) setSelectedColor(next);
    }
  }, [product, selectedColor, sellableColors]);

  useEffect(() => {
    // Värin vaihto: koko, jota ei valmisteta uudella värillä, poistetaan valinnasta.
    if (product && selectedSize && !isVariantAvailable(product, selectedColor, selectedSize)) {
      setSelectedSize(undefined);
    }
  }, [product, selectedColor, selectedSize]);

  const currentImages = useMemo(() => {
    if (selectedColor) {
      const variantImgs = (variantImages[selectedColor] || []).filter(Boolean);
      if (variantImgs.length > 0) return variantImgs;
    }
    return (product?.images || []).filter(Boolean);
  }, [selectedColor, variantImages, product]);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedColor]);

  const seoCopy = useMemo(
    () => generateProductCopy({
      id: product?.id ?? '',
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      category: product?.category ?? '',
      price: product?.price ?? 0,
      description: product?.description ?? '',
    }),
    [product]
  );
  const matchingGiftGuide = useMemo(() => {
    if (!product) return undefined;
    const t = (product.name + " " + product.description).toLowerCase();
    return situationGifts.find(g =>
      g.keywords.some(k => t.includes(k.toLowerCase()))
      || (g.categories || []).includes(product.category)
    );
  }, [product]);
  const relatedBlogPosts = useMemo(() => {
    if (!product) return [];
    return blogPosts
      .filter(p => p.category === product.category || p.relatedCategories?.includes(product.category))
      .slice(0, 2);
  }, [product]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Myynnistä piilotettu tuote (mukit 21.10.2026): ohjaus kaikkiin tuotteisiin.
  if (!product && slug && piilotetutSlugit.has(slug)) return <Navigate to="/kaikki-tuotteet" replace />;

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <SEOHead title="Tuotetta ei löydy | Huumorikauppa" description="Etsimääsi tuotetta ei löytynyt. Selaa kaikkia tuotteita." noindex={true} />
        <h1 className="font-display text-3xl text-foreground mb-4">Tuotetta ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const category = categories.find(c => c.slug === product.category);
  const hideSize = NO_SIZE_CATEGORIES.includes(product.category);
  const hasSizes = !hideSize && product.variants.sizes && product.variants.sizes.length > 1;
  const hasColors = product.variants.colors && product.variants.colors.length > 0;
  // Oletusväri ensin, jotta valittu väri näkyy mobiilin vaakarivin alussa.
  const defaultColor = product.variants.default_color as string | undefined;
  const uniqueColors = [...new Set(sellableColors)].sort(
    (a, b) => Number(b === defaultColor) - Number(a === defaultColor),
  );
  // Valitulla värillä valmistettavat koot; valmistamattomat yhdistelmät eivät näy valitsimessa.
  const allSizes = (product.variants.sizes || []) as string[];
  const sellableSizes = availableSizes(product, selectedColor, sortSizes(allSizes));
  const needsSize = hasSizes && !selectedSize;
  const needsColor = hasColors && !selectedColor;
  const isCustom = isCustomTextProduct(product);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const categoryName = category?.name || product.category;

  // Käsin kirjoitettu kuvaus (src/data/productContent.ts) ohittaa tietokannan kuvauksen; esirenderöinti käyttää samaa.
  const contentOverride = getProductContent(product.slug);
  const useGeneratedDescription = isGenericDescription(product.description);
  const effectiveDescription = contentOverride
    ? contentOverride.description
    : useGeneratedDescription
      ? seoCopy.longDescription
      : sanitizeProductDescription(product.description);

  const handleAddToCart = () => {
    if (needsSize) {
      toast({ title: "Valitse koko ensin! 📏", variant: "destructive" });
      return;
    }
    if (needsColor) {
      toast({ title: "Valitse väri ensin! 🎨", variant: "destructive" });
      return;
    }
    if (isCustom && !customText.trim()) {
      toast({
        title: "Kerro vielä toiveesi! ✍️",
        description: "Tämä on personoitava tuote – kirjoita haluamasi teksti tai kuvatoive kenttään ennen koriin lisäystä.",
        variant: "destructive",
      });
      document.getElementById("custom-text-input")?.focus();
      return;
    }
    const size = hideSize ? (availableSizes(product, selectedColor, allSizes)[0] ?? allSizes[0]) : selectedSize;
    const tarkistettavaKoko = size ?? (allSizes.length === 1 ? allSizes[0] : undefined);
    if (
      (tarkistettavaKoko !== undefined || allSizes.length === 0) &&
      !isVariantAvailable(product, selectedColor, tarkistettavaKoko)
    ) {
      toast({ title: "Tätä kokoa ei valmisteta valitulla värillä. Valitse toinen koko tai väri.", variant: "destructive" });
      return;
    }
    addItem(product, quantity, size, selectedColor, isCustom ? customText.trim() : undefined);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Linkki kopioitu! 📋" });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const scrollToVariants = () => {
    variantSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Cross-category: same theme products
  const themeProducts = (() => {
    const skipWords = new Set(['paita', 'paidat', 'huppari', 'muki', 'mukit', 'tarra', 'hauska', 'hauskat', 'kahvikuppi', 'maailman', 'paras', 'body', 'peitto', 'pipo', 'laukku', 'taulu', 'koriste']);
    const nameWords = product.name.toLowerCase()
      .split(/[\s\-–,!?()]+/)
      .filter(w => w.length > 3 && !skipWords.has(w));
    
    if (nameWords.length === 0) return [];
    
    return allProducts
      .filter(p =>
        p.id !== product.id &&
        p.category !== product.category &&
        nameWords.some(w => p.name.toLowerCase().includes(w))
      )
      .slice(0, 4);
  })();

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const allProductImages = currentImages.length > 0 ? currentImages : (product.images.length > 0 ? product.images : ["/placeholder.svg"]);

  // Product + Offer (toimitus, palautusehdot) samasta rakentajasta kuin esirenderöinti.
  // Ei aggregateRatingia eikä Reviewta: arvioita ei ole todennetusta lähteestä (src/data/arvostelut-arkisto.ts).
  const productReviews = getProductReviews(product);

  const productJsonLd = buildProductJsonLd({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: effectiveDescription,
    images: allProductImages.map((img) => toProxiedImage(img.startsWith("http") ? img : `https://huumorikauppa.fi${img}`)),
    price: product.price,
    stock: product.stock,
    categoryName,
    variants: product.variants,
  });

  const { faqs: genericProductFaqs, audience, occasion, whyFunny } = buildProductFaqs(product, categoryName, { isCustom });
  // Tuotekohtaiset UKK:t ensin, yleiset perään ilman päällekkäisiä kysymyksiä (sama lista näkyvään UKK:hon ja FAQPage-JSON-LD:hen).
  const productFaqsExtended = mergeFaqs(contentOverride?.faqs ?? [], genericProductFaqs);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": productFaqsExtended.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const combinedProductJsonLd = {
    "@context": "https://schema.org",
    "@graph": [productJsonLd, faqJsonLd],
  };


  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category?.name || product.category, url: `https://huumorikauppa.fi/kategoria/${product.category}` },
    { name: product.name, url: `https://huumorikauppa.fi/tuote/${product.slug}` },
  ];

  // categoryName already declared above

  const shortDesc = product.description.length > 200
    ? product.description.slice(0, 200) + "…"
    : product.description;
  const metaDesc = contentOverride
    ? truncateAtWord(contentOverride.description.replace(/\s+/g, " "), 155)
    : seoCopy.shortDescription;

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{`${product.name} | Huumorikauppa`}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta property="og:title" content={`${product.name} | Huumorikauppa`} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        <meta property="og:image" content={toProxiedImage(allProductImages[0]?.startsWith("http") ? allProductImages[0] : `https://huumorikauppa.fi${allProductImages[0]}`)} />
        <meta property="og:site_name" content="Huumorikauppa.fi" />
        <meta property="og:locale" content="fi_FI" />
        <meta property="product:price:amount" content={product.price.toFixed(2)} />
        <meta property="product:price:currency" content="EUR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | Huumorikauppa`} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={toProxiedImage(allProductImages[0]?.startsWith("http") ? allProductImages[0] : `https://huumorikauppa.fi${allProductImages[0]}`)} />
        <link rel="alternate" hrefLang="fi" href={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://huumorikauppa.fi/tuote/${product.slug}`} />
        {/* JSON-LD (Product + Breadcrumb + FAQPage) is emitted exclusively by SEOHead below via combinedProductJsonLd. */}
      </Helmet>
      <SEOHead
        title={`${product.name} | Huumorikauppa`}
        description={metaDesc}
        canonical={`https://huumorikauppa.fi/tuote/${product.slug}`}
        jsonLd={combinedProductJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={toProxiedImage(currentImages[0]?.startsWith("http") ? currentImages[0] : `https://huumorikauppa.fi${currentImages[0] || ""}`)}
        ogType="product"
        productPrice={product.price.toFixed(2)}
      />
      <div className="container pt-2 pb-6 md:py-10">
        {/* Desktop: full breadcrumb (mobiilissa kategorialinkki on sivun alaosassa, jotta osto mahtuu ensinäkymään) */}
        <nav aria-label="Murupolku" className="hidden md:flex text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <Link to={`/kategoria/${product.category}`} className="hover:text-foreground">
            {category?.emoji} {category?.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12">
          {/* MOBILE ONLY: nimi, hinta ja toimitus/palautus ennen kuvaa. Ensinäkymässä 360x740 ja 390x844
              näkyvät hinta, värit, koot ja Lisää koriin -painike. */}
          <div className="md:hidden mb-2">
            <h1 className="font-display text-xl text-foreground leading-tight line-clamp-2">{product.name}</h1>
            <div className="flex items-baseline gap-2 mt-0.5">
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">{formatPriceFi(product.original_price!)}</span>
              )}
              <span className={`text-xl font-bold ${hasDiscount ? "text-destructive" : "text-primary"}`}>
                {formatPriceFi(product.price)}
              </span>
              {hasDiscount && (
                <Badge className="bg-destructive text-destructive-foreground text-xs font-bold">-{discountPercent}%</Badge>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground">Alin hinta 30 päivän ajalta: {formatPriceFi(product.original_price!)}</p>
            )}
            <PurchaseFacts isCustom={isCustom} showDeliveryTime={product.supplier !== "aliexpress"} compact className="mt-1" />
          </div>

          {/* Images */}
          <div className="space-y-3">
            {/* Mobile: koko näytön levyinen pyyhkäistävä galleria */}
            <div className="md:hidden -mx-4 relative">
              <div
                className="flex overflow-x-auto snap-x snap-mandatory bg-muted"
                style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  if (idx !== activeImage) setActiveImage(idx);
                }}
              >
                {currentImages.map((img, i) => {
                  const { src, srcSet } = productImageSources(img);
                  return (
                    <img
                      key={`m-${selectedColor}-${i}`}
                      src={src}
                      srcSet={srcSet}
                      sizes={PRODUCT_IMAGE_SIZES}
                      alt={productImageAlt(product, { url: img, index: i, color: selectedColor })}
                      className="w-full shrink-0 snap-start aspect-square object-cover max-h-[calc(100svh-492px)] min-h-[220px]"
                      style={{ scrollSnapAlign: "start" }}
                      width={800}
                      height={800}
                      loading={i === 0 ? "eager" : "lazy"}
                      {...({ fetchpriority: i === 0 ? "high" : "auto" } as Record<string, string>)}
                      decoding={i === 0 ? "sync" : "async"}
                    />
                  );
                })}
              </div>
              <div className="absolute top-3 left-4 flex flex-col gap-1 pointer-events-none">
                {product.is_gift_idea && <Badge className="bg-secondary text-secondary-foreground font-bold">LAHJAIDEA 🎁</Badge>}
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground font-bold">-{discountPercent}%</Badge>
                )}
              </div>
              {currentImages.length > 1 && (
                <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 pointer-events-none" aria-hidden="true">
                  {currentImages.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImage === i ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: main image + thumbnails */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden hidden md:block">
              {(() => {
                const mainUrl = currentImages[activeImage] || currentImages[0];
                const { src, srcSet } = productImageSources(mainUrl);
                return (
                  <img
                    src={src}
                    srcSet={srcSet}
                    sizes={PRODUCT_IMAGE_SIZES}
                    alt={productImageAlt(product, { url: mainUrl, index: activeImage, color: selectedColor })}
                    className="w-full h-full object-cover"
                    width={800}
                    height={800}
                  />
                );
              })()}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {product.is_gift_idea && <Badge className="bg-secondary text-secondary-foreground font-bold">LAHJAIDEA 🎁</Badge>}
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground font-bold">-{discountPercent}%</Badge>
                )}
              </div>
            </div>
            {currentImages.length > 1 && (
              <div className="hidden md:flex gap-2 overflow-x-auto pb-1">
                {currentImages.map((img, i) => (
                  <button
                    key={`${selectedColor}-${i}`}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      activeImage === i ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={proxiedImage(img, { width: 320 }) || img}
                      alt={productImageAlt(product, { url: img, index: i, color: selectedColor })}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={64}
                      height={64}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-2.5 md:space-y-5 mt-2 md:mt-0">
            {/* Desktop only: name/price/facts — on mobile these are shown above the gallery */}
            <div className="hidden md:block">
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">{product.name}</h1>
              <div>
                <div className="flex items-center gap-3">
                  {hasDiscount && (
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPriceFi(product.original_price!)}
                    </span>
                  )}
                  <span className={`text-2xl md:text-3xl font-bold ${hasDiscount ? "text-destructive" : "text-primary"}`}>
                    {formatPriceFi(product.price)}
                  </span>
                  {hasDiscount && (
                    <Badge className="bg-destructive text-destructive-foreground font-bold text-sm">-{discountPercent}%</Badge>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Alin hinta 30 päivän ajalta: {formatPriceFi(product.original_price!)}
                  </p>
                )}
                <PurchaseFacts isCustom={isCustom} showDeliveryTime={product.supplier !== "aliexpress"} className="mt-2 text-sm" />
              </div>
            </div>

            {/* Color + size selector — ref used by sticky bar scroll-to */}
            {hasColors && (
              <div ref={variantSectionRef}>
                <span className="text-xs md:text-sm font-medium text-foreground mb-1 md:mb-2 block">
                  Väri{selectedColor ? `: ${selectedColor}` : ""}
                </span>
                <div
                  className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible"
                  style={{ scrollbarWidth: "none" }}
                  role="radiogroup"
                  aria-label="Väri"
                >
                  {uniqueColors.map((color: string) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={selectedColor === color}
                      onClick={() => handleColorSelect(color)}
                      className={`shrink-0 px-3 md:px-4 h-9 md:h-11 rounded-md border text-sm font-medium transition-colors ${
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector + kokoapu */}
            {hasSizes && (
              <div ref={!hasColors ? variantSectionRef : undefined}>
                <div className="flex items-center justify-between mb-1 md:mb-2 min-h-[20px]">
                  <span className="text-xs md:text-sm font-medium text-foreground">Koko{selectedSize ? `: ${selectedSize}` : ""}</span>
                  {isClothingCategory(product.category) && (
                    <SizeGuide
                      category={product.category}
                      sizes={sortSizes(product.variants.sizes!)}
                      description={product.description}
                      isCustom={isCustom}
                    />
                  )}
                </div>
                <div
                  className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible"
                  style={{ scrollbarWidth: "none" }}
                  role="radiogroup"
                  aria-label="Koko"
                >
                  {sellableSizes.map((size: string) => (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={selectedSize === size}
                      onClick={() => setSelectedSize(size)}
                      className={`shrink-0 min-w-[44px] px-3 md:px-4 h-9 md:h-11 rounded-md border text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom text input */}
            {isCustom && (
              <div>
                <label htmlFor="custom-text-input" className="text-sm font-medium text-foreground mb-2 block">
                  Minkä tekstin/kuvan haluat tuotteeseen? ✍️ <span className="text-primary">*</span>
                </label>
                <Textarea
                  id="custom-text-input"
                  placeholder="Kirjoita haluamasi teksti tai kuvaile kuvatoiveesi tähän..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="bg-muted border-border resize-none"
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{customText.length}/200 merkkiä · Toiveesi kulkee tilauksen mukana meille asti</p>
              </div>
            )}

            {/* Määrä + Lisää koriin samalla rivillä */}
            <div className="flex items-stretch gap-3">
              <div className="flex items-center rounded-md border border-border shrink-0" role="group" aria-label="Määrä">
                <button type="button" aria-label="Vähennä määrää" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-12 text-foreground hover:bg-muted flex items-center justify-center font-bold">−</button>
                <span className="text-base font-bold text-foreground w-7 text-center" aria-live="polite">{quantity}</span>
                <button type="button" aria-label="Lisää määrää" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-12 text-foreground hover:bg-muted flex items-center justify-center font-bold">+</button>
              </div>
              <Button ref={addToCartBtnRef} onClick={handleAddToCart} size="lg" className="flex-1 h-12 bg-primary text-primary-foreground font-bold text-base md:text-lg shadow-glow-lime hover:scale-[1.02] transition-transform">
                <ShoppingCart className="h-5 w-5 mr-2" /> Lisää koriin
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PaymentIcons iconClassName="h-4 w-auto" />
              <span>Korttimaksu Stripen maksusivulla</span>
            </div>

            <DeliveryBadge supplier={product.supplier} className="w-fit" />

            {product.is_featured && (
              <Badge className="bg-accent text-accent-foreground font-bold w-fit">🔥 Suosittu tuote</Badge>
            )}

            {/* Share */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Share2 className="h-4 w-4" /> Jaa:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(product.name + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Facebook</a>
              <button onClick={handleCopyLink} className="text-sm text-primary hover:underline flex items-center gap-1"><Copy className="h-4 w-4" /> Kopioi</button>
            </div>
          </div>
        </div>

        {/* Sopii yhteen: täydentävät tuotteet ostoalueen alla (src/lib/recommendations.ts) */}
        <ComplementaryProducts base={[product]} all={allProducts} className="mt-12 max-w-3xl" />

        {/* Product description */}
        <section className="mt-12">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8 max-w-3xl">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Tuotekuvaus 📝</h2>
            <ProductDescription description={effectiveDescription} expanded={descExpanded} onToggle={() => setDescExpanded(prev => !prev)} />
          </div>
        </section>

        {/* Structured SEO content blocks: Material, Care, Scenarios, Why buy */}
        <section className="mt-8 max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="font-display text-lg text-foreground mb-2">Materiaali ja koot 🧵</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{seoCopy.material}</p>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="font-display text-lg text-foreground mb-2">Hoito-ohjeet 🧺</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{seoCopy.care}</p>
          </div>
          {!contentOverride && (<>
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="font-display text-lg text-foreground mb-2">Tositilanteita 🎬</h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {seoCopy.scenarios.map((s, i) => (
                <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-6">
            <h2 className="font-display text-lg text-foreground mb-2">Lahjavinkit 🎁</h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {seoCopy.giftUseCases.map((s, i) => (
                <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2 rounded-xl border border-border bg-card/50 p-6">
            <h2 className="font-display text-lg text-foreground mb-2">Miksi tämä lahjaksi 💚</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{seoCopy.whyBuy}</p>
          </div>
          </>)}
        </section>

        {/* Internal links: gift guide + category */}
        <section className="mt-8 max-w-3xl">
          <nav aria-label="Aiheeseen liittyvät sivut" className="flex flex-wrap gap-2 text-sm">
            {category && (
              <Link to={`/kategoria/${product.category}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50">
                {category.emoji} Kaikki {category.name.toLowerCase()}
              </Link>
            )}
            {matchingGiftGuide && (
              <Link to={`/lahjat/${matchingGiftGuide.slug}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50">
                {matchingGiftGuide.emoji} {matchingGiftGuide.h1}
              </Link>
            )}
            <Link to="/kaikki-tuotteet" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/50">
              🛍️ Kaikki tuotteet
            </Link>
          </nav>
        </section>

        {/* Related blog posts — hub & spoke */}
        {relatedBlogPosts.length > 0 && (
          <section className="mt-8 max-w-3xl">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Lue myös – lahjaoppaat:</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              {relatedBlogPosts.map(post => (
                <Link
                  key={post.slug}
                  to={`/blogi/${post.slug}`}
                  className="group flex-1 rounded-lg border border-border bg-card/50 hover:border-primary/50 transition-colors p-4"
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">{post.title}</p>
                  <span className="text-xs text-primary font-medium">Lue artikkeli →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* GEO/AI: Kenelle / Miksi / Mihin tilanteeseen (käsin kirjoitetussa kuvauksessa nämä on jo kerrottu) */}
        {!contentOverride && <section className="mt-8 max-w-3xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Lahjavinkki 💡</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Kenelle sopii</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{audience.charAt(0).toUpperCase() + audience.slice(1)}.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Miksi tämä on hauska lahja</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{whyFunny}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Mihin tilanteeseen</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{occasion.charAt(0).toUpperCase() + occasion.slice(1)}.</p>
              </div>
            </div>
          </div>
        </section>}

        {/* Customer Reviews: vain todennetut, päivätyt arviot (src/lib/productReviews.ts). Ei osiota, jos arvioita ei ole. */}
        {productReviews.length > 0 && <section id="asiakasarviot" className="mt-8 max-w-3xl scroll-mt-24">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Asiakasarviot ⭐</h2>
            {(() => {
              const reviews = productReviews;
              const avgStars = reviews.reduce((s, r) => s + r.stars, 0) / reviews.length;
              return (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < Math.round(avgStars) ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{avgStars.toFixed(1)} / 5 ({reviews.length} arvostelua)</span>
                  </div>
                  {/* Individual reviews */}
                  {reviews.map((review, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: review.stars }).map((_, s) => (
                              <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                            ))}
                            {Array.from({ length: 5 - review.stars }).map((_, s) => (
                              <Star key={`e-${s}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-foreground">{review.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">"{review.text}"</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>}

        {/* Product FAQ */}
        <section className="mt-8 max-w-3xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Usein kysyttyä ❓</h2>
            <div className="space-y-4">
              {productFaqsExtended.map((faq, i) => (
                <div key={i}>
                  <h3 className="font-medium text-foreground text-sm">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Lisää kysymyksiä? Katso <Link to="/usein-kysytyt-kysymykset" className="text-primary hover:underline">UKK-sivumme</Link> tai ota yhteyttä huumorikauppa@gmail.com
            </p>
          </div>
        </section>

        {/* Category link */}
        {category && (
          <section className="mt-6">
            <Link to={`/kategoria/${product.category}`} className="text-sm text-primary hover:underline">
              ← Takaisin kategoriaan: {category.emoji} {category.name}
            </Link>
          </section>
        )}

        {/* Same theme cross-sell */}
        {themeProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">Samalla teemalla eri tuotteina 🎯</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {themeProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">Saatat myös tykätä 😍</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* City-targeted recommendations (Vercel geo) with bestseller fallback */}
        <CityProductsSection
          allProducts={allProducts}
          currentProductId={product.id}
        />
        {/* Ostopalkin piilotusraja: tästä alaspäin palkki ei peitä sisältöä. */}
        <div ref={stickyEndRef} aria-hidden="true" className="h-px" />
      </div>

      {/* Sticky mobile add-to-cart bar */}
      <div
        className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-2xl pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="flex items-center gap-3 p-3">
          <img
            src={proxiedImage(currentImages[0] || product.images[0], { width: 320 }) || "/placeholder.svg"}
            alt=""
            className="w-12 h-12 rounded-md object-cover bg-muted shrink-0"
            width={48}
            height={48}
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
            <p className="text-sm font-bold text-primary">{formatPriceFi(product.price)}</p>
          </div>
          <Button
            onClick={(needsSize && !selectedSize) || (needsColor && !selectedColor) ? scrollToVariants : handleAddToCart}
            size="lg"
            className="bg-primary text-primary-foreground font-bold shrink-0 shadow-glow-lime"
          >
            {(needsSize && !selectedSize) ? (
              "Valitse koko ↓"
            ) : (needsColor && !selectedColor) ? (
              "Valitse väri ↓"
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-1" /> Lisää koriin</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
