import { Percent } from "lucide-react";
import type { KorialennusTila } from "@/lib/ostoskori";
import { useEffect, useState } from "react";
import { TPAITAPARI_KAMPANJA, tpaitapariVoimassa } from "../../api/_lib/korialennus.js";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/** Kampanjan teksti ja kuluttajansuojalain edellyttämä 30 päivän alin hinta (api/_lib/vakiot.js TPAITAPARI_KAMPANJA). */
export const TPAITAPARI_TEKSTI = `Kaksi t-paitaa ${eur(TPAITAPARI_KAMPANJA.parihinta)}`;
export const TPAITAPARI_ALIN_HINTA = `T-paidan hinta ${eur(TPAITAPARI_KAMPANJA.kappalehinta)}, alin hinta 30 päivän aikana ${eur(TPAITAPARI_KAMPANJA.alinHinta30pv)}.`;

/**
 * Kahden tuotteen alennuksen vihje ja edistymispalkki (ostoskori, minikori, kassa). Tila lasketaan
 * src/lib/ostoskori.ts korialennusTila-funktiolla, palvelin laskee lopullisen alennuksen.
 */
export function KorialennusVihje({ tila, className = "" }: { tila: KorialennusTila; className?: string }) {
  if (tila.kpl === 0 || tila.syy === "pois" || tila.syy === "koodi" || tila.syy === "ei_rivia") return null;
  if (tila.voimassa && tila.tyyppi === "tpaitapari") {
    return (
      <p className={`flex items-center gap-2 text-xs font-medium text-primary ${className}`}>
        <Percent className="h-4 w-4 shrink-0" /> {TPAITAPARI_TEKSTI} on mukana
      </p>
    );
  }
  // Kampanja: pariton määrä t-paitoja, toinen t-paita täydentää parin.
  if ((tila.kampanjaTpaitoja ?? 0) % 2 === 1) {
    return (
      <p className={`flex items-center gap-2 text-xs text-foreground ${className}`}>
        <Percent className="h-4 w-4 text-primary shrink-0" />
        <span>Lisää toinen t-paita: <span className="font-bold text-primary">{TPAITAPARI_TEKSTI.toLowerCase()}</span>. {TPAITAPARI_ALIN_HINTA}</span>
      </p>
    );
  }
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

/**
 * T-paidan tuotesivun kampanjarivi (vain kampanjan aikana, vain selaimessa: esirenderöityyn HTML:ään ei jää vanhaa
 * tarjousta). Näyttää myös 30 päivän alimman hinnan (kuluttajansuojalaki 2:6 a §).
 */
export function TpaitapariRivi({ kategoria, hinta, className = "" }: { kategoria: string; hinta: number; className?: string }) {
  const [voimassa, setVoimassa] = useState(false);
  useEffect(() => { setVoimassa(tpaitapariVoimassa()); }, []);
  if (!voimassa || kategoria !== TPAITAPARI_KAMPANJA.kategoria || Math.abs(hinta - TPAITAPARI_KAMPANJA.kappalehinta) > 0.005) return null;
  return (
    <p className={`flex items-start gap-1.5 text-[13px] leading-snug text-foreground ${className}`}>
      <Percent className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
      <span><span className="font-bold text-primary">{TPAITAPARI_TEKSTI}</span> (kun korissa on kaksi t-paitaa). {TPAITAPARI_ALIN_HINTA}</span>
    </p>
  );
}
