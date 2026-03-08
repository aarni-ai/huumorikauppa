import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useState, useMemo } from "react";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

// Pick a varied hover color – cycle through non-default colors
function getHoverImage(product: Product): string | null {
  const mainImage = product.images[0] || "";
  const variantImages = product.variants.variant_images as Record<string, string[]> | undefined;
  
  if (variantImages && Object.keys(variantImages).length > 0) {
    const defaultColor = (product.variants.default_color as string) || "";
    const colorKeys = Object.keys(variantImages).filter(c => c !== defaultColor);

    // Try picking a different color's first image that is actually different from main
    if (colorKeys.length > 0) {
      const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      for (let i = 0; i < colorKeys.length; i++) {
        const picked = colorKeys[(hash + i) % colorKeys.length];
        const img = variantImages[picked]?.[0];
        if (img && img !== mainImage) return img;
      }
    }
    
    // Try second image of default color (e.g. back view)
    const defaultImages = variantImages[defaultColor];
    if (defaultImages?.[1] && defaultImages[1] !== mainImage) {
      return defaultImages[1];
    }

    // Try second image of any color
    for (const imgs of Object.values(variantImages)) {
      if (imgs[1] && imgs[1] !== mainImage) return imgs[1];
    }
  }

  // Fallback: second image from product images
  if (product.images[1] && product.images[1] !== mainImage) return product.images[1];
  return null;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCartContext();
  const { toast } = useToast();

  const hoverImage = useMemo(() => getHoverImage(product), [product]);
  const mainImage = product.images[0] || "/placeholder.svg";
  const displayImage = isHovered && hoverImage ? hoverImage : mainImage;

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

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <Link
      to={`/tuote/${product.slug}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-glow-lime relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(prev => !prev)}
    >
      {/* Image with hover swap */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={displayImage}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? "scale-105" : "scale-100"}`}
          loading="lazy"
        />
        {hoverImage && (
          <img src={hoverImage} alt="" className="hidden" loading="lazy" />
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-destructive text-destructive-foreground font-bold text-xs px-2 py-1">
              -{discountPercent}%
            </Badge>
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
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
        <div className="flex items-center gap-2 flex-wrap">
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {product.original_price!.toFixed(2)} €
            </span>
          )}
          <span className={`text-lg md:text-xl font-bold ${hasDiscount ? "text-destructive" : "text-primary"}`}>
            {product.price.toFixed(2)} €
          </span>
        </div>
      </div>
    </Link>
  );
}
