import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Truck, RotateCcw, Shield, Flag, Mail, MapPin, CheckCircle2 } from "lucide-react";
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
    email: "info@huumorikauppa.fi",
    foundingDate: "2024",
    foundingLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: "Helsinki", addressCountry: "FI" },
    },
    description:
      "Huumorikauppa on 100 % suomalainen verkkokauppa, joka tekee hauskoja t-paitoja, huppareita, mukeja ja muita lahjoja suomalaisella huumorilla.",
    sameAs: [
      "https://www.wikidata.org/wiki/Q139915256",
      "https://www.instagram.com/huumorikauppa_fi",
      "https://www.tiktok.com/@huumorikauppa",
      "https://www.youtube.com/@huumorikauppa",
      "https://www.facebook.com/profile.php?id=61584153329326",
    ],
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Finnish Business ID (Y-tunnus)",
      value: "3583677-2",
    },
    numberOfEmployees: { "@type": "QuantitativeValue", value: "2" },
    knowsAbout: ["Finnish humor", "Print-on-demand", "E-commerce", "Gift products"],
  },
};

const stats = [
  { value: "200+", label: "tuotetta valikoimassa" },
  { value: "14 pv", label: "palautusoikeus" },
  { value: "3–10", label: "arkipäivää toimitusaika" },
  { value: "100 %", label: "suomalainen yritys" },
];

const processSteps = [
  {
    number: "01",
    title: "Ideointi",
    body: "Suomalaisesta arjesta nousevat vitsit ja sanonnat – setähuumorista, eläkepäivistä, kahvista, kalastuksesta. Emme käännä englanninkielistä sisältöä, vaan kirjoitamme alusta alkaen suomeksi.",
  },
  {
    number: "02",
    title: "Suunnittelu",
    body: "Tekstit ja kuvat sovitetaan tuotteeseen – oikeat fontit, kontrasti ja sijoittelu niin, että painatus näyttää hyvältä pesun jälkeenkin. Jokaisesta designista tehdään useita versioita ennen julkaisua.",
  },
  {
    number: "03",
    title: "Painatus",
    body: "EU-kumppanimme käyttää DTG- (suorapainatus kankaalle) ja sublimaatiotekniikkaa. Tilaukset painetaan tilauksesta – ei turhaa varastoa, ei pitkiä kuljetusketjuja Aasiasta.",
  },
  {
    number: "04",
    title: "Toimitus",
    body: "Posti toimittaa suoraan osoitteeseesi 3–10 arkipäivässä. Ilmainen toimitus yli 60 € tilauksiin. Jokainen tilaus on seurattavissa koko matkan ajan.",
  },
];

const materials = [
  { label: "T-paidat & hupparit", detail: "Rengaskehrätty 100 % puuvilla tai 80/20 puuvilla-polyesterisekoite. Koot S–3XL." },
  { label: "Mukit", detail: "Korkealaatuinen keramiikka, 330 ml. Astianpesukoneenkestävä sublimaatiopainatus." },
  { label: "Tarrat", detail: "Kestävä UV-suojattu vinyyli. Vedenkestävä, sopii ulkokäyttöön." },
  { label: "Peitot", detail: "Pehmeä fleece, 150×200 cm. Painatus koko peittoalueelle." },
  { label: "Seinätaulut", detail: "Puiset kehykset, laadukas kangas. Valmiina ripustamiseen." },
];

