import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { categories } from "@/data/products";
import { useProduct } from "@/hooks/use-products";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { sortSizes } from "@/lib/sortSizes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Share2, Ruler, Truck, RotateCcw, Shield, Copy, MessageCircle, ChevronDown, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductCard } from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductCopy, isGenericDescription } from "@/lib/productCopy";
import { isCustomTextProduct } from "@/lib/customProduct";
import { situationGifts } from "@/data/situationGifts";
import { blogPosts } from "@/data/blog";
import { proxiedImage } from "@/lib/imageProxy";

import { getProductReviews, getProductRating, type Review } from "@/lib/productReviews";
import { ProductRating } from "@/components/ProductRating";


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


const sizeGuide = [
  { size: "S", chest: "88–92", waist: "72–76", hip: "88–92" },
  { size: "M", chest: "96–100", waist: "80–84", hip: "96–100" },
  { size: "L", chest: "104–108", waist: "88–92", hip: "104–108" },
  { size: "XL", chest: "112–116", waist: "96–100", hip: "112–116" },
  { size: "XXL", chest: "120–124", waist: "104–108", hip: "120–124" },
];

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
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const el = addToCartBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product?.id]);

  const variantImages = useMemo(() => {
    return (product?.variants?.variant_images as Record<string, string[]>) || {};
  }, [product]);

  useEffect(() => {
    if (product && !selectedColor) {
      const defaultColor = product.variants.default_color as string | undefined;
      if (defaultColor && product.variants.colors?.includes(defaultColor)) {
        setSelectedColor(defaultColor);
      } else if (product.variants.colors?.[0]) {
        setSelectedColor(product.variants.colors[0]);
      }
    }
  }, [product, selectedColor]);

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

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Tuotetta ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const category = categories.find(c => c.slug === product.category);
  const hideSize = NO_SIZE_CATEGORIES.includes(product.category);
  const hasSizes = !hideSize && product.variants.sizes && product.variants.sizes.length > 1;
  const hasColors = product.variants.colors && product.variants.colors.length > 0;
  const uniqueColors = [...new Set((product.variants.colors || []) as string[])];
  const needsSize = hasSizes && !selectedSize;
  const needsColor = hasColors && !selectedColor;
  const isCustom = isCustomTextProduct(product);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const categoryName = category?.name || product.category;

  const useGeneratedDescription = isGenericDescription(product.description);
  const effectiveDescription = useGeneratedDescription ? seoCopy.longDescription : product.description;

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
    const size = hideSize ? product.variants.sizes?.[0] : selectedSize;
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

  const productReviewsForSchema = getProductReviews({ id: product.id, name: product.name, category: product.category });
  const avgRatingForSchema = productReviewsForSchema.reduce((s, r) => s + r.stars, 0) / productReviewsForSchema.length;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": effectiveDescription.slice(0, 5000),
    "image": allProductImages.map(img => {
      const abs = img.startsWith("http") ? img : `https://huumorikauppa.fi${img}`;
      return toProxiedImage(abs);
    }),
    "url": `https://huumorikauppa.fi/tuote/${product.slug}`,
    "sku": product.slug,
    "mpn": product.id,
    "brand": { "@type": "Brand", "name": "Huumorikauppa" },
    "category": categoryName,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRatingForSchema.toFixed(1),
      "reviewCount": String(productReviewsForSchema.length),
      "bestRating": "5",
      "worstRating": "1"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price.toFixed(2),
      "priceCurrency": "EUR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": { "@type": "Organization", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
      "url": `https://huumorikauppa.fi/tuote/${product.slug}`,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      ...(hasDiscount && product.original_price ? {
        "priceSpecification": {
          "@type": "PriceSpecification",
          "price": product.price.toFixed(2),
          "priceCurrency": "EUR",
          "valueAddedTaxIncluded": true
        }
      } : {}),
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "EUR"
        },
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "FI" },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2, "unitCode": "DAY" },
          "transitTime": { "@type": "QuantitativeValue", "minValue": 2, "maxValue": 4, "unitCode": "DAY" }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "FI",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility"
      }
    }
  };

  const productFaqs = [
    { q: "Onko tämä hyvä lahja?", a: `${product.name} on erinomainen lahja syntymäpäiviin, jouluksi tai ihan vaan piristykseksi. Hauskuus taattu!` },
    { q: "Kuinka nopeasti saan tilauksen?", a: "Toimitamme 3–10 arkipäivässä koko Suomeen. Yli 60 € tilaukset toimitetaan ilmaiseksi." },
    { q: "Voinko palauttaa tuotteen?", a: "Kyllä! Sinulla on 14 päivän palautusoikeus." },
  ];

  // GEO/AI: heuristinen "Kenelle sopii / Miksi hauska / Mihin tilanteeseen"
  const _t = (product.name + " " + product.description).toLowerCase();
  const audience = (() => {
    if (_t.includes("äiti") || _t.includes("mamma") || _t.includes("mummi")) return "äidille, mummille tai anopille — kenelle tahansa elämäsi tärkeälle naiselle";
    if (_t.includes("isä") || _t.includes("iskä") || _t.includes("ukki")) return "isälle, ukille tai sedälle — miehelle joka rakastaa sopivan ronskia huumoria";
    if (_t.includes("kala")) return "kalastusta harrastavalle isälle, sedälle tai kaverille";
    if (_t.includes("eläke") || _t.includes("museo")) return "eläkkeelle jäävälle työkaverille tai juuri eläköityneelle läheiselle";
    if (_t.includes("polttari") || _t.includes("morsian") || _t.includes("sulhanen")) return "polttariporukalle, morsiamelle tai sulhaselle";
    if (_t.includes("vauva") || product.category === "bodyt") return "vauvalle ja vanhemmille — turvallinen ja söpö lahja";
    if (product.category === "mukit") return "kahvinjuojalle, työkaverille tai itsellesi aamukahvia varten";
    return "kaverille, perheenjäsenelle tai työkaverille — tai vaikka itsellesi";
  })();
  const occasion = (() => {
    if (_t.includes("äiti")) return "äitienpäivään, äidin syntymäpäiviin ja ihan vaan kiitokseksi";
    if (_t.includes("isä")) return "isänpäivään, isän syntymäpäiviin ja jouluksi";
    if (_t.includes("eläke")) return "eläkejuhliin ja läksiäisiin";
    if (_t.includes("polttari")) return "polttareihin ja häihin";
    if (_t.includes("joulu")) return "jouluksi, pikkujouluihin ja kalenterin täytteeksi";
    if (product.category === "bodyt") return "vauvanristiäisiin, ristiäislahjaksi ja vauvanpäiville";
    return "syntymäpäiviin, jouluun, pikkujouluihin ja yllätyslahjaksi";
  })();
  const whyFunny = `${product.name} on hauska, koska se yhdistää tutun arkitilanteen ja yllättävän tekstin — juuri sellaisen lahjan, joka jää muistiin pidemmäksi aikaa kuin tavallinen lahja.`;

  // Kasvatetaan FAQ:t AI-vastauksia varten
  const productFaqsExtended = [
    ...productFaqs,
    { q: "Kenelle tämä tuote sopii?", a: `Tämä ${categoryName.toLowerCase().replace(/t$/, "")} sopii ${audience}.` },
    { q: "Mihin tilanteeseen tämä on hyvä lahja?", a: `${product.name} sopii ${occasion}.` },
    { q: "Miksi tämä on hauska lahja?", a: whyFunny },
  ];

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
  const metaDesc = seoCopy.shortDescription;

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
      <div className="container py-6 md:py-10">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <Link to={`/kategoria/${product.category}`} className="hover:text-foreground">
            {category?.emoji} {category?.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Images */}
          <div className="space-y-3">
            {/* Mobile: swipeable scroll-snap gallery */}
            <div className="md:hidden">
              <div
                className="relative flex overflow-x-auto snap-x snap-mandatory rounded-lg bg-muted scrollbar-hide"
                style={{ scrollSnapType: "x mandatory" }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  if (idx !== activeImage) setActiveImage(idx);
                }}
              >
                {currentImages.map((img, i) => (
                  <img
                    key={`m-${selectedColor}-${i}`}
                    src={proxiedImage(img) || img}
                    alt={`${product.name}${selectedColor ? ' – ' + selectedColor : ''} – ${categoryName} kuva ${i + 1}`}
                    className="w-full aspect-square object-cover shrink-0 snap-start"
                    style={{ scrollSnapAlign: "start" }}
                    width={600}
                    height={600}
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                ))}
                <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
                  {product.is_gift_idea && <Badge className="bg-secondary text-secondary-foreground font-bold">LAHJAIDEA 🎁</Badge>}
                  {hasDiscount && (
                    <Badge className="bg-destructive text-destructive-foreground font-bold">-{discountPercent}%</Badge>
                  )}
                </div>
              </div>
              {currentImages.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
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
              <img
                src={proxiedImage(currentImages[activeImage] || currentImages[0]) || "/placeholder.svg"}
                alt={`${product.name}${selectedColor ? ' – ' + selectedColor : ''} – Osta ${categoryName} Huumorikaupasta`}
                className="w-full h-full object-cover"
                width={600}
                height={600}
              />
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
                      src={proxiedImage(img) || img}
                      alt={`${product.name}${selectedColor ? ' ' + selectedColor : ''} – ${categoryName} kuva ${i + 1} | Huumorikauppa`}
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
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">{product.name}</h1>
              <div>
                <div className="flex items-center gap-3">
                  {hasDiscount && (
                    <span className="text-xl text-muted-foreground line-through">
                      {product.original_price!.toFixed(2)} €
                    </span>
                  )}
                  <span className={`text-2xl md:text-3xl font-bold ${hasDiscount ? "text-destructive" : "text-primary"}`}>
                    {product.price.toFixed(2)} €
                  </span>
                  {hasDiscount && (
                    <Badge className="bg-destructive text-destructive-foreground font-bold text-sm">-{discountPercent}%</Badge>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Alin hinta 30 päivän ajalta: {product.original_price!.toFixed(2)} €
                  </p>
                )}
              </div>
            </div>

            {product.is_featured && (
              <Badge className="bg-accent text-accent-foreground font-bold w-fit">🔥 Suosittu tuote</Badge>
            )}
            {product.stock <= 10 && product.stock > 0 && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-md px-3 py-2">
                <span className="text-sm font-bold">🔥 Vain {product.stock} kpl jäljellä – tilaa ennen kuin loppuu!</span>
              </div>
            )}

            {/* Color selector */}
            {hasColors && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Väri{selectedColor ? `: ${selectedColor}` : ""}
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
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

            {/* Size selector with modal size chart */}
            {hasSizes && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Koko</label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Ruler className="h-3 w-3" /> Kokotaulukko
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="font-display text-foreground">Kokotaulukko (cm)</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="py-2 text-left">Koko</th>
                              <th className="py-2 text-left">Rinta</th>
                              <th className="py-2 text-left">Vyötärö</th>
                              <th className="py-2 text-left">Lantio</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sizeGuide.map(row => (
                              <tr key={row.size} className="border-b border-border/50">
                                <td className="py-2 font-medium text-foreground">{row.size}</td>
                                <td className="py-2 text-muted-foreground">{row.chest}</td>
                                <td className="py-2 text-muted-foreground">{row.waist}</td>
                                <td className="py-2 text-muted-foreground">{row.hip}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sortSizes(product.variants.sizes!).map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
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

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Määrä</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-md border border-border text-foreground hover:bg-muted flex items-center justify-center font-bold">−</button>
                <span className="text-lg font-bold text-foreground w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 rounded-md border border-border text-foreground hover:bg-muted flex items-center justify-center font-bold">+</button>
              </div>
            </div>

            {/* Add to cart */}
            <Button ref={addToCartBtnRef} onClick={handleAddToCart} size="lg" className="w-full bg-primary text-primary-foreground font-bold text-lg shadow-glow-lime hover:scale-[1.02] transition-transform">
              <ShoppingCart className="h-5 w-5 mr-2" /> Lisää koriin
            </Button>

            <p className="text-xs text-muted-foreground">
              Maksu turvallisesti: Visa · Mastercard · Apple Pay · Google Pay · Klarna · MobilePay
            </p>

            {/* Share */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Share2 className="h-4 w-4" /> Jaa:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(product.name + " – " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Facebook</a>
              <button onClick={handleCopyLink} className="text-sm text-primary hover:underline flex items-center gap-1"><Copy className="h-4 w-4" /> Kopioi</button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-primary shrink-0" /> Ilmainen toimitus yli 60 €</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 text-primary shrink-0" /> 14 pv palautusoikeus</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4 text-primary shrink-0" /> Turvallinen maksu</div>
            </div>
          </div>
        </div>

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
            <h2 className="font-display text-lg text-foreground mb-2">Miksi asiakkaamme ostavat tämän 💚</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{seoCopy.whyBuy}</p>
          </div>
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

        {/* GEO/AI: Kenelle / Miksi / Mihin tilanteeseen */}
        <section className="mt-8 max-w-3xl">
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
        </section>

        {/* Customer Reviews */}
        <section className="mt-8 max-w-3xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Asiakasarviot ⭐</h2>
            {(() => {
              const reviews = getProductReviews(product);
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
        </section>

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
            src={proxiedImage(product.images[0]) || "/placeholder.svg"}
            alt=""
            className="w-12 h-12 rounded-md object-cover bg-muted shrink-0"
            width={48}
            height={48}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
            <p className="text-sm font-bold text-primary">{product.price.toFixed(2)} €</p>
          </div>
          <Button
            onClick={handleAddToCart}
            size="lg"
            className="bg-primary text-primary-foreground font-bold shrink-0 shadow-glow-lime"
          >
            <ShoppingCart className="h-4 w-4 mr-1" /> Lisää
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
