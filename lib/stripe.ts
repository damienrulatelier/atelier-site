import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// On évite de planter le build si la clé n'est pas encore renseignée
// (utile pendant le développement, avant d'avoir un vrai compte Stripe connecté).
export const stripe = key ? new Stripe(key) : null;

export function isStripeConfigured(): boolean {
  return !!key;
}
