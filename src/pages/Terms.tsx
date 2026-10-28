import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";
import { ORGANIZATION } from "@/seo/site";

const Terms = () => {
  usePrerenderReady();
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title={STATIC_PAGE_META["/toimitusehdot"].title}
        description={STATIC_PAGE_META["/toimitusehdot"].description}
        canonical="https://huumorikauppa.fi/toimitusehdot"
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Toimitusehdot", url: "https://huumorikauppa.fi/toimitusehdot" },
        ]}
      />

      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Toimitusehdot</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8">Toimitusehdot ja palautukset</h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl text-foreground">1. Yleistä</h2>
          <p>Nämä toimitusehdot koskevat Huumorikaupan verkkokaupasta osoitteessa huumorikauppa.fi tehtyjä tilauksia. Myyjä on {ORGANIZATION.legalName} (Y-tunnus {ORGANIZATION.legalId}). Tilaamalla tuotteita verkkokaupasta asiakas hyväksyy nämä toimitusehdot.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">2. Tilaaminen</h2>
          <p>Tilaus tehdään lisäämällä tuotteet ostoskoriin ja täyttämällä kassalla pyydetyt tiedot. Tilaus on sitova kun maksu on suoritettu. Tilausvahvistus lähetetään sähköpostitse.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">3. Hinnat ja maksaminen</h2>
          <p>Kaikki hinnat sisältävät arvonlisäveron (ALV 25,5 %). Maksu suoritetaan tilauksen yhteydessä. Hyväksymme seuraavat maksutavat: Visa, Mastercard, Apple Pay, Google Pay, Klarna ja MobilePay.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">4. Toimitus</h2>
          <p>Toimitamme tilaukset Postin tai Matkahuollon kautta. Toimitusaika on {TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta. Vähintään {ILMAINEN_RAJA_TEKSTI} € tilaukset toimitetaan ilman toimituskuluja. Alle {ILMAINEN_RAJA_TEKSTI} € tilausten toimituskulut ovat {TOIMITUSMAKSU_TEKSTI} €.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">5. Palautukset ja vaihto</h2>
          <p>Asiakkaalla on kuluttajansuojalain mukainen 14 päivän peruutusoikeus. Palautuskulut maksaa asiakas, ellei tuote ole virheellinen.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">6. Reklamaatiot</h2>
          <p>Virheellisestä tuotteesta tulee reklamoida viipymättä osoitteeseen {ORGANIZATION.email}. Liitä viestiin tilausnumero, kuvaus virheestä sekä valokuva.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">7. Myyjän yhteystiedot</h2>
          <p>
            {ORGANIZATION.legalName} / Huumorikauppa<br />
            Y-tunnus {ORGANIZATION.legalId}<br />
            ALV-numero {ORGANIZATION.vatID}<br />
            {ORGANIZATION.postalAddress}, Suomi<br />
            {ORGANIZATION.email}
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
