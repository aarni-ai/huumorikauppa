import { Link } from "react-router-dom";
import {
  Shirt, Coffee, Tag, Baby, ShoppingBag, Image as ImageIcon,
  Package, Layers, Sparkles, HardHat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  slug: string;
  name: string;
  emoji: string;
  description: string;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "t-paidat":      Shirt,
  "hupparit":      Layers,
  "pitkahihaiset": Shirt,
  "mukit":         Coffee,
  "bodyt":         Baby,
  "tarrat":        Tag,
  "peitot":        Package,
  "pipot":         HardHat,
  "laukut":        ShoppingBag,
  "seinataulut":   ImageIcon,
  "koristeet":     Sparkles,
};

export function CategoryCard({ slug, name, description }: CategoryCardProps) {
  const Icon = CATEGORY_ICONS[slug] ?? Package;

  return (
    <Link
      to={`/kategoria/${slug}`}
      className="group flex flex-col items-center justify-center p-6 md:p-7 bg-card border border-border rounded-2xl hover:border-foreground/20 hover:shadow-md transition-all duration-200 text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background transition-all duration-200">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-background transition-colors duration-200" />
      </div>
      <h3 className="text-sm font-semibold text-foreground group-hover:text-foreground transition-colors">
        {name}
      </h3>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{description}</p>
    </Link>
  );
}
