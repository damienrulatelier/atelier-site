import fs from "fs";
import path from "path";
import { getProductById, incrementEditionSold } from "./products";

export type EditionReservation = {
  id: string;
  productId: string;
  number: number; // le numéro précis réservé, ex: 4 (sur editionTotal)
  sessionToken: string; // identifiant du panier/session du client, pour libérer sa propre réservation
  reservedAt: string;
  expiresAt: string; // au-delà de cette date, la réservation est considérée comme abandonnée
  confirmed: boolean; // passe à true une fois la commande réellement payée
};

const RESERVATIONS_PATH = path.join(process.cwd(), "data", "edition-reservations.json");
const RESERVATION_DURATION_MS = 20 * 60 * 1000; // 20 minutes : largement assez pour aller au bout d'un paiement

function readReservations(): EditionReservation[] {
  try {
    return JSON.parse(fs.readFileSync(RESERVATIONS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeReservations(reservations: EditionReservation[]) {
  fs.mkdirSync(path.dirname(RESERVATIONS_PATH), { recursive: true });
  fs.writeFileSync(RESERVATIONS_PATH, JSON.stringify(reservations, null, 2));
}

// Retire les réservations expirées et non confirmées — appelée avant toute
// lecture/écriture pour que les numéros abandonnés redeviennent disponibles
// sans qu'il y ait besoin d'une tâche planifiée séparée.
function pruneExpired(reservations: EditionReservation[]): EditionReservation[] {
  const now = Date.now();
  return reservations.filter(
    (r) => r.confirmed || new Date(r.expiresAt).getTime() > now
  );
}

// Réserve le prochain numéro disponible pour un print à édition limitée.
// Retourne null si le produit n'a pas d'édition limitée configurée, ou si
// tous les numéros sont déjà vendus ou réservés par quelqu'un d'autre.
export function reserveNextEditionNumber(
  productId: string,
  sessionToken: string
): EditionReservation | null {
  const product = getProductById(productId);
  if (!product || !product.editionTotal) return null;

  let reservations = pruneExpired(readReservations());

  // Si ce même client (même sessionToken) a déjà une réservation active pour
  // ce produit, on la lui rend telle quelle plutôt que d'en créer une autre.
  const existing = reservations.find(
    (r) => r.productId === productId && r.sessionToken === sessionToken && !r.confirmed
  );
  if (existing) return existing;

  const takenNumbers = new Set(
    reservations.filter((r) => r.productId === productId).map((r) => r.number)
  );
  let nextNumber: number | null = null;
  for (let n = product.editionSold + 1; n <= product.editionTotal; n++) {
    if (!takenNumbers.has(n)) {
      nextNumber = n;
      break;
    }
  }
  if (nextNumber === null) return null; // édition épuisée

  const reservation: EditionReservation = {
    id: "res_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    productId,
    number: nextNumber,
    sessionToken,
    reservedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS).toISOString(),
    confirmed: false,
  };
  reservations.push(reservation);
  writeReservations(reservations);
  return reservation;
}

// Libère explicitement une réservation (ex: le client retire l'article du
// panier, ou ferme l'onglet et le navigateur le signale via sendBeacon).
export function releaseReservation(productId: string, sessionToken: string) {
  const reservations = pruneExpired(readReservations()).filter(
    (r) => !(r.productId === productId && r.sessionToken === sessionToken && !r.confirmed)
  );
  writeReservations(reservations);
}

// Confirme définitivement une réservation au moment du paiement réussi, et
// incrémente le compteur officiel de l'édition.
export function confirmReservation(productId: string, sessionToken: string): number | null {
  const reservations = pruneExpired(readReservations());
  const idx = reservations.findIndex(
    (r) => r.productId === productId && r.sessionToken === sessionToken && !r.confirmed
  );
  if (idx === -1) return null;
  reservations[idx].confirmed = true;
  writeReservations(reservations);
  incrementEditionSold(productId, 1);
  return reservations[idx].number;
}

// Nombre d'exemplaires restants visibles publiquement, en tenant compte des
// réservations actives en plus des ventes déjà confirmées.
export function getRemainingCount(productId: string): number | null {
  const product = getProductById(productId);
  if (!product || !product.editionTotal) return null;
  const activeReservations = pruneExpired(readReservations()).filter(
    (r) => r.productId === productId && !r.confirmed
  ).length;
  return Math.max(product.editionTotal - product.editionSold - activeReservations, 0);
}
