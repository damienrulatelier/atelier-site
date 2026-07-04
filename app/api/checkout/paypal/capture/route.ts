import { NextRequest, NextResponse } from "next/server";
import { paypalFetch, isPaypalConfigured } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  if (!isPaypalConfigured()) {
    return NextResponse.json({ error: "PayPal n'est pas configuré." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const orderId = body?.orderId;
  if (!orderId) {
    return NextResponse.json({ error: "Identifiant de commande manquant." }, { status: 400 });
  }

  try {
    const res = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Erreur capture PayPal:", data);
      return NextResponse.json({ error: "Le paiement PayPal n'a pas pu être finalisé." }, { status: 500 });
    }
    return NextResponse.json({ status: data.status, id: data.id });
  } catch (err) {
    console.error("Erreur capture PayPal:", err);
    return NextResponse.json({ error: "Impossible de contacter PayPal." }, { status: 500 });
  }
}
