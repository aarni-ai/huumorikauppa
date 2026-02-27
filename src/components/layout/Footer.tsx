import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
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
            Suomen hauskin verkkokauppa. Meemihuumoria paidoissa, mukeissa ja tarroissa vuodesta 2024. 😂
          </p>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-foreground">KAUPPA</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/kategoria/t-paidat" className="hover:text-foreground transition-colors">T-paidat</Link>
            <Link to="/kategoria/housut" className="hover:text-foreground transition-colors">Housut</Link>
            <Link to="/kategoria/mukit" className="hover:text-foreground transition-colors">Mukit</Link>
            <Link to="/kategoria/tarrat" className="hover:text-foreground transition-colors">Tarrat</Link>
            <Link to="/kategoria/hupparit" className="hover:text-foreground transition-colors">Hupparit</Link>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-foreground">TIETOA</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/faq" className="hover:text-foreground transition-colors">Usein kysytyt</Link>
            <Link to="/toimitusehdot" className="hover:text-foreground transition-colors">Toimitusehdot</Link>
            <Link to="/tietosuoja" className="hover:text-foreground transition-colors">Tietosuojakäytäntö</Link>
          </div>
        </div>

        {/* Newsletter + Contact */}
        <div className="space-y-4">
          <h4 className="font-display text-sm text-foreground">TILAA MEEMI-ISKU 💥</h4>
          <p className="text-sm text-muted-foreground">Saat 10% alennuskoodin + viikoittaisen meemiterveisin.</p>
          <div className="flex gap-2">
            <Input placeholder="Sähköposti" className="h-9 bg-muted border-border text-sm" />
            <Button size="sm" className="bg-primary text-primary-foreground font-bold shrink-0">
              Tilaa
            </Button>
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground pt-2">
            <a href="mailto:info@huumorikauppa.fi" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail className="h-4 w-4" /> info@huumorikauppa.fi
            </a>
            <a href="tel:+358401234567" className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone className="h-4 w-4" /> 040 123 4567
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border py-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2026 Huumorikauppa.fi – Kaikki oikeudet pidätetään (ja huumorintaju vaaditaan)</p>
          <div className="flex items-center gap-4">
            <span>🔒 SSL-suojattu</span>
            <span>💳 Turvallinen maksu</span>
            <span>🇫🇮 Made in Finland</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
