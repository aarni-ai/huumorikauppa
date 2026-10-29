import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { proxiedImage } from "@/lib/imageProxy";
import { productImageAlt } from "@/lib/productNames";
import { sortSizes } from "@/lib/sortSizes";
import { quickAddOption, selectComplementary } from "@/lib/recommendations";

interface Props {
  /** Tuotteet, joihin suositukset sovitetaan (tuotesivun tuote tai korin tuotteet). */
  base: Product[];
  all: Product[];
  title?: string;
  /** "grid" tuotesivulle ja ostoskoriin, "list" kapeaan paneeliin. */
  layout?: "grid" | "list";
  limit?: number;
  onNavigate?: () => void;
  className?: string;
  /** Valmiiksi valitut suositukset (esim. selectSecondTshirt); muuten selectComplementary. */
  picks?: Product[];
  /** Otsikon alle näytettävä lyhyt teksti. */
  note?: string;
}

/**
 * "Sopii yhteen": 2-3 täydentävää tuotetta (src/lib/recommendations.ts). Ei väitä, että tuotteita
 * ostettaisiin yhdessä. Lisäys koriin kuten tuotesivulla: oletusväri, koko valitaan itse.
 */
export function ComplementaryProducts({ base, all, title = "Sopii yhteen", layout = "grid", limit = 3, onNavigate, className = "", picks: valmiit, note }: Props) {
  // Avain tuotetunnisteista: uusi taulukko joka renderöinnillä ei laske suosituksia uudelleen.
  const baseKey = base.map((b) => b.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lasketut = useMemo(() => (valmiit ? [] : selectComplementary(base, all, limit)), [baseKey, all, limit, valmiit]);
  const picks = valmiit ?? lasketut;
  if (picks.length < 2) return null;
  return (
    <section className={className} aria-label={title}>
      <h2 className={`font-display text-xl md:text-2xl text-foreground ${note ? "mb-1" : "mb-4"}`}>{title}</h2>
      {note && <p className="text-sm text-muted-foreground mb-4">{note}</p>}
      <div className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4" : "space-y-3"}>
        {picks.map((p) => (
          <ComplementaryItem key={p.id} product={p} layout={layout} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

function ComplementaryItem({ product, layout, onNavigate }: { product: Product; layout: "grid" | "list"; onNavigate?: () => void }) {
  const { addItem } = useCartContext();
  const option = useMemo(() => quickAddOption(product), [product]);
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);
  const href = `/tuote/${product.slug}`;

  const add = () => {
    if (option.kind === "add") addItem(product, 1, option.size, option.color);
    else if (option.kind === "choose-size" && size) addItem(product, 1, size, option.color);
    else return;
    setAdded(true);
  };

  return (
    <div className={`flex gap-3 rounded-lg border border-border bg-card p-3 ${layout === "grid" ? "sm:flex-col" : ""}`}>
      <Link to={href} onClick={onNavigate} className={`shrink-0 ${layout === "grid" ? "sm:w-full" : ""}`}>
        <img
          src={proxiedImage(product.images[0]) || "/placeholder.svg"}
          alt={productImageAlt(product)}
          className={`w-20 h-20 rounded-md bg-muted object-cover ${layout === "grid" ? "sm:w-full sm:h-auto sm:aspect-square" : ""}`}
          loading="lazy"
          width={200}
          height={200}
        />
      </Link>
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <div>
          <Link to={href} onClick={onNavigate} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </Link>
          <p className="text-sm font-bold text-primary mt-0.5">{product.price.toFixed(2)} €</p>
          {option.kind !== "link" && option.color && <p className="text-xs text-muted-foreground">Väri: {option.color}</p>}
        </div>
        {added ? (
          <p className="text-xs font-medium text-primary" role="status">Lisätty ostoskoriin</p>
        ) : option.kind === "add" ? (
          <Button type="button" size="sm" onClick={add} className="w-fit">
            <ShoppingCart className="h-4 w-4 mr-1" /> Lisää koriin
          </Button>
        ) : option.kind === "choose-size" ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`koko-${product.id}`}>Koko: {product.name}</label>
            <select
              id={`koko-${product.id}`}
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              <option value="">Valitse koko</option>
              {sortSizes(option.sizes).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={add} disabled={!size}>
              <ShoppingCart className="h-4 w-4 mr-1" /> Lisää
            </Button>
          </div>
        ) : (
          <Link to={href} onClick={onNavigate} className="text-sm text-primary hover:underline w-fit">
            Valitse tuotesivulla
          </Link>
        )}
        {option.kind !== "link" && !added && (
          <Link to={href} onClick={onNavigate} className="text-xs text-muted-foreground hover:text-primary w-fit">
            Muut värit tuotesivulla
          </Link>
        )}
      </div>
    </div>
  );
}
