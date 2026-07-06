import fs from "fs";
import path from "path";
import crypto from "crypto";

export type Review = {
  id: string;
  reviewToken: string; // token unique inclus dans le lien envoyé par e-mail
  sessionId: string; // lié à la session Stripe de la commande, pour garantir un vrai achat
  productTitle: string; // titre du produit concerné (tel qu'affiché dans la commande)
  customerEmail: string;
  customerName: string;
  rating: number; // 1 à 5
  comment: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  submittedAt?: string;
};

const REVIEWS_PATH = path.join(process.cwd(), "data", "reviews.json");

function readReviews(): Review[] {
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeReviews(reviews: Review[]) {
  if (process.env.SUPABASE_URL) return;
  fs.mkdirSync(path.dirname(REVIEWS_PATH), { recursive: true });
  fs.writeFileSync(REVIEWS_PATH, JSON.stringify(reviews, null, 2));
}

// Crée une "invitation à laisser un avis" pour chaque produit d'une commande
// payée — pas l'avis lui-même, juste le droit d'en laisser un, identifié par
// un jeton unique imprévisible (inclus dans le lien envoyé par e-mail).
export function createReviewInvitations(
  sessionId: string,
  customerEmail: string,
  customerName: string,
  productTitles: string[]
): Review[] {
  const reviews = readReviews();
  const created: Review[] = [];

  for (const title of productTitles) {
    // Évite de créer deux fois une invitation pour le même produit de la même commande.
    const exists = reviews.some((r) => r.sessionId === sessionId && r.productTitle === title);
    if (exists) continue;

    const review: Review = {
      id: "rev_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      reviewToken: crypto.randomBytes(24).toString("hex"),
      sessionId,
      productTitle: title,
      customerEmail,
      customerName,
      rating: 0,
      comment: "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    reviews.push(review);
    created.push(review);
  }

  writeReviews(reviews);
  return created;
}

export function getReviewByToken(token: string): Review | undefined {
  return readReviews().find((r) => r.reviewToken === token);
}

// Le client soumet sa note et son commentaire via le lien reçu par e-mail.
// Le statut passe à "pending" → reste "pending" jusqu'à validation manuelle
// par l'artiste (on ne republie jamais automatiquement).
export function submitReview(token: string, rating: number, comment: string): Review | null {
  const reviews = readReviews();
  const idx = reviews.findIndex((r) => r.reviewToken === token);
  if (idx === -1) return null;
  reviews[idx].rating = Math.min(5, Math.max(1, rating));
  reviews[idx].comment = comment.trim().slice(0, 1000);
  reviews[idx].submittedAt = new Date().toISOString();
  writeReviews(reviews);
  return reviews[idx];
}

export function getAllReviews(): Review[] {
  return readReviews();
}

export function getApprovedReviewsForProduct(productTitle: string): Review[] {
  return readReviews()
    .filter((r) => r.productTitle === productTitle && r.status === "approved" && r.rating > 0)
    .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime());
}

export function moderateReview(id: string, status: "approved" | "rejected"): Review | null {
  const reviews = readReviews();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  reviews[idx].status = status;
  writeReviews(reviews);
  return reviews[idx];
}
