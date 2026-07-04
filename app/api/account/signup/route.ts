import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createCustomer } from "@/lib/customers";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name) {
    return NextResponse.json({ error: "Merci de remplir tous les champs." }, { status: 400 });
  }
  if (body.password.length < 6) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 6 caractères." },
      { status: 400 }
    );
  }

  const customer = createCustomer(body.email, body.password, body.name);
  if (!customer) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cette adresse e-mail." },
      { status: 409 }
    );
  }

  const token = await createCustomerSessionToken(customer.email);
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  return NextResponse.json({ ok: true, email: customer.email, name: customer.name });
}
