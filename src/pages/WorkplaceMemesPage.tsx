import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Share2, Copy, Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const MEMES: { title: string; note: string }[] = [
  { title: "“Tehdään palaveri siitä, että pidetään palaveri.”", note: "Klassinen Teams-kalenterin täyttöharjoitus." },
  { title: "Maanantain kahvinkeitin on hiljainen sankari.", note: "Ilman sitä koko firma kaatuu ennen yhdeksää." },
  { title: "“Lähetän sähköpostin, niin jää muistiin.”", note: "= en muista enää kahden tunnin päästä." },
  { title: "Etätyöpäivä = housut neuvottelevat itsenäisesti.", note: "Kameralla ylhäältä, verkkareilla alhaalta." },
  { title: "Pomon ‘pieni juttu’ on aina kahden viikon projekti.", note: "Skaalauskerroin on luotettavasti 14×." },
  { title: "Tulostin tunnistaa pelkosi.", note: "Se rikkoutuu vain tärkeinä päivinä." },
  { title: "“Tää menee nopeasti” – kuukausi myöhemmin.", note: "Aikataulut ovat suosituksia." },
  { title: "Kahvihuoneessa ratkaistaan 80 % strategiasta.", note: "Loput 20 % päätetään saunassa." },
  { title: "“Voitaisko vielä kerran käydä läpi.”", note: "Tarkoittaa: en kuunnellut kertaakaan." },
  { title: "Excel on rakkaussuhde, joka ei pääty hyvin.", note: "Mutta aina palataan takaisin." },
  { title: "Sähköpostin ‘Vastaa kaikille’ on ydinase.", note: "Käytä vain hätätilanteessa." },
  { title: "Perjantain klo 15 palaveri = sodanjulistus.", note: "Kukaan ei selviä siitä elossa." },
  { title: "“Ei mitään ihmeellistä” -palaveri kestää 90 min.", note: "Aina." },
  { title: "VPN:n alasveto = päivän tuottavin hetki.", note: "Vapauden tunne on käsinkosketeltava." },
  { title: "Slackin ‘kirjoittaa…’ on jännitysnäytelmä.", note: "Kestää 10 min, viesti on kolme sanaa." },
  { title: "Etänä kissa osallistuu kaikkiin palavereihin.", note: "Ja se on yleensä paras osallistuja." },
  { title: "“Pingaillaan myöhemmin” = ei pingata koskaan.", note: "Standardisanasto." },
  { title: "Kahvi on virallinen suomalainen polttoaine.", note: "Maailmanmestaruus per capita." },
  { title: "Office-piknik = lounas omalla pöydällä.", note: "Sosiaalisuus optio." },
  { title: "Tiimipalaveri ilman agendaa = improteatteri.", note: "Tällä kertaa ilman naurua." },
  { title: "“Quick sync” kestää aina 47 minuuttia.", note: "Tutkittu fakta." },
  { title: "Kalenterin Tetris on oma uralaji.", note: "Jokaisella on mestari talossa." },
  { title: "“Hoidan asian” = unohdan asian tyylikkäästi.", note: "Sanakirjamerkitys." },
  { title: "Maanantain ‘miten meni viikonloppu?’ on rituaali.", note: "Vastaus: ‘ihan jees, sulla?’" },
  { title: "Etätyössä mikrofoni on aina päällä.", note: "Aina." },
  { title: "“Tämä on QA:n vika.”", note: "QA: “Tämä on devin vika.”" },
  { title: "Standuppi seisten = nopeampi. Teoriassa.", note: "Käytännössä yhtä pitkä, mutta selkä jumissa." },
  { title: "Kalenterissa ‘focus time’ = kahdeksan kokousta.", name: undefined as unknown as string } as any,
  { title: "Kahvi #4 on se, joka ratkaisee bugit.", note: "Älä kysy miksi, vain ole kiitollinen." },
  { title: "“Onko teillä hetki?” = ei ole. Eikä koskaan ollut.", note: "Mutta sanotaan ‘joo’." },
  { title: "Loma-asetus päällä, vastaan silti.", note: "Suomalainen versio rentoutumisesta." },
  { title: "“Tämä on viimeinen muutos.” – versio 17.", note: "Lopullinen lopullinen FINAL_v3." },
  { title: "Pomo lähettää viestin klo 22.", note: "‘Ei kiire, vastaa huomenna.’ Ei toimi näin." },
  { title: "“Jaa scheduleen” = unohda elämäsi.", note: "Vapauden viimeinen rajalinja." },
  { title: "Office-stoolissa istutaan 8h yhtäjaksoisesti.", note: "Selkä lähettää terveisiä vuonna 2030." },
  { title: "“Tämä menee tuotantoon perjantaina.”", note: "Kukaan ei suosittele, kaikki tekee silti." },
  { title: "All-hands = 60 min, joista 5 min sinulle.", note: "Loput 55 osakekursseista." },
  { title: "Kahvihuoneen leivos katoaa 7 sekunnissa.", note: "Newtonin neljäs laki." },
  { title: "“Voisitko vielä katsoa.”", note: "= tee tämä loppuun puolestani." },
  { title: "Etäpalaverissa joku syö aina näkyvästi.", note: "Vahingossa, tietysti." },
  { title: "Tiimichat on 60 % memejä, 40 % paniikkia.", note: "Tervettä." },
  { title: "Status: ‘In progress’ koko Q4 ajan.", note: "Lopulta siirtyy Q1:lle." },
  { title: "Onboardaus = ‘löydät kyllä’.", note: "Ei löydä." },
  { title: "Kalenteri-ehdotus klo 8:00.", note: "Sodanjulistus #2." },
  { title: "“Anteeksi, en kuullut – verkko pätki.”", note: "Verkko ei pätkinyt." },
  { title: "Excel-makro = rituaalimagiaa.", note: "Toimii, kunnes ei toimi." },
  { title: "“Korjasin sen, mutta en muista miten.”", note: "Älä koske mihinkään." },
  { title: "Kalenterin värikoodaus = persoonallisuustesti.", note: "Sininen = rauha. Punainen = pakeneminen." },
  { title: "Perjantain ‘nopea kysymys’ on koskaan nopea.", note: "Toivota itsellesi onnea viikonloppuun." },
  { title: "“Ootteko jo nähneet tän?” – kyllä, kolmesti.", note: "Mutta nauretaan silti kohteliaasti." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Suomalaiset työpaikkameemit – TOP 50",
  url: "https://huumorikauppa.fi/suomalaiset-tyopaikkameemit-top-50",
  numberOfItems: MEMES.length,
  itemListElement: MEMES.map((m, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: m.title,
  })),
};

