import { NextRequest, NextResponse } from "next/server";
import {
  reserveNextEditionNumber,
  releaseReservation,
  getRemainingCount,
} from "@/lib/reservations";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.productId || !body?.sessionToken) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }
  const reservation = reserveNextEditionNumber(body.productId, body.sessionToken);
  if (!reservation) {
    return NextResponse.json({ error: "Plus aucun numéro disponible." }, { status: 409 });
  }
  return NextResponse.json({ number: reservation.number, expiresAt: reservation.expiresAt });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.productId || !body?.sessionToken) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }
  releaseReservation(body.productId, body.sessionToken);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId manquant." }, { status: 400 });
  }
  const remaining = getRemainingCount(productId);
  return NextResponse.json({ remaining });
}
