import { Link } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";

const CartPage = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems, clearCart } = useCartContext();

  const shippingFree = totalPrice >= 60;
  const shippingCost = shippingFree ? 0 : 5.95;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center space-y-6">
        <SEOHead title="Ostoskori – Huumorikauppa" description="Ostoskorisi on tyhjä. Selaa Huumorikaupan hauskoja tuotteita!" />
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
      <SEOHead title="Ostoskori – Huumorikauppa" description="Tarkista ostoskorisi ja jatka kassalle." />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8">Ostoskori 🛒</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 bg-card border border-border rounded-lg p-4">
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
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold text-foreground w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">{(item.product.price * item.quantity).toFixed(2)} €</span>
                    <button
                      onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              <p className="text-xs text-primary">
                Lisää {(60 - totalPrice).toFixed(2)} € saadaksesi ilmaisen toimituksen!
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
            <p>🚚 Toimitus 3–7 arkipäivää</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
