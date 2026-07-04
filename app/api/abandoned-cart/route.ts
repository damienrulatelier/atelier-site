import { NextRequest, NextResponse } from "next/server";
import { upsertAbandonedCart } from "@/lib/abandoned-carts";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.items?.length) {
    return NextResponse.json({ ok: false });
  }
  upsertAbandonedCart(body.email, body.items, body.total || 0);
  return NextResponse.json({ ok: true });
}
