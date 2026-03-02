import { useParams, Link } from "react-router-dom";
import { categories } from "@/data/products";
import { useProduct } from "@/hooks/use-products";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Share2, Ruler, Truck, RotateCcw, Shield, Copy, MessageCircle, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductCard } from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

const sizeGuide = [
  { size: "S", chest: "88–92", waist: "72–76", hip: "88–92" },
  { size: "M", chest: "96–100", waist: "80–84", hip: "96–100" },
  { size: "L", chest: "104–108", waist: "88–92", hip: "104–108" },
  { size: "XL", chest: "112–116", waist: "96–100", hip: "112–116" },
  { size: "XXL", chest: "120–124", waist: "104–108", hip: "120–124" },
];

const isMugCategory = (category: string) => category === "mukit";

const ProductPage = () => {
  const { slug } = useParams();
  const { product, products: allProducts = [], isLoading } = useProduct(slug);
  const { addItem } = useCartContext();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

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
  const isMug = isMugCategory(product.category);
  const hasSizes = !isMug && product.variants.sizes && product.variants.sizes.length > 1;
  const hasColors = product.variants.colors && product.variants.colors.length > 0;
  const needsSize = hasSizes && !selectedSize;
  const needsColor = hasColors && !selectedColor;

  const handleAddToCart = () => {
    if (needsSize) {
      toast({ title: "Valitse koko ensin! 📏", variant: "destructive" });
      return;
    }
    if (needsColor) {
      toast({ title: "Valitse väri ensin! 🎨", variant: "destructive" });
      return;
    }
    const size = isMug ? product.variants.sizes?.[0] : selectedSize;
    addItem(product, quantity, size, selectedColor);
    toast({
      title: "Lisätty koriin! 🛒",
      description: `${product.name} (${quantity} kpl) on nyt ostoskorissasi.`,
    });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Linkki kopioitu! 📋" });
  };

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images[0] || "/placeholder.svg",
    "url": `https://huumorikauppa.fi/tuote/${product.slug}`,
    "brand": { "@type": "Brand", "name": "Huumorikauppa" },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "EUR",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": { "@type": "Organization", "name": "Huumorikauppa" }
    }
  };

  const categoryName = category?.name || product.category;
  const descriptionShort = product.description.length > 120 
    ? product.description.slice(0, 120) + "…" 
    : product.description;

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${product.name} – Osta ${categoryName} | Huumorikauppa`}
        description={product.description.slice(0, 155)}
        canonical={`https://huumorikauppa.fi/tuote/${product.slug}`}
        jsonLd={productJsonLd}
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
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={product.images[0] || "/placeholder.svg"}
              alt={`${product.name} – hauska ${categoryName} Huumorikaupasta`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.is_new && <Badge className="bg-accent text-accent-foreground font-bold">UUTUUS 🔥</Badge>}
              {product.is_gift_idea && <Badge className="bg-secondary text-secondary-foreground font-bold">LAHJAIDEA 🎁</Badge>}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">{product.name}</h1>
              <p className="text-2xl md:text-3xl font-bold text-primary">{product.price.toFixed(2)} €</p>
            </div>

            {product.stock <= 10 && product.stock > 0 && (
              <p className="text-sm font-bold text-destructive">Vain {product.stock} jäljellä – tilaa nyt! 😱</p>
            )}

            {hasSizes && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">Koko</label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Ruler className="h-3 w-3" /> Koko-opas
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="font-display text-foreground">Koko-opas (cm)</DialogTitle>
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
                  {product.variants.sizes!.map(size => (
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

            {hasColors && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Väri</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.colors!.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
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

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Määrä</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-md border border-border text-foreground hover:bg-muted flex items-center justify-center font-bold">−</button>
                <span className="text-lg font-bold text-foreground w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 rounded-md border border-border text-foreground hover:bg-muted flex items-center justify-center font-bold">+</button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddToCart} size="lg" className="flex-1 bg-primary text-primary-foreground font-bold text-lg shadow-glow-lime hover:scale-[1.02] transition-transform">
                <ShoppingCart className="h-5 w-5 mr-2" /> Lisää koriin
              </Button>
              <Button variant="outline" size="lg" onClick={() => { setWishlisted(!wishlisted); toast({ title: wishlisted ? "Poistettu suosikeista" : "Lisätty suosikkeihin ❤️" }); }} className="border-border">
                <Heart className={`h-5 w-5 ${wishlisted ? "fill-secondary text-secondary" : ""}`} />
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Share2 className="h-4 w-4" /> Jaa kaverille:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(product.name + " – " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Facebook</a>
              <button onClick={handleCopyLink} className="text-sm text-primary hover:underline flex items-center gap-1"><Copy className="h-4 w-4" /> Kopioi</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-primary shrink-0" /> Ilmainen toimitus yli 60 €</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 text-primary shrink-0" /> 14 pv palautusoikeus</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4 text-primary shrink-0" /> Turvallinen maksu</div>
            </div>
          </div>
        </div>

        {/* Product description section – visual card with read more */}
        <section className="mt-12">
          <div className="rounded-xl border border-border bg-card/50 p-6 md:p-8 max-w-3xl">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Tuotekuvaus 📝</h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {descExpanded || product.description.length <= 120 ? (
                <p>{product.description}</p>
              ) : (
                <>
                  <p>{descriptionShort}</p>
                  <button
                    onClick={() => setDescExpanded(true)}
                    className="mt-3 text-primary font-medium text-sm hover:underline inline-flex items-center gap-1"
                  >
                    Lue lisää <ChevronDown className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            {descExpanded && product.description.length > 120 && (
              <button
                onClick={() => setDescExpanded(false)}
                className="mt-3 text-primary font-medium text-sm hover:underline inline-flex items-center gap-1"
              >
                Näytä vähemmän <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            )}
          </div>
        </section>

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
