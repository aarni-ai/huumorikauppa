import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const Terms = () => {
  usePrerenderReady();
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Toimitusehdot & palautukset | Huumorikauppa.fi"
        description="Huumorikaupan toimitusehdot: tilaaminen, hinnat, toimitus, palautukset ja reklamaatiot. Turvallinen verkkokauppa."
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
          <p>Nämä toimitusehdot koskevat Huumorikaupan verkkokaupasta osoitteessa huumorikauppa.fi tehtyjä tilauksia. Tilaamalla tuotteita verkkokaupasta asiakas hyväksyy nämä toimitusehdot.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">2. Tilaaminen</h2>
          <p>Tilaus tehdään lisäämällä tuotteet ostoskoriin ja täyttämällä kassalla pyydetyt tiedot. Tilaus on sitova kun maksu on suoritettu. Tilausvahvistus lähetetään sähköpostitse.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">3. Hinnat ja maksaminen</h2>
          <p>Kaikki hinnat sisältävät arvonlisäveron (ALV 25,5 %). Maksu suoritetaan tilauksen yhteydessä. Hyväksymme seuraavat maksutavat: Visa, Mastercard sekä muut yleisimmät maksutavat.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">4. Toimitus</h2>
          <p>Toimitamme tilaukset Postin tai Matkahuollon kautta. Toimitusaika on 3–10 arkipäivää tilauksesta. Yli 60 € tilaukset toimitetaan ilman toimituskuluja. Alle 60 € tilausten toimituskulut ovat 5,95 €.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">5. Palautukset ja vaihto</h2>
          <p>Asiakkaalla on kuluttajansuojalain mukainen 14 päivän peruutusoikeus. Palautuskulut maksaa asiakas, ellei tuote ole virheellinen.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">6. Reklamaatiot</h2>
          <p>Virheellisestä tuotteesta tulee reklamoida viipymättä osoitteeseen info@huumorikauppa.fi. Liitä viestiin tilausnumero, kuvaus virheestä sekä valokuva.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">7. Yhteystiedot</h2>
          <p>Huumorikauppa<br />Helsinki, Suomi<br />info@huumorikauppa.fi</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
