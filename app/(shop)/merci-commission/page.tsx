import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";

async function confirmAndNotify(commissionId: string, sessionId: string) {
  // Vérifier le paiement Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && sessionId && !sessionId.startsWith("mock")) {
    try {
      const stripe = (await import("stripe")).default;
      const stripeClient = new stripe(stripeKey);
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") return false;
    } catch { return false; }
  }

  // Charger la demande
  const p = path.join(process.cwd(), "data", "commissions-pending.json");
  if (!fs.existsSync(p)) return false;
  const list = JSON.parse(fs.readFileSync(p, "utf-8"));
  const commission = list.find((c: { id: string }) => c.id === commissionId);
  if (!commission) return false;
  if (commission.status === "paid") return true; // déjà traité

  // Marquer comme payé
  commission.status = "paid";
  commission.paidAt = new Date().toISOString();
  fs.writeFileSync(p, JSON.stringify(list, null, 2));

  // Sauvegarder dans commissions.json
  try {
    const cp = path.join(process.cwd(), "data", "commissions.json");
    let confirmed: unknown[] = [];
    if (fs.existsSync(cp)) confirmed = JSON.parse(fs.readFileSync(cp, "utf-8"));
    confirmed.push(commission);
    fs.writeFileSync(cp, JSON.stringify(confirmed, null, 2));
  } catch { /* silencieux */ }

  // Envoyer le mail à l'artiste
  const resendKey = process.env.RESEND_API_KEY;
  const artistEmail = process.env.ARTIST_EMAIL || "damienrul34@gmail.com";
  if (resendKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const c = commission;
      const html = `
        <h2>✅ Nouvelle commission payée — ${c.category}${c.size ? ` ${c.size}` : ""}</h2>
        <p><strong>Acompte reçu — tu peux commencer le croquis !</strong></p>
        <table style="border-collapse:collapse;width:100%">
          ${[["Catégorie",c.category],["Format",c.size],["Rendu",c.color],["Médium",c.medium],["Prints",c.prints],["Digital",c.digital],["Prix estimé",c.estimatedPrice],["Acompte",c.deposit]]
            .filter(([,v])=>v).map(([k,v])=>`<tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold">${k}</td><td style="padding:6px;border:1px solid #ddd">${v}</td></tr>`).join("")}
        </table>
        <h3>Description du projet</h3>
        <p style="white-space:pre-wrap">${c.description}</p>
        ${c.referencePath ? `<p><em>📎 Photo de référence : <a href="${process.env.NEXT_PUBLIC_SITE_URL}${c.referencePath}">voir la photo</a></em></p>` : ""}
      `;
      await resend.emails.send({
        from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
        to: artistEmail,
        subject: `✅ Commission payée — ${c.category}${c.size ? ` ${c.size}` : ""}`,
        html,
      });
    } catch { /* silencieux */ }
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
