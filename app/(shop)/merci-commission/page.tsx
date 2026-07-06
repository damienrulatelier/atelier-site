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

  const resendKey = process.env.RESEND_API_KEY;
  const artistEmail = process.env.ARTIST_EMAIL || "damienrul34@gmail.com";

  if (!resendKey) {
    console.log("[MerciCommission] Pas de RESEND_API_KEY");
    return true;
  }

  // Récupérer les données de la commission depuis Supabase
  let commission: Record<string, string> | null = null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data } = await sb.from("commissions").select("data").eq("id", commissionId).single();
    if (data?.data) commission = data.data;
  } catch (e) { console.error("[MerciCommission] Supabase error:", e); }

  const c = commission;
  const rows = c ? [
    ["Catégorie", c.category],
    ["Format", c.size],
    ["Rendu", c.color],
    ["Médium", c.medium],
    ["Prints", c.prints],
    ["Digital", c.digital],
    ["Formats souhaités", c.formats],
    ["Prix estimé", c.estimatedPrice],
    ["Acompte", c.deposit],
  ].filter(([, v]) => v) : [];

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const html = `
      <h2>✅ Acompte reçu — Commission confirmée !</h2>
      <p><strong>Tu peux commencer le croquis !</strong></p>
      ${rows.length > 0 ? `
      <table style="border-collapse:collapse;width:100%">
        ${rows.map(([k, v]) => `<tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold">${k}</td><td style="padding:6px;border:1px solid #ddd">${v}</td></tr>`).join("")}
      </table>` : ""}
      ${c?.description ? `<h3>Description</h3><p style="white-space:pre-wrap">${c.description}</p>` : ""}
      ${c?.referencePath ? `<p>📎 <a href="${c.referencePath}">Voir la photo de référence</a></p>` : ""}
      <p><strong>Commission ID :</strong> ${commissionId}</p>
    `;

    await resend.emails.send({
      from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
      to: artistEmail,
      subject: `✅ Commission payée${c?.category ? ` — ${c.category}` : ""}${c?.size ? ` ${c.size}` : ""}`,
      html,
    });

    // Mettre à jour le statut dans Supabase
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
      await sb.from("commissions").update({ status: "paid" }).eq("id", commissionId);
    } catch { /* silencieux */ }

    console.log("[MerciCommission] Mail envoyé");
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
