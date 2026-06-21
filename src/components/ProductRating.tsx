import { Star } from "lucide-react";
import { getProductRating } from "@/lib/productReviews";

interface Props {
  product: { id: string; name: string; category: string };
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProductRating({ product, size = "md", showCount = true, onClick, className = "" }: Props) {
  const { average, count } = getProductRating(product);
  if (count === 0) return null;

  const starSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const rounded = Math.round(average);

  const Inner = (
    <>
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${i < rounded ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
          />
        ))}
      </div>
      {showCount && (
        <span className={`${textSize} text-muted-foreground`}>
          {average.toFixed(1)}{count > 0 && ` (${count})`}
        </span>
      )}
    </>
  );

  const aria = `Arvio ${average.toFixed(1)} viidestä, ${count} arvostelua`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={aria}
        className={`inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity ${className}`}
      >
        {Inner}
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`} aria-label={aria}>
      {Inner}
    </div>
  );
}
