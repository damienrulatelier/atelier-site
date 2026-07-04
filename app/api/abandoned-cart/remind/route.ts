import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCartsToRemind, markReminderSent } from "@/lib/abandoned-carts";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

// Cette route est appelée en interne par le scheduler toutes les heures.
// Elle n'est pas exposée publiquement (pas de lien dans l'interface).
export async function POST() {
  if (!RESEND_API_KEY) return NextResponse.json({ skipped: true });

  const carts = getCartsToRemind();
  if (carts.length === 0) return NextResponse.json({ sent: 0 });

  const resend = new Resend(RESEND_API_KEY);
  let sent = 0;

  for (const cart of carts) {
    const itemsHtml = cart.items
      .map((item) => `<li>${item.qty} × ${item.title} — ${fmt(item.price * item.qty)}</li>`)
      .join("");

    try {
      await resend.emails.send({
        from: "Atelier Damien Rul <onboarding@resend.dev>",
        to: [cart.email],
        subject: "Tu as oublié quelque chose 👀",
        html: `
          <h2>Ton panier t&rsquo;attend</h2>
          <p>Tu avais commencé une commande sur l&rsquo;Atelier Damien Rul mais tu n&rsquo;as
          pas finalisé ton achat. Ton panier est toujours là :</p>
          <ul>${itemsHtml}</ul>
          <p><strong>Total : ${fmt(cart.total)}</strong></p>
          <p>
            <a href="https://damienrulatelier.fr/commande"
               style="display:inline-block;padding:12px 24px;background:#181614;color:white;text-decoration:none;">
              Reprendre ma commande
            </a>
          </p>
          <p style="color:#888;font-size:12px;">
            Si tu as finalement décidé de ne pas commander, pas de souci — tu ne recevras
            plus de rappel de notre part.
          </p>
        `,
      });
      markReminderSent(cart.id);
      sent++;
    } catch {
      // On ne bloque pas les autres envois si l'un échoue.
    }
  }

  return NextResponse.json({ sent });
}
