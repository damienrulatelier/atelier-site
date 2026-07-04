import { NextRequest, NextResponse } from "next/server";
import { paypalFetch, isPaypalConfigured } from "@/lib/paypal";

type CartLineInput = { title: string; price: number; qty: number };

export async function POST(req: NextRequest) {
  if (!isPaypalConfigured()) {
    return NextResponse.json(
      { error: "PayPal n'est pas encore configuré sur ce site. Renseigne PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET dans .env.local." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const lines: CartLineInput[] = body?.lines;
  const shippingPrice: number = body?.shippingPrice || 0;

  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }

  const itemsTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const total = itemsTotal + shippingPrice;

  try {
    const res = await paypalFetch("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value: total.toFixed(2),
              breakdown: {
                item_total: { currency_code: "EUR", value: itemsTotal.toFixed(2) },
                shipping: { currency_code: "EUR", value: shippingPrice.toFixed(2) },
              },
            },
            items: lines.map((l) => ({
              name: l.title.slice(0, 127),
              unit_amount: { currency_code: "EUR", value: l.price.toFixed(2) },
              quantity: String(l.qty),
            })),
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Erreur création commande PayPal:", data);
      return NextResponse.json({ error: "Impossible de créer la commande PayPal." }, { status: 500 });
    }

    return NextResponse.json({ orderId: data.id });
  } catch (err) {
    console.error("Erreur PayPal:", err);
    return NextResponse.json({ error: "Impossible de contacter PayPal." }, { status: 500 });
  }
}
