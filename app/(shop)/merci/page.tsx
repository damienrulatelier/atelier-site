import Link from "next/link";
import fs from "fs";
import path from "path";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { incrementEditionSold, getProductByIdAsync } from "@/lib/products";
import { confirmReservation } from "@/lib/reservations";
import { recordLimitedPurchase } from "@/lib/limited-editions";
import { saveCustomerOrder, orderAlreadySaved } from "@/lib/customers";
import ClearCartOnMount from "../../components/ClearCartOnMount";
export const dynamic = "force-dynamic";
const PROCESSED_PATH = path.join(process.cwd(), "data", "processed-sessions.json");
function isAlreadyProcessed(sessionId: string): boolean {
  try {
    const raw = fs.readFileSync(PROCESSED_PATH, "utf-8");
    const ids: string[] = JSON.parse(raw);
    return ids.includes(sessionId);
  } catch { return false; }
}
function markAsProcessed(sessionId: string) {
  let ids: string[] = [];
  try { ids = JSON.parse(fs.readFileSync(PROCESSED_PATH, "utf-8")); } catch { ids = []; }
  ids.push(sessionId);
  if (ids.length > 500) ids = ids.slice(-500);
  if (process.env.SUPABASE_URL) return;
  fs.writeFileSync(PROCESSED_PATH, JSON.stringify(ids));
}
async function getStripeSessionStatus(sessionId: string | undefined) {
  if (!sessionId || !isStripeConfigured() || !stripe) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["customer_details"] });
    return {
      status: session.payment_status,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email || session.customer_email,
      shippingAddress: session.collected_information?.shipping_details?.address ? {
        name: session.collected_information.shipping_details.name ?? undefined,
        line1: session.collected_information.shipping_details.address.line1 ?? undefined,
        line2: session.collected_information.shipping_details.address.line2 ?? undefined,
        postal_code: session.collected_information.shipping_details.address.postal_code ?? undefined,
        city: session.collected_information.shipping_details.address.city ?? undefined,
        country: session.collected_information.shipping_details.address.country ?? undefined,
      } : undefined,
    };
  } catch { return null; }
}
async function applyEditionDecrement(
  sessionId: string,
  metadata?: Record<string, string> | null,
  customerEmail?: string,
  customerName?: string
) {
  if (!metadata?.items) return;
  if (isAlreadyProcessed(sessionId)) return;
  try {
    const items: { id: string; qty: number }[] = JSON.parse(metadata.items);
    const sessionToken = metadata.sessionToken || "";
    for (const item of items) {
      if (!item.id || item.qty <= 0) continue;
      let confirmedAny = false;
      if (sessionToken) {
        for (let i = 0; i < item.qty; i++) {
          const number = confirmReservation(item.id, sessionToken);
          if (number !== null) confirmedAny = true;
        }
      }
      if (!confirmedAny) { incrementEditionSold(item.id, item.qty); }
      const product = await getProductByIdAsync(item.id);
      if (product?.temporaryUntil && product.editionTotal > 0 && customerEmail) {
        recordLimitedPurchase(item.id, customerEmail, customerName || "", item.qty);
      }
    }
    markAsProcessed(sessionId);
  } catch { /* silencieux */ }
}
async function sendOrderConfirmationEmails(
  sessionId: string,
  origin: string,
  metadata?: Record<string, string> | null,
  customerEmail?: string | null,
  shippingAddress?: Record<string, string | undefined>
) {
  if (!metadata?.orderSummary) {
    console.log("[Merci] Pas d'orderSummary dans metadata");
    return;
  }
  try {
    const lines = JSON.parse(metadata.orderSummary);
    console.log("[Merci] Appel direct sendEmail, email:", customerEmail);
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "damienrul34@gmail.com";
    const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " €";
    const shippingPrice = parseFloat(metadata.shippingPrice || "0");
    const subtotal = lines.reduce((s: number, l: { price: number; qty: number }) => s + l.price * l.qty, 0);
    const total = subtotal + shippingPrice;
    const linesHtml = lines.map((l: { title: string; price: number; qty: number; dedication: string; size?: string }) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">
          <strong>${l.title}</strong>
          ${l.size ? `<br><span style="color:#8C8780;font-size:12px">${l.size}</span>` : ""}
          ${l.dedication ? `<br><em style="font-size:12px">(dédicace : ${l.dedication})</em>` : ""}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${l.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(l.price * l.qty)}</td>
      </tr>`).join("");
    const html = `
      <h2>Nouvelle commande — ${fmt(total)}</h2>
      <p><strong>Client :</strong> ${customerEmail || "inconnu"}</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #181614">Produit</th>
          <th style="text-align:center;padding:8px;border-bottom:2px solid #181614">Qté</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #181614">Prix</th>
        </tr></thead>
        <tbody>${linesHtml}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:8px;text-align:right">Livraison</td><td style="padding:8px;text-align:right">${fmt(shippingPrice)}</td></tr>
          <tr><td colspan="2" style="padding:8px;text-align:right;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">${fmt(total)}</td></tr>
        </tfoot>
      </table>
      <p><strong>Session Stripe :</strong> ${sessionId}</p>
    `;
    await resend.emails.send({
      from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
      to: CONTACT_EMAIL,
      subject: `🛍️ Nouvelle commande — ${fmt(total)}`,
      html,
    });
    if (customerEmail) {
      await resend.emails.send({
        from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
        to: customerEmail,
        subject: "Merci pour ta commande — Damien Rul Atelier",
        html: `
          <h2>Merci pour ta commande !</h2>
          <p>Ta commande a bien été reçue et est en cours de préparation.</p>
          ${linesHtml ? `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:8px">Produit</th><th style="text-align:center;padding:8px">Qté</th><th style="text-align:right;padding:8px">Prix</th></tr></thead><tbody>${linesHtml}</tbody></table>` : ""}
          <p><strong>Total :</strong> ${fmt(total)}</p>
          <p>Je te contacterai dès que ton colis sera expédié.</p>
          <p>— Damien</p>
        `,
      });
    }
    console.log("[Merci] Emails envoyés avec succès");
  } catch (err) {
    console.error("[Merci] Erreur envoi email:", err);
  }
}
function saveOrderToCustomerHistory(
  sessionId: string,
  customerEmail?: string | null,
  metadata?: Record<string, string> | null
) {
  if (!customerEmail || !metadata?.orderSummary) return;
  if (orderAlreadySaved(sessionId)) return;
  try {
    const items = JSON.parse(metadata.orderSummary);
    const shippingPrice = parseFloat(metadata.shippingPrice || "0");
    const total = items.reduce((sum: number, l: { price: number; qty: number }) => sum + l.price * l.qty, 0) + shippingPrice;
    saveCustomerOrder({
      customerEmail,
      sessionId,
      items,
      shippingLabel: metadata.shippingLabel || "Livraison",
      shippingPrice,
      total,
      status: "paid",
      createdAt: new Date().toISOString(),
    });
  } catch { /* silencieux */ }
}
export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const sessionResult = await getStripeSessionStatus(session_id);
  const isConfirmedPaid = sessionResult?.status === "paid";
  if (isConfirmedPaid && session_id) {
    applyEditionDecrement(session_id, sessionResult?.metadata, sessionResult?.customerEmail ?? undefined, sessionResult?.metadata?.customerName);
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;
    await sendOrderConfirmationEmails(session_id, origin, sessionResult?.metadata, sessionResult?.customerEmail, sessionResult?.shippingAddress);
    console.log("[Merci] sessionResult:", JSON.stringify({
      isConfirmedPaid,
      hasMetadata: !!sessionResult?.metadata,
      hasOrderSummary: !!sessionResult?.metadata?.orderSummary,
      customerEmail: sessionResult?.customerEmail,
    }));
    saveOrderToCustomerHistory(session_id, sessionResult?.customerEmail, sessionResult?.metadata);
    if (sessionResult?.customerEmail) {
      const { markCartConverted } = await import("@/lib/abandoned-carts");
      markCartConverted(sessionResult.customerEmail);
    }
  }
  return (
    <main className="max-w-xl mx-auto px-8 py-28 text-center">
      <ClearCartOnMount />
      <div className="text-4xl mb-6 text-[#B23A24]">✓</div>
      <h1 className="font-serif text-3xl text-[#181614] mb-4">Merci pour ta commande</h1>
      <p className="text-[#3A3631] mb-6">
        Un e-mail de confirmation va t&rsquo;être envoyé. L&rsquo;atelier prépare ton envoi avec soin — et ta dédicace, s&rsquo;il y en a une, sera faite avant l&rsquo;expédition.
      </p>
      {session_id && (
        <p className="text-xs text-[#8C8780] mb-10 font-mono">
          {isConfirmedPaid ? "Paiement confirmé par Stripe." : "Vérification du paiement en cours — tu recevras la confirmation par e-mail."}
        </p>
      )}
      <Link href="/" className="inline-flex px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors">
        Retour à la boutique
      </Link>
    </main>
  );
}
