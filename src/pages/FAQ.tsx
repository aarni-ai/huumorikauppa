import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Kuinka nopeasti tilaukseni toimitetaan?",
    a: "Toimitamme tilauksesi 1–3 arkipäivässä Postin tai Matkahuollon kautta. Jos olet tilannut perjantai-iltana krapulassa, maanantaina paketti on matkalla! 📦🚀"
  },
  {
    q: "Onko ilmainen toimitus?",
    a: "Kyllä! Yli 60 € tilaukset toimitetaan ilmaiseksi. Eli tilaa vain yksi muki lisää niin säästät toimituskulut. Matikka toimii! 🧮"
  },
  {
    q: "Voinko palauttaa tuotteen?",
    a: "Totta kai! Sinulla on 14 päivän palautusoikeus. Tuotteen pitää olla käyttämätön ja alkuperäispakkauksessa. Paitsi jos mummo on jo ehtinyt käyttää mukin – silloin se on hänen. 🧶"
  },
  {
    q: "Sopiiko tuote lahjaksi?",
    a: "Ehdottomasti! Monet tuotteemme on merkitty 'Lahjaidea' -badgella. Voit myös valita lahjapaketoinnin kassalla (+3,95 €). Mummo tilasi jo kolme mukin – kyllä se lahjaksi sopii! 🎁"
  },
  {
    q: "Miten tiedän mikä koko sopii?",
    a: "Jokaisella vaatetuotesivulla on koko-opas senttimetreinä. Jos olet epävarma, tilaa isompi – paidat kutistuu pesussa ja setävatsa kasvaa joka joulu. 📏😄"
  },
  {
    q: "Onko maksaminen turvallista?",
    a: "100%! Käytämme SSL-suojattua yhteyttä ja luotettavaa maksunvälitystä. Korttitietosi eivät tallennu meille – ainoastaan huumorintajusi jää meidän muistiin. 🔒"
  },
  {
    q: "Voinko tilata ilman rekisteröitymistä?",
    a: "Kyllä! Voit tilata vierailijana ilman tiliä. Mutta rekisteröitymällä näet tilaushistoriasi ja saat eksklusiivisia tarjouksia. Win-win! 🏆"
  },
  {
    q: "Teettekö custom-painatuksia?",
    a: "Tällä hetkellä emme, mutta tulevaisuudessa ehkä! Laita meille sähköpostia (info@huumorikauppa.fi) ja ehdota oma meemisi – jos se naurattaa meitä, se päätyy kauppaan! 😂"
  },
  {
    q: "Onko tämä oikea kauppa vai vitsi?",
    a: "Molempia! Olemme 100% oikea suomalainen verkkokauppa joka myy hauskoja tuotteita. Y-tunnus löytyy ja laskut lähtee. Huumori on vakava bisnes. 🇫🇮💼"
  },
  {
    q: "Mummo tilasi mukin itse – onko totta?",
    a: "Kyllä! 87-vuotias Helvi Kotkasta tilasi 'Maailman paras mummo' -mukin ja antoi meille 5 tähteä. Kiitos Helvi, olet legenda! ⭐🧶"
  },
];

const FAQ = () => {
  return (
    <div className="container py-8 md:py-12 max-w-3xl">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Usein kysytyt kysymykset</span>
      </nav>

      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Usein Kysytyt Kysymykset 🤔</h1>
      <p className="text-muted-foreground mb-8">Vastaukset kaikkiin sun (ja mummon) kysymyksiin.</p>

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
        <p className="text-sm text-muted-foreground">📧 info@huumorikauppa.fi &nbsp;•&nbsp; 📞 0400 123 456 &nbsp;•&nbsp; Ma–Pe 9–17</p>
      </div>
    </div>
  );
};

export default FAQ;
