import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Printer, Share2, Coffee, Users, Briefcase, Calendar } from "lucide-react";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

interface NoteCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  notes: string[];
}

const CATEGORIES: NoteCategory[] = [
  {
    id: "pomo",
    title: "Pomo-vitsit",
    icon: <Briefcase className="h-5 w-5 text-primary" />,
    notes: [
      "“Tämä on pieni juttu” – muista skaalauskerroin 14×.",
      "Pomon kalenteri on vihjaus, ei lupaus.",
      "“Voitaisko keskustella?” = mitään hyvää ei seuraa.",
      "Bonus-puhe alkaa aina sanalla ‘haastava vuosi’.",
      "Pomon palaute on kuin sää: vaihtuu ennusteesta huolimatta.",
    ],
  },
  {
    id: "kollega",
    title: "Kollegavitsit",
    icon: <Users className="h-5 w-5 text-primary" />,
    notes: [
      "“Tää on muuten siun vuoro tiskata kahvinkeitin.”",
      "Open spacen kuiskaus kuuluu kahteen kerrokseen.",
      "Slackissä naureskelu = naama peruslukemilla.",
      "Toimistolahja = post-it, jossa lukee ‘kiitti’.",
      "Yhteinen lounas on neuvottelu, ei tauko.",
    ],
  },
  {
    id: "palaverit",
    title: "Palaverivitsit",
    icon: <Calendar className="h-5 w-5 text-primary" />,
    notes: [
      "“Olisiko tämä voinut olla sähköposti?” – kyllä.",
      "Stand-up kestää 27 minuuttia keskimäärin.",
      "“Ihan vain pikainen sync.” – varaa tunti.",
      "Kameratta = vielä pyjamassa.",
      "Loppupäätös: pidetään uusi palaveri.",
    ],
  },
  {
    id: "kahvi",
    title: "Kahvikulttuuri",
    icon: <Coffee className="h-5 w-5 text-primary" />,
    notes: [
      "Kahvi #1 herätys, #2 ihmisyys, #3 tuottavuus, #4 sankaruus.",
      "Tyhjä pannu = rikollinen teko.",
      "Maitoa enää 2ml = riittää muille, ei sinulle.",
      "Pulla on rakkauden valuutta.",
      "Kahvihuoneen sohva tietää kaikki firman salaisuudet.",
    ],
  },
];

const url = "https://huumorikauppa.fi/hauskimmat-tyopaikkalaput-2026";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  name: "Hauskimmat työpaikkalaput 2026",
  url,
  about: "Toimiston huumori, tulostettavat post-it -vitsit suomalaisille työpaikoille",
  inLanguage: "fi-FI",
};

const OfficeNotesPage = () => {
  usePrerenderReady();

  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Hauskimmat työpaikkalaput 2026", url });
        return;
      } catch {
        /* noop */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Hauskimmat työpaikkalaput 2026 – tulosta ja jaa | Huumorikauppa"
        description="Tulostettavat ja jaettavat työpaikkalaput 2026: pomo-vitsit, kollegavitsit, palaverit ja kahvikulttuuri. Suomalaista toimistohuumoria valmiina käyttöön."
        canonical={url}
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Hauskimmat työpaikkalaput 2026", url },
        ]}
      />
      <div className="container py-10 md:py-14 max-w-3xl">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Hauskimmat työpaikkalaput 2026</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">
          Hauskimmat työpaikkalaput 2026 📋
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Tulosta, leikkaa ja kiinnitä jääkaappiin tai kahvinkeittimen viereen. Kokosimme suomalaisen toimistohuumorin
          parhaat post-it -vitsit neljään kategoriaan – kaikki valmiina jaettavaksi.
        </p>

        <div className="flex flex-wrap gap-3 mb-8 print:hidden">
          <button onClick={print} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition">
            <Printer className="h-4 w-4" /> Tulosta laput
          </button>
          <button onClick={share} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground hover:border-primary/60 transition">
            <Share2 className="h-4 w-4" /> Jaa kollegoille
          </button>
        </div>

        {CATEGORIES.map(cat => (
          <section key={cat.id} className="mt-10">
            <h2 className="font-display text-2xl text-foreground mb-4 flex items-center gap-2">
              {cat.icon} {cat.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.notes.map((n, i) => (
                <div
                  key={i}
                  className="rounded-md border border-border p-4 bg-muted/40 print:bg-white print:text-black"
                >
                  {n}
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12 pt-6 border-t border-border print:hidden">
          <h2 className="font-display text-2xl text-foreground mb-3">Vie vitsi seinältä lahjaksi 🎁</h2>
          <p className="text-muted-foreground mb-4">
            Jos joku näistä lapuista kuvaa kollegaasi liiankin tarkasti, se on merkki – sama vitsi näyttää vielä
            paremmalta mukissa, paidassa tai hupparissa.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/lahjat/tyokaverille" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">🎁 Lahjat työkaverille</Link>
            <Link to="/lahjat/pomolle" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">👔 Lahjat pomolle</Link>
            <Link to="/lahjat/pikkujouluihin" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">🎄 Pikkujouluihin</Link>
            <Link to="/kategoria/mukit" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">☕ Hauskat mukit</Link>
            <Link to="/suomalaiset-tyopaikkameemit-top-50" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">😂 Työpaikkameemit TOP 50</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OfficeNotesPage;