import fs from "fs";
import path from "path";

export type AbandonedCart = {
  id: string;
  email: string;
  items: { title: string; price: number; qty: number }[];
  total: number;
  capturedAt: string;
  reminderSentAt?: string;
  convertedAt?: string; // renseigné une fois la commande finalisée, pour ne pas envoyer l'email
};

const CARTS_PATH = path.join(process.cwd(), "data", "abandoned-carts.json");

function read(): AbandonedCart[] {
  try {
    return JSON.parse(fs.readFileSync(CARTS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function write(carts: AbandonedCart[]) {
  fs.mkdirSync(path.dirname(CARTS_PATH), { recursive: true });
  fs.writeFileSync(CARTS_PATH, JSON.stringify(carts, null, 2));
}

// Enregistre ou met à jour le panier d'un client dès qu'il saisit son email
// sur la page commande, sans attendre qu'il paye.
export function upsertAbandonedCart(
  email: string,
  items: { title: string; price: number; qty: number }[],
  total: number
): string {
  const carts = read();
  const existing = carts.findIndex(
    (c) => c.email.toLowerCase() === email.toLowerCase() && !c.convertedAt
  );
  if (existing !== -1) {
    carts[existing].items = items;
    carts[existing].total = total;
    carts[existing].capturedAt = new Date().toISOString();
    carts[existing].reminderSentAt = undefined;
    write(carts);
    return carts[existing].id;
  }
  const id = "cart_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  carts.push({ id, email, items, total, capturedAt: new Date().toISOString() });
  write(carts);
  return id;
}

// Marque un panier comme converti (commande finalisée) pour ne jamais
// envoyer de relance inutile après un vrai achat.
export function markCartConverted(email: string) {
  const carts = read();
  const now = new Date().toISOString();
  carts.forEach((c) => {
    if (c.email.toLowerCase() === email.toLowerCase() && !c.convertedAt) {
      c.convertedAt = now;
    }
  });
  write(carts);
}

// Retourne les paniers abandonnés depuis plus de 23h et moins de 48h,
// dont la relance n'a pas encore été envoyée.
export function getCartsToRemind(): AbandonedCart[] {
  const now = Date.now();
  const MIN_DELAY = 23 * 60 * 60 * 1000; // 23h min
  const MAX_DELAY = 48 * 60 * 60 * 1000; // 48h max (au-delà on abandonne)
  return read().filter((c) => {
    if (c.convertedAt || c.reminderSentAt) return false;
    const age = now - new Date(c.capturedAt).getTime();
    return age >= MIN_DELAY && age <= MAX_DELAY;
  });
}

export function markReminderSent(id: string) {
  const carts = read();
  const idx = carts.findIndex((c) => c.id === id);
  if (idx !== -1) carts[idx].reminderSentAt = new Date().toISOString();
  write(carts);
}
