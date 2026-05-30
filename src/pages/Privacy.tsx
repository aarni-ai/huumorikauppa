import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const Privacy = () => {
  usePrerenderReady();
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Tietosuojaseloste | Huumorikauppa.fi"
        description="Huumorikaupan tietosuojakäytäntö: miten keräämme, käytämme ja suojaamme henkilötietojasi GDPR:n mukaisesti."
        canonical="https://huumorikauppa.fi/tietosuojakaytanto"
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Tietosuojakäytäntö", url: "https://huumorikauppa.fi/tietosuojakaytanto" },
        ]}
      />

      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Tietosuojakäytäntö</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8">Tietosuojakäytäntö</h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-display text-xl text-foreground">1. Rekisterinpitäjä</h2>
          <p>Huumorikauppa<br />Helsinki, Suomi<br />huumorikauppa@gmail.com</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">2. Kerättävät tiedot</h2>
          <p>Keräämme seuraavia henkilötietoja tilausten käsittelyä varten: nimi, sähköpostiosoite, puhelinnumero, toimitusosoite ja maksutiedot. Maksutietoja ei tallenneta palvelimillemme vaan ne käsitellään maksunvälittäjän toimesta.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">3. Tietojen käyttötarkoitus</h2>
          <p>Henkilötietoja käytetään tilausten käsittelyyn, toimittamiseen ja asiakaspalveluun. Suostumuksellasi tietoja voidaan käyttää myös markkinointiviestintään (uutiskirje).</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">4. Tietojen säilytys</h2>
          <p>Henkilötietoja säilytetään niin kauan kuin on tarpeellista edellä mainittujen tarkoitusten toteuttamiseksi sekä lakisääteisten velvoitteiden täyttämiseksi (esim. kirjanpitolaki 6 vuotta).</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">5. Rekisteröidyn oikeudet</h2>
          <p>Sinulla on oikeus tarkastaa, korjata ja poistaa itseäsi koskevat tiedot. Voit myös vastustaa tietojen käsittelyä ja pyytää tietojen siirtämistä. Ota yhteyttä huumorikauppa@gmail.com.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">6. Evästeet</h2>
          <p>Käytämme evästeitä verkkosivuston toiminnan varmistamiseksi ja käyttökokemuksen parantamiseksi. Voit hallita evästeasetuksia selaimesi asetuksista.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">7. Tietoturva</h2>
          <p>Kaikki tiedonsiirto on suojattu SSL-salauksella. Pääsy henkilötietoihin on rajattu ainoastaan niihin henkilöihin, joiden työtehtävät sitä edellyttävät.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">8. Muutokset</h2>
          <p>Pidätämme oikeuden muuttaa tätä tietosuojakäytäntöä. Olennaisista muutoksista ilmoitetaan verkkosivuillamme.</p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
