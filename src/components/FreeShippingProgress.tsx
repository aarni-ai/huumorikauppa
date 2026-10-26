import { Truck } from "lucide-react";
import { freeShippingStatus, ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";

const euro = (n: number) => n.toFixed(2).replace(".", ",");

/** Ilmaisen toimituksen edistymispalkki ostoskorin paneeliin ja minikoriin. */
export function FreeShippingProgress({ total, className = "" }: { total: number; className?: string }) {
  const { free, gap, progress } = freeShippingStatus(total);
  if (free) {
    return (
      <p className={`flex items-center gap-2 text-xs font-medium text-primary ${className}`}>
        <Truck className="h-4 w-4 shrink-0" /> Ilmainen toimitus
      </p>
    );
  }
  return (
    <div className={className}>
      <p className="flex items-center gap-2 text-xs text-foreground mb-1.5">
        <Truck className="h-4 w-4 text-primary shrink-0" />
        <span>
          <span className="font-bold text-primary">{euro(gap)} €</span> ilmaiseen toimitukseen
        </span>
      </p>
      <div
        className="h-2 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={`Ilmainen toimitus ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen`}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
