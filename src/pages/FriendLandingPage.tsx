import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { EtusivunSuosituimmat } from "@/components/EtusivunSuosituimmat";
import { useProducts } from "@/hooks/use-products";

const YSTAVAKOODI = /^YSTAVA-[A-Z2-9]{6}$/;

/**
 * /ystava/<koodi> (2.11.2026, api/_lib/uusintaosto.js): ystävän jakama linkki. Koodi tallennetaan evästeeseen
 * hk_alekoodi 7 päiväksi, ja kassa täyttää sen alennuskoodikenttään. Ystävä saa 5 %, ja koodin antaja saa 5 %
 * seuraavaan tilaukseen, kun ystävän tilaus on maksettu. Katesääntö kuten kaikissa koodeissa.
 */
const FriendLandingPage = () => {
  const { koodi = "" } = useParams();
  const k = koodi.toUpperCase();
  const kelpaa = YSTAVAKOODI.test(k);
  const { data: tuotteet = [], isLoading } = useProducts();
  useEffect(() => {
    if (kelpaa) document.cookie = `hk_alekoodi=${k}; Path=/; Max-Age=${7 * 86400}; SameSite=Lax; Secure`;
  }, [k, kelpaa]);
  return (
    <div className="py-8 md:py-12">
      <SEOHead title="Ystäväsi lähetti alennuksen | Huumorikauppa" description="Ystäväsi lähetti sinulle 5 % alennuksen Huumorikauppaan." noindex />
      <div className="container max-w-3xl text-center space-y-3">
        <h1 className="font-display text-3xl md:text-4xl text-foreground">{kelpaa ? "Ystäväsi lähetti sinulle 5 % alennuksen" : "Tervetuloa Huumorikauppaan"}</h1>
        {kelpaa && (
          <p className="text-muted-foreground">
            Koodi {k} on valmiina kassalla 7 päivän ajan: paina kassalla alennuskoodin kohdalla Käytä. Alennus koskee useimpia tilauksia.
          </p>
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

export default FriendLandingPage;
