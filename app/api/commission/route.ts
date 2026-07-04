import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "damienrul34@gmail.com";

function isConfigured() {
  return !!RESEND_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error:
          "L'envoi d'email n'est pas encore configuré sur ce site. Renseigne RESEND_API_KEY dans .env.local.",
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { name, email, formula, format, delivery, printCopies, description, images } = body;

  if (!name || !email || !formula || !delivery || !description) {
    return NextResponse.json({ error: "Merci de remplir tous les champs." }, { status: 400 });
  }

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const imageUrls: string[] = Array.isArray(images) ? images : [];

  const formulaLabels: Record<string, string> = {
    souvenir: "Souvenir (25 €) — mise en scène imaginée",
    reproduction: "Reproduction (20 €) — dessin d'observation fidèle",
    surmesure: "Sur mesure — devis à discuter",
  };

  const formatLabels: Record<string, string> = {
    traditionnel: "Traditionnel (carnet A3)",
    digital: "Digital (tablette graphique)",
  };

  const deliveryLabels: Record<string, Record<string, string>> = {
    traditionnel: {
      scan: "Scan numérique par e-mail (l'original reste chez l'artiste)",
      mondialrelay: "Scan par e-mail + original envoyé par Mondial Relay",
      poste: "Scan par e-mail + original envoyé par la Poste",
    },
    digital: {
      scan: "Fichier numérique par e-mail uniquement",
      mondialrelay: "Fichier par e-mail + print imprimé envoyé par Mondial Relay",
      poste: "Fichier par e-mail + print imprimé envoyé par la Poste",
    },
  };

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Commission Atelier <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `Nouvelle demande de commission — ${name}`,
      html: `
        <h2>Nouvelle demande de commission</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>E-mail :</strong> ${email}</p>
        <p><strong>Formule souhaitée :</strong> ${formulaLabels[formula] || formula}</p>
        <p><strong>Format :</strong> ${formatLabels[format] || format || "Non précisé"}</p>
        <p><strong>Mode de réception :</strong> ${
          deliveryLabels[format]?.[delivery] || delivery
        }</p>
        ${
          printCopies && printCopies > 0
            ? `<p><strong>Nombre d'exemplaires imprimés demandés :</strong> ${printCopies}</p>`
            : ""
        }
        <p><strong>Description du projet :</strong></p>
        <p>${String(description).replace(/\n/g, "<br>")}</p>
        ${
          imageUrls.length > 0
            ? `<p><strong>Photo(s) de référence :</strong></p>
               <div>${imageUrls
                 .map(
                   (url) =>
                     `<a href="${origin}${url}"><img src="${origin}${url}" alt="Référence" width="200" style="margin: 4px; border: 1px solid #ddd;" /></a>`
                 )
                 .join("")}</div>`
            : ""
        }
      `,
    });

    if (error) {
      console.error("Erreur Resend:", error);
      return NextResponse.json({ error: "Échec de l'envoi de l'email." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erreur envoi commission:", err);
    return NextResponse.json({ error: "Échec de l'envoi de l'email." }, { status: 500 });
  }
}
