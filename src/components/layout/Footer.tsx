import { Link } from "react-router-dom";
import { Mail, MapPin, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/products";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4">
          <div>
            <span className="font-display text-xl text-primary">HUUMORI</span>
            <span className="font-display text-xl text-secondary">KAUPPA</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Suomen hauskin verkkokauppa – hauskoja t-paitoja, huppareita, mukeja ja tarroja koko perheelle. 😂
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Helsinki, Suomi</span>
            <a href="mailto:info@huumorikauppa.fi" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-4 w-4 shrink-0" /> info@huumorikauppa.fi
            </a>
          </div>
          {/* Social */}
          <div className="flex items-center gap-4 pt-2">
            <a href="https://www.instagram.com/huumorikauppa" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" /> @huumorikauppa
            </a>
            <a href="https://www.facebook.com/profile.php?id=61584153329326" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
          </div>
        </div>

        {/* Shop links - all categories */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-foreground">KAUPPA</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/kaikki-tuotteet" className="hover:text-foreground transition-colors">Kaikki tuotteet</Link>
            {categories.map(cat => (
              <Link key={cat.slug} to={`/kategoria/${cat.slug}`} className="hover:text-foreground transition-colors">
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
          </div>
        </div>

        {/* Gift categories - own column, visually clean */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-foreground">LAHJAIDEAT</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/hauskat-lahjat-miehelle" className="hover:text-foreground transition-colors">Lahjat miehelle</Link>
            <Link to="/hauskat-lahjat-naiselle" className="hover:text-foreground transition-colors">Lahjat naiselle</Link>
            <Link to="/polttari-lahjat" className="hover:text-foreground transition-colors">Polttarilahjat</Link>
            <Link to="/joululahjat" className="hover:text-foreground transition-colors">Joululahjat</Link>
            <Link to="/isanpaiva-lahjat" className="hover:text-foreground transition-colors">Isänpäivälahjat</Link>
            <Link to="/aitienpaiva-lahjat" className="hover:text-foreground transition-colors">Äitienpäivälahjat</Link>
            <Link to="/syntymapaivaLahjat" className="hover:text-foreground transition-colors">Synttärilahjat</Link>
            <Link to="/elakelahjat" className="hover:text-foreground transition-colors">Eläkelahjat</Link>
          </div>

        {/* Info */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-foreground">TIETOA</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/usein-kysytyt-kysymykset" className="hover:text-foreground transition-colors">Usein kysytyt kysymykset</Link>
            <Link to="/blogi" className="hover:text-foreground transition-colors">Blogi</Link>
            <Link to="/toimitusehdot" className="hover:text-foreground transition-colors">Toimitusehdot</Link>
            <Link to="/tietosuojakaytanto" className="hover:text-foreground transition-colors">Tietosuojakäytäntö</Link>
          </div>
          {/* Social repeated for mobile */}
          <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-3">
            <h4 className="font-display text-sm text-foreground">SEURAA MEITÄ</h4>
            <a href="https://www.instagram.com/huumorikauppa" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" /> Instagram
            </a>
            <a href="https://www.facebook.com/profile.php?id=61584153329326" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </a>
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 className="font-display text-sm text-foreground">TILAA UUTISKIRJE 💥</h4>
          <p className="text-sm text-muted-foreground">Tilaa uutiskirje ja saat 10% alennuskoodin ensimmäiseen tilaukseesi!</p>
          <div className="flex gap-2">
            <Input placeholder="anna@email.fi" className="h-9 bg-muted border-border text-sm" />
            <Button size="sm" className="bg-primary text-primary-foreground font-bold shrink-0">
              Tilaa 🚀
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Voit peruuttaa milloin vain.</p>
        </div>
      </div>

      {/* Payment icons */}
      <div className="border-t border-border py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Huumorikauppa – Kaikki oikeudet pidätetään</p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="bg-white rounded-md px-2 py-1.5 h-8 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="h-5 w-auto"><rect width="48" height="32" rx="4" fill="#fff"/><path d="M19.5 21.5h-3.2l2-12.3h3.2l-2 12.3z" fill="#00579F"/><path d="M32.3 9.4c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.6c.7.3 2.1.6 3.5.6 3.4 0 5.6-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.4-2.6z" fill="#00579F"/><path d="M37.3 9.2h-2.5c-.8 0-1.3.2-1.7 1l-4.7 11.3h3.4l.7-1.9h4.1l.4 1.9H40l-2.7-12.3zm-3.9 7.9l1.7-4.6.9 4.6h-2.6z" fill="#00579F"/><path d="M15.4 9.2l-3.1 8.4-.3-1.7c-.6-2-2.4-4.1-4.4-5.2l2.9 10.8h3.4l5.1-12.3h-3.6z" fill="#00579F"/><path d="M9.6 9.2H4.5l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.5-1.1z" fill="#FAA61A"/></svg>
            </div>
            <div className="bg-white rounded-md px-2 py-1.5 h-8 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className="h-5 w-auto"><rect width="48" height="32" rx="4" fill="#fff"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.2a9 9 0 0 1 3.3 6.8A9 9 0 0 1 24 22.8a9 9 0 0 1-3.3-6.8A9 9 0 0 1 24 9.2z" fill="#FF5F00"/></svg>
            </div>
            <div className="bg-white rounded-md px-2 py-1.5 h-8 flex items-center justify-center">
              <span className="text-black font-semibold text-xs tracking-tight">Apple Pay</span>
            </div>
            <div className="bg-white rounded-md px-2 py-1.5 h-8 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-700">G Pay</span>
            </div>
            <div className="bg-[#FFB3C7] rounded-md px-2.5 py-1.5 h-8 flex items-center justify-center">
              <span className="text-black font-bold text-xs">Klarna</span>
            </div>
            <div className="bg-[#5A78FF] rounded-md px-2.5 py-1.5 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">MobilePay</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 md:mt-0">🚚 Toimitukset 3–7 arkipäivässä</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
