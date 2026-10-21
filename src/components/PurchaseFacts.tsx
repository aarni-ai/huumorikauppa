import { Link } from "react-router-dom";
import { RotateCcw, Truck } from "lucide-react";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";

/**
 * Toimitus- ja palautustiedot heti hinnan alla (tuotesivu). Arvot: src/config/toimitus.ts.
 * Personoiduilla tuotteilla ei ole peruutusoikeutta (ReturnsPolicy.tsx kohta 7).
 */
export function PurchaseFacts({
  isCustom,
  showDeliveryTime = true,
  compact = false,
  className = "",
}: {
  isCustom: boolean;
  /** Mobiilin lyhyt muoto, joka mahtuu yhdelle riville 360 px leveällä näytöllä. */
  compact?: boolean;
  /** false, kun tuotteella on oma toimitusaikansa (DeliveryBadge, AliExpress). */
  showDeliveryTime?: boolean;
  className?: string;
}) {
  return (
    <ul className={`space-y-1 text-[13px] leading-snug text-muted-foreground ${className}`}>
      <li className="flex items-start gap-1.5">
        <Truck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span>
          {showDeliveryTime && <>Toimitus {TOIMITUSAIKA_TEKSTI} {compact ? "pv" : "arkipäivää"} · </>}
          {TOIMITUSMAKSU_TEKSTI} €, ilmainen {ILMAINEN_RAJA_TEKSTI} eurosta{compact ? "" : " alkaen"}
        </span>
      </li>
      <li className="flex items-start gap-1.5">
        <RotateCcw className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        {isCustom ? (
          <span>
            Personoitu tuote: ei 14 päivän palautusoikeutta.{" "}
            <Link to="/palautusehdot" className="underline underline-offset-2 hover:text-foreground">Palautusehdot</Link>
          </span>
        ) : (
          <Link to="/palautusehdot" className="underline underline-offset-2 hover:text-foreground">
            14 päivän palautusoikeus
          </Link>
        )}
      </li>
    </ul>
  );
}
