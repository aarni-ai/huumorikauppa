import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const faqs = [
  {
    q: "Kuinka nopeasti tilaus toimitetaan?",
    a: "Toimitamme tilaukset PostNordin kautta. Toimitusaika on tyypillisesti 3–10 arkipäivää tilauksesta. Saat sähköpostiisi toimitusseurantakoodin kun paketti on lähetetty."
  },
  {
    q: "Onko toimitus ilmainen?",
    a: "Toimitus on ilmainen yli 60 euron tilauksille. Alle 60 euron tilauksille toimitusmaksu on 5,95 €."
  },
  {
    q: "Miten palautusoikeus toimii?",
    a: "Sinulla on 14 päivää aikaa palauttaa tuotteet ilman syytä. Palautuskulut ovat asiakkaan vastuulla. Rahat palautetaan 5–7 arkipäivässä."
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
    a: "Ehdottomasti. Monet tuotteemme on merkitty 'Lahjaidea'-badgella ja sopivat lahjaksi syntymäpäiviin, jouluun, polttareihin, valmistujaisiin, eläkejuhliin ja työkavereille."
  },
  {
    q: "Miten tiedän mikä koko sopii?",
    a: "Jokaisella vaatetuotesivulla on koko-opas senttimetreinä. Jos olet epävarma, suosittelemme tilaamaan yhden koon isomman."
  },
  {
    q: "Teettekö custom-painatuksia?",
    a: "Kyllä! Teemme custom-painatuksia paitoihin, huppareihin ja mukeihin. Ota yhteyttä sähköpostilla (huumorikauppa@gmail.com) ja kerro mitä haluat – suunnitellaan yhdessä!"
  },
  {
    q: "Mikä on Huumorikauppa?",
    a: "Huumorikauppa on suomalainen verkkokauppa, joka myy hauskoja t-paitoja, huppareita, mukeja, tarroja, kangaskasseja ja muita huumorituotteita. Designit suunnitellaan Suomessa ja jokainen tuote painetaan tilauksesta."
  },
  {
    q: "Mistä Huumorikaupan tuotteet painetaan?",
    a: "Tuotteet painetaan tilauksesta print-on-demand-menetelmällä, joten ylituotantoa ei synny. Painopalvelu on EU-alueelta ja täyttää eurooppalaiset laatuvaatimukset."
  },
  {
    q: "Millaiset materiaalit tuotteissa on käytössä?",
    a: "T-paidat ja hupparit ovat 100 % puuvillaa tai puuvilla–polyesteri-sekoitteita. Mukit ovat keraamisia, tarrat säänkestävää vinyyliä ja kangaskassit kestävää puuvillaa."
  },
  {
    q: "Mikä on hauska lahja miehelle?",
    a: "Suosituimmat hauskat lahjat miehelle ovat huumorit-paidat, isänpäivä- ja syntymäpäivähupparit, kahvimukit toimistoon ja meemiaiheiset tarrat. Katso valikoima kategoriasta /hauskat-lahjat-miehelle."
  },
  {
    q: "Mikä on hauska lahja naiselle?",
    a: "Naisille suosituimpia ovat hauskat tekstihupparit, kahvimukit, kangaskassit ja meemipaidat. Katso lahjaideoita kategoriasta /hauskat-lahjat-naiselle."
  },
  {
    q: "Mitkä ovat parhaat lahjat työkaverille?",
    a: "Toimistolahjoiksi sopivat hauskat kahvimukit, työpaikkahuumoria sisältävät t-paidat ja toimistotarrat. Suositut tuotteet löytyvät /lahja-tyokaverille-sivulta."
  },
  {
    q: "Onko teillä polttarilahjoja?",
    a: "Kyllä – polttareihin sopivat hauskat ryhmäpaidat ja personoidut hupparit. Katso /polttari-lahjat-kategoria tai pyydä custom-printti sähköpostilla."
  },
  {
    q: "Miten löydän lahjan ihmiselle, jolla on jo kaikkea?",
    a: "Hauska lahja toimii silloin kun mikään muu ei tunnu sopivalta. Suosittelemme henkilön persoonaan sopivaa huumoripaitaa, mukia tai tekstitaulua – kategoriasta /lahjaideat-jolla-jo-kaikkea löydät listan testattuja vinkkejä."
  },
  {
    q: "Voiko tilauksen noutaa?",
    a: "Emme tarjoa noutoa tällä hetkellä. Kaikki tilaukset toimitetaan PostNordin kautta lähimpään pakettiautomaattiin tai Postin pisteeseen Suomessa."
  },
  {
    q: "Miten alennuskoodi käytetään?",
    a: "Syötä alennuskoodi (esim. HUUMORI10) ostoskorin Yhteenveto-osioon ennen kassalle siirtymistä. Alennus näkyy heti loppusummassa."
  },
  {
    q: "Voinko vaihtaa väärän koon?",
    a: "Kyllä. Lähetä tuote takaisin 30 päivän sisällä ja tilaa uusi koko erillisellä tilauksella – näin saat sen nopeammin kuin vaihdolla."
  },
  {
    q: "Säilyvätkö painatukset pesussa?",
    a: "Kyllä. Painatukset on tehty kestopainomenetelmällä, ja oikein hoidettuna (käännä nurin ennen pesua, max 40 °C, ei kuivurin korkeinta lämpöä) ne säilyvät vuosia ennallaan."
  },
  {
    q: "Onko tuotteet eettisesti tuotettu?",
    a: "Käyttämämme tukkutoimittajat (mm. Stanley/Stella ja Bella+Canvas) on sertifioitu Fair Wear- tai vastaavilla työehtosertifikaateilla. Print-on-demand-tuotanto vähentää myös ylituotantoa ja jätettä."
  },
  {
    q: "Tarjoatteko yrityslahjoja tai tukkuhintoja?",
    a: "Kyllä, teemme yrityslahjoja, kausituotteita ja tiimipaitoja. Pyydä tarjous: huumorikauppa@gmail.com – kerro määrä, tuote ja toivottu painatus."
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
