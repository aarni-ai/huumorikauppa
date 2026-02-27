import { useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

type Step = "details" | "shipping" | "payment";

const CheckoutPage = () => {
  const { items, totalPrice, totalItems } = useCartContext();
  const [step, setStep] = useState<Step>("details");

  const shippingFree = totalPrice >= 60;
  const shippingCost = shippingFree ? 0 : 5.95;
  const grandTotal = totalPrice + shippingCost;

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center space-y-6">
        <SEOHead title="Kassa – Huumorikauppa" description="Viimeistele tilauksesi Huumorikaupassa." />
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="font-display text-3xl text-foreground">Ostoskori on tyhjä</h1>
        <Button asChild className="bg-primary text-primary-foreground font-bold">
          <Link to="/kaikki-tuotteet">Selaa tuotteita 🛒</Link>
        </Button>
      </div>
    );
  }

  const steps: { key: Step; label: string; num: number }[] = [
    { key: "details", label: "Tiedot", num: 1 },
    { key: "shipping", label: "Toimitus", num: 2 },
    { key: "payment", label: "Maksu", num: 3 },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead title="Kassa – Huumorikauppa" description="Viimeistele tilauksesi turvallisesti Huumorikaupassa." />
      <h1 className="font-display text-3xl text-foreground mb-8">Kassa 💳</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i <= currentIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {s.num}
            </div>
            <span className={`text-sm font-medium ${i <= currentIndex ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <div className={`w-8 md:w-16 h-px ${i < currentIndex ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-2 space-y-6">
          {step === "details" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl text-foreground">Yhteystiedot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-foreground">Etunimi *</Label>
                  <Input id="firstName" className="bg-muted border-border mt-1" placeholder="Matti" />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-foreground">Sukunimi *</Label>
                  <Input id="lastName" className="bg-muted border-border mt-1" placeholder="Meikäläinen" />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground">Sähköposti *</Label>
                <Input id="email" type="email" className="bg-muted border-border mt-1" placeholder="matti@email.fi" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-foreground">Puhelin</Label>
                <Input id="phone" type="tel" className="bg-muted border-border mt-1" placeholder="0401234567" />
              </div>
              <Button onClick={() => setStep("shipping")} className="bg-primary text-primary-foreground font-bold">
                Jatka toimitustietoihin <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === "shipping" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl text-foreground">Toimitusosoite</h2>
              <div>
                <Label htmlFor="address" className="text-foreground">Osoite *</Label>
                <Input id="address" className="bg-muted border-border mt-1" placeholder="Esimerkkikatu 123" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip" className="text-foreground">Postinumero *</Label>
                  <Input id="zip" className="bg-muted border-border mt-1" placeholder="00100" />
                </div>
                <div>
                  <Label htmlFor="city" className="text-foreground">Kaupunki *</Label>
                  <Input id="city" className="bg-muted border-border mt-1" placeholder="Helsinki" />
                </div>
              </div>

              <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Toimitustapa:</p>
                <p>📦 Posti – kotiinkuljetus (3–10 arkipäivää)</p>
                <p>{shippingFree ? "✅ Ilmainen toimitus!" : `Toimituskulut: ${shippingCost.toFixed(2)} €`}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("details")} className="border-border">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Takaisin
                </Button>
                <Button onClick={() => setStep("payment")} className="bg-primary text-primary-foreground font-bold">
                  Jatka maksuun <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl text-foreground">Maksu</h2>
              <div className="bg-muted/50 border border-border rounded-lg p-6 text-center space-y-4">
                <Lock className="h-10 w-10 text-primary mx-auto" />
                <p className="text-foreground font-medium">Turvallinen maksu</p>
                <p className="text-sm text-muted-foreground">
                  Sinut ohjataan turvalliselle maksusivulle. Tuemme Visa, Mastercard ja muita maksutapoja.
                </p>
                <Button size="lg" className="bg-primary text-primary-foreground font-bold text-lg shadow-glow-lime w-full hover:scale-[1.02] transition-transform">
                  Maksa {grandTotal.toFixed(2)} € 🔒
                </Button>
                <p className="text-xs text-muted-foreground">SSL-suojattu yhteys • Turvallinen maksu</p>
              </div>
              <Button variant="outline" onClick={() => setStep("shipping")} className="border-border">
                <ArrowLeft className="h-4 w-4 mr-2" /> Takaisin
              </Button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="bg-card border border-border rounded-lg p-6 h-fit space-y-4">
          <h3 className="font-display text-lg text-foreground">Tilauksesi</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {items.map(item => (
              <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-3 text-sm">
                <img src={item.product.images[0] || "/placeholder.svg"} alt={item.product.name} className="w-12 h-12 rounded bg-muted object-cover" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground line-clamp-1">{item.product.name}</p>
                  <p className="text-muted-foreground">{item.quantity} × {item.product.price.toFixed(2)} €</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tuotteet</span><span>{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Toimitus</span>
              <span>{shippingFree ? "Ilmainen" : `${shippingCost.toFixed(2)} €`}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border">
              <span>Yhteensä</span><span className="text-primary">{grandTotal.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
