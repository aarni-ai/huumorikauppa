import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isPublishableReview } from "@/lib/productReviews";

// Etusivun arviokaruselli näyttää vain todennetut, päivätyt arviot (ks. src/lib/productReviews.ts).
// Aiemmat päiväämättömät arviot ja niihin satunnaisesti liitetyt nimet ovat tiedostossa
// src/data/arvostelut-arkisto.ts (ei sovelluksen käytössä). Tyhjä lista piilottaa koko osion.
type CarouselReview = { name: string; text: string; stars: number; date: string };
const VERIFIED_REVIEWS: CarouselReview[] = [];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const shuffledReviews = shuffle(VERIFIED_REVIEWS.filter(isPublishableReview).slice(0, 20));

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

  if (shuffledReviews.length === 0) return null;

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
            <p className="text-xs font-medium text-foreground">{review.name} · {review.date}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
