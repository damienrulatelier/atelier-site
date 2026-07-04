import { NextRequest, NextResponse } from "next/server";
import { releaseReservation } from "@/lib/reservations";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (body?.productId && body?.sessionToken) {
    releaseReservation(body.productId, body.sessionToken);
  }
  return NextResponse.json({ ok: true });
}
