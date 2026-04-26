import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const faqs = [
  {
    q: "Kuinka nopeasti tilaus toimitetaan?",
    a: "Toimitamme tilaukset 2–4 arkipäivässä koko Suomeen. Arkisin ennen klo 14 tehdyt tilaukset lähtevät samana päivänä."
  },
  {
    q: "Onko toimitus ilmainen?",
    a: "Toimitus on ilmainen yli 50 euron tilauksille. Alle 50 euron tilauksille toimitusmaksu on 4,90 €."
  },
  {
    q: "Miten palautusoikeus toimii?",
    a: "Sinulla on 30 päivää aikaa palauttaa tuotteet ilman syytä. Palautus on ilmainen. Rahat palautetaan 5–7 arkipäivässä."
  },
  {
    q: "Mitä maksutapoja teillä on?",
    a: "Hyväksymme Visa, Mastercard, Apple Pay, Google Pay ja Klarna. Klarnalla voit ostaa nyt ja maksaa myöhemmin."
  },
  {
    q: "Voinko tilata ilman tiliä?",
    a: "Kyllä, voit tilata vieraana ilman rekisteröitymistä."
  },
  {
    q: "Toimittaako Huumorikauppa ulkomaille?",
    a: "Tällä hetkellä toimitamme vain Suomeen, mukaan lukien Ahvenanmaa."
  },
  {
    q: "Miten otan yhteyttä asiakaspalveluun?",
    a: "Tavoitat meidät sähköpostilla huumorikauppa@gmail.com. Vastaamme 1–2 arkipäivässä."
  },
  {
    q: "Ovatko tuotteet suomalaista käsialaa?",
    a: "Kaikki designit ovat suomalaista käsialaa. Huumorikauppa on 100% suomalainen verkkokauppa, joka toimii Helsingistä."
  },
  {
    q: "Sopiiko tuote lahjaksi?",
    a: "Ehdottomasti! Monet tuotteemme on merkitty 'Lahjaidea' -badgella ja sopivat täydellisesti lahjaksi syntymäpäiviin, jouluun, isänpäivään ja äitienpäivään."
  },
  {
    q: "Miten tiedän mikä koko sopii?",
    a: "Jokaisella vaatetuotesivulla on koko-opas senttimetreinä. Jos olet epävarma, suosittelemme tilaamaan yhden koon isomman."
  },
  {
    q: "Teettekö custom-painatuksia?",
    a: "Kyllä! Teemme custom-painatuksia paitoihin, huppareihin ja mukeihin. Ota yhteyttä sähköpostilla (huumorikauppa@gmail.com) ja kerro mitä haluat – suunnitellaan yhdessä!"
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(f => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a }
  }))
};

const FAQ = () => {
  usePrerenderReady();
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Usein kysytyt kysymykset – UKK | Huumorikauppa.fi"
        description="Vastaukset yleisimpiin kysymyksiin toimituksesta, palautuksista, maksamisesta ja custom-painatuksista. Huumorikauppa – Suomen hauskin verkkokauppa."
        canonical="https://huumorikauppa.fi/usein-kysytyt-kysymykset"
        jsonLd={faqJsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Usein kysytyt kysymykset", url: "https://huumorikauppa.fi/usein-kysytyt-kysymykset" },
        ]}
      />

      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Usein kysytyt kysymykset</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Usein kysytyt kysymykset</h1>
      <p className="text-muted-foreground mb-8">Vastaukset yleisimpiin kysymyksiin.</p>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card">
            <AccordionTrigger className="text-foreground text-left font-medium hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-10 text-center">
        <p className="text-muted-foreground mb-4">Etkö löytänyt vastausta? Ota yhteyttä!</p>
        <p className="text-sm text-muted-foreground">📧 huumorikauppa@gmail.com</p>
      </div>
    </div>
  );
};

export default FAQ;
