import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
type CartLineInput = {
  productId?: string;
  title: string;
  price: number;
  qty: number;
  dedication?: string;
  size?: string;
};
export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: "Stripe n'est pas encore configuré." }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const lines: CartLineInput[] = body?.lines;
  const shippingLabel: string = body?.shippingLabel || "Livraison";
  const shippingPrice: number = body?.shippingPrice || 0;
  const customerEmail: string | undefined = body?.email;
  const sessionToken: string = body?.sessionToken || "";
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  try {
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((l) => ({
      price_data: {
        currency: "eur",
        unit_amount: Math.round(l.price * 100),
        product_data: {
          name: l.size ? `${l.title} — ${l.size}` : l.title,
          description: l.dedication ? `Dédicace : ${l.dedication}` : undefined,
        },
      },
      quantity: l.qty,
    }));
    if (shippingPrice > 0) {
      line_items.push({
        price_data: {
          currency: "eur",
          unit_amount: Math.round(shippingPrice * 100),
          product_data: { name: shippingLabel },
        },
        quantity: 1,
      });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      customer_email: customerEmail,
      success_url: `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/commande`,
      shipping_address_collection: { allowed_countries: ["FR", "BE", "CH", "LU", "MC"] },
      metadata: {
        items: JSON.stringify(
          lines.filter((l) => l.productId).map((l) => ({ id: l.productId, qty: l.qty }))
        ),
        orderSummary: JSON.stringify(
          lines.map((l) => ({
            title: l.title,
            price: l.price,
            qty: l.qty,
            dedication: l.dedication || "",
            size: l.size || "",
          }))
        ),
        shippingLabel,
        shippingPrice: String(shippingPrice),
        sessionToken,
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Erreur Stripe Checkout:", err);
    return NextResponse.json({ error: "Impossible de créer la session de paiement." }, { status: 500 });
  }
}
