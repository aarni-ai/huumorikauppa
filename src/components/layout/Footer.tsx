import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
            Suomen hauskin verkkokauppa. Hauskaa huumoria suomalaisille jo vuodesta 2026. 😂
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Huumorikauppa Oy, Esimerkkitie 123, 00100 Helsinki</span>
            <a href="tel:0400123456" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone className="h-4 w-4 shrink-0" /> 0400 123 456
            </a>
            <a href="mailto:info@huumorikauppa.fi" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-4 w-4 shrink-0" /> info@huumorikauppa.fi
            </a>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> Asiakaspalvelu ma–pe 9–17</span>
          </div>
        </div>

        {/* Shop links */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-foreground">KAUPPA</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/kaikki-tuotteet" className="hover:text-foreground transition-colors">Kaikki tuotteet</Link>
            <Link to="/kategoria/t-paidat" className="hover:text-foreground transition-colors">👕 T-Paidat</Link>
            <Link to="/kategoria/hupparit" className="hover:text-foreground transition-colors">🧥 Hupparit</Link>
            <Link to="/kategoria/housut" className="hover:text-foreground transition-colors">👖 Housut</Link>
            <Link to="/kategoria/mukit" className="hover:text-foreground transition-colors">☕ Mukit</Link>
            <Link to="/kategoria/tarra-arkit" className="hover:text-foreground transition-colors">🏷️ Tarra-arkit</Link>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-foreground">TIETOA</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/usein-kysytyt-kysymykset" className="hover:text-foreground transition-colors">Usein kysytyt kysymykset</Link>
            <Link to="/toimitusehdot" className="hover:text-foreground transition-colors">Toimitusehdot</Link>
            <Link to="/tietosuojakaytanto" className="hover:text-foreground transition-colors">Tietosuojakäytäntö</Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 className="font-display text-sm text-foreground">TILAA UUTISKIRJE 💥</h4>
          <p className="text-sm text-muted-foreground">Tilaa kuukausittainen uutiskirje ja saat 10% alennuskoodin heti + viikoittaisen meemi-iskun!</p>
          <div className="flex gap-2">
            <Input placeholder="anna@email.fi" className="h-9 bg-muted border-border text-sm" />
            <Button size="sm" className="bg-primary text-primary-foreground font-bold shrink-0">
              Tilaa 🚀
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Voit peruuttaa milloin vain. Emme myy tietojasi.</p>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border py-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2026 Huumorikauppa Oy – Kaikki oikeudet pidätetään</p>
          <div className="flex items-center gap-4">
            <span>🔒 SSL-suojattu</span>
            <span>💳 Turvallinen maksu</span>
            <span>🚚 Nopeat toimitukset 1–3 arkipäivää</span>
            <span>🇫🇮 Made in Finland</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
