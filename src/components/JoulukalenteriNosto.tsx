import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { joulukalenteriNosto, seuraavaKalenteriVaihtoMs, JOULUKALENTERI_ALKU_TEKSTI } from "@/data/campaignSchedule";
import { JOULUKALENTERI_POLKU } from "../../api/_lib/joulukalenteri.js";

/** setTimeoutin yläraja (noin 24,8 vrk). */
const MAX_TIMEOUT_MS = 2_147_483_647;

function subscribe(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    const next = seuraavaKalenteriVaihtoMs(Date.now());
    if (next === null) return;
    timer = setTimeout(() => { onChange(); arm(); }, Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS));
  };
  arm();
  return () => clearTimeout(timer);
}

/**
 * Etusivun joulukalenterinosto (src/data/campaignSchedule.ts joulukalenteriNosto): ennakkonostosta alkaen avautumispäivä,
 * joulukuussa päivän luukku. Ei tuotetta eikä hintaa (luukun sisältö vain /joulukalenteri-sivulla palvelimelta).
 * Esirenderöityyn HTML:ään ei jää mitään (palvelimella null).
 */
export function JoulukalenteriNosto({ className = "container pt-3" }: { className?: string }) {
  const tila = useSyncExternalStore(subscribe, () => joulukalenteriNosto(Date.now()), () => null);
  if (!tila) return null;
  return (
    <div className={className}>
      <aside aria-label="Joulukalenteri" className="rounded-lg border border-red-900/20 bg-red-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Gift className="h-6 w-6 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-display text-lg">{tila === "auki" ? "Joulukalenteri: päivän luukku auki" : `Joulukalenteri aukeaa ${JOULUKALENTERI_ALKU_TEKSTI}`}</p>
            <p className="text-sm opacity-90">
              {tila === "auki"
                ? "Joka päivä uusi luukku ja yhden päivän tarjous t-paidasta tai hupparista jouluaattoon asti."
                : "24 luukkua, joka päivä yksi tarjous t-paidasta tai hupparista. Tulevia luukkuja ei voi avata etukäteen."}
            </p>
          </div>
        </div>
        <Link to={JOULUKALENTERI_POLKU} className="rounded-md bg-white text-red-900 px-4 py-2 text-sm font-semibold whitespace-nowrap">
          {tila === "auki" ? "Avaa päivän luukku" : "Katso joulukalenteri"}
        </Link>
      </aside>
    </div>
  );
}
