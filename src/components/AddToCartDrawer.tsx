import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartContext } from "@/context/CartContext";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Product } from "@/types/product";

const SKIP_WORDS = new Set([
  "paita", "paidat", "huppari", "hupparit", "muki", "mukit", "tarra", "tarrat",
  "body", "bodyt", "peitto", "peitot", "pipo", "pipot", "laukku", "laukut",
  "taulu", "taulut", "koriste", "koristeet", "hauska", "hauskat", "kahvikuppi",
  "kahvimuki", "maailman", "paras", "pitkähihainen", "t-paita",
]);

function getUpsellProducts(product: Product, allProducts: Product[]): Product[] {
  const nameWords = product.name
    .toLowerCase()
    .split(/[\s\-–,!?()]+/)
    .filter((w) => w.length > 3 && !SKIP_WORDS.has(w));

  const crossCategory = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      p.category !== product.category &&
      nameWords.some((w) => p.name.toLowerCase().includes(w))
  );

  const sameCategory = allProducts.filter(
    (p) => p.id !== product.id && p.category === product.category
  );

  const result: Product[] = [];
  const seen = new Set<string>();

  for (const p of crossCategory) {
    if (result.length >= 4) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      result.push(p);
    }
  }
  for (const p of sameCategory) {
    if (result.length >= 4) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      result.push(p);
    }
  }

  return result;
}

export function AddToCartDrawer() {
  const { lastAddedItem, clearLastAdded, totalItems, totalPrice, addItem } =
    useCartContext();
  const { data: allProducts = [] } = useProducts();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (lastAddedItem) setOpen(true);
  }, [lastAddedItem]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => clearLastAdded(), 300);
  };

  const upsellProducts = useMemo(() => {
    if (!lastAddedItem) return [];
    return getUpsellProducts(lastAddedItem.product, allProducts);
  }, [lastAddedItem, allProducts]);

  const shippingGap = 60 - totalPrice;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-md bg-card border-border flex flex-col overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-foreground font-display text-lg">
            <Check className="h-5 w-5 text-primary" /> Lisätty ostoskoriin!
          </SheetTitle>
        </SheetHeader>

        {lastAddedItem && (
          <div className="flex-1 space-y-5 pt-4">
            {/* Added item */}
            <div className="flex gap-3">
              <img
                src={lastAddedItem.product.images[0] || "/placeholder.svg"}
                alt={lastAddedItem.product.name}
                className="w-20 h-20 rounded-md bg-muted object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm line-clamp-2">
                  {lastAddedItem.product.name}
                </p>
                <p className="text-primary font-bold mt-1">
                  {lastAddedItem.product.price.toFixed(2)} €
                </p>
                <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
                  {lastAddedItem.size && <span>Koko: {lastAddedItem.size}</span>}
                  {lastAddedItem.color && (
                    <span>Väri: {lastAddedItem.color}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Cart summary */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Korissa {totalItems} tuotetta
                </span>
                <span className="font-bold text-foreground">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
              {shippingGap > 0 && (
                <p className="text-xs text-primary font-medium">
                  🚚 Lisää {shippingGap.toFixed(2)} € → ilmainen toimitus!
                </p>
              )}
              {shippingGap <= 0 && (
                <p className="text-xs text-primary font-medium">
                  ✅ Ilmainen toimitus!
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                asChild
                size="lg"
                className="w-full bg-primary text-primary-foreground font-bold shadow-glow-lime"
              >
                <Link
                  to="/ostoskori"
                  onClick={handleClose}
                  className="flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" /> Siirry kassalle{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleClose}
                className="w-full border-border"
              >
                Jatka ostoksia
              </Button>
            </div>

            {/* Upsell */}
            {upsellProducts.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-display text-base text-foreground mb-3">
                  Muut ostivat myös 🔥
                </h3>
                <div className="space-y-3">
                  {upsellProducts.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      to={`/tuote/${p.slug}`}
                      onClick={handleClose}
                      className="flex gap-3 group hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                    >
                      <img
                        src={p.images[0] || "/placeholder.svg"}
                        alt={p.name}
                        className="w-14 h-14 rounded-md bg-muted object-cover shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {p.name}
                        </p>
                        <p className="text-sm font-bold text-primary mt-0.5">
                          {p.price.toFixed(2)} €
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
