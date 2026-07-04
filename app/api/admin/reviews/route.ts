import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import { getAllReviews } from "@/lib/reviews";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  // On ne montre que les avis effectivement soumis par le client (note > 0),
  // pas les simples invitations encore en attente de réponse.
  const reviews = getAllReviews().filter((r) => r.rating > 0);
  return NextResponse.json({ reviews });
}
