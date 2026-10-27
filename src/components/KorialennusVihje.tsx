import { Percent } from "lucide-react";
import type { KorialennusTila } from "@/lib/ostoskori";

/**
 * Kahden tuotteen alennuksen vihje ja edistymispalkki (ostoskori, minikori, kassa). Tila lasketaan
 * src/lib/ostoskori.ts korialennusTila-funktiolla, palvelin laskee lopullisen alennuksen.
 */
export function KorialennusVihje({ tila, className = "" }: { tila: KorialennusTila; className?: string }) {
  if (tila.kpl === 0 || tila.syy === "pois" || tila.syy === "koodi" || tila.syy === "ei_rivia") return null;
  if (tila.voimassa) {
    return (
      <p className={`flex items-center gap-2 text-xs font-medium text-primary ${className}`}>
        <Percent className="h-4 w-4 shrink-0" /> Kahden tuotteen alennus -{tila.prosentti} % on mukana
      </p>
    );
  }
  if (tila.syy === "kate" || tila.syy === "kulu") {
    return (
      <p className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Percent className="h-4 w-4 shrink-0" /> Kahden tuotteen alennus ei koske tätä tuoteyhdistelmää.
      </p>
    );
  }
  const tarvitaan = tila.kpl + tila.puuttuu;
  const edistyminen = Math.min(100, (tila.kpl / tarvitaan) * 100);
  return (
    <div className={className}>
      <p className="flex items-center gap-2 text-xs text-foreground mb-1.5">
        <Percent className="h-4 w-4 text-primary shrink-0" />
        <span>
          {tila.puuttuu === 1 ? "Lisää toinen tuote, saat " : `Lisää ${tila.puuttuu} tuotetta, saat `}
          <span className="font-bold text-primary">-{tila.prosentti} %</span>
        </span>
      </p>
      <div
        className="h-2 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(edistyminen)}
        aria-label={`Kahden tuotteen alennus -${tila.prosentti} %`}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${edistyminen}%` }} />
      </div>
    </div>
  );
}
