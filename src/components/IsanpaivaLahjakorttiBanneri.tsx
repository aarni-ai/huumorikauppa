import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { useLahjakortitMyynnissa } from "@/hooks/use-lahjakortit";
import { paivanLoppuUtcMs } from "@/data/campaignSchedule";
import { KAMPANJAPAIVAT } from "../../api/_lib/vakiot.js";

/** Isänpäivä su 8.11.2026 klo 23.59.59 Suomen aikaa (kampanjakalenteri, api/_lib/vakiot.js KAMPANJAPAIVAT). */
export const ISANPAIVA_LOPPU_UTC_MS = paivanLoppuUtcMs(KAMPANJAPAIVAT.isanpaiva.loppu);
export const isanpaivaLahjakorttiAika = (nyt: number) => nyt <= ISANPAIVA_LOPPU_UTC_MS;

/** Isä-sivut, joilla banneri näkyy (etusivun lisäksi). */
export const ISA_POLUT = ["/isanpaivalahja", "/hauska-isanpaivalahja", "/joululahja-isalle", "/lahjat/isoisalle"];

const eiTilausta = () => () => undefined;

/**
 * "Isänpäivä su 8.11: lahjakortti perille heti" (1.11.2026): etusivu ja isä-sivut isänpäivän loppuun. Lahjakortin koodi
 * ja PDF ovat valmiina heti maksun jälkeen (kiitossivu), joten se ehtii, vaikka paketit eivät enää ehdi. Piilossa, jos
 * lahjakortit eivät ole myynnissä.
 */
export function IsanpaivaLahjakorttiBanneri({ className = "container pt-3" }: { className?: string }) {
  const aika = useSyncExternalStore(eiTilausta, () => isanpaivaLahjakorttiAika(Date.now()), () => isanpaivaLahjakorttiAika(Date.now()));
  const myynnissa = useLahjakortitMyynnissa();
  if (!aika || myynnissa === false) return null;
  return (
    <div className={className}>
      <Link
        to="/lahjakortti"
        data-banner="isanpaiva-lahjakortti"
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl bg-blue-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-95"
      >
        <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Isänpäivä su 8.11: lahjakortti perille heti</span>
        <span className="underline">Osta lahjakortti 25, 35 tai 50 €</span>
      </Link>
    </div>
  );
}
