import Stripe from "stripe";

let client: Stripe | null = null;
export function stripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}
