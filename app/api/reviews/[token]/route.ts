import { NextRequest, NextResponse } from "next/server";
import { getReviewByToken, submitReview } from "@/lib/reviews";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const review = getReviewByToken(token);
  if (!review) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
  }
  return NextResponse.json({
    productTitle: review.productTitle,
    alreadySubmitted: !!review.submittedAt,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => null);

  if (!body?.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "Merci de choisir une note entre 1 et 5." }, { status: 400 });
  }

  const review = getReviewByToken(token);
  if (!review) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
  }
  if (review.submittedAt) {
    return NextResponse.json({ error: "Tu as déjà laissé ton avis, merci !" }, { status: 409 });
  }

  submitReview(token, body.rating, body.comment || "");
  return NextResponse.json({ ok: true });
}
