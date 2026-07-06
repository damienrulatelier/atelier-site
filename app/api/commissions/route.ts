import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEVIS_CATEGORIES = ["Projet visuel", "Sur mesure"];

const SCAN_SUPPLEMENT: Record<string, number> = {
  A5: 2, A4: 4, A3: 10, A2: 20, A1: 25,
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const category       = (formData.get("category") as string) || "";
  const size           = (formData.get("size") as string) || "";
  const color          = (formData.get("color") as string) || "";
  const medium         = (formData.get("medium") as string) || "";
  const description    = (formData.get("description") as string) || "";
  const estimatedPrice = (formData.get("estimatedPrice") as string) || "";
  const deposit        = (formData.get("deposit") as string) || "";
  const prints         = (formData.get("prints") as string) || "";
  const digital        = (formData.get("digital") as string) || "";
  const formats        = (formData.get("formats") as string) || "";
  const paymentMethod  = (formData.get("paymentMethod") as string) || "stripe";
  const referenceUrl   = (formData.get("referenceUrl") as string) || "";

  if (!description.trim()) {
    return NextResponse.json({ error: "Description manquante." }, { status: 400 });
  }

  const isDevis = DEVIS_CATEGORIES.includes(category);
  const commissionId = `com_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Sauvegarder la photo de référence
  const commissionData = {
    id: commissionId,
    createdAt: new Date().toISOString(),
    status: isDevis ? "pending_reply" : "pending_payment",
    category, size, color, medium, description, formats,
    estimatedPrice, deposit, prints, digital, referencePath: referenceUrl,
  };

  // Sauvegarder dans Supabase
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    await sb.from("commissions").upsert({ id: commissionId, data: commissionData, status: commissionData.status, created_at: commissionData.createdAt });
  } catch (e) { console.error("[Commission] Supabase save error:", e); }

  // Pour les devis — envoyer mail et retourner succès directement
  if (isDevis) {
    console.log("[Commission] Devis reçu, envoi mail...");
    try {
      await sendEmail(commissionData, referenceUrl);
      console.log("[Commission] Mail envoyé");
    } catch (e) {
      console.error("[Commission] sendEmail error:", e);
    }
    return NextResponse.json({ ok: true, devis: true });
  }

  // Pour référence et imagination — créer session de paiement
  const depositAmount = (() => {
    if (size === "A5") return 500;
    if (size === "A4") return 800;
    if (size === "A3") return 1000;
    if (size === "A2") return 2000;
    return 1000; // digital
  })();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  // Mode dev sans Stripe — redirection directe vers merci
  if (!stripeKey) {
    return NextResponse.json({
      checkoutUrl: `${siteUrl}/merci-commission?id=${commissionId}&mock=1`,
    });
  }

  try {
    // Stripe
    const stripe = (await import("stripe")).default;
    const stripeClient = new stripe(stripeKey);
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Acompte commission — ${category}${size ? ` ${size}` : ""}`,
            description: "Déduit du total final.",
          },
          unit_amount: depositAmount,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${siteUrl}/merci-commission?id=${commissionId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/commissions?cancelled=1`,
      metadata: { commissionId, category, size },
    });
    return NextResponse.json({ checkoutUrl: session.url });

  } catch (err) {
    console.error("[Commission] Erreur paiement:", err);
    // Fallback — redirection directe (paiement sera demandé manuellement)
    return NextResponse.json({
      checkoutUrl: `${siteUrl}/merci-commission?id=${commissionId}&mock=1`,
    });
  }
}

async function sendEmail(commission: Record<string, string>, referencePath: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const artistEmail = process.env.ARTIST_EMAIL || "damienrul34@gmail.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  console.log("[Commission sendEmail] resendKey:", resendKey ? "OK" : "MANQUANT", "artistEmail:", artistEmail);
  if (!resendKey) return;

  const { Resend } = await import("resend");
  const resend = new Resend(resendKey);
  const c = commission;
  const isDevis = c.status === "pending_reply";

  const rows = [
    ["Catégorie", c.category],
    ["Format", c.size],
    ["Rendu", c.color],
    ["Médium", c.medium],
    ["Prints", c.prints],
    ["Digital", c.digital],
    ["Formats souhaités", c.formats],
    ["Prix estimé", c.estimatedPrice],
    ["Acompte", c.deposit],
  ].filter(([, v]) => v);

  const html = `
    <h2>${isDevis ? "📋 Nouveau devis" : "✅ Commission — acompte à collecter"} — ${c.category}${c.size ? ` ${c.size}` : ""}</h2>
    ${!isDevis ? "<p><strong>Envoie le lien de paiement de l'acompte au client.</strong></p>" : ""}
    <table style="border-collapse:collapse;width:100%">
      ${rows.map(([k, v]) => `<tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold">${k}</td><td style="padding:6px;border:1px solid #ddd">${v}</td></tr>`).join("")}
    </table>
    <h3>Description</h3>
    <p style="white-space:pre-wrap">${c.description}</p>
    ${referencePath ? `<p>📎 <a href="${referencePath}">Voir la photo de référence</a></p>` : ""}
  `;

  await resend.emails.send({
    from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
    to: artistEmail,
    subject: `${isDevis ? "📋 Devis" : "🎨 Commission"} — ${c.category}${c.size ? ` ${c.size}` : ""}`,
    html,
  });
}

// Export pour référence externe
export { SCAN_SUPPLEMENT };