const WorkplaceMemesPage = () => {
  usePrerenderReady();
  const [copied, setCopied] = useState(false);
  const url = "https://huumorikauppa.fi/suomalaiset-tyopaikkameemit-top-50";

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Suomalaiset työpaikkameemit – TOP 50", url });
        return;
      } catch {
        /* noop */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Suomalaiset työpaikkameemit – TOP 50 (2026) | Huumorikauppa"
        description="50 osuvinta suomalaista työpaikkameemiä: palaverit, kahvihuone, etätyö ja pomon klassikot. Jaa kollegoille ja naura yhdessä."
        canonical={url}
        jsonLd={jsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Työpaikkameemit TOP 50", url },
        ]}
      />
      <div className="container py-10 md:py-14 max-w-3xl">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Työpaikkameemit TOP 50</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">
          Suomalaiset työpaikkameemit – TOP 50 😂
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Palaverit jotka olisivat voineet olla sähköposteja, kahvihuoneen sisäpiirivitsit ja klassinen
          “tää menee nopeasti” -lupaus. Kokosimme tähän 50 kaikkein osuvinta suomalaista työpaikkameemiä – jaa
          kollegoille ja katso, ketkä myöntävät tunnistavansa itsensä.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={share}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            <Share2 className="h-4 w-4" /> Jaa tämä sivu
          </button>
          <button
            onClick={async () => {
              if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                setCopied(true);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground hover:border-primary/60 transition"
          >
            <Copy className="h-4 w-4" /> {copied ? "Kopioitu!" : "Kopioi linkki"}
          </button>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Flag className="h-4 w-4 text-primary" /> 100 % suomalainen huumori
          </span>
        </div>

        <ol className="space-y-4">
          {MEMES.map((m, i) => (
            <li key={i} className="rounded-lg border border-border p-4">
              <p className="text-foreground font-medium">
                {i + 1}. {m.title}
              </p>
              {m.note && <p className="text-sm text-muted-foreground mt-1">{m.note}</p>}
            </li>
          ))}
        </ol>

        <section className="mt-12 pt-6 border-t border-border">
          <h2 className="font-display text-2xl text-foreground mb-3">Tunnistitko kollegasi? 🎁</h2>
          <p className="text-muted-foreground mb-4">
            Jos meemi osui kohdalleen, lahjoita se eteenpäin – aitona huumorituotteena, ei vain kuvana
            chatissa. Katso suosituimmat lahjat työkavereille:
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/lahjat/tyokaverille" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">🎁 Lahjat työkaverille</Link>
            <Link to="/lahjat/pomolle" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">👔 Lahjat pomolle</Link>
            <Link to="/lahjat/kollegalle" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">🤝 Lahjat kollegalle</Link>
            <Link to="/lahjat/pikkujouluihin" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">🎄 Pikkujouluihin</Link>
            <Link to="/hauskimmat-tyopaikkalaput-2026" className="px-3 py-1.5 rounded-full border border-border text-sm hover:border-primary/60 hover:text-primary transition">📋 Työpaikkalaput 2026</Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default WorkplaceMemesPage;