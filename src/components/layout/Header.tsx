import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { categories } from "@/data/products";
import { Input } from "@/components/ui/input";

export function Header() {
  const { totalItems } = useCartContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/haku?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Trust banner */}
      <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs md:text-sm font-medium tracking-wide">
        🚚 Ilmainen toimitus yli 60 € tilauksista
      </div>

      <div className="container flex items-center justify-between h-14 md:h-16 gap-4">
        {/* Mobile menu */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Valikko"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-0 shrink-0">
          <span className="font-display text-xl md:text-2xl text-primary">HUUMORI</span>
          <span className="font-display text-xl md:text-2xl text-secondary">KAUPPA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          <Link
            to="/kaikki-tuotteet"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            Kaikki tuotteet
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.slug}
              to={`/kategoria/${cat.slug}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            >
              {cat.emoji} {cat.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                placeholder="Etsi tuotteita..."
                className="w-40 md:w-64 h-9 bg-muted border-border"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setSearchOpen(false)}
              />
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground p-2" aria-label="Haku">
              <Search className="h-5 w-5" />
            </button>
          )}

          <Link to="/ostoskori" className="relative p-2 text-muted-foreground hover:text-foreground">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce-subtle">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background pb-4">
          <Link
            to="/kaikki-tuotteet"
            onClick={() => setMenuOpen(false)}
            className="block px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            🛍️ Kaikki tuotteet
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.slug}
              to={`/kategoria/${cat.slug}`}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {cat.emoji} {cat.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
