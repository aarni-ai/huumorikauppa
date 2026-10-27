/** Stripe (STRIPE_SECRET_KEY, webhook: STRIPE_WEBHOOK_SECRET). */
import Stripe from "stripe";

let asiakas = null;
export const onStripe = () => !!process.env.STRIPE_SECRET_KEY;
export function stripe() {
  if (!onStripe()) throw new Error("STRIPE_SECRET_KEY puuttuu");
  if (!asiakas) asiakas = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
  return asiakas;
}
