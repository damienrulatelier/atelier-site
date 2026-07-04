import fs from "fs";
import path from "path";
import { getProductById } from "./products";
import { Resend } from "resend";

// Un achat dans une édition limitée temporaire.
// Créé au moment du paiement, avant la clôture.
export type LimitedPurchase = {
  id: string;
  productId: string;
  customerEmail: string;
  customerName: string;
  quantity: number; // nombre d'exemplaires achetés dans cette commande
  orderedAt: string; // date du paiement — détermine l'ordre des numéros
  // Numéros définitifs attribués après clôture du compte à rebours.
  // Null tant que l'édition n'est pas clôturée.
  assignedNumbers: number[] | null;
  closureEmailSent: boolean;
};

const PURCHASES_PATH = path.join(process.cwd(), "data", "limited-purchases.json");

function readPurchases(): LimitedPurchase[] {
  try { return JSON.parse(fs.readFileSync(PURCHASES_PATH, "utf-8")); }
  catch { return []; }
}

function writePurchases(p: LimitedPurchase[]) {
  fs.mkdirSync(path.dirname(PURCHASES_PATH), { recursive: true });
  fs.writeFileSync(PURCHASES_PATH, JSON.stringify(p, null, 2));
}

// Enregistre un achat au moment du paiement.
// Retourne l'achat créé.
export function recordLimitedPurchase(
  productId: string,
  customerEmail: string,
  customerName: string,
  quantity: number
): LimitedPurchase {
  const purchases = readPurchases();
  const purchase: LimitedPurchase = {
    id: "lp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    productId,
    customerEmail,
    customerName,
    quantity,
    orderedAt: new Date().toISOString(),
    assignedNumbers: null,
    closureEmailSent: false,
  };
  purchases.push(purchase);
  writePurchases(purchases);
  return purchase;
}

// Nombre d'exemplaires déjà vendus pour ce produit (somme des quantités).
export function getSoldCount(productId: string): number {
  return readPurchases()
    .filter(p => p.productId === productId)
    .reduce((sum, p) => sum + p.quantity, 0);
}

// Nombre d'exemplaires encore disponibles (editionTotal - déjà vendus).
export function getRemainingForLimited(productId: string): number | null {
  const product = getProductById(productId);
  if (!product || !product.editionTotal) return null;
  return Math.max(product.editionTotal - getSoldCount(productId), 0);
}

// Clôture une édition : attribue les numéros définitifs dans l'ordre d'achat,
// puis envoie un email personnalisé à chaque acheteur.
// Appelée automatiquement quand temporaryUntil est dépassé.
export async function closeLimitedEdition(productId: string): Promise<void> {
  const product = getProductById(productId);
  if (!product) return;

  const purchases = readPurchases();
  const forProduct = purchases
    .filter(p => p.productId === productId && p.assignedNumbers === null)
    .sort((a, b) => new Date(a.orderedAt).getTime() - new Date(b.orderedAt).getTime());

  if (forProduct.length === 0) return; // rien à clôturer

  // Attribue les numéros dans l'ordre d'achat.
  // Ex: premier acheteur prend 2 exemplaires → n°1 et n°2.
  // Deuxième acheteur prend 1 exemplaire → n°3. Etc.
  const totalSold = forProduct.reduce((sum, p) => sum + p.quantity, 0);
  let nextNumber = 1;

  for (const purchase of forProduct) {
    const numbers: number[] = [];
    for (let i = 0; i < purchase.quantity; i++) {
      numbers.push(nextNumber++);
    }
    purchase.assignedNumbers = numbers;
  }

  // Sauvegarde les numéros attribués.
  for (const updated of forProduct) {
    const idx = purchases.findIndex(p => p.id === updated.id);
    if (idx !== -1) purchases[idx] = updated;
  }
  writePurchases(purchases);

  // Envoie les emails de clôture.
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  const resend = new Resend(resendKey);
  const artistEmail = process.env.ARTIST_EMAIL || "damienrul34@gmail.com";

  for (const purchase of forProduct) {
    if (purchase.closureEmailSent) continue;

    const nums = purchase.assignedNumbers!;
    const numStr = nums.length === 1
      ? `le n°${nums[0]}`
      : `les n°${nums.slice(0, -1).join(", ")} et ${nums[nums.length - 1]}`;

    const html = `
      <p>Bonjour ${purchase.customerName || ""},</p>
      <p>
        Le tirage limité de <strong>${product.title}</strong> est maintenant clôturé.
      </p>
      <p>
        <strong>${totalSold} exemplaire${totalSold > 1 ? "s" : ""}</strong> ont été vendus au total.
        Votre commande correspond à <strong>${numStr} sur ${totalSold}</strong>.
      </p>
      <p>
        ${nums.length > 1
          ? `Vous possédez donc ${nums.length} exemplaires uniques au monde, numérotés de ${nums[0]} à ${nums[nums.length - 1]} sur ${totalSold}.`
          : `Vous possédez l'exemplaire unique n°${nums[0]} sur ${totalSold} au monde.`
        }
      </p>
      <p>Merci pour votre confiance,<br/>Damien Rul · Atelier</p>
    `;

    try {
      await resend.emails.send({
        from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
        to: purchase.customerEmail,
        subject: `Votre édition numérotée — ${product.title}`,
        html,
      });
      const idx = purchases.findIndex(p => p.id === purchase.id);
      if (idx !== -1) purchases[idx].closureEmailSent = true;
    } catch {
      // L'email sera retenté au prochain cycle du scheduler si closureEmailSent reste false.
    }
  }

  writePurchases(purchases);

  // Notifie aussi l'artiste avec le récapitulatif complet.
  try {
    const recap = forProduct.map(p =>
      `${p.customerName} (${p.customerEmail}) — ${p.quantity} ex. — numéros ${p.assignedNumbers?.join(", ")}`
    ).join("\n");

    await resend.emails.send({
      from: "Damien Rul · Atelier <no-reply@damienrulatelier.fr>",
      to: artistEmail,
      subject: `Clôture édition — ${product.title} — ${totalSold} vente${totalSold > 1 ? "s" : ""}`,
      html: `<pre>${recap}</pre>`,
    });
  } catch { /* silencieux */ }
}

// Vérifie tous les produits temporaires dont le compte à rebours vient de se terminer
// et déclenche la clôture si ce n'est pas déjà fait.
export async function checkAndCloseExpiredEditions(): Promise<void> {
  const { getAllProducts } = await import("./products");
  const products = getAllProducts();
  const now = Date.now();

  for (const p of products) {
    if (!p.temporaryUntil) continue;
    const expired = new Date(p.temporaryUntil).getTime() < now;
    if (!expired) continue;

    // Vérifie s'il reste des achats sans numéros attribués pour ce produit.
    const purchases = readPurchases();
    const pending = purchases.filter(
      lp => lp.productId === p.id && lp.assignedNumbers === null
    );
    if (pending.length === 0) continue;

    await closeLimitedEdition(p.id);
  }
}
