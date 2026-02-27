import { Link } from "react-router-dom";

interface CategoryCardProps {
  slug: string;
  name: string;
  emoji: string;
  description: string;
}

export function CategoryCard({ slug, name, emoji, description }: CategoryCardProps) {
  return (
    <Link
      to={`/kategoria/${slug}`}
      className="group flex flex-col items-center justify-center p-6 md:p-8 bg-card border border-border rounded-lg hover:border-primary/50 transition-all duration-300 hover:shadow-glow-lime text-center"
    >
      <span className="text-4xl md:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
        {emoji}
      </span>
      <h3 className="font-display text-base md:text-lg text-foreground group-hover:text-primary transition-colors">
        {name}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground mt-1">{description}</p>
    </Link>
  );
}
