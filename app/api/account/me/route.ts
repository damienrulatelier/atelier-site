import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/auth";
import { getCustomerByEmail, getOrdersForCustomer } from "@/lib/customers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const email = await verifyCustomerSessionToken(token);

  if (!email) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const customer = getCustomerByEmail(email);
  if (!customer) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  const orders = getOrdersForCustomer(email);

  return NextResponse.json({
    email: customer.email,
    name: customer.name,
    address: customer.address || null,
    orders,
  });
}
