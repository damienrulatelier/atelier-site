import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import { updateOrderStatus, getOrderById } from "@/lib/customers";
import { createReviewInvitations } from "@/lib/reviews";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.status) {
    return NextResponse.json({ error: "Statut manquant." }, { status: 400 });
  }

  const order = updateOrderStatus(id, body.status);
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  // Dès qu'une commande de print imprimé passe à "Livrée", on crée
  // automatiquement les invitations à laisser un avis pour chaque produit
  // de cette commande, puis on envoie le lien par e-mail au client.
  if (body.status === "delivered") {
    const productTitles = order.items.map((item) => item.title);
    const fullOrder = getOrderById(id);
    if (fullOrder) {
      const newReviews = createReviewInvitations(
        fullOrder.sessionId,
        fullOrder.customerEmail,
        fullOrder.customerEmail.split("@")[0],
        productTitles
      );
      if (newReviews.length > 0) {
        const origin = req.nextUrl.origin;
        await fetch(`${origin}/api/review-invitation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews: newReviews, origin }),
        }).catch(() => {
          // On ne bloque jamais la mise à jour du statut pour autant.
        });
      }
    }
  }

  return NextResponse.json({ order });
}
