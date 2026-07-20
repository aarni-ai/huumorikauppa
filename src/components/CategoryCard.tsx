import { Link } from "react-router-dom";

interface CategoryCardProps {
  slug: string;
  name: string;
  emoji?: string;
  description?: string;
  image?: string;
  count?: number;
}

export function CategoryCard({ slug, name, description, image, count }: CategoryCardProps) {
  return (
    <Link to={`/kategoria/${slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[#F4F4F4]">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-white font-bold text-base md:text-lg uppercase tracking-tight leading-none">
            {name}
          </h3>
          {(count ?? 0) > 0 && (
            <p className="text-white/70 text-[11px] font-medium mt-1.5 uppercase tracking-wider">
              {count} tuotetta
            </p>
          )}
          {!count && description && (
            <p className="text-white/70 text-xs mt-1 line-clamp-1">{description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
