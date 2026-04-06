import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NAMES = [
  "Anna H.", "Tepe", "Veetu", "Marja-Leena H.", "Reijo T.", "Mika L.",
  "Anna87", "Sanna", "Sanni", "Jukka P.", "Tiina K.", "Mikko S.",
  "Laura M.", "Petri V.", "Heikki R.", "Emilia J.", "Tomi", "Riikka",
  "Antti K.", "Jenni S.", "Ville", "Kaisa M.", "Juha-Pekka", "Elina",
  "Markku T.", "Henna", "Tommi L.", "Päivi K.", "Aki", "Noora S.",
  "Jarmo H.", "Susanna", "Kimmo", "Outi V.", "Matias", "Johanna R.",
  "Samuli", "Katja P.", "Jari M.", "Tuija", "Aleksi", "Minna K.",
  "Pasi T.", "Anu", "Harri V.", "Leena", "Jesse", "Niina M.",
  "Riku", "Maija S.", "Tapio", "Kirsi L.", "Arttu", "Helena T.",
  "Esa P.", "Pirjo", "Lauri", "Tanja K.", "Ilkka", "Saija",
];

const REVIEWS = [
  { text: "toimitus ruotsiin hoitui todella ripeästi. tuote vastasi täysin sitä mitä odotin", stars: 5 },
  { text: "Toimitus tuli todella nopeasti, peukkua ylös!", stars: 5 },
  { text: "asiakaspalvelu oli aivan mahtavaa olen todella tyytyväinen kaikkeen!", stars: 5 },
  { text: "Vaihto sujui asiakaspalvelun kanssa todella mutkattomasti ja ystävällisesti.", stars: 5 },
  { text: "siistit tuotteet, laadukkaita paitoja ja muita hauskoja meemijuttuja. tää vaikuttaa tosi lupaavalta paikalta huumorihankintoihin", stars: 5 },
  { text: "paketti tuli perille todella nopeasti", stars: 5 },
  { text: "Lähetys saapui ripeästi ja täysin ongelmitta.", stars: 5 },
  { text: "tuote kiva palvelu erinomaista tasoa!", stars: 5 },
  { text: "Toimitus oli nopea ja hupparin laatu näytti heti hyvältä.", stars: 5 },
  { text: "täältä löytyy loistavia lahjaideoita haha", stars: 4 },
  { text: "Erittäin tyytyväinen! Aluksi Suomi/Ruotsi ei ollut valikoimassa, mutta sähköpostilla asia korjaantui salamannopeasti. Poika oli innoissaan uudesta mukistaan 😊👍", stars: 5 },
  { text: "tuote laadukas ja toimitus ripeä", stars: 5 },
  { text: "kaikki sujui juuri niin kuin oli luvattu ja tuotekin oli täysin ok", stars: 5 },
  { text: "Toimitus hoitui todella nopeasti.", stars: 5 },
  { text: "paketti tuli tosi nopeast perille", stars: 5 },
  { text: "Tuotteen laatu hyvä ja istuvuus just sopiva. Toimituksen seuranta oli tosin vähän epäselvä.", stars: 4 },
  { text: "nopea toimitus + laadukkaat materiaalit paidoissa. paidat on herättäny paljon naurua ympärillä", stars: 5 },
  { text: "ei mitää moitittavaa, toimitus nopea ja muutenkin kaikki ok", stars: 5 },
  { text: "Tilaus saapui todella nopeasti, kiitos siitä!", stars: 5 },
  { text: "palvelu oli todella ystävällistä ja hyvää 😊", stars: 5 },
  { text: "tuote oli juuri niin hyvä kuin toivoin", stars: 5 },
  { text: "Toimitus luotettavaa ja nopeaa.", stars: 5 },
  { text: "paketti tuli perille ripeästi", stars: 5 },
  { text: "homma meni luvatusti ehdottomasti suosittelen", stars: 5 },
  { text: "Kaikki toimi kuten pitikin, huppari oli aivan huippu ja toimitus tuli nopeasti.", stars: 5 },
  { text: "tää on parasta ikinä!!", stars: 5 },
  { text: "Tää on selkeästi paras meemikauppa! Palvelu sujuvaa, hinta-laatusuhde loistava ja uusi juomapeli aivan huikea.", stars: 5 },
  { text: "kaikki pelasi just niin ku pitää", stars: 5 },
  { text: "tilasin capybara-hupparin, laatu erinomainen koko täydellinen itselle ja printtikin onnistunu. asiakaspalvelu ansaitsee isot kiitokset!", stars: 5 },
  { text: "asiakaspalvelu tuotteiden laatu ja hinta-laatusuhde kaikki täysi kymppi 😊", stars: 5 },
  { text: "Asiakaspalvelu oli aivan uskomattoman hyvää!", stars: 5 },
  { text: "laatu tuntuu hyvältä toimitus ripeää ja koko osu nappiin", stars: 5 },
  { text: "maksu hoitu helposti, toimitus toimi moitteetta ja sain tosi kivan kassin", stars: 5 },
  { text: "kiva kassi ja vielä kotiinkuljetuksella", stars: 4 },
  { text: "Toimitus nopea ja tuotteet laadukkaita.", stars: 5 },
  { text: "Ei mitään valittamista. Tuotteet lähtivät vähän eri aikoihin, mutta kokonaisuus saapui sovitussa ajassa.", stars: 4 },
  { text: "tilaaminen helppoa toimitus nopea tuote laadukas ja valikoima monipuolinen", stars: 5 },
  { text: "tuotteet juuri sellaisia kuin piti ja valmistus + toimitus ripeää", stars: 5 },
  { text: "Tilasin ~50 € hupparin – laatu hyvä, mukava päällä. Voin suositella muillekin!", stars: 5 },
  { text: "asiakaspalvelu erinomaista! tilattu paita oli aluksi liian pieni mutta tilanne hoidettiin nopeasti ja joustavasti", stars: 5 },
  { text: "toimitus todella nopea", stars: 5 },
  { text: "paketti saapui salamannopeasti ja paidat olivat täsmälleen toivotunlaisia", stars: 5 },
  { text: "hauskat vaateet ja hauska muki tuli postissa :D kiva paikka ostaa!", stars: 5 },
  { text: "Printti paidoissa laadukas + ilmainen toimitus yli 60 € tilauksiin.", stars: 5 },
  { text: "hyvä meininki :D", stars: 5 },
  { text: "asiakaspalvelu ystävällistä ja koonvaihto isompaan suju helposti", stars: 5 },
  { text: "tilaus helppo ja paketti saapui kotiovelle joutuisasti", stars: 5 },
  { text: "Tuote täsmäsi täysin kuvaukseen.", stars: 5 },
  { text: "laadukkaat vaatteet selkeät tiedot ja nopea toimitus. tilannu jo koko perheelle täältä!", stars: 5 },
  { text: "kaikki meni just niin ku pitikin", stars: 5 },
  { text: "sivusto selkeä ja toimitus nopea. ei moitittavaa", stars: 5 },
  { text: "tilaaminen helppoa paketit saapuivat sujuvasti. tuotteet laadukkaita", stars: 5 },
  { text: "nopea ja kelpo kokemus", stars: 4 },
  { text: "Tilaus hoitui mutkattomasti ja tuote saapui ehjänä perille.", stars: 5 },
  { text: "kaikki toimi luvatusti ei viivästyksiä eikä muita ongelmia", stars: 5 },
  { text: "tuote ok mutta toimitus kesti harmillisen kauan (12 päivää)", stars: 4 },
  { text: "ei mitään ongelmia siis positiivinen kokemus :)", stars: 5 },
  { text: "Valmistaa hyviä vaatteita ja verkkopalvelu toimii todella hyvin.", stars: 5 },
  { text: "paketti tuli juuri sellaisena kuin pitikin", stars: 5 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const shuffledReviews = shuffle(REVIEWS.slice(0, 20).map((r, i) => ({ ...r, name: NAMES[i % NAMES.length] })));

export function ReviewsCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const [isMobileLike, setIsMobileLike] = useState(false);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const update = () => setIsMobileLike(mediaQuery.matches);
    update();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.05 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isMobileLike) return;

    let animId: number;
    let lastTime = 0;
    const speed = 80; // pixels per second

    function step(timestamp: number) {
      if (lastTime === 0) lastTime = timestamp;
      const delta = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (!isPausedRef.current && isInView && el) {
        el.scrollLeft += speed * delta;
        // Reset to start for infinite loop
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isMobileLike, isInView]);

  const items = isMobileLike ? shuffledReviews.slice(0, 10) : [...shuffledReviews, ...shuffledReviews];

  return (
    <section ref={sectionRef} className="py-12 md:py-16 overflow-hidden">
      <div className="container mb-8">
        <h2 className="font-display text-2xl md:text-3xl text-foreground text-center">
          Asiakkaiden arviot ⭐
        </h2>
      </div>
      <div
        ref={scrollRef}
        className={`flex gap-4 ${isMobileLike ? "overflow-x-auto snap-x snap-mandatory pb-2" : "overflow-x-hidden"}`}
        style={isMobileLike ? { WebkitOverflowScrolling: "touch" } : undefined}
        onMouseEnter={() => { if (!isMobileLike) isPausedRef.current = true; }}
        onMouseLeave={() => { if (!isMobileLike) isPausedRef.current = false; }}
      >
        {items.map((review, i) => (
          <div
            key={i}
            className={`shrink-0 w-[300px] md:w-[350px] bg-card border border-border rounded-lg p-5 space-y-3 ${isMobileLike ? "snap-start" : ""}`}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: review.stars }).map((_, s) => (
                <Star key={s} className="h-4 w-4 fill-primary text-primary" />
              ))}
              {Array.from({ length: 5 - review.stars }).map((_, s) => (
                <Star key={`e-${s}`} className="h-4 w-4 text-muted-foreground/30" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">"{review.text}"</p>
            <p className="text-xs font-medium text-foreground">– {review.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
