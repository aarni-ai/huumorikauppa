import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { JOULU_LAHJAKORTTI_TEKSTI, joulunLahjakorttiAika, JOULUN_JALKEEN_NORMAALI_UTC_MS } from "@/data/tilauspaivat";
import { CHRISTMAS_ORDER_END_UTC_MS } from "@/data/campaignSchedule";
import { useLahjakortitMyynnissa, useLahjakorttiSahkoposti } from "@/hooks/use-lahjakortit";
import { LAHJAKORTTI_ARVOT } from "../../api/_lib/lahjakortti.js";

/**
 * Joulun lahjakorttiaika (src/data/tilauspaivat.ts joulunLahjakorttiAika, 3.12.-26.12.2026): vain selaimessa (palvelin-
 * ja esirenderöinnissä false, jottei staattiseen HTML:ään jää vanhentunutta tilaa) ja vain, kun lahjakortit ovat
 * myynnissä ja oma sähköposti on käytössä (viesti lupaa toimituksen sähköpostilla, api/_lib/lahjakortti-db.js). Herää ikkunan alussa ja lopussa, jos sivu on auki.
 */
const subscribe = (onChange: () => void) => {
  const seuraava = [CHRISTMAS_ORDER_END_UTC_MS + 1, JOULUN_JALKEEN_NORMAALI_UTC_MS].find((t) => t > Date.now());
  if (!seuraava) return () => {};
  const t = setTimeout(onChange, Math.min(seuraava - Date.now(), 2_147_483_647));
  return () => clearTimeout(t);
};

export function useJoulunLahjakorttiAika(): boolean {
  const aika = useSyncExternalStore(subscribe, () => joulunLahjakorttiAika(Date.now()), () => false);
  const myynnissa = useLahjakortitMyynnissa();
  const sahkoposti = useLahjakorttiSahkoposti();
  return aika && myynnissa === true && sahkoposti;
}

const arvot = `${LAHJAKORTTI_ARVOT.slice(0, -1).join(", ")} tai ${LAHJAKORTTI_ARVOT.at(-1)} €`;

/** Lahjakortti ensimmäisenä tuotteena (blogien Top 3, etusivu) joulun lahjakorttiaikana. */
export function JoulunLahjakorttiKortti({ className = "" }: { className?: string }) {
  return (
    <Link to="/lahjakortti" className={`group flex flex-col rounded-xl border-2 border-primary bg-primary/5 p-4 hover:bg-primary/10 transition-colors ${className}`}>
      <Gift className="h-10 w-10 text-primary mb-3" aria-hidden="true" />
      <span className="font-display text-lg text-foreground">Lahjakortti</span>
      <span className="text-sm text-foreground mt-1">{JOULU_LAHJAKORTTI_TEKSTI}.</span>
      <span className="text-lg font-black text-foreground mt-2">{arvot}</span>
      <span className="mt-auto pt-3 flex items-center justify-center w-full min-h-[40px] rounded-md bg-primary text-primary-foreground text-sm font-bold">Osta lahjakortti</span>
    </Link>
  );
}

/** Lyhyt viestirivi linkillä (tuotesivu, etusivu). */
export function JoulunLahjakorttiRivi({ className = "", as: Tag = "p" }: { className?: string; as?: "p" | "li" }) {
  if (!useJoulunLahjakorttiAika()) return null;
  return (
    <Tag className={`flex items-start gap-1.5 ${className}`}>
      <Gift className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
      <span>{JOULU_LAHJAKORTTI_TEKSTI}. <Link to="/lahjakortti" className="underline font-semibold">Osta lahjakortti</Link></span>
    </Tag>
  );
}
