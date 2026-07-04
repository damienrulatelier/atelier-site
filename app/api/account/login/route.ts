import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerPassword } from "@/lib/customers";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Merci de remplir tous les champs." }, { status: 400 });
  }

  const customer = verifyCustomerPassword(body.email, body.password);
  if (!customer) {
    return NextResponse.json(
      {
        error:
          "Adresse e-mail ou mot de passe incorrect. Si tu n'as pas encore de compte, tu peux en créer un en quelques secondes juste à côté.",
      },
      { status: 401 }
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
