import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { EtusivunSuosituimmat } from "@/components/EtusivunSuosituimmat";
import { useProducts } from "@/hooks/use-products";
import { kumppaniTervehdys } from "../../api/_lib/kumppani.js";

type Kumppani = { koodi: string; nimi: string; kautta: string; malli: "provisio" | "alennus" };

/** Palvelimen renderöimän sivun tiedot (api/_lib/kumppani.js kumppaniSivunHtml): ei uutta hakua. */
function palvelimenTiedot(koodi: string): { kumppani: Kumppani | null } | null {
  const s = typeof window !== "undefined" ? (window as Window & { __hkKumppani?: { pyynto: string; kumppani: Kumppani | null } }).__hkKumppani : undefined;
  return s && s.pyynto === koodi.toLowerCase() ? { kumppani: s.kumppani } : null;
}

/**
 * /k/<koodi> (2.11.2026): kumppanin oma laskeutumissivu. Palvelin tallentaa koodin evästeeseen 30 päiväksi
 * (api/sahkoposti.js ?kumppanisivu=), joten kassa käyttää sitä ilman kirjoittamista (src/lib/kumppani.ts).
 */
const PartnerLandingPage = () => {
  const { koodi = "" } = useParams();
  const alku = palvelimenTiedot(koodi);
  const [k, setK] = useState<Kumppani | null>(alku?.kumppani ?? null);
  const [virhe, setVirhe] = useState(!!alku && !alku.kumppani);
  const { data: tuotteet = [], isLoading } = useProducts();
  useEffect(() => {
    if (palvelimenTiedot(koodi)) return;
    fetch(`/api/sahkoposti?kumppanisivu=${encodeURIComponent(koodi)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.ok ? setK(j) : setVirhe(true)))
      .catch(() => setVirhe(true));
  }, [koodi]);

  return (
    <div className="py-8 md:py-12">
      <SEOHead title={k ? `${kumppaniTervehdys(k).otsikko} | Huumorikauppa` : "Tervetuloa | Huumorikauppa"} description="Hauskoja t-paitoja ja huppareita suomalaisella huumorilla." noindex />
      <div className="container max-w-3xl text-center space-y-3">
        {!k && !virhe && <p className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan...</p>}
        {(k || virhe) && (
          <>
            <h1 className="font-display text-3xl md:text-4xl text-foreground">{kumppaniTervehdys(k).otsikko}</h1>
            <p className="text-muted-foreground">{kumppaniTervehdys(k).teksti}</p>
          </>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/joulu" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">Joulumallisto 2026</Link>
          <Link to="/kaikki-tuotteet" className="rounded-md border border-border px-4 py-2 font-semibold text-foreground">Kaikki tuotteet</Link>
        </div>
      </div>
      <EtusivunSuosituimmat tuotteet={tuotteet} lataa={isLoading} />
    </div>
  );
};

export default PartnerLandingPage;
