import { useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { kampanjaNosto, seuraavaKampanjaVaihtoMs } from "@/data/kampanjat";
import { BlackFridayNosto } from "@/components/KorialennusVihje";
import { useLahjakortitMyynnissa } from "@/hooks/use-lahjakortit";

/** setTimeoutin yläraja (noin 24,8 vrk). */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** Herättää komponentin seuraavalla vaiheen vaihtohetkellä (keskiyö Suomen aikaa), jos sivu on silloin auki. */
function subscribe(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    const next = seuraavaKampanjaVaihtoMs(Date.now());
    if (next === null) return;
    timer = setTimeout(() => {
      onChange();
      arm();
    }, Math.min(Math.max(next - Date.now(), 0), MAX_TIMEOUT_MS));
  };
  arm();
  return () => clearTimeout(timer);
}

/** Vaihe muuttuu vain keskiyöllä, joten tunniste (vaihe + päivä) riittää useSyncExternalStoren vertailuun. */
let viimeisin: { avain: string; nosto: ReturnType<typeof kampanjaNosto> } | null = null;
function nykyinen() {
  const nyt = Date.now();
  const n = kampanjaNosto(nyt);
  const avain = n ? `${n.vaihe}|${n.otsikko}|${n.teksti}` : "";
  if (!viimeisin || viimeisin.avain !== avain) viimeisin = { avain, nosto: n };
  return viimeisin.nosto;
}

/**
 * Etusivun kampanjanosto kampanjakalenterin mukaan (src/data/kampanjat.ts): isänpäivä, joululahjat, Black Friday,
 * joulun viimeiset tilauspäivät ja lahjakortti vaihtuvat itsestään päivämäärän mukaan. Esirenderöityyn HTML:ään ei jää
 * vanhentunutta kampanjaa (palvelimella ei mitään).
 */
export function KampanjaNosto({ className = "container pt-3" }: { className?: string }) {
  const nosto = useSyncExternalStore(subscribe, nykyinen, () => null);
  const lahjakortit = useLahjakortitMyynnissa();
  if (!nosto) return null;
  if (nosto.vaihe === "black-friday") {
    return (
      <div className={className}>
        <BlackFridayNosto />
      </div>
    );
  }
  // Lahjakortit eivät myynnissä: lahjakortin nosto vaihtuu toissijaiseen linkkiin tai jää pois.
  const eiLahjakorttia = nosto.vaatiiLahjakortin && lahjakortit === false;
  if (eiLahjakorttia && !nosto.lisalinkki) return null;
  const paalinkki = eiLahjakorttia ? nosto.lisalinkki! : nosto.linkki;
  const lisa = eiLahjakorttia ? undefined : nosto.lisalinkki;
  return (
    <div className={className}>
      <aside
        aria-label={nosto.otsikko}
        data-kampanja={nosto.vaihe}
        className="rounded-xl border border-primary/40 bg-primary/5 p-4 md:p-5"
      >
        <p className="font-display text-xl text-foreground flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
          {nosto.otsikko}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{nosto.teksti}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link to={paalinkki.polku} className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
            {paalinkki.teksti}
          </Link>
          {lisa && (
            <Link to={lisa.polku} className="text-sm font-semibold text-primary underline underline-offset-2">
              {lisa.teksti}
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
