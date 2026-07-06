import { redirect } from "next/navigation";

async function confirmAndNotify(commissionId: string, sessionId: string) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  // Vérifier le paiement Stripe
  if (stripeKey && sessionId && !sessionId.startsWith("mock")) {
    try {
      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") return false;
    } catch { return false; }
  }

  // Envoyer le mail directement avec les données de la session Stripe
  const resendKey = process.env.RESEND_API_KEY;
  const artistEmail = process.env.ARTIST_EMAIL || "damienrul34@gmail.com";

  if (!resendKey) {
    console.log("[MerciCommission] Pas de RESEND_API_KEY");
    return true;
  }

  // Récupérer les détails de la session Stripe pour avoir les metadata
  let category = "";
  let size = "";
  let commissionDetails = "";

  if (stripeKey && sessionId && !sessionId.startsWith("mock")) {
    try {
      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      const meta = session.metadata || {};
      category = meta.category || "";
      size = meta.size || "";
      commissionDetails = meta.commissionId || commissionId;
    } catch { /* silencieux */ }
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const html = `
      <h2>✅ Acompte commission reçu !</h2>
      <p><strong>Commission ID :</strong> ${commissionId}</p>
      ${category ? `<p><strong>Catégorie :</strong> ${category}</p>` : ""}
      ${size ? `<p><strong>Format :</strong> ${size}</p>` : ""}
      <p><strong>Session Stripe :</strong> ${sessionId}</p>
      <p>L'acompte a été reçu — tu peux commencer le croquis !</p>
    `;

    await resend.emails.send({
      from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
      to: artistEmail,
      subject: `✅ Acompte commission reçu${category ? ` — ${category}` : ""}`,
      html,
    });

    console.log("[MerciCommission] Mail envoyé à", artistEmail);
  } catch (e) {
    console.error("[MerciCommission] Erreur mail:", e);
  }

  return true;
}

export default async function MerciCommissionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; session_id?: string; mock?: string }>;
}) {
  const params = await searchParams;
  const { id, session_id, mock } = params;

  if (!id) redirect("/commissions");

  await confirmAndNotify(id as string, session_id || (mock ? "mock" : ""));

  return (
    <main className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="text-4xl mb-6">✓</div>
      <h1 className="font-serif text-3xl text-[#181614] mb-4">Acompte reçu — merci !</h1>
      <p className="text-[#3A3631] mb-3">
        Ta demande de commission est confirmée. Je vais travailler sur un premier croquis et te le soumettre très prochainement.
      </p>
      <p className="text-sm text-[#8C8780]">
        Je te contacte par e-mail dans les 48h. L&rsquo;acompte sera déduit du prix final.
      </p>
    </main>
  );
}
