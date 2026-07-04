import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import { moderateReview } from "@/lib/reviews";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (body?.status !== "approved" && body?.status !== "rejected") {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }
  const review = moderateReview(id, body.status);
  if (!review) {
    return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
  }
  return NextResponse.json({ review });
}
