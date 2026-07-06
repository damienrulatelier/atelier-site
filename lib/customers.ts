import fs from "fs";
import path from "path";
import crypto from "crypto";

export type CustomerAddress = {
  name: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
};

export type Customer = {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  name: string;
  address?: CustomerAddress;
  createdAt: string;
};

export type CustomerOrder = {
  id: string;
  customerEmail: string;
  sessionId: string;
  items: { title: string; price: number; qty: number; dedication?: string }[];
  shippingLabel: string;
  shippingPrice: number;
  total: number;
  status: "paid" | "preparing" | "shipped" | "delivered";
  usedFreeReward?: boolean; // true si cette commande a consommé la récompense fidélité (3e achat)
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const CUSTOMERS_PATH = path.join(DATA_DIR, "customers.json");
const ORDERS_PATH = path.join(DATA_DIR, "customer-orders.json");

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  if (process.env.SUPABASE_URL) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// On utilise PBKDF2 (module natif Node, pas de dépendance externe à
// installer) pour ne jamais stocker un mot de passe en clair : chaque
// compte a son propre "sel" aléatoire, combiné au mot de passe avant hash.
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function getAllCustomers(): Customer[] {
  return readJson<Customer[]>(CUSTOMERS_PATH, []);
}

export function getCustomerByEmail(email: string): Customer | undefined {
  const normalized = email.trim().toLowerCase();
  return getAllCustomers().find((c) => c.email.toLowerCase() === normalized);
}

export function createCustomer(email: string, password: string, name: string): Customer | null {
  if (getCustomerByEmail(email)) return null; // déjà existant

  const salt = generateSalt();
  const customer: Customer = {
    id: "cust_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password, salt),
    passwordSalt: salt,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  const customers = getAllCustomers();
  customers.push(customer);
  writeJson(CUSTOMERS_PATH, customers);
  return customer;
}

export function verifyCustomerPassword(email: string, password: string): Customer | null {
  const customer = getCustomerByEmail(email);
  if (!customer) return null;
  const hash = hashPassword(password, customer.passwordSalt);
  // Comparaison à temps constant pour limiter les attaques par mesure de timing.
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(customer.passwordHash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return customer;
}

export function updateCustomerAddress(email: string, address: CustomerAddress): Customer | null {
  const customers = getAllCustomers();
  const idx = customers.findIndex((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  if (idx === -1) return null;
  customers[idx].address = address;
  writeJson(CUSTOMERS_PATH, customers);
  return customers[idx];
}

export function getOrdersForCustomer(email: string): CustomerOrder[] {
  const orders = readJson<CustomerOrder[]>(ORDERS_PATH, []);
  const normalized = email.trim().toLowerCase();
  return orders
    .filter((o) => o.customerEmail.toLowerCase() === normalized)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function saveCustomerOrder(order: Omit<CustomerOrder, "id">): CustomerOrder {
  const orders = readJson<CustomerOrder[]>(ORDERS_PATH, []);
  const fullOrder: CustomerOrder = {
    ...order,
    id: "ord_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
  };
  orders.push(fullOrder);
  writeJson(ORDERS_PATH, orders);
  return fullOrder;
}

// Évite d'enregistrer deux fois la même commande si la page /merci est
// revisitée (même logique de protection que pour les e-mails et le décompte
// d'édition limitée).
export function orderAlreadySaved(sessionId: string): boolean {
  const orders = readJson<CustomerOrder[]>(ORDERS_PATH, []);
  return orders.some((o) => o.sessionId === sessionId);
}

// --- Fidélité, suivie par adresse e-mail, indépendamment de l'existence
// d'un compte. Tout client qui achète avec la même adresse progresse dans
// le programme, qu'il ait créé un compte ou non.

export type LoyaltyStatus = {
  purchaseCount: number;
  freeRewardUnlocked: boolean; // dès le 3e achat (commandes cumulées, peu importe le panier de chacune)
  freeRewardClaimed: boolean; // une fois la récompense utilisée sur une commande
};

const REWARD_THRESHOLD = 3; // nombre de commandes pour débloquer la pièce gratuite

export function getLoyaltyStatus(email: string): LoyaltyStatus {
  const normalized = email.trim().toLowerCase();
  const orders = readJson<CustomerOrder[]>(ORDERS_PATH, []).filter(
    (o) => o.customerEmail.toLowerCase() === normalized
  );
  const purchaseCount = orders.length;
  const freeRewardClaimed = orders.some((o) => o.usedFreeReward);

  return {
    purchaseCount,
    freeRewardUnlocked: purchaseCount >= REWARD_THRESHOLD && !freeRewardClaimed,
    freeRewardClaimed,
  };
}

export function getOrderById(orderId: string): CustomerOrder | undefined {
  return readJson<CustomerOrder[]>(ORDERS_PATH, []).find((o) => o.id === orderId);
}

export function updateOrderStatus(
  orderId: string,
  status: CustomerOrder["status"]
): CustomerOrder | null {
  const orders = readJson<CustomerOrder[]>(ORDERS_PATH, []);
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  orders[idx].status = status;
  writeJson(ORDERS_PATH, orders);
  return orders[idx];
}

export function getAllOrders(): CustomerOrder[] {
  return readJson<CustomerOrder[]>(ORDERS_PATH, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
