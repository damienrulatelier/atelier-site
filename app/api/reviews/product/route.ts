import { NextRequest, NextResponse } from "next/server";
import { getApprovedReviewsForProduct } from "@/lib/reviews";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  if (!title) {
    return NextResponse.json({ reviews: [] });
  }
  const reviews = getApprovedReviewsForProduct(title).map((r) => ({
    rating: r.rating,
    comment: r.comment,
    customerName: r.customerName,
    submittedAt: r.submittedAt,
  }));
  return NextResponse.json({ reviews });
}
