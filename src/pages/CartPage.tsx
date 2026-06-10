import { Link } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { useMemo } from "react";

const FREE_SHIPPING = 60;

const CartPage = () => {
  usePrerenderReady();
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartContext();
  const { data: allProducts = [] } = useProducts();

  const shippingFree = totalPrice >= FREE_SHIPPING;
  const shippingCost = shippingFree ? 0 : 5.95;
  const shippingGap = Math.max(0, FREE_SHIPPING - totalPrice);
  const shippingProgress = Math.min(100, (totalPrice / FREE_SHIPPING) * 100);

  const cartProductIds = new Set(items.map((i) => i.product.id));
  const upsellProducts = useMemo(() => {
    const cartCategories = [...new Set(items.map((i) => i.product.category))];
    return allProducts
      .filter((p) => !cartProductIds.has(p.id) && cartCategories.includes(p.category))
      .slice(0, 4);
  }, [allProducts, items]);

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center space-y-6">
        <SEOHead title="Ostoskori – Huumorikauppa" description="Ostoskorisi on tyhjä. Selaa Huumorikaupan hauskoja tuotteita!" noindex={true} />
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="font-display text-3xl text-foreground">Ostoskori on tyhjä 😅</h1>
        <p className="text-muted-foreground">Etkö löytänyt mitään hauskaa? Mahdotonta!</p>
        <Button asChild className="bg-primary text-primary-foreground font-bold">
          <Link to="/kaikki-tuotteet">Selaa tuotteita 🛒</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <SEOHead title="Ostoskori – Huumorikauppa" description="Tarkista ostoskorisi ja jatka kassalle." noindex={true} />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8">Ostoskori 🛒</h1>

      {/* Shipping progress bar */}
      {!shippingFree ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              Lisää <span className="font-bold text-primary">{shippingGap.toFixed(2)} €</span> tilaukseen → ilmainen toimitus!
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{totalPrice.toFixed(2)} € / {FREE_SHIPPING} €</p>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-primary">Ilmainen toimitus! 🎉</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${item.customText || ""}`} className="flex gap-4 bg-card border border-border rounded-lg p-4">
              <Link to={`/tuote/${item.product.slug}`} className="shrink-0">
                <img
                  src={item.product.images[0] || "/placeholder.svg"}
                  alt={`${item.product.name} – ostoskorissa`}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-md bg-muted"
                  loading="lazy"
                  width={96}
                  height={96}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/tuote/${item.product.slug}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                  {item.product.name}
                </Link>
                <div className="text-sm text-muted-foreground mt-1 space-x-2">
                  {item.selectedSize && <span>Koko: {item.selectedSize}</span>}
                  {item.selectedColor && <span>Väri: {item.selectedColor}</span>}
                </div>
                {item.customText && (
                  <p className="text-sm text-primary mt-1 break-words">✍️ Oma teksti: ”{item.customText}”</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor, item.customText)}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold text-foreground w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor, item.customText)}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">{(item.product.price * item.quantity).toFixed(2)} €</span>
                    <button
                      onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor, item.customText)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Upsell */}
          {upsellProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">
                {shippingFree ? "Täydennä lahjaasi:" : `Lisää ${shippingGap.toFixed(2)} € → ilmainen toimitus:`}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {upsellProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/tuote/${p.slug}`}
                    className="group rounded-lg border border-border bg-card hover:border-primary/50 transition-colors overflow-hidden"
                  >
                    <img
                      src={p.images[0] || "/placeholder.svg"}
                      alt={p.name}
                      className="w-full aspect-square object-cover bg-muted"
                      loading="lazy"
                    />
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-xs font-bold text-primary mt-0.5">{p.price.toFixed(2)} €</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-card border border-border rounded-lg p-6 h-fit space-y-4 sticky top-32">
          <h2 className="font-display text-xl text-foreground">Yhteenveto</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tuotteet ({totalItems} kpl)</span>
              <span>{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Toimitus</span>
              <span>{shippingFree ? <span className="text-primary font-medium">Ilmainen 🎉</span> : `${shippingCost.toFixed(2)} €`}</span>
            </div>
            {!shippingFree && (
              <p className="text-xs text-primary font-medium">
                + {shippingGap.toFixed(2)} € → ilmainen toimitus
              </p>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Yhteensä</span>
              <span className="text-primary">{(totalPrice + shippingCost).toFixed(2)} €</span>
            </div>
          </div>

          {/* Discount code */}
          <div className="flex gap-2">
            <Input placeholder="Alennuskoodi" className="h-9 bg-muted border-border text-sm" />
            <Button variant="outline" size="sm" className="shrink-0 border-border">
              Käytä
            </Button>
          </div>

          <Button asChild size="lg" className="w-full bg-primary text-primary-foreground font-bold shadow-glow-lime hover:scale-[1.02] transition-transform">
            <Link to="/kassa" className="flex items-center justify-center gap-2">
              Jatka kassalle <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>🔒 Turvallinen SSL-suojattu maksu</p>
            <p>🚚 Toimitus 3–10 arkipäivää</p>
            <p>↩️ 14 pv palautusoikeus</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
