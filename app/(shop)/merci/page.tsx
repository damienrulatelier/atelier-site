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
  } catch {
    return false;
  }
}

function markAsProcessed(sessionId: string) {
  let ids: string[] = [];
  try {
    ids = JSON.parse(fs.readFileSync(PROCESSED_PATH, "utf-8"));
  } catch {
    ids = [];
  }
  ids.push(sessionId);
  // On ne garde que les 500 dernières sessions pour ne pas faire grossir le fichier indéfiniment.
  if (ids.length > 500) ids = ids.slice(-500);
  fs.writeFileSync(PROCESSED_PATH, JSON.stringify(ids));
}

async function getStripeSessionStatus(sessionId: string | undefined) {
  if (!sessionId || !isStripeConfigured() || !stripe) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer_details"],
    });
    return {
      status: session.payment_status,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email || session.customer_email,
      shippingAddress: session.collected_information?.shipping_details?.address
        ? {
            name: session.collected_information.shipping_details.name ?? undefined,
            line1: session.collected_information.shipping_details.address.line1 ?? undefined,
            line2: session.collected_information.shipping_details.address.line2 ?? undefined,
            postal_code:
              session.collected_information.shipping_details.address.postal_code ?? undefined,
            city: session.collected_information.shipping_details.address.city ?? undefined,
            country: session.collected_information.shipping_details.address.country ?? undefined,
          }
        : undefined,
    };
  } catch {
    return null;
  }
}

// Confirme définitivement le ou les numéros d'édition réservés par ce
// visiteur pendant sa navigation (système de réservation, voir
// lib/reservations.ts), pour les produits à édition limitée. Pour les
// produits sans système de réservation actif côté client (anciens flux,
// ou hors prints numérotés), on retombe sur l'ancien décompte direct.
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
      if (!confirmedAny) {
        incrementEditionSold(item.id, item.qty);
      }

      // Si c'est un tirage limité temporaire, on enregistre l'achat
      // pour l'attribution des numéros définitifs à la clôture.
      const product = await getProductByIdAsync(item.id);
      if (product?.temporaryUntil && product.editionTotal > 0 && customerEmail) {
        recordLimitedPurchase(item.id, customerEmail, customerName || "", item.qty);
      }
    }
    markAsProcessed(sessionId);
  } catch {
    // Si le JSON est invalide, on ne bloque pas l'affichage de la page pour autant.
  }
}

// Construit et envoie les e-mails de confirmation (client + artiste) en
// appelant notre propre route API, à partir des métadonnées de la session.
async function sendOrderConfirmationEmails(
  sessionId: string,
  origin: string,
  metadata?: Record<string, string> | null,
  customerEmail?: string | null,
  shippingAddress?: Record<string, string | undefined>
) {
  if (!metadata?.orderSummary) return;
  try {
    const lines = JSON.parse(metadata.orderSummary);
    await fetch(`${origin}/api/order-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        customerEmail,
        shippingAddress,
        lines,
        shippingLabel: metadata.shippingLabel || "Livraison",
        shippingPrice: parseFloat(metadata.shippingPrice || "0"),
      }),
    });
  } catch {
    // On ne bloque jamais l'affichage de la page de confirmation pour autant.
  }
}

// Enregistre la commande dans l'historique du compte client, si l'acheteur
// a un compte associé à cette adresse e-mail. Si aucun compte n'existe pour
// cet e-mail, la commande n'est simplement pas rattachée à un historique —
// ce n'est pas bloquant, l'achat a déjà bien eu lieu et l'e-mail confirme tout.
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
    const total = items.reduce(
      (sum: number, l: { price: number; qty: number }) => sum + l.price * l.qty,
      0
    ) + shippingPrice;
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
  } catch {
    // Si le JSON est invalide, on ne bloque pas l'affichage de la page pour autant.
  }
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
    applyEditionDecrement(
      session_id,
      sessionResult?.metadata,
      sessionResult?.customerEmail ?? undefined,
      sessionResult?.metadata?.customerName
    );

    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    await sendOrderConfirmationEmails(
      session_id,
      origin,
      sessionResult?.metadata,
      sessionResult?.customerEmail,
      sessionResult?.shippingAddress
    );

    saveOrderToCustomerHistory(session_id, sessionResult?.customerEmail, sessionResult?.metadata);

    // Marque le panier abandonné de ce client comme converti, pour ne
    // jamais lui envoyer une relance après un achat déjà finalisé.
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
        Un e-mail de confirmation va t&rsquo;être envoyé. L&rsquo;atelier prépare ton envoi avec
        soin — et ta dédicace, s&rsquo;il y en a une, sera faite avant l&rsquo;expédition.
      </p>
      {session_id && (
        <p className="text-xs text-[#8C8780] mb-10 font-mono">
          {isConfirmedPaid
            ? "Paiement confirmé par Stripe."
            : "Vérification du paiement en cours — tu recevras la confirmation par e-mail."}
        </p>
      )}
      <Link
        href="/"
        className="inline-flex px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors"
      >
        Retour à la boutique
      </Link>
    </main>
  );
}
