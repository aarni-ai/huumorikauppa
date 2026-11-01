import { Truck } from "lucide-react";
import { ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";
import { toimitusTila, ilmaisenToimituksenViesti } from "@/lib/ostoskori";
import type { CartItem } from "@/types/product";

/** Ilmaisen toimituksen edistymispalkki ostoskorin paneeliin ja minikoriin (kaksi tuotetta tai ilmaisen toimituksen raja). */
export function FreeShippingProgress({ items, className = "" }: { items: Pick<CartItem, "product" | "quantity">[]; className?: string }) {
  const tila = toimitusTila(items);
  if (tila.vainLahjakortteja) return null;
  if (tila.ilmainen) {
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
        <span className="font-bold text-primary">{ilmaisenToimituksenViesti(tila)}</span>
      </p>
      <div
        className="h-2 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(tila.edistyminen)}
        aria-label={`Ilmainen toimitus kahdesta tuotteesta tai ${ILMAINEN_RAJA_TEKSTI} eurosta`}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${tila.edistyminen}%` }} />
      </div>
    </div>
  );
}
