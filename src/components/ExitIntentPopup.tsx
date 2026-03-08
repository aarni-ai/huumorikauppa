import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { ShoppingCart, X, ArrowRight } from "lucide-react";

const SESSION_KEY = "huumorikauppa-exit-intent-shown";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const { items, totalItems, totalPrice } = useCartContext();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // Desktop: mouse leaving viewport from top
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 && items.length > 0) {
          const shown = sessionStorage.getItem(SESSION_KEY);
          if (shown) return;
          sessionStorage.setItem(SESSION_KEY, "true");
          setOpen(true);
        }
      };
      document.addEventListener("mouseout", handleMouseLeave);
      return () => document.removeEventListener("mouseout", handleMouseLeave);
    } else {
      // Mobile: detect rapid scroll up (user about to leave)
      let lastScrollY = window.scrollY;
      let rapidScrollCount = 0;

      const handleScroll = () => {
        const currentY = window.scrollY;
        if (currentY < lastScrollY && lastScrollY - currentY > 100) {
          rapidScrollCount++;
          if (rapidScrollCount >= 2 && items.length > 0) {
            const shown = sessionStorage.getItem(SESSION_KEY);
            if (!shown) {
              sessionStorage.setItem(SESSION_KEY, "true");
              setOpen(true);
            }
          }
        } else {
          rapidScrollCount = 0;
        }
        lastScrollY = currentY;
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [items.length]);

  const handleClose = () => setOpen(false);

  if (items.length === 0) return null;

  const shippingGap = 60 - totalPrice;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-card border-border max-w-[calc(100vw-2rem)] sm:max-w-sm p-0 overflow-hidden gap-0 [&>button]:hidden rounded-xl">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="h-8 w-8 text-primary" />
          </div>

          <div>
            <h2 className="font-display text-2xl text-foreground">
              Hei, unohditko jotain? 🛒
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sinulla on {totalItems} tuotetta ostoskorissasi ({totalPrice.toFixed(2)} €)
            </p>
          </div>

          {/* Cart preview */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-left">
            {items.slice(0, 3).map((item) => (
              <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-2 text-sm">
                <img
                  src={item.product.images[0] || "/placeholder.svg"}
                  alt={item.product.name}
                  className="w-10 h-10 rounded bg-muted object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-foreground line-clamp-1 text-xs font-medium">{item.product.name}</p>
                  <p className="text-primary text-xs font-bold">{(item.product.price * item.quantity).toFixed(2)} €</p>
                </div>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-xs text-muted-foreground">...ja {items.length - 3} muuta tuotetta</p>
            )}
          </div>

          {shippingGap > 0 && (
            <p className="text-xs text-primary font-medium">
              🚚 Lisää {shippingGap.toFixed(2)} € → ilmainen toimitus!
            </p>
          )}

          <div className="space-y-2 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full bg-primary text-primary-foreground font-bold shadow-glow-lime"
            >
              <Link to="/ostoskori" onClick={handleClose} className="flex items-center justify-center gap-2">
                Viimeistele tilaus <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <button
              onClick={handleClose}
              className="w-full text-sm font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors py-2"
            >
              Jatkan ostoksia
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
