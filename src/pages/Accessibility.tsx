import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const Accessibility = () => {
  usePrerenderReady();
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Saavutettavuusseloste | Huumorikauppa.fi"
        description="Huumorikauppa.fi-verkkokaupan saavutettavuusseloste. Sitoudumme WCAG 2.1 AA -tason saavutettavuuteen."
        canonical="https://huumorikauppa.fi/saavutettavuusseloste"
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Saavutettavuusseloste", url: "https://huumorikauppa.fi/saavutettavuusseloste" },
        ]}
      />

      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Saavutettavuusseloste</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8">Saavutettavuusseloste</h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>Tämä saavutettavuusseloste koskee verkkopalvelua <strong>huumorikauppa.fi</strong> ja on laadittu EU:n saavutettavuusdirektiivin (2016/2102) ja Suomen digipalvelulain (306/2019) mukaisesti.</p>

        <section>
          <h2 className="font-display text-xl text-foreground">Saavutettavuuden tila</h2>
          <p>Verkkopalvelu täyttää suurelta osin saavutettavuusvaatimukset (WCAG 2.1 -kriteeristön A- ja AA-tason). Mahdolliset puutteet on listattu alla.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">Ei-saavutettava sisältö</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Osa tuotekuvista on tuotettu kolmannen osapuolen järjestelmissä, jolloin alt-tekstit voivat olla automaattisesti generoituja.</li>
            <li>Joissakin upotetuissa videoissa ei välttämättä ole tekstitystä.</li>
            <li>Korjaamme puutteet sitä mukaa, kun ne tulevat tietoomme.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">Saavutettavuuden varmistaminen</h2>
          <p>Olemme toteuttaneet sivustolla mm. seuraavia saavutettavuutta tukevia ratkaisuja:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Semanttinen HTML-rakenne (otsikkohierarkia, landmarkit, aria-labelit).</li>
            <li>Riittävä värikontrasti tumman taustan ja tekstin välillä.</li>
            <li>Näppäimistönavigaatio kaikissa interaktiivisissa elementeissä.</li>
            <li>Responsiivinen design mobiililaitteille.</li>
            <li>Kuvaavat alt-tekstit tuotekuville.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">Palaute ja yhteystiedot</h2>
          <p>Huomasitko saavutettavuuspuutteen verkkopalvelussamme? Kerro siitä meille — teemme parhaamme korjataksemme puutteen.</p>
          <p>Sähköposti: <a href="mailto:huumorikauppa@gmail.com" className="text-primary hover:underline">huumorikauppa@gmail.com</a></p>
          <p>Vastaamme palautteeseen 14 päivän kuluessa.</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">Valvontaviranomainen</h2>
          <p>Jos et ole tyytyväinen saamaasi vastaukseen tai et saa vastausta lainkaan kahden viikon aikana, voit ilmoittaa asiasta Etelä-Suomen aluehallintovirastolle.</p>
          <p>
            Etelä-Suomen aluehallintovirasto<br />
            Saavutettavuuden valvonnan yksikkö<br />
            <a href="https://www.saavutettavuusvaatimukset.fi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.saavutettavuusvaatimukset.fi</a><br />
            <a href="mailto:saavutettavuus@avi.fi" className="text-primary hover:underline">saavutettavuus@avi.fi</a>
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-foreground">Selosteen päivittäminen</h2>
          <p>Tämä seloste on laadittu 23.4.2026 ja sitä päivitetään verkkopalvelun muutosten yhteydessä.</p>
        </section>
      </div>
    </div>
  );
};

export default Accessibility;
