import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEOHead";

const faqs = [
  {
    q: "Kuinka nopeasti tilaukseni toimitetaan?",
    a: "Toimitamme tilauksesi 3–10 arkipäivässä Postin tai Matkahuollon kautta. Saat seurantakoodin sähköpostiisi heti kun paketti lähtee matkaan."
  },
  {
    q: "Onko ilmainen toimitus?",
    a: "Kyllä! Yli 60 € tilaukset toimitetaan ilmaiseksi koko Suomeen."
  },
  {
    q: "Voinko palauttaa tuotteen?",
    a: "Totta kai! Sinulla on 14 päivän palautusoikeus."
  },
  {
    q: "Sopiiko tuote lahjaksi?",
    a: "Ehdottomasti! Monet tuotteemme on merkitty 'Lahjaidea' -badgella ja sopivat täydellisesti lahjaksi."
  },
  {
    q: "Miten tiedän mikä koko sopii?",
    a: "Jokaisella vaatetuotesivulla on koko-opas senttimetreinä. Jos olet epävarma, suosittelemme tilaamaan yhden koon isomman."
  },
  {
    q: "Onko maksaminen turvallista?",
    a: "Kyllä! Käytämme SSL-suojattua yhteyttä ja luotettavaa maksunvälitystä."
  },
  {
    q: "Teettekö custom-painatuksia?",
    a: "Kyllä! Teemme custom-painatuksia paitoihin, huppareihin ja mukeihin. Ota yhteyttä sähköpostilla (info@huumorikauppa.fi) ja kerro mitä haluat – suunnitellaan yhdessä!"
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
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <SEOHead
        title="Usein kysytyt kysymykset – Huumorikauppa"
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

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Usein Kysytyt Kysymykset</h1>
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
        <p className="text-sm text-muted-foreground">📧 info@huumorikauppa.fi</p>
      </div>
    </div>
  );
};

export default FAQ;
