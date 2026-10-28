import { Truck, Gift } from "lucide-react";
import { useMemo } from "react";
import { Product } from "@/types/product";
import { muotoilePaiva, tanaanSuomessa, toimitusarvio, toimitusalue } from "@/lib/toimitusarvio";
import { useJouluTakaraja } from "@/components/JouluTakaraja";

/**
 * Tuotesivun toimitusarvio (lasketaan selaimessa tämän päivän mukaan). AliExpress-tuotteille näytetään
 * DeliveryBadge, ei tätä.
 */
export function ToimitusarvioRivi({ product, className = "" }: { product: Product; className?: string }) {
  const tiedot = useMemo(() => ({ arvio: toimitusarvio(tanaanSuomessa(), toimitusalue(product)) }), [product]);
  // "Ehtii jouluksi" samasta tuotetyypin takarajasta kuin "Tilaa viimeistään" -rivi (src/data/jouluAikataulu.ts).
  const joulu = useJouluTakaraja([product.category]);
  if (product.supplier === "aliexpress") return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <Truck className="h-4 w-4 text-primary shrink-0" />
        Toimitusarvio: perillä viimeistään <span className="font-semibold">{muotoilePaiva(tiedot.arvio.viimeistaan)}</span>
      </span>
      {joulu && (
        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          <Gift className="h-3.5 w-3.5" /> Ehtii jouluksi
        </span>
      )}
    </div>
  );
}
