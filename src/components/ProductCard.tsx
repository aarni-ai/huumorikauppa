import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/data/products";
import { sortSizes } from "@/lib/sortSizes";

interface ProductCardProps {
  product: Product;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  categories.map(c => [c.slug, c.name.toLowerCase()])
);

const NO_SIZE_CATEGORIES = ["mukit", "tarrat", "seinataulut", "peitot", "koristeet"];

function getHoverImage(product: Product): string | null {
  const mainImage = product.images[0] || "";
  const variantImages = product.variants.variant_images as Record<string, string[]> | undefined;
  
  if (variantImages && Object.keys(variantImages).length > 0) {
    const defaultColor = (product.variants.default_color as string) || "";
    const colorKeys = Object.keys(variantImages).filter(c => c !== defaultColor);

    if (colorKeys.length > 0) {
      const hash = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      for (let i = 0; i < colorKeys.length; i++) {
        const picked = colorKeys[(hash + i) % colorKeys.length];
        const img = variantImages[picked]?.[0];
        if (img && img !== mainImage) return img;
      }
    }
    
    const defaultImages = variantImages[defaultColor];
    if (defaultImages?.[1] && defaultImages[1] !== mainImage) {
      return defaultImages[1];
    }

    for (const imgs of Object.values(variantImages)) {
      if (imgs[1] && imgs[1] !== mainImage) return imgs[1];
    }
  }

  if (product.images[1] && product.images[1] !== mainImage) return product.images[1];
  return null;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const { addItem } = useCartContext();
  const { toast } = useToast();
  const optionsRef = useRef<HTMLDivElement>(null);
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category;

  const hoverImage = useMemo(() => getHoverImage(product), [product]);
  const mainImage = product.images[0] || "/placeholder.svg";
  const displayImage = isHovered && hoverImage ? hoverImage : mainImage;

  // Preload hover image so swap is instant
  useEffect(() => {
    if (hoverImage) {
      const img = new Image();
      img.src = hoverImage;
    }
  }, [hoverImage]);

  const hideSize = NO_SIZE_CATEGORIES.includes(product.category);
  const sortedSizes = useMemo(() => sortSizes(product.variants.sizes || []), [product.variants.sizes]);
  const hasSizes = !hideSize && sortedSizes.length > 1;
  const hasColors = product.variants.colors && product.variants.colors.length > 1;
  const needsSelection = hasSizes || hasColors;

  // Close options when clicking outside
  useEffect(() => {
    if (!showOptions) return;
    const handler = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showOptions]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (needsSelection) {
      setShowOptions(true);
      // Pre-select defaults
      if (!selectedColor && product.variants.colors?.length > 0) {
        setSelectedColor(product.variants.default_color || product.variants.colors[0]);
      }
      if (!selectedSize && sortedSizes.length === 1) {
        setSelectedSize(sortedSizes[0]);
      }
    } else {
      // No selection needed, add directly
      const size = product.variants.sizes?.[0];
      const color = product.variants.colors?.[0];
      addItem(product, 1, size, color);
    }
  };

  const handleConfirmAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasSizes && !selectedSize) {
      toast({ title: "Valitse koko ensin! 📏", variant: "destructive" });
      return;
    }

    const size = hideSize ? product.variants.sizes?.[0] : selectedSize;
    const color = selectedColor || product.variants.colors?.[0];

    addItem(product, 1, size, color);
    setShowOptions(false);
    setSelectedSize(undefined);
    setSelectedColor(undefined);
  };

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <Link
      to={`/tuote/${product.slug}`}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors duration-300 hover:shadow-glow-lime relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); if (!showOptions) setShowOptions(false); }}
      onTouchStart={() => setIsHovered(prev => !prev)}
    >
      {/* Image with hover swap */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={displayImage}
          alt={`${product.name} – Osta hauska ${categoryLabel} Huumorikaupasta`}
          className={`w-full h-full object-cover transition-transform duration-500 ease-out will-change-transform ${isHovered ? "scale-105" : "scale-100"}`}
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
        />

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

        {/* Quick add button overlay */}
        {!showOptions && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-primary text-primary-foreground font-bold text-sm py-2.5 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Lisää koriin
            </button>
          </div>
        )}

        {/* Options picker overlay */}
        {showOptions && (
          <div
            ref={optionsRef}
            className="absolute inset-0 bg-card/95 backdrop-blur-sm flex flex-col p-3 z-10 overflow-y-auto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {/* Close button */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOptions(false); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex-1 space-y-3">
              {/* Color picker */}
              {hasColors && (
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Väri{selectedColor ? `: ${selectedColor}` : ""}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.colors!.map((color: string) => (
                      <button
                        key={color}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(color); }}
                        className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                          selectedColor === color
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size picker */}
              {hasSizes && (
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Koko</label>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedSizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(size); }}
                        className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                          selectedSize === size
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirmAdd}
              className="w-full bg-primary text-primary-foreground font-bold text-xs py-2 rounded flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors mt-2"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Lisää koriin
            </button>
          </div>
        )}
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
