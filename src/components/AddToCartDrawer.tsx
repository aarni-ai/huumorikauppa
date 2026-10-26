import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCartContext } from "@/context/CartContext";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { productAlt } from "@/lib/seoAlt";
import { ComplementaryProducts } from "@/components/ComplementaryProducts";
import { FreeShippingProgress } from "@/components/FreeShippingProgress";
import { proxiedImage } from "@/lib/imageProxy";

export function AddToCartDrawer() {
  const { lastAddedItem, clearLastAdded, totalItems, totalPrice } =
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

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <SheetContent className="w-[100vw] sm:max-w-md bg-card border-border flex flex-col overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
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
                src={proxiedImage(lastAddedItem.product.images[0]) || "/placeholder.svg"}
                alt={productAlt(lastAddedItem.product, "lisätty ostoskoriin")}
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
                {lastAddedItem.customText && (
                  <p className="text-xs text-primary mt-1 break-words">
                    ✍️ Oma teksti: ”{lastAddedItem.customText}”
                  </p>
                )}
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
              <FreeShippingProgress total={totalPrice} className="pt-1" />
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

            {/* Sopii yhteen (src/lib/recommendations.ts): ei väitettä yhteisostoista */}
            <ComplementaryProducts
              base={[lastAddedItem.product]}
              all={allProducts}
              layout="list"
              onNavigate={handleClose}
              className="pt-4 border-t border-border"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
