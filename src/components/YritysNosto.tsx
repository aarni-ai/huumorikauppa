import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { MAARAALENNUS } from "../../api/_lib/vakiot.js";

/** Pienin määräalennusporras (api/_lib/vakiot.js MAARAALENNUS), esim. { min: 10, prosentti: 10 }. */
const PORRAS = [...MAARAALENNUS.portaat].sort((a, b) => a.min - b.min)[0];

/**
 * Yritystilauksen nosto (30.10.2026): kolme eniten liikennettä tuovaa blogia ja viisi myydyintä tuotetta
 * (src/data/yritysNostot.ts). Ei päivämääriä, jotta esirenderöity HTML ja selain vastaavat toisiaan.
 */
export function YritysNosto({ className = "" }: { className?: string }) {
  return (
    <aside className={`rounded-xl border border-primary/40 bg-primary/5 p-4 ${className}`} aria-label="Yritystilaukset">
      <p className="flex items-center gap-2 font-display text-lg text-foreground">
        <Building2 className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
        Tilaa koko tiimille: {PORRAS.min}+ t-paitaa -{PORRAS.prosentti} %
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Määräalennus lasketaan kassalla automaattisesti, ja paidat voivat olla eri designeja ja kokoja. Yritykset voivat maksaa myös laskulla.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link to="/yritykset/tilaus" className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:opacity-95">Tilaa koko tiimille</Link>
        <Link to="/yritykset" className="rounded-md border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary">Valmiit paketit ja tarjous</Link>
      </div>
    </aside>
  );
}
