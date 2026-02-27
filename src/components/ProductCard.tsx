import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/tuote/${product.slug}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-glow-lime"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.images[0] || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && (
            <Badge className="bg-accent text-accent-foreground text-xs font-bold">UUTUUS 🔥</Badge>
          )}
          {product.is_gift_idea && (
            <Badge className="bg-secondary text-secondary-foreground text-xs font-bold">LAHJAIDEA 🎁</Badge>
          )}
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="destructive" className="text-xs font-bold">
              Vain {product.stock} jäljellä! 😱
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-4 space-y-1">
        <h3 className="font-display text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-lg md:text-xl font-bold text-primary">
          {product.price.toFixed(2)} €
        </p>
      </div>
    </Link>
  );
}
