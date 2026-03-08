import { useParams, Link } from "react-router-dom";
import { categories } from "@/data/products";
import { useProduct } from "@/hooks/use-products";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Share2, Ruler, Truck, RotateCcw, Shield, Copy, MessageCircle, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductCard } from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

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

function ProductFaqSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.id = "product-faq-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [faqs]);
  return null;
}

const sizeGuide = [
  { size: "S", chest: "88–92", waist: "72–76", hip: "88–92" },
  { size: "M", chest: "96–100", waist: "80–84", hip: "96–100" },
  { size: "L", chest: "104–108", waist: "88–92", hip: "104–108" },
  { size: "XL", chest: "112–116", waist: "96–100", hip: "112–116" },
  { size: "XXL", chest: "120–124", waist: "104–108", hip: "120–124" },
];

const NO_SIZE_CATEGORIES = ["mukit", "tarrat", "seinataulut", "peitot", "koristeet"];

function isCustomTextProduct(product: { name: string; description: string }): boolean {
  const t = (product.name + ' ' + product.description).toLowerCase();
  return t.includes('oma teksti') || t.includes('oma kuva') || t.includes('custom text') || t.includes('personoi');
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
    if (selectedColor && variantImages[selectedColor]?.length > 0) {
      return variantImages[selectedColor];
    }
    return product?.images || [];
  }, [selectedColor, variantImages, product]);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedColor]);

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
  const needsSize = hasSizes && !selectedSize;
  const needsColor = hasColors && !selectedColor;
  const isCustom = isCustomTextProduct(product);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (needsSize) {
      toast({ title: "Valitse koko ensin! 📏", variant: "destructive" });
      return;
    }
    if (needsColor) {
      toast({ title: "Valitse väri ensin! 🎨", variant: "destructive" });
      return;
    }
    const size = hideSize ? product.variants.sizes?.[0] : selectedSize;
    addItem(product, quantity, size, selectedColor);
    toast({
      title: "Lisätty koriin! 🛒",
      description: `${product.name} (${quantity} kpl) on nyt ostoskorissasi.${customText ? ' Teksti: ' + customText : ''}`,
    });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Linkki kopioitu! 📋" });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": currentImages[0] || "/placeholder.svg",
    "url": `https://huumorikauppa.fi/tuote/${product.slug}`,
    "brand": { "@type": "Brand", "name": "Huumorikauppa" },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "EUR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": { "@type": "Organization", "name": "Huumorikauppa" },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingDestination": { "@type": "DefinedRegion", "addressCountry": "FI" },
        "freeShippingThreshold": { "@type": "MonetaryAmount", "value": 60, "currency": "EUR" },
        "deliveryTime": { "@type": "ShippingDeliveryTime", "businessDays": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 10 } }
      }
    }
  };

  const productFaqs = [
    { q: "Onko tämä hyvä lahja?", a: `${product.name} on erinomainen lahja syntymäpäiviin, jouluksi tai ihan vaan piristykseksi. Hauskuus taattu!` },
    { q: "Kuinka nopeasti saan tilauksen?", a: "Toimitamme 3–10 arkipäivässä koko Suomeen. Yli 60 € tilaukset toimitetaan ilmaiseksi." },
    { q: "Voinko palauttaa tuotteen?", a: "Kyllä! Sinulla on 14 päivän palautusoikeus." },
  ];

  const productFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": productFaqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category?.name || product.category, url: `https://huumorikauppa.fi/kategoria/${product.category}` },
    { name: product.name, url: `https://huumorikauppa.fi/tuote/${product.slug}` },
  ];

  const categoryName = category?.name || product.category;

  const shortDesc = product.description.length > 200
    ? product.description.slice(0, 200) + "…"
    : product.description;

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${product.name} – Osta ${categoryName} | Huumorikauppa`}
        description={`${product.name} – ${product.description.slice(0, 120)}. Ilmainen toimitus yli 60 €. 14 pv palautusoikeus.`}
        canonical={`https://huumorikauppa.fi/tuote/${product.slug}`}
        jsonLd={productJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={currentImages[0]}
      />
      {/* FAQ Schema injected separately */}
      <ProductFaqSchema faqs={productFaqs} />

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
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={currentImages[activeImage] || currentImages[0] || "/placeholder.svg"}
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
              <div className="flex gap-2 overflow-x-auto pb-1">
                {currentImages.map((img, i) => (
                  <button
                    key={`${selectedColor}-${i}`}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      activeImage === i ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={img} alt={`${product.name} kuva ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">{product.name}</h1>
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
            </div>

            {product.stock <= 10 && product.stock > 0 && (
              <p className="text-sm font-bold text-destructive">Vain {product.stock} jäljellä – tilaa nyt! 😱</p>
            )}

            {/* Color selector */}
            {hasColors && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Väri{selectedColor ? `: ${selectedColor}` : ""}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.colors!.map((color: string) => (
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
                  {product.variants.sizes!.map((size: string) => (
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
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Minkä tekstin haluat tuotteeseen? ✍️
                </label>
                <Textarea
                  placeholder="Kirjoita haluamasi teksti tähän..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="bg-muted border-border resize-none"
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{customText.length}/200 merkkiä</p>
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
            <Button onClick={handleAddToCart} size="lg" className="w-full bg-primary text-primary-foreground font-bold text-lg shadow-glow-lime hover:scale-[1.02] transition-transform">
              <ShoppingCart className="h-5 w-5 mr-2" /> Lisää koriin
            </Button>

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
            <ProductDescription description={product.description} expanded={descExpanded} onToggle={() => setDescExpanded(prev => !prev)} />
          </div>
        </section>

        {/* Product FAQ */}
        <section className="mt-8 max-w-3xl">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Usein kysyttyä ❓</h2>
            <div className="space-y-4">
              {productFaqs.map((faq, i) => (
                <div key={i}>
                  <h3 className="font-medium text-foreground text-sm">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Lisää kysymyksiä? Katso <Link to="/usein-kysytyt-kysymykset" className="text-primary hover:underline">UKK-sivumme</Link> tai ota yhteyttä info@huumorikauppa.fi
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
    </div>
  );
};

export default ProductPage;
