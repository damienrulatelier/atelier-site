const TOKEN_KEY = "atelier_session_token_v1";

// Identifiant anonyme et stable du visiteur, utilisé uniquement pour relier
// une réservation de numéro d'édition à son propriétaire (pour pouvoir la
// libérer si ce même visiteur abandonne, ou la confirmer à son nom au
// paiement). Ce n'est pas un identifiant de compte — un visiteur non
// connecté en a un aussi.
export function getSessionToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = "tok_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return "";
  }
}
