import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { recordCheckout, cancelSubscription } from "@/lib/membership";

export async function POST(req: NextRequest) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "stripe not configured" }, { status: 503 });
  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `bad signature: ${(e as Error).message}` }, { status: 400 });
  }
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        if (cs.payment_status === "paid" || cs.mode === "subscription") await recordCheckout(cs);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await cancelSubscription(sub.id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("webhook handler error", e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
