import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { Product } from "@/types/product";
import { isCustomTextProduct } from "@/lib/customProduct";
import { proxiedImage } from "@/lib/imageProxy";

interface InlineProductCardProps {
  product: Product;
}

export function InlineProductCard({ product }: InlineProductCardProps) {
  const { addItem } = useCartContext();
  const [added, setAdded] = useState(false);

  const sizes: string[] = product.variants?.sizes || [];
  const colors: string[] = product.variants?.colors || [];
  const canAddDirectly = sizes.length <= 1 && !isCustomTextProduct(product);

  const handleAdd = () => {
    addItem(product, 1, sizes[0], colors[0]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <div
      className="flex gap-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors p-3"
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link
        to={`/tuote/${product.slug}`}
        className="shrink-0"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={proxiedImage(product.images[0]) || "/placeholder.svg"}
          alt={product.name}
          className="w-20 h-20 rounded-lg object-cover bg-muted"
          loading="lazy"
          width={80}
          height={80}
          itemProp="image"
        />
      </Link>

      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <Link
            to={`/tuote/${product.slug}`}
            className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
            itemProp="name"
          >
            {product.name}
          </Link>
          <div
            itemProp="offers"
            itemScope
            itemType="https://schema.org/Offer"
          >
            <meta itemProp="priceCurrency" content="EUR" />
            <meta itemProp="availability" content="https://schema.org/InStock" />
            <div className="flex items-baseline gap-2 mt-1">
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {product.original_price!.toFixed(2)} €
                </span>
              )}
              <span className="font-bold text-primary text-sm" itemProp="price" content={product.price.toFixed(2)}>
                {product.price.toFixed(2)} €
              </span>
            </div>
            {hasDiscount && (
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Alin 30 pv: {product.original_price!.toFixed(2)} €
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          {canAddDirectly ? (
            <button
              onClick={handleAdd}
              disabled={added}
              aria-live="polite"
              aria-label={added ? `${product.name} lisätty koriin` : `Lisää ${product.name} ostoskoriin`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold min-h-[40px] hover:opacity-90 transition-opacity disabled:opacity-80"
            >
              {added ? (
                <><Check className="h-3.5 w-3.5" /> Lisätty ✓</>
              ) : (
                <><ShoppingCart className="h-3.5 w-3.5" /> Lisää koriin</>
              )}
            </button>
          ) : (
            <Link
              to={`/tuote/${product.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold min-h-[40px] hover:opacity-90 transition-opacity"
              aria-label={`Valitse koko: ${product.name}`}
            >
              Valitse koko <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <Link
            to={`/tuote/${product.slug}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Lisätietoja →
          </Link>
        </div>
      </div>
    </div>
  );
}

interface InlineProductRowProps {
  products: Product[];
}

export function InlineProductRow({ products }: InlineProductRowProps) {
  if (products.length === 0) return null;
  return (
    <div className="my-6 space-y-2">
      {products.map((p) => (
        <InlineProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
