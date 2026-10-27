import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import type { CartItem, Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { proxiedImage } from "@/lib/imageProxy";
import { productImageAlt } from "@/lib/productNames";
import { valitseMittarinLisa } from "@/lib/lisatarra";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/**
 * Ilmaisen toimituksen mittarin lisätuote ostoskorissa: yksi tarra tai juliste, joka kuroo puuttuvan summan parhaiten
 * umpeen ja pitää korin katteen positiivisena (src/lib/lisatarra.ts valitseMittarinLisa). Lisäys yhdellä painalluksella.
 */
export function MittarinLisatuote({ items, kaikki, className = "" }: { items: CartItem[]; kaikki: Product[]; className?: string }) {
  const { addItem } = useCartContext();
  const koriKey = items.map((i) => `${i.product.id}:${i.quantity}:${i.selectedSize || ""}:${i.selectedColor || ""}`).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ehdotus = useMemo(() => valitseMittarinLisa(items, kaikki), [koriKey, kaikki]);
  const [lisatty, setLisatty] = useState<string | null>(null);
  if (!ehdotus || lisatty === ehdotus.product.id) return null;
  const { product, size, color, ilmainenJalkeen, puuttuuJalkeen } = ehdotus;
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3 ${className}`}>
      <Link to={`/tuote/${product.slug}`} className="shrink-0">
        <img
          src={proxiedImage(product.images[0]) || "/placeholder.svg"}
          alt={productImageAlt(product)}
          className="h-14 w-14 rounded-md bg-muted object-cover"
          loading="lazy"
          width={56}
          height={56}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/tuote/${product.slug}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-1">
          {product.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {eur(product.price)}
          {" · "}
          {ilmainenJalkeen ? "tämän kanssa toimitus on ilmainen" : `tämän jälkeen ${eur(puuttuuJalkeen)} ilmaiseen toimitukseen`}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          addItem(product, 1, size, color);
          setLisatty(product.id);
        }}
        aria-label={`Lisää koriin: ${product.name}`}
      >
        <Plus className="h-4 w-4 mr-1" /> Lisää
      </Button>
    </div>
  );
}
