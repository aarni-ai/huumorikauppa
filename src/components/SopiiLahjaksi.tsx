import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { useJouluTakaraja } from "@/components/JouluTakaraja";
import { jouluRivi } from "@/data/jouluAikataulu";
import { useLahjakortitMyynnissa } from "@/hooks/use-lahjakortit";
import { sopiiLahjaksi } from "@/lib/sopiiLahjaksi";

/**
 * Tiivis "Sopii lahjaksi" -rivi ostopainikkeen alle (2.11.2026): kenelle tuote sopii ja linkki saman aiheen lahjasivulle
 * (src/lib/sopiiLahjaksi.ts). Ei hookeja eikä aikaa, joten sama rivi on esirenderöidyssä HTML:ssä (ProductPage previewOnly).
 */
export function SopiiLahjaksiRivi({ product, className = "" }: { product: { slug: string; category?: string | null }; className?: string }) {
  const r = sopiiLahjaksi(product);
  return (
    <p className={`flex items-start gap-1.5 text-[13px] leading-snug text-foreground ${className}`} data-sopii-lahjaksi="">
      <Gift className="h-4 w-4 text-primary shrink-0 mt-px" aria-hidden="true" />
      <span>
        {r.teksti}{" "}
        <Link to={r.polku} className="text-primary underline underline-offset-2 whitespace-nowrap">{r.linkkiTeksti}</Link>
      </span>
    </p>
  );
}

/**
 * "Sopii lahjaksi" tuotesivulle. Vain todennettavia asioita: kassan vastaanottajavalinta (CheckoutPage),
 * joulun takaraja (src/data/jouluAikataulu.ts, vain ennen takarajaa), palautusoikeus (ReturnsPolicy.tsx) ja
 * lahjakortti (GiftCardPage.tsx: 25, 50 tai 75 €, koodi sähköpostilla; vain kun lahjakortit ovat myynnissä).
 */
export function SopiiLahjaksi({ isCustom, jouluKategoriat }: { isCustom: boolean; jouluKategoriat: readonly (string | null)[] }) {
  const joulu = useJouluTakaraja(jouluKategoriat);
  const lahjakortit = useLahjakortitMyynnissa();
  return (
    <section className="rounded-xl border border-border bg-card/50 p-5 md:p-6" aria-labelledby="sopii-lahjaksi">
      <h2 id="sopii-lahjaksi" className="font-display text-xl text-foreground mb-3 flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" aria-hidden="true" /> Sopii lahjaksi
      </h2>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {joulu && <li className="text-foreground">{jouluRivi(joulu)}</li>}
        <li>Paketti voidaan toimittaa suoraan lahjan saajalle: valitse kassalla "Toimitetaan eri vastaanottajalle kuin maksaja".</li>
        {isCustom ? (
          <li>Personoidulla tuotteella ei ole 14 päivän palautusoikeutta, joten tarkista koko ennen tilausta.</li>
        ) : (
          <li>Jos koko ei sovi, tuotteella on 14 päivän palautusoikeus. <Link to="/palautusehdot" className="text-primary underline underline-offset-2">Palautusehdot</Link></li>
        )}
        {lahjakortit && (
          <li>Et tiedä kokoa? <Link to="/lahjakortti" className="text-primary underline underline-offset-2">Lahjakortti</Link> 25, 50 tai 75 €, koodi sähköpostilla heti maksun jälkeen.</li>
        )}
      </ul>
    </section>
  );
}
