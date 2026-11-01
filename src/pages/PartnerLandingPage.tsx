import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { EtusivunSuosituimmat } from "@/components/EtusivunSuosituimmat";
import { useProducts } from "@/hooks/use-products";
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";

type Kumppani = { koodi: string; nimi: string; kautta: string; malli: "provisio" | "alennus" };

/**
 * /k/<koodi> (2.11.2026): kumppanin oma laskeutumissivu. Palvelin tallentaa koodin evästeeseen 30 päiväksi
 * (api/sahkoposti.js ?kumppanisivu=), joten kassa käyttää sitä ilman kirjoittamista (src/lib/kumppani.ts).
 */
const PartnerLandingPage = () => {
  const { koodi = "" } = useParams();
  const [k, setK] = useState<Kumppani | null>(null);
  const [virhe, setVirhe] = useState(false);
  const { data: tuotteet = [], isLoading } = useProducts();
  useEffect(() => {
    fetch(`/api/sahkoposti?kumppanisivu=${encodeURIComponent(koodi)}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.ok ? setK(j) : setVirhe(true)))
      .catch(() => setVirhe(true));
  }, [koodi]);

  return (
    <div className="py-8 md:py-12">
      <SEOHead title="Tervetuloa | Huumorikauppa" description="Hauskoja t-paitoja ja huppareita suomalaisella huumorilla." noindex />
      <div className="container max-w-3xl text-center space-y-3">
        {!k && !virhe && <p className="flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Ladataan...</p>}
        {virhe && (
          <>
            <h1 className="font-display text-3xl text-foreground">Tervetuloa Huumorikauppaan</h1>
            <p className="text-muted-foreground">Kumppanikoodia ei löytynyt. Tuotteet löytyvät alta.</p>
          </>
        )}
        {k && (
          <>
            <h1 className="font-display text-3xl md:text-4xl text-foreground">Tervetuloa {k.kautta} kautta</h1>
            <p className="text-muted-foreground">
              {k.malli === "alennus"
                ? `Koodi ${k.koodi.toUpperCase()} on tallennettu: kassa antaa ${KUMPPANUUS.alennusmalli.alennusProsentti} %:n alennuksen useimmista tilauksista, eikä koodia tarvitse kirjoittaa.`
                : `Koodi ${k.koodi.toUpperCase()} on tallennettu, eikä sitä tarvitse kirjoittaa kassalla.`}{" "}
              Koodi on voimassa tällä laitteella 30 päivää.
            </p>
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
