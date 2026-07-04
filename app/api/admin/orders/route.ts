import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import { getAllOrders } from "@/lib/customers";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  return NextResponse.json({ orders: getAllOrders() });
}
