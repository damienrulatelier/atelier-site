import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "damienrul34@gmail.com";
const PROCESSED_EMAIL_PATH = path.join(process.cwd(), "data", "processed-order-emails.json");

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function isAlreadySent(sessionId: string): boolean {
  try {
    const ids: string[] = JSON.parse(fs.readFileSync(PROCESSED_EMAIL_PATH, "utf-8"));
    return ids.includes(sessionId);
  } catch {
    return false;
  }
}

function markAsSent(sessionId: string) {
  let ids: string[] = [];
  try {
    ids = JSON.parse(fs.readFileSync(PROCESSED_EMAIL_PATH, "utf-8"));
  } catch {
    ids = [];
  }
  ids.push(sessionId);
  if (ids.length > 500) ids = ids.slice(-500);
  if (process.env.SUPABASE_URL) return;
  fs.writeFileSync(PROCESSED_EMAIL_PATH, JSON.stringify(ids));
}

type OrderLine = { title: string; price: number; qty: number; dedication: string };

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    // Pas de clé configurée : on ne bloque jamais l'affichage de la page
    // de confirmation pour autant, on échoue juste silencieusement ici.
    return NextResponse.json({ skipped: true });
  }

  const body = await req.json().catch(() => null);
  if (!body?.sessionId) {
    return NextResponse.json({ error: "sessionId manquant." }, { status: 400 });
  }

  const { sessionId, customerEmail, shippingAddress, lines, shippingLabel, shippingPrice } = body as {
    sessionId: string;
    customerEmail?: string;
    shippingAddress?: { name?: string; line1?: string; line2?: string; postal_code?: string; city?: string; country?: string };
    lines: OrderLine[];
    shippingLabel: string;
    shippingPrice: number;
  };

  // Protection contre les doublons : si la page /merci est rechargée ou
  // revisitée (cache navigateur, retour arrière...), on n'envoie pas deux fois.
  if (isAlreadySent(sessionId)) {
    return NextResponse.json({ alreadySent: true });
  }

  const itemsTotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const total = itemsTotal + (shippingPrice || 0);

  const itemsHtml = lines
    .map(
      (l) =>
        `<li>${l.qty} × ${l.title} — ${fmt(l.price * l.qty)}${
          l.dedication ? `<br><span style="color:#888;">Dédicace : ${l.dedication}</span>` : ""
        }</li>`
    )
    .join("");

  const addressHtml = shippingAddress
    ? `${shippingAddress.name || ""}<br>${shippingAddress.line1 || ""}${
        shippingAddress.line2 ? `<br>${shippingAddress.line2}` : ""
      }<br>${shippingAddress.postal_code || ""} ${shippingAddress.city || ""}<br>${
        shippingAddress.country || ""
      }`
    : "Non renseignée (à vérifier dans Stripe)";

  const isMondialRelay = shippingLabel.toLowerCase().includes("mondial relay");

  try {
    const resend = new Resend(RESEND_API_KEY);

    // E-mail pour l'artiste : tout le détail nécessaire pour préparer l'envoi.
    await resend.emails.send({
      from: "Atelier Damien Rul <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      replyTo: customerEmail,
      subject: `Nouvelle commande — ${fmt(total)}`,
      html: `
        <h2>Nouvelle commande payée</h2>
        <ul>${itemsHtml}</ul>
        <p><strong>Livraison :</strong> ${shippingLabel} (${fmt(shippingPrice || 0)})</p>
        ${
          isMondialRelay
            ? `<p style="color:#B23A24;"><strong>⚠ À faire :</strong> demande au client son point relais préféré par e-mail avant l'envoi.</p>`
            : ""
        }
        <p><strong>Total :</strong> ${fmt(total)}</p>
        <p><strong>E-mail client :</strong> ${customerEmail || "inconnu"}</p>
        <p><strong>Adresse de livraison :</strong><br>${addressHtml}</p>
      `,
    });

    // E-mail pour le client : confirmation simple, sans détail interne.
    if (customerEmail) {
      await resend.emails.send({
        from: "Atelier Damien Rul <onboarding@resend.dev>",
        to: [customerEmail],
        subject: "Confirmation de ta commande — Atelier Damien Rul",
        html: `
          <h2>Merci pour ta commande !</h2>
          <ul>${itemsHtml}</ul>
          <p><strong>Livraison :</strong> ${shippingLabel} (${fmt(shippingPrice || 0)})</p>
          <p><strong>Total payé :</strong> ${fmt(total)}</p>
          ${
            isMondialRelay
              ? `<p>Je te recontacte très vite par e-mail pour connaître le point relais où tu
                 souhaites récupérer ton colis.</p>`
              : ""
          }
          <p>L'atelier prépare ton envoi avec soin — et ta dédicace, s'il y en a une, sera
          dessinée avant l'expédition.</p>
        `,
      });
    }

    markAsSent(sessionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur envoi email commande:", err);
    return NextResponse.json({ error: "Échec de l'envoi." }, { status: 500 });
  }
}
