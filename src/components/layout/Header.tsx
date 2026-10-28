import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { useCartContext } from "@/context/CartContext";
import { categories } from "@/data/products";
import { onKategoriasivu } from "@/lib/hiddenCategories";
import { Input } from "@/components/ui/input";
import { CHRISTMAS_MENU, FATHERS_DAY_MENU } from "@/data/landingRoutes";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";

type CategoryItem = { slug: string; name: string; emoji: string; description: string };

function MobileMenu({ mainCats, otherCats, onClose }: { mainCats: CategoryItem[]; otherCats: CategoryItem[]; onClose: () => void }) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [xmasOpen, setXmasOpen] = useState(false);
  const [dadOpen, setDadOpen] = useState(false);
  return (
    <nav className="md:hidden border-t border-border bg-background pb-4">
      <Link to="/kaikki-tuotteet" onClick={onClose} className="block px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        Kaikki tuotteet
      </Link>
      <button
        onClick={() => setXmasOpen(prev => !prev)}
        aria-expanded={xmasOpen}
        className="w-full flex items-center justify-between px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
      >
        Joululahjat
        <ChevronDown className={`h-4 w-4 transition-transform ${xmasOpen ? "rotate-180" : ""}`} />
      </button>
      {xmasOpen && CHRISTMAS_MENU.map(item => (
        <Link key={item.href} to={item.href} onClick={onClose} className="block px-8 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {item.label}
        </Link>
      ))}
      <button
        onClick={() => setDadOpen(prev => !prev)}
        aria-expanded={dadOpen}
        className="w-full flex items-center justify-between px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
      >
        Isänpäivä
        <ChevronDown className={`h-4 w-4 transition-transform ${dadOpen ? "rotate-180" : ""}`} />
      </button>
      {dadOpen && FATHERS_DAY_MENU.map(item => (
        <Link key={item.href} to={item.href} onClick={onClose} className="block px-8 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {item.label}
        </Link>
      ))}
      {mainCats.map(cat => (
        <Link key={cat.slug} to={`/kategoria/${cat.slug}`} onClick={onClose} className="block px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {cat.name}
        </Link>
      ))}
      {otherCats.length > 0 && <button
        onClick={() => setOtherOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        Muut tuotteet
        <ChevronDown className={`h-4 w-4 transition-transform ${otherOpen ? "rotate-180" : ""}`} />
      </button>}
      {otherOpen && otherCats.map(cat => (
        <Link key={cat.slug} to={`/kategoria/${cat.slug}`} onClick={onClose} className="block px-8 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}

const MAIN_CATEGORIES = ["t-paidat", "hupparit", "pitkahihaiset", "bodyt"]; // mukit pois myynnistä 21.10.2026
const OTHER_CATEGORIES = ["tarrat", "peitot", "pipot", "laukut", "seinataulut", "koristeet", "sukat", "avaimenperat", "asut", "naamiot"];

export function Header() {
  const { totalItems } = useCartContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/haku?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Yhdistetyt kategoriat (alle 8 tuotetta) ohjautuvat muualle: ei valikkoon (src/lib/hiddenCategories.ts).
  const mainCats = categories.filter(c => MAIN_CATEGORIES.includes(c.slug) && onKategoriasivu(c.slug));
  const otherCats = categories.filter(c => OTHER_CATEGORIES.includes(c.slug) && onKategoriasivu(c.slug));

  const openDropdown = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setDropdownOpen(true);
  };
  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 150);
  };

  const [xmasOpen, setXmasOpen] = useState(false);
  const xmasTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openXmas = () => {
    if (xmasTimeout.current) clearTimeout(xmasTimeout.current);
    setXmasOpen(true);
  };
  const closeXmas = () => {
    xmasTimeout.current = setTimeout(() => setXmasOpen(false), 150);
  };

  const [dadOpen, setDadOpen] = useState(false);
  const dadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openDad = () => {
    if (dadTimeout.current) clearTimeout(dadTimeout.current);
    setDadOpen(true);
  };
  const closeDad = () => {
    dadTimeout.current = setTimeout(() => setDadOpen(false), 150);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Premium multi-signal trust strip */}
      <div className="bg-foreground text-background text-center py-1.5 text-[11px] font-medium tracking-widest uppercase">
        Toimitus {TOIMITUSMAKSU_TEKSTI} &euro;, ilmainen {ILMAINEN_RAJA_TEKSTI} eurosta &middot; Toimitus {TOIMITUSAIKA_TEKSTI} pv &middot; Kotimainen kauppa
      </div>

      <div className="container flex items-center justify-between h-14 md:h-16 gap-4">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-foreground p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Valikko"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0" aria-label="Huumorikauppa">
          <span
            className="font-display text-xl md:text-2xl tracking-tight leading-none"
            style={{ color: "#39FF14", textShadow: "0 0 6px rgba(57,255,20,0.35)" }}
          >
            HUUMORI
          </span>
          <span
            className="font-display text-xl md:text-2xl tracking-tight leading-none"
            style={{ color: "#FF2D95", textShadow: "0 0 8px rgba(255,45,149,0.55)" }}
          >
            KAUPPA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          <Link
            to="/kaikki-tuotteet"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          >
            Kaikki tuotteet
          </Link>
          {mainCats.map(cat => (
            <Link
              key={cat.slug}
              to={`/kategoria/${cat.slug}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {cat.name}
            </Link>
          ))}
          {/* "Joululahjat" dropdown */}
          <div
            className="relative"
            onMouseEnter={openXmas}
            onMouseLeave={closeXmas}
          >
            <button
              className="px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors rounded-lg flex items-center gap-1"
              onClick={() => setXmasOpen(prev => !prev)}
              aria-expanded={xmasOpen}
            >
              Joululahjat
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${xmasOpen ? "rotate-180" : ""}`} />
            </button>
            {xmasOpen && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[240px] z-50">
                {CHRISTMAS_MENU.map(item => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setXmasOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* "Isänpäivä" dropdown (ikivihreä sisältö, jää valikkoon isänpäivän jälkeen) */}
          <div
            className="relative"
            onMouseEnter={openDad}
            onMouseLeave={closeDad}
          >
            <button
              className="px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors rounded-lg flex items-center gap-1"
              onClick={() => setDadOpen(prev => !prev)}
              aria-expanded={dadOpen}
            >
              Isänpäivä
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dadOpen ? "rotate-180" : ""}`} />
            </button>
            {dadOpen && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[260px] z-50">
                {FATHERS_DAY_MENU.map(item => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setDadOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* "Muut tuotteet" dropdown */}
          {otherCats.length > 0 && <div
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={closeDropdown}
          >
            <button
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted flex items-center gap-1"
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              Muut tuotteet
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg py-2 min-w-[200px] z-50">
                {otherCats.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/kategoria/${cat.slug}`}
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                placeholder="Etsi tuotteita..."
                className="w-40 md:w-64 h-9 bg-muted border-border rounded-lg"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
              />
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Haku">
              <Search className="h-5 w-5" />
            </button>
          )}

          <Link to="/ostoskori" className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <MobileMenu mainCats={mainCats} otherCats={otherCats} onClose={() => setMenuOpen(false)} />
      )}
    </header>
  );
}
