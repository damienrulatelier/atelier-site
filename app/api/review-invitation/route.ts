import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import type { Review } from "@/lib/reviews";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ skipped: true });
  }

  const body = await req.json().catch(() => null);
  const { reviews, origin } = body as { reviews: Review[]; origin: string };
  if (!reviews?.length) {
    return NextResponse.json({ error: "Aucun avis à notifier." }, { status: 400 });
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    for (const review of reviews) {
      const link = `${origin}/avis/${review.reviewToken}`;
      await resend.emails.send({
        from: "Atelier Damien Rul <onboarding@resend.dev>",
        to: [review.customerEmail],
        subject: `Ton avis sur « ${review.productTitle} » ?`,
        html: `
          <h2>Ton avis compte !</h2>
          <p>J&rsquo;espère que tu es content·e de <strong>${review.productTitle}</strong>.</p>
          <p>Si tu as deux minutes, ça m&rsquo;aiderait beaucoup que tu laisses un petit avis :</p>
          <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#181614;color:white;text-decoration:none;">Laisser mon avis</a></p>
          <p style="color:#888;font-size:13px;">Merci infiniment pour ta confiance — Damien</p>
        `,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur envoi email avis:", err);
    return NextResponse.json({ error: "Échec de l'envoi." }, { status: 500 });
  }
}
