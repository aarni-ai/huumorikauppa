import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { proxiedImage } from "@/lib/imageProxy";
import { productImageAlt } from "@/lib/productNames";
import { quickAddOption } from "@/lib/recommendations";
import { valitseLisatarra } from "@/lib/lisatarra";

/** Ostoskorin "Lisää tarra" -rivi (src/lib/lisatarra.ts). */
export function TarraLisamyynti({ kori, kaikki, className = "" }: { kori: Product[]; kaikki: Product[]; className?: string }) {
  const { addItem } = useCartContext();
  const koriKey = kori.map((p) => p.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tarra = useMemo(() => valitseLisatarra(kori, kaikki), [koriKey, kaikki]);
  const [lisatty, setLisatty] = useState(false);
  if (!tarra || lisatty) return null;
  const valinta = quickAddOption(tarra);
  const hinta = tarra.price.toFixed(2).replace(".", ",");
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 ${className}`}>
      <Link to={`/tuote/${tarra.slug}`} className="shrink-0">
        <img
          src={proxiedImage(tarra.images[0]) || "/placeholder.svg"}
          alt={productImageAlt(tarra)}
          className="h-14 w-14 rounded-md bg-muted object-cover"
          loading="lazy"
          width={56}
          height={56}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Lisää tarra {hinta} €</p>
        <Link to={`/tuote/${tarra.slug}`} className="text-xs text-muted-foreground hover:text-foreground line-clamp-1">
          {tarra.name}
        </Link>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          if (valinta.kind !== "add") return;
          addItem(tarra, 1, valinta.size, valinta.color);
          setLisatty(true);
        }}
      >
        <Plus className="h-4 w-4 mr-1" /> Lisää
      </Button>
    </div>
  );
}
