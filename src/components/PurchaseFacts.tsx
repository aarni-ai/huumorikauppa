import { Link } from "react-router-dom";
import { Factory, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { maksutavatTekstina } from "@/config/maksutavat";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSMAKSU_TEKSTI, toimitusaikaTeksti } from "@/config/toimitus";
import { JouluTakarajaRivi } from "@/components/JouluTakaraja";

/**
 * Toimitus- ja palautustiedot heti hinnan alla (tuotesivu). Arvot: src/config/toimitus.ts.
 * Personoiduilla tuotteilla ei ole peruutusoikeutta (ReturnsPolicy.tsx kohta 7).
 * Joulun takaraja (src/data/jouluAikataulu.ts) näkyy toimitustiedon alla vain ennen takarajaa.
 */
export function PurchaseFacts({
  isCustom,
  showDeliveryTime = true,
  euPaino = false,
  jouluKategoriat = [],
  kategoria = null,
  compact = false,
  className = "",
  toimitusSisaltyy = null,
}: {
  isCustom: boolean;
  /** Hintatesti B (src/lib/toimitustesti.ts): hinta sisältää toimituksen; arvo = kappalehinta kahden tuotteen tilauksessa. */
  toimitusSisaltyy?: number | null;
  /** Mobiilin lyhyt muoto, joka mahtuu yhdelle riville 360 px leveällä näytöllä. */
  compact?: boolean;
  /** false, kun tuotteella on oma toimitusaikansa (DeliveryBadge, AliExpress). */
  showDeliveryTime?: boolean;
  /** Tuotteen painotalo on EU:ssa (api/_lib/materiaali.js painetaanEUssa): "Painetaan tilauksesta EU:ssa". */
  euPaino?: boolean;
  /** Tuotteen kategoria joulun tilauspäivää varten; tyhjä = ei joulurivia (esim. AliExpress). */
  jouluKategoriat?: readonly (string | null)[];
  /** Tuotteen kategoria: tuotetyypin toimitusaika (src/config/toimitus.ts TOIMITUSAJAT_TYYPEITTAIN). */
  kategoria?: string | null;
  className?: string;
}) {
  const aika = toimitusaikaTeksti(kategoria);
  const toimitusTeksti = toimitusSisaltyy
    ? `Ilmainen toimitus${compact ? "" : `, kahden tuotteen tilauksessa ${toimitusSisaltyy.toFixed(2).replace(".", ",")} €/kpl`}`
    : null;
  return (
    <ul className={`space-y-1 text-[13px] leading-snug text-muted-foreground ${className}`}>
      {euPaino && showDeliveryTime ? (
        <>
          <li className="flex items-start gap-1.5">
            <Factory className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span>Painetaan tilauksesta EU:ssa, perillä {aika} arkipäivässä</span>
          </li>
          <li className="flex items-start gap-1.5">
            <Truck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span>{toimitusTeksti ?? `Toimitus ${TOIMITUSMAKSU_TEKSTI} €, ilmainen kahdesta tuotteesta`}</span>
          </li>
        </>
      ) : (
      <li className="flex items-start gap-1.5">
        <Truck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span>
          {showDeliveryTime && <>Perillä {aika} {compact ? "pv" : "arkipäivässä"} · </>}
          {toimitusTeksti ?? `${TOIMITUSMAKSU_TEKSTI} €, ilmainen kahdesta tuotteesta`}
        </span>
      </li>
      )}
      <li className="flex items-start gap-1.5">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <span>{compact ? "Turvallinen maksu (Stripe)" : `Turvallinen maksu Stripellä: ${maksutavatTekstina(["visa", "mastercard", "mobilepay", "klarna"])}`}</span>
      </li>
      <JouluTakarajaRivi as="li" categories={jouluKategoriat} className="text-foreground" />
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
