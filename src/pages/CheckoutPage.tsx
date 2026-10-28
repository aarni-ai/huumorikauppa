import { useEffect, useRef, useState } from "react";
import { useCartContext } from "@/context/CartContext";
import { ProductRating } from "@/components/ProductRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ShoppingCart, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Checkbox } from "@/components/ui/checkbox";
import { SUOSTUMUS_MUISTUTUS } from "../../api/_lib/vakiot.js";
import { toast } from "@/hooks/use-toast";
import { proxiedImage } from "@/lib/imageProxy";
import { trackBeginCheckout } from "@/lib/analytics";
import { useProducts } from "@/hooks/use-products";
import { toimitusTila, arvioiPakettialennus, korialennusTila } from "@/lib/ostoskori";
import { PaymentIcons } from "@/components/PaymentIcons";
import { PAYMENT_METHODS_TEXT } from "@/config/maksutavat";
import { TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";

const VALID_CODES: Record<string, { percent: number; label: string }> = {
  "HUUMORI5": { percent: 5, label: "5% alennus" },
  "PALAA10": { percent: 10, label: "10% alennus" },
};

const CheckoutPage = () => {
  const { items, totalPrice, totalItems } = useCartContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; label: string } | null>(null);
  const beginCheckoutSent = useRef(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", zip: "", city: "",
  });
  const [differentRecipient, setDifferentRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const { data: allProducts = [] } = useProducts();
  const [giftCardInput, setGiftCardInput] = useState("");
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ code: string; saldo: number } | null>(null);
  const [checkingGiftCard, setCheckingGiftCard] = useState(false);
  // Pelkät lahjakortit: ei toimitusosoitetta eikä toimitusmaksua.
  const tila = toimitusTila(items);
  const onlyGiftCards = tila.vainLahjakortteja;
  const hasGiftCards = items.some((i) => i.product.type === "giftcard");

  // Keskeneräisen tilauksen muistutus vain suostumuksella (valintaruutu, ei valmiiksi valittu). Kori tallennetaan
  // /api/sahkoposti-rajapintaan; valinnan poistaminen poistaa tallennetun korin.
  const [muistutus, setMuistutus] = useState(false);
  const muistutusLahetetty = useRef(false);
  useEffect(() => {
    const email = form.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (!muistutus && !muistutusLahetetty.current) return;
    const fyysiset = items.filter((i) => i.product.type !== "giftcard");
    if (muistutus && fyysiset.length === 0) return;
    const t = setTimeout(() => {
      muistutusLahetetty.current = muistutus;
      fetch("/api/sahkoposti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kori", email, suostumus: muistutus, items: fyysiset }),
      }).catch(() => { /* paras yritys */ });
    }, 1200);
    return () => clearTimeout(t);
  }, [form.email, items, muistutus]);

  // Auto-apply discount code from ?code= (used by recovery emails)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code")?.toUpperCase();
    if (code && VALID_CODES[code] && !appliedDiscount) {
      setAppliedDiscount({ code, ...VALID_CODES[code] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (beginCheckoutSent.current || items.length === 0) return;
    beginCheckoutSent.current = true;
    try {
      trackBeginCheckout(
        items.map(i => ({
          item_id: i.product.slug || i.product.id,
          item_name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          item_variant: [i.selectedSize, i.selectedColor].filter(Boolean).join(" / ") || undefined,
          item_category: i.product.category,
        })),
        items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      );
    } catch { /* analytics is best-effort */ }
  }, [items]);

  const updateForm = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) => {
    // Hyväksyy +, numerot, välilyönnit ja viivat. Vähintään 6 numeroa.
    const digits = phone.replace(/\D/g, "");
    return /^[+\d\s-]+$/.test(phone) && digits.length >= 6;
  };

  const canProceedToShipping = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || (!onlyGiftCards && !form.phone.trim())) {
      toast({ title: "Täytä kaikki pakolliset kentät", variant: "destructive" });
      return false;
    }
    if (!isValidEmail(form.email)) {
      toast({ title: "Tarkista sähköpostiosoite", variant: "destructive" });
      return false;
    }
    if (!onlyGiftCards && !isValidPhone(form.phone)) {
      toast({ title: "Tarkista puhelinnumero", variant: "destructive" });
      return false;
    }
    return true;
  };

  const canProceedToPayment = () => {
    if (!form.address.trim() || !form.zip.trim() || !form.city.trim()) {
      toast({ title: "Täytä kaikki pakolliset kentät", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!form.email || !form.firstName || (!onlyGiftCards && (!form.phone || !form.address || !form.zip || !form.city))) {
      toast({ title: "Täytä kaikki pakolliset kentät", variant: "destructive" });
      return;
    }
    if (!isValidEmail(form.email)) {
      toast({ title: "Tarkista sähköpostiosoite", variant: "destructive" });
      return;
    }
    if (!onlyGiftCards && !isValidPhone(form.phone)) {
      toast({ title: "Tarkista puhelinnumero", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      // Oma tausta (21.10.2026): kassa sivuston omassa /api/checkout-funktiossa.
      const vastaus = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({
            id: i.product.id,
            slug: i.product.slug,
            name: i.product.name,
            quantity: i.quantity,
            image: proxiedImage(i.product.images[0], { absolute: true }) || undefined,
            size: i.selectedSize,
            color: i.selectedColor,
            customText: i.customText || undefined,
            ...(i.product.type === "giftcard" ? { type: "giftcard", giftCard: i.giftCard } : {}),
          })),
          customerEmail: form.email,
          customerName: `${form.firstName} ${form.lastName}`,
          shippingAddress: onlyGiftCards ? undefined : { address: form.address, zip: form.zip, city: form.city, phone: form.phone },
          recipientName: differentRecipient && recipientName.trim() ? recipientName.trim() : undefined,
          discountCode: appliedDiscount?.code || undefined,
          giftCardCode: appliedGiftCard?.code || undefined,
        }),
      });
      const data = await vastaus.json().catch(() => null);
      if (data?.ok === false) {
        throw new Error(data?.error || "Maksun aloitus epäonnistui");
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe-sessiota ei voitu luoda");
      }
    } catch (err: unknown) {
      console.error("Payment error:", err);
      toast({ title: "Maksun aloitus epäonnistui", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyDiscount = async () => {
    const upper = discountCode.trim().toUpperCase();
    if (!upper) return;
    const found = VALID_CODES[upper];
    if (found) {
      setAppliedDiscount({ code: upper, ...found });
      toast({ title: `Koodi "${upper}" aktivoitu! ${found.label} 🎉` });
      return;
    }
    // Muut koodit (ensitilauksen koodi, kannan koodit) tarkistetaan palvelimella sähköpostiosoitteen kanssa.
    try {
      const vastaus = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "alennuskoodi", code: upper, email: form.email.trim() }),
      });
      const data = await vastaus.json().catch(() => null);
      if (data?.ok && Number(data.percent) > 0) {
        const label = `${Number(data.percent)} % alennus`;
        setAppliedDiscount({ code: upper, percent: Number(data.percent), label });
        toast({ title: `Koodi "${upper}" aktivoitu: ${label}` });
      } else {
        toast({ title: data?.error || "Virheellinen alennuskoodi", variant: "destructive" });
      }
    } catch {
      toast({ title: "Koodin tarkistus epäonnistui", variant: "destructive" });
    }
  };

  const applyGiftCard = async () => {
    const code = giftCardInput.trim();
    if (!code) return;
    setCheckingGiftCard(true);
    try {
      const vastaus = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lahjakortti", code }),
      });
      const data = await vastaus.json().catch(() => null);
      if (data?.ok) {
        setAppliedGiftCard({ code: data.code, saldo: Number(data.saldo) });
        toast({ title: `Lahjakortti lisätty, saldo ${Number(data.saldo).toFixed(2).replace(".", ",")} €` });
      } else {
        toast({ title: data?.error || "Lahjakortin tarkistus epäonnistui", variant: "destructive" });
      }
    } catch {
      toast({ title: "Lahjakortin tarkistus epäonnistui", variant: "destructive" });
    } finally {
      setCheckingGiftCard(false);
    }
  };

  // Alennuskoodi koskee vain fyysisiä tuotteita (ei lahjakortteja). Pakettialennus vain ilman alennuskoodia.
  // Lopullinen summa lasketaan palvelimella (api/_lib/kassa.js).
  const discountAmount = appliedDiscount ? Math.round(tila.summa * appliedDiscount.percent) / 100 : 0;
  const bundleDiscount = appliedDiscount ? 0 : arvioiPakettialennus(items, allProducts);
  // Kahden tuotteen alennus vain ilman alennuskoodia (api/_lib/korialennus.js).
  const kori = korialennusTila(items, allProducts, !!appliedDiscount);
  const basketDiscount = kori.alennus;
  const shippingFree = tila.ilmainen;
  const shippingCost = tila.toimitus;
  const grandTotal = Math.round((totalPrice - discountAmount - bundleDiscount - basketDiscount + shippingCost) * 100) / 100;
  // Sama sääntö kuin palvelimella: Stripen pienin veloitus 0,50 €, joten alle 0,50 €:n loppusummaa ei jätetä.
  const giftCardRaw = appliedGiftCard ? Math.min(appliedGiftCard.saldo, grandTotal) : 0;
  const giftCardUse = grandTotal - giftCardRaw > 0 && grandTotal - giftCardRaw < 0.5 ? Math.max(0, grandTotal - 0.5) : giftCardRaw;
  const amountDue = Math.round((grandTotal - giftCardUse) * 100) / 100;

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


  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      <SEOHead title="Kassa – Huumorikauppa" description="Viimeistele tilauksesi turvallisesti Huumorikaupassa." />
      <h1 className="font-display text-3xl text-foreground mb-8">Kassa</h1>

      <p className="text-sm text-muted-foreground -mt-6 mb-6">Täytä tiedot ja siirry maksamaan. Maksutapa valitaan Stripen maksusivulla.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Yksi lomake (29.10.2026): yhteystiedot, toimitusosoite ja maksupainike samalla sivulla, selaimen
              automaattinen täyttö (autoComplete) käytössä. Aiemmin kolme vaihetta ennen Stripeä. */}
          <form
            className="space-y-4"
            autoComplete="on"
            onSubmit={(e) => { e.preventDefault(); if (canProceedToShipping() && (onlyGiftCards || canProceedToPayment())) handlePayment(); }}
          >
            <h2 className="font-display text-xl text-foreground">Yhteystiedot</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="firstName" className="text-foreground">Etunimi *</Label>
                <Input id="firstName" name="given-name" autoComplete="given-name" enterKeyHint="next" value={form.firstName} onChange={e => updateForm("firstName", e.target.value)} className="bg-muted border-border mt-1" placeholder="Matti" />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-foreground">Sukunimi *</Label>
                <Input id="lastName" name="family-name" autoComplete="family-name" enterKeyHint="next" value={form.lastName} onChange={e => updateForm("lastName", e.target.value)} className="bg-muted border-border mt-1" placeholder="Meikäläinen" />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-foreground">Sähköposti *</Label>
              <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} enterKeyHint="next" value={form.email} onChange={e => updateForm("email", e.target.value)} className="bg-muted border-border mt-1" placeholder="matti@email.fi" />
            </div>
            {!onlyGiftCards && (
              <div>
                <Label htmlFor="phone" className="text-foreground">Puhelin *</Label>
                <Input
                  id="phone"
                  name="tel"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  value={form.phone}
                  onChange={e => updateForm("phone", e.target.value)}
                  className="bg-muted border-border mt-1"
                  placeholder="0401234567"
                />
                <p className="text-xs text-muted-foreground mt-1">Tarvitsemme puhelinnumeron toimitusta varten.</p>
              </div>
            )}

            {!onlyGiftCards && (
              <>
                <h2 className="font-display text-xl text-foreground pt-2">Toimitusosoite</h2>
                <div>
                  <Label htmlFor="address" className="text-foreground">Katuosoite *</Label>
                  <Input id="address" name="street-address" autoComplete="street-address" enterKeyHint="next" value={form.address} onChange={e => updateForm("address", e.target.value)} className="bg-muted border-border mt-1" placeholder="Esimerkkikatu 123" />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="zip" className="text-foreground">Postinumero *</Label>
                    <Input id="zip" name="postal-code" autoComplete="postal-code" inputMode="numeric" maxLength={5} enterKeyHint="next" value={form.zip} onChange={e => updateForm("zip", e.target.value)} className="bg-muted border-border mt-1" placeholder="00100" />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-foreground">Postitoimipaikka *</Label>
                    <Input id="city" name="address-level2" autoComplete="address-level2" enterKeyHint="done" value={form.city} onChange={e => updateForm("city", e.target.value)} className="bg-muted border-border mt-1" placeholder="Helsinki" />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={differentRecipient}
                    onChange={e => { setDifferentRecipient(e.target.checked); if (!e.target.checked) setRecipientName(""); }}
                    className="accent-primary"
                  />
                  Toimitetaan eri vastaanottajalle kuin maksaja
                </label>
                {differentRecipient && (
                  <div>
                    <Label htmlFor="recipientName" className="text-foreground">Vastaanottajan nimi *</Label>
                    <Input
                      id="recipientName"
                      autoComplete="off"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="bg-muted border-border mt-1"
                      placeholder="Etunimi Sukunimi"
                    />
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  📦 Kotiinkuljetus {TOIMITUSAIKA_TEKSTI} arkipäivää · {shippingFree ? "ilmainen toimitus" : `toimitus ${shippingCost.toFixed(2).replace(".", ",")} €`}
                </p>
              </>
            )}

            {!onlyGiftCards && (
              <div className="flex items-start gap-2">
                <Checkbox id="muistutus" checked={muistutus} onCheckedChange={(v) => setMuistutus(v === true)} className="mt-0.5" />
                <Label htmlFor="muistutus" className="text-sm font-normal text-muted-foreground leading-snug">
                  {SUOSTUMUS_MUISTUTUS} Saat enintään kaksi viestiä (tunnin ja vuorokauden kuluttua), ja jokaisessa on peruutuslinkki.{" "}
                  <Link to="/tietosuojakaytanto" className="underline underline-offset-2">Tietosuojakäytäntö</Link>
                </Label>
              </div>
            )}
            {onlyGiftCards && (
              <p className="text-xs text-muted-foreground">Lahjakortti toimitetaan sähköpostilla heti maksun jälkeen, joten toimitusosoitetta ei tarvita.</p>
            )}

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isProcessing}
                className="bg-primary text-primary-foreground font-bold text-lg shadow-glow-lime w-full h-14"
              >
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Siirrytään maksuun...</>
                ) : amountDue <= 0 ? (
                  <>Vahvista tilaus, maksetaan lahjakortilla</>
                ) : (
                  <>Siirry maksamaan {amountDue.toFixed(2).replace(".", ",")} € 🔒</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Maksu Stripen suojatulla maksusivulla: {PAYMENT_METHODS_TEXT}.
              </p>
              <PaymentIcons className="justify-center" />
            </div>
          </form>
        </div>

        {/* Order summary sidebar */}
        <div className="bg-card border border-border rounded-lg p-6 h-fit space-y-4">
          <h3 className="font-display text-lg text-foreground">Tilauksesi</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {items.map(item => (
              <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${item.customText || ""}-${item.lineId || ""}`} className="flex gap-3 text-sm">
                <img src={proxiedImage(item.product.images[0]) || "/placeholder.svg"} alt={`${item.product.name} – kassalla`} className="w-12 h-12 rounded bg-muted object-cover" loading="lazy" width={48} height={48} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground line-clamp-1">{item.product.name}</p>
                  <p className="text-muted-foreground">{item.quantity} × {item.product.price.toFixed(2)} €</p>
                  <ProductRating
                    product={{ id: item.product.id, name: item.product.name, category: item.product.category }}
                    size="sm"
                    showCount={false}
                    className="!gap-0.5"
                  />
                  {item.customText && (
                    <p className="text-xs text-primary break-words">✍️ ”{item.customText}”</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Discount code */}
          <div className="border-t border-border pt-3 space-y-2">
            {appliedDiscount ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary font-medium">✅ {appliedDiscount.code}</span>
                <span className="text-primary">-{appliedDiscount.label}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Alennuskoodi"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value)}
                  className="bg-muted border-border text-sm"
                />
                <Button variant="outline" size="sm" onClick={applyDiscount} className="border-border whitespace-nowrap">
                  Käytä
                </Button>
              </div>
            )}
          </div>
          {!hasGiftCards && (
            <div className="space-y-2">
              {appliedGiftCard ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary font-medium">✅ Lahjakortti {appliedGiftCard.code}</span>
                  <button type="button" onClick={() => setAppliedGiftCard(null)} className="text-xs text-muted-foreground hover:underline">Poista</button>
                </div>
              ) : (
                <>
                  <Label htmlFor="giftCardCode" className="text-xs text-muted-foreground">Lahjakortin koodi</Label>
                  <div className="flex gap-2">
                    <Input
                      id="giftCardCode"
                      placeholder="HK-XXXX-XXXX-XXXX"
                      value={giftCardInput}
                      onChange={e => setGiftCardInput(e.target.value)}
                      className="bg-muted border-border text-sm"
                      autoComplete="off"
                    />
                    <Button variant="outline" size="sm" onClick={applyGiftCard} disabled={checkingGiftCard} className="border-border whitespace-nowrap">
                      {checkingGiftCard ? <Loader2 className="h-4 w-4 animate-spin" /> : "Käytä"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tuotteet</span><span>{totalPrice.toFixed(2)} €</span>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between text-primary">
                <span>Alennus ({appliedDiscount.percent}%)</span><span>-{discountAmount.toFixed(2)} €</span>
              </div>
            )}
            {bundleDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Pakettialennus</span><span>-{bundleDiscount.toFixed(2)} €</span>
              </div>
            )}
            {basketDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Kahden tuotteen alennus (-{kori.prosentti} %)</span><span>-{basketDiscount.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Toimitus</span>
              <span>{onlyGiftCards ? "Sähköpostilla" : shippingFree ? "Ilmainen" : `${shippingCost.toFixed(2)} €`}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border">
              <span>Yhteensä</span><span className="text-primary">{grandTotal.toFixed(2)} €</span>
            </div>
            {appliedGiftCard && (
              <>
                <div className="flex justify-between text-primary">
                  <span>Lahjakortti {appliedGiftCard.code}</span><span>-{giftCardUse.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Maksettavaa</span><span>{amountDue.toFixed(2)} €</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
