import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCartContext();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.variants.sizes?.[0];
    const defaultColor = product.variants.colors?.[0];
    addItem(product, 1, defaultSize, defaultColor);
    toast({
      title: "Lisätty koriin! 🛒",
      description: `${product.name} on nyt ostoskorissasi.`,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    toast({
      title: wishlisted ? "Poistettu suosikeista" : "Lisätty suosikkeihin ❤️",
      description: product.name,
    });
  };

  return (
    <Link
      to={`/tuote/${product.slug}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-glow-lime relative"
    >
      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        aria-label="Lisää suosikkeihin"
      >
        <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "fill-secondary text-secondary" : "text-muted-foreground hover:text-secondary"}`} />
      </button>

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
          <div className="absolute bottom-2 left-2">
            <Badge variant="destructive" className="text-xs font-bold">
              Vain {product.stock} jäljellä! 😱
            </Badge>
          </div>
        )}

        {/* Add to cart overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Lisää koriin
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 md:p-4 space-y-1">
        <h3 className="font-sans text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-lg md:text-xl font-bold text-primary">
          {product.price.toFixed(2)} €
        </p>
      </div>
    </Link>
  );
}