const trustPoints = [
  { icon: Truck, title: "Nopea toimitus", body: "3–10 arkipäivää koko Suomeen Postin verkostolla. Ilmainen toimitus yli 60 € tilauksiin." },
  { icon: RotateCcw, title: "14 pv palautusoikeus", body: "Palauta ilman selittelyjä 14 päivän kuluessa. Palautusohjeet löytyvät tilausvahvistuksesta." },
  { icon: Shield, title: "Turvallinen maksu", body: "Visa, Mastercard, Klarna, MobilePay, Apple Pay, Google Pay. Maksut suojattu SSL-salauksella." },
  { icon: Flag, title: "Suomalainen yritys", body: "Rekisteröity Helsinki, Finland. Y-tunnus 3583677-2. Noudatamme EU:n kuluttajansuoja- ja GDPR-lainsäädäntöä." },
  { icon: Mail, title: "Aito asiakaspalvelu", body: "Vastaamme 1–2 arkipäivässä. Ei chatbottia – aito ihminen lukee viestisi ja auttaa." },
  { icon: MapPin, title: "Tunnettu ja vahvistettu", body: "Rekisteröity Wikidataan (Q139915256). Arvostelut Google Merchant Centerissä." },
];

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
        {/* Breadcrumb */}
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Tietoa meistä</span>
        </nav>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">Tietoa meistä</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Huumorikauppa on suomalainen verkkokauppa, joka uskoo, että parhaat lahjat naurattavat.
          Suunnittelemme hauskoja t-paitoja, huppareita, mukeja, tarroja ja muita tuotteita, joissa on
          aitoa suomalaista huumoria – ei kopioitua, ei käännettyä.
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="font-display text-2xl text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Miksi Huumorikauppa on olemassa</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Suomalaiset rakastavat huumoria, mutta hauskoja lahjoja on yllättävän vaikea löytää. Useimmat
              verkkokaupat myyvät käännettyä, persoonatonta tavaraa, joka ei osu suomalaiseen sielunmaisemaan.
              Perustimme Huumorikaupan, koska halusimme tarjota lahjoja, jotka ymmärtävät setähuumorin,
              eläkeläishuumorin, ammattikuntavitsit ja klassiset suomalaiset sanonnat.
            </p>
            <p>
              Huumori on suomalaisille tapa selvitä – pimeästä talvesta, pitkistä palavereista, sukulaisten
              kysymyksistä. Halusimme rakentaa kaupan, joka kunnioittaa juuri tätä: paikallista, osuvaa,
              joskus vinoa, mutta ei koskaan loukkaavaa. Jokainen tuote suunnitellaan niin, että se
              naurattaa myös vuoden päästä – ei vain ostohetkellä.
            </p>
            <p>
              Tavoitteemme on yksinkertainen: jokainen lahjapaketti, joka avautuu, saa hymyn aikaan.
            </p>
          </div>
        </section>

        {/* Who we are */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Kuka pyörittää kauppaa</h2>
          <p className="text-muted-foreground">
            Huumorikauppa on pieni suomalainen yritys, jota pyöritetään Helsingistä käsin. Suunnittelemme
            tuotteet itse, valitsemme materiaalit huolella ja vastaamme asiakaspalveluun henkilökohtaisesti.
            Emme ole iso kansainvälinen jättiläinen – ja juuri siksi pystymme reagoimaan nopeasti ja
            pitämään asiakkaista huolta yksilöinä.
          </p>
        </section>

        {/* Process */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-6">Miten tuote syntyy</h2>
          <div className="space-y-4">
            {processSteps.map((step) => (
              <div key={step.number} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <span className="font-display text-2xl text-primary/40 shrink-0 w-8">{step.number}</span>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Materials */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Materiaalit ja läpinäkyvyys</h2>
          <p className="text-muted-foreground mb-4">
            Uskomme läpinäkyvyyteen. Tässä on tarkka listaus siitä, mitä tuotteemme sisältävät:
          </p>
          <div className="rounded-xl border border-border overflow-hidden">
            {materials.map((m, i) => (
              <div
                key={m.label}
                className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-5 py-3 text-sm ${
                  i < materials.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="font-medium text-foreground shrink-0 sm:w-44">{m.label}</span>
                <span className="text-muted-foreground">{m.detail}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Painatus tapahtuu EU-kumppanillamme DTG- tai sublimaatiotekniikalla. Tuotteet toimitetaan
            tilauksesta – ei turhaa varastoa, ei pitkiä kuljetusketjuja kaukaa.
          </p>
        </section>

        {/* Trust grid */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-6">Luottamus ja turvallisuus</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trustPoints.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5 flex gap-3">
                <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why us — scannable bullets */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Miksi asiakkaat valitsevat meidät</h2>
          <ul className="space-y-2">
            {[
              "Aitoa suomalaista huumoria – emme käännä vitsejä englannista",
              "Laadukkaat materiaalit ja kestävä painatus",
              "Nopea toimitus 3–10 arkipäivässä koko Suomeen",
              "Henkilökohtainen asiakaspalvelu, joka vastaa 1–2 arkipäivässä",
              "14 päivän palautusoikeus ilman selittelyjä",
              "Tuhansia tyytyväisiä asiakkaita ja todelliset arvostelut",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Company info */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Yritystiedot</h2>
          <div className="rounded-xl border border-border bg-card/50 p-5 text-sm space-y-2">
            <div className="flex gap-2"><span className="text-muted-foreground w-32">Brändi</span><span className="text-foreground">Huumorikauppa</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-32">Yritys</span><span className="text-foreground">Inteller</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-32">Y-tunnus</span><span className="text-foreground">3583677-2</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-32">Kotipaikka</span><span className="text-foreground">Helsinki, Suomi</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-32">Sähköposti</span><a href="mailto:info@huumorikauppa.fi" className="text-primary hover:underline">info@huumorikauppa.fi</a></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-32">Wikidata</span><a href="https://www.wikidata.org/wiki/Q139915256" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Q139915256</a></div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-foreground mb-3">Ota yhteyttä</h2>
          <p className="text-muted-foreground mb-4">
            Onko mielessä idea, kysymys tai palaute? Vastaamme mielellämme 1–2 arkipäivässä.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:info@huumorikauppa.fi"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:border-primary/60 hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" /> info@huumorikauppa.fi
            </a>
            <Link
              to="/yhteystiedot"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:border-primary/60 hover:text-primary transition-colors"
            >
              Yhteydenottolomake →
            </Link>
          </div>
        </section>

        {/* Internal links */}
        <section>
          <h2 className="font-display text-xl text-foreground mb-3">Lue lisää</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/lahjat/miehelle" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/60 transition">🎁 Lahjat miehelle</Link>
            <Link to="/lahjat/naiselle" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/60 transition">🎁 Lahjat naiselle</Link>
            <Link to="/suomalaiset-tyopaikkameemit-top-50" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/60 transition">😂 Työpaikkameemit TOP 50</Link>
            <Link to="/hauskimmat-tyopaikkalaput-2026" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/60 transition">📋 Työpaikkalaput 2026</Link>
            <Link to="/blogi" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/60 transition">📰 Lahjaopas-blogi</Link>
            <Link to="/toimitusehdot" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/60 transition">📦 Toimitusehdot</Link>
            <Link to="/palautusehdot" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/60 transition">↩️ Palautusehdot</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
