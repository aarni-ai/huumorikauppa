import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Truck, RotateCcw, Shield, Flag, Heart, Sparkles } from "lucide-react";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Tietoa meistä – Huumorikauppa",
  url: "https://huumorikauppa.fi/tietoa-meista",
  mainEntity: {
    "@type": "Organization",
    name: "Huumorikauppa",
    url: "https://huumorikauppa.fi",
    logo: "https://huumorikauppa.fi/favicon.ico",
    email: "huumorikauppa@gmail.com",
    foundingLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Helsinki", addressCountry: "FI" } },
    description:
      "Huumorikauppa on 100 % suomalainen verkkokauppa, joka tekee hauskoja t-paitoja, huppareita, mukeja ja muita lahjoja suomalaisella huumorilla.",
    sameAs: [
      "https://instagram.com/huumorikauppa_fi",
      "https://www.facebook.com/profile.php?id=61584153329326",
    ],
  },
};

const AboutPage = () => {
  usePrerenderReady();
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Tietoa meistä – Suomalainen huumorikauppa | Huumorikauppa.fi"
        description="Huumorikauppa on 100 % suomalainen verkkokauppa. Tutustu tarinaamme, tuotantoon, materiaaleihin ja siihen, miksi tuhannet suomalaiset valitsevat meidät lahjakaupakseen."
        canonical="https://huumorikauppa.fi/tietoa-meista"
        jsonLd={aboutJsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Tietoa meistä", url: "https://huumorikauppa.fi/tietoa-meista" },
        ]}
      />
      <div className="container py-10 md:py-14 max-w-3xl">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Tietoa meistä</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">Tietoa meistä</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Huumorikauppa on suomalainen verkkokauppa, joka uskoo, että parhaat lahjat naurattavat. Suunnittelemme ja myymme hauskoja
          t-paitoja, huppareita, mukeja, tarroja ja muita tuotteita, joissa on aitoa suomalaista huumoria – ei kopioitua, ei käännettyä.
        </p>

        <article className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Miksi Huumorikauppa on olemassa</h2>
            <p>
              Suomalaiset rakastavat huumoria, mutta hauskoja lahjoja on yllättävän vaikea löytää. Useimmat verkkokaupat myyvät
              käännettyä, persoonatonta tavaraa, joka ei osu suomalaiseen sielunmaisemaan. Perustimme Huumorikaupan, koska halusimme
              tarjota lahjoja, jotka ymmärtävät setähuumorin, eläkeläishuumorin, ammattikuntavitsit ja klassiset suomalaiset sanonnat.
              Tavoitteemme on yksinkertainen: jokainen lahjapaketti, joka avautuu, saa hymyn aikaan.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Kuka pyörittää kauppaa</h2>
            <p>
              Huumorikauppa on pieni suomalainen yritys, jota pyöritetään Helsingistä käsin. Suunnittelemme tuotteet itse, valitsemme
              materiaalit huolella ja vastaamme asiakaspalveluun henkilökohtaisesti. Emme ole iso kansainvälinen jättiläinen – ja
              juuri siksi pystymme reagoimaan nopeasti ja pitämään asiakkaista huolta yksilöinä.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Tuotanto ja materiaalit</h2>
            <p>
              Tuotteemme valmistetaan tilauksesta luotettavalla EU-painokumppanilla, joka käyttää modernia DTG- ja
              sublimaatio-painatusmenetelmää. Tämä tarkoittaa, että emme tuota turhaa varastoa, materiaali ei mene hukkaan ja kuljetus
              Suomeen on lyhyt. T-paitamme ja hupparimme ovat puuvillaa tai puuvilla-polyesterisekoitetta, mukimme korkealaatuista
              keramiikkaa, ja tarrat kestävää UV-suojattua vinyyliä. Kaikki materiaalit valitaan niin, että lahja kestää käytössä
              vuosia.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Toimitus ja palautus</h2>
            <p>
              Toimitamme kaikki tilaukset 3–7 arkipäivässä koko Suomeen Postin verkostolla. Yli 60 € tilaukset toimitetaan ilmaiseksi.
              Jokaisella tilauksella on 14 päivän palautusoikeus, ja maksaminen on aina turvallista (Visa, Mastercard, Klarna,
              MobilePay, Apple Pay, Google Pay). Lue lisää{" "}
              <Link to="/toimitusehdot" className="text-primary hover:underline">toimitusehdoistamme</Link> ja{" "}
              <Link to="/palautusehdot" className="text-primary hover:underline">palautusehdoistamme</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Miksi asiakkaat valitsevat meidät</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Aitoa suomalaista huumoria – emme käännä vitsejä englannista</li>
              <li>Laadukkaat materiaalit ja kestävä painatus</li>
              <li>Nopea toimitus 3–7 arkipäivässä koko Suomeen</li>
              <li>Henkilökohtainen asiakaspalvelu, joka vastaa 1–2 arkipäivässä</li>
              <li>14 päivän palautusoikeus ilman selittelyjä</li>
              <li>Tuhansia tyytyväisiä asiakkaita ja todelliset arvostelut</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Ota yhteyttä</h2>
            <p>
              Onko mielessä idea, kysymys tai palaute? Vastaamme mielellämme. Ota yhteyttä sähköpostitse osoitteeseen{" "}
              <a href="mailto:huumorikauppa@gmail.com" className="text-primary hover:underline">huumorikauppa@gmail.com</a> tai
              käytä <Link to="/yhteystiedot" className="text-primary hover:underline">yhteydenottolomakettamme</Link>.
            </p>
          </section>
        </article>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen yritys</div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;