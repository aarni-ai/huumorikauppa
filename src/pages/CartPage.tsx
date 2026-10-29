import { Link } from "react-router-dom";
import { useCartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Truck, Gift } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { proxiedImage } from "@/lib/imageProxy";
import { useMemo } from "react";
import { ILMAINEN_TOIMITUS_RAJA, toimitusTila, arvioiPakettialennus, korialennusTila } from "@/lib/ostoskori";
import { KorialennusVihje, korialennusNimi } from "@/components/KorialennusVihje";
import { ComplementaryProducts } from "@/components/ComplementaryProducts";
import { selectSecondTshirt } from "@/lib/recommendations";
import { PERSONOITU_HINTA } from "../../api/_lib/personoitu.js";
import { LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";
import { TarraLisamyynti } from "@/components/TarraLisamyynti";
import { MittarinLisatuote } from "@/components/MittarinLisatuote";
import { MaksuJaToimitus } from "@/components/MaksuJaToimitus";
import { JouluTakarajaRivi } from "@/components/JouluTakaraja";
import { jouluAvain } from "@/data/jouluAikataulu";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
import { TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";

const CartPage = () => {
  usePrerenderReady();
  const { items, addItem, removeItem, updateQuantity, totalPrice, totalItems } = useCartContext();
  const { data: allProducts = [] } = useProducts();

  // Ilmainen toimitus fyysisten tuotteiden summasta (lahjakortit eivät kerrytä rajaa), raja api/_lib/vakiot.js.
  const tila = toimitusTila(items);
  const shippingFree = tila.ilmainen;
  const shippingCost = tila.toimitus;
  const shippingGap = tila.puuttuu;
  const shippingProgress = tila.edistyminen;
  const pakettialennus = useMemo(() => arvioiPakettialennus(items, allProducts), [items, allProducts]);
  const kori = useMemo(() => korialennusTila(items, allProducts), [items, allProducts]);
  // Yksi t-paita korissa: ehdotetaan toista t-paitaa (kate noin 9,60 € -> noin 19 €, KATTEET.md "Hinnoittelu 29.10.2026").
  const fyysiset = items.filter((i) => !i.giftCard);
  const vainTarroja = fyysiset.length > 0 && fyysiset.every((i) => LISATUOTE_KATEGORIAT.includes(i.product.category));
  const yksiPaita = fyysiset.length === 1 && fyysiset[0].quantity === 1 && fyysiset[0].product.category === "t-paidat";
  const toinenPaita = useMemo(
    () => (yksiPaita ? selectSecondTshirt([fyysiset[0].product], allProducts) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [yksiPaita, fyysiset[0]?.product.id, allProducts],
  );

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center space-y-6">
        <SEOHead title="Ostoskori – Huumorikauppa" description="Ostoskorisi on tyhjä. Selaa Huumorikaupan hauskoja tuotteita!" noindex={true} />
        <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="font-display text-3xl text-foreground">Ostoskori on tyhjä 😅</h1>
        <p className="text-muted-foreground">Etkö löytänyt mitään hauskaa? Mahdotonta!</p>
        <Button asChild className="bg-primary text-primary-foreground font-bold">
          <Link to="/kaikki-tuotteet">Selaa tuotteita 🛒</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 pb-28 lg:pb-12">
      <SEOHead title="Ostoskori – Huumorikauppa" description="Tarkista ostoskorisi ja jatka kassalle." noindex={true} />
      <h1 className="font-display text-3xl md:text-4xl text-foreground mb-8">Ostoskori 🛒</h1>

      {/* Shipping progress bar */}
      {tila.vainLahjakortteja ? null : !shippingFree ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              Lisää <span className="font-bold text-primary">{eur(shippingGap)}</span> ilmaiseen toimitukseen
            </p>
          </div>
          <div
            className="h-2 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-label="Ilmainen toimitus"
            aria-valuemin={0}
            aria-valuemax={ILMAINEN_TOIMITUS_RAJA}
            aria-valuenow={Math.min(tila.summa, ILMAINEN_TOIMITUS_RAJA)}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{eur(tila.summa)} / {ILMAINEN_TOIMITUS_RAJA} €{tila.summa !== totalPrice ? " (lahjakortit eivät kerrytä rajaa)" : ""}</p>
          {/* Lisätuote, joka kuroo puuttuvan summan umpeen (src/lib/lisatarra.ts, KATTEET.md 28.10.2026) */}
          <MittarinLisatuote items={items} kaikki={allProducts} className="mt-3" />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-primary">Ilmainen toimitus! 🎉</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${item.customText || ""}-${item.lineId || ""}`} className="flex gap-4 bg-card border border-border rounded-lg p-4">
              <Link to={item.product.type === "giftcard" ? "/lahjakortti" : `/tuote/${item.product.slug}`} className="shrink-0">
                <img
                  src={proxiedImage(item.product.images[0]) || "/placeholder.svg"}
                  alt={`${item.product.name} – ostoskorissa`}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-md bg-muted"
                  loading="lazy"
                  width={96}
                  height={96}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={item.product.type === "giftcard" ? "/lahjakortti" : `/tuote/${item.product.slug}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                  {item.product.name}
                </Link>
                <div className="text-sm text-muted-foreground mt-1 space-x-2">
                  {item.selectedSize && <span>Koko: {item.selectedSize}</span>}
                  {item.selectedColor && <span>Väri: {item.selectedColor}</span>}
                </div>
                {item.customText && (
                  <p className="text-sm text-primary mt-1 break-words">✍️ Oma teksti: ”{item.customText}”</p>
                )}
                {item.giftCard && (item.giftCard.recipientName || item.giftCard.recipientEmail) && (
                  <p className="text-sm text-muted-foreground mt-1 break-words">
                    <Gift className="inline h-3.5 w-3.5 mr-1 text-primary" />
                    Saaja: {[item.giftCard.recipientName, item.giftCard.recipientEmail].filter(Boolean).join(", ")}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor, item.customText, item.lineId)}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold text-foreground w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor, item.customText, item.lineId)}
                      className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary">{(item.product.price * item.quantity).toFixed(2)} €</span>
                    <button
                      onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor, item.customText, item.lineId)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lisämyynti yhteenvedon jälkeen mobiilissa, jotta Jatka kassalle näkyy heti tuotteiden alla (29.10.2026). */}
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 space-y-4">
          {/* Rajan alittavassa korissa lisätuotetta ehdottaa mittari (MittarinLisatuote). */}
          {shippingFree && !tila.vainLahjakortteja && <TarraLisamyynti kori={items} kaikki={allProducts} />}

          {yksiPaita && toinenPaita.length >= 2 && (
            <ComplementaryProducts
              base={[fyysiset[0].product]}
              all={allProducts}
              picks={toinenPaita}
              title="Lisää toinen t-paita"
              note="Kahden tuotteen alennus lasketaan ostoskorissa automaattisesti."
              className="mt-6 pt-6 border-t border-border"
            />
          )}
          {yksiPaita && (
            <Link to="/personoitu-paita" className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm text-foreground hover:border-primary">
              <Gift className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <span><span className="font-semibold">Saajan nimi ja ikä paitaan:</span> personoitu t-paita {eur(PERSONOITU_HINTA)}, esikatselu ennen tilausta.</span>
            </Link>
          )}

          {/* Sopii yhteen (src/lib/recommendations.ts): täydentävät tuotteet, ei väitettä yhteisostoista */}
          {!tila.vainLahjakortteja && !yksiPaita && (
          <ComplementaryProducts
            base={items.map((i) => i.product)}
            all={allProducts}
            title={shippingFree ? "Täydennä tilaus" : `Täydennä tilaus: ${shippingGap.toFixed(2).replace(".", ",")} € ilmaiseen toimitukseen`}
            className="mt-6 pt-6 border-t border-border"
          />
          )}
        </div>

        {/* Summary */}
        <div className="bg-card border border-border rounded-lg p-6 h-fit space-y-4 lg:sticky lg:top-32 lg:col-start-3 lg:row-start-1 lg:row-span-2">
          <h2 className="font-display text-xl text-foreground">Yhteenveto</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tuotteet ({totalItems} kpl)</span>
              <span>{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Toimitus</span>
              <span>{shippingFree ? <span className="text-primary font-medium">Ilmainen 🎉</span> : `${shippingCost.toFixed(2)} €`}</span>
            </div>
            {pakettialennus > 0 && (
              <div className="flex justify-between text-primary">
                <span>Pakettialennus</span>
                <span>-{eur(pakettialennus)}</span>
              </div>
            )}
            {kori.voimassa && (
              <div className="flex justify-between text-primary">
                <span>{korialennusNimi(kori)}</span>
                <span>-{eur(kori.alennus)}</span>
              </div>
            )}
            {!tila.vainLahjakortteja && <KorialennusVihje tila={kori} />}
            {!shippingFree && (
              <p className="text-xs text-primary font-medium">
                {eur(shippingGap)} ilmaiseen toimitukseen
              </p>
            )}
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Yhteensä</span>
              <span className="text-primary">{(totalPrice - pakettialennus - kori.alennus + shippingCost).toFixed(2)} €</span>
            </div>
          </div>

          <JouluTakarajaRivi
            categories={items.some((i) => i.product.supplier === "aliexpress") ? [] : items.map((i) => jouluAvain(i.product))}
            className="text-sm text-foreground"
          />

          {items.some((i) => i.product.supplier === "aliexpress") && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
              <p className="font-medium">📦 Osa tuotteista toimitetaan erikseen</p>
              <p>
                AliExpress-tuotteiden toimitusaika on n. 2–4 viikkoa.
                {items.some((i) => i.product.supplier !== "aliexpress")
                  ? ` Muut tuotteesi (${TOIMITUSAIKA_TEKSTI} arkipäivää) toimitetaan eri paketissa eri aikataululla.`
                  : ""}
              </p>
            </div>
          )}

          {vainTarroja && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800" role="status">
              Tarra myydään t-paidan, hupparin tai julisteen lisänä. Lisää koriin myös toinen tuote.
            </p>
          )}

          {/* Alennuskoodi ja lahjakortti syötetään kassalla (CheckoutPage), jossa ne myös tarkistetaan. */}
          <Button asChild size="lg" className="w-full bg-primary text-primary-foreground font-bold shadow-glow-lime hover:scale-[1.02] transition-transform">
            <Link to="/kassa" className="flex items-center justify-center gap-2">
              Jatka kassalle <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <MaksuJaToimitus center />

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>🔒 Turvallinen SSL-suojattu maksu</p>
            <p>🚚 Toimitus {TOIMITUSAIKA_TEKSTI} arkipäivää</p>
            <p>↩️ 14 pv palautusoikeus</p>
          </div>
        </div>
      </div>

      {/* Mobiilin kiinteä kassapalkki: loppusumma toimituksineen ja Jatka kassalle aina näkyvissä. */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-2xl pb-[env(safe-area-inset-bottom,0px)]">
        <div className="container flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Yhteensä{tila.vainLahjakortteja ? "" : shippingFree ? ", ilmainen toimitus" : `, sis. toimitus ${eur(shippingCost)}`}</p>
            <p className="text-lg font-bold text-foreground">{eur((totalPrice - pakettialennus - kori.alennus + shippingCost))}</p>
          </div>
          <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold shrink-0 shadow-glow-lime">
            <Link to="/kassa" className="flex items-center gap-2">Jatka kassalle <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
