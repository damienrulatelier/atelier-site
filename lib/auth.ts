import { SignJWT, jwtVerify } from "jose";

// Le mot de passe admin et la clé de session sont lus depuis les variables
// d'environnement (fichier .env.local). Ne JAMAIS écrire le vrai mot de
// passe en dur dans le code source.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

function getSecretKey() {
  return new TextEncoder().encode(SESSION_SECRET);
}

export function checkPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_NAME = "atelier_admin_session";

// --- Sessions clients (espace compte, distinct de l'admin) ---

export const CUSTOMER_SESSION_COOKIE_NAME = "atelier_customer_session";

export async function createCustomerSessionToken(email: string): Promise<string> {
  return new SignJWT({ role: "customer", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(getSecretKey());
}

export async function verifyCustomerSessionToken(
  token: string | undefined
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "customer" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}
