import { NextResponse } from "next/server";
import { getActiveProductsAsync } from "@/lib/products";

export async function GET() {
  const products = await getActiveProductsAsync();
  return NextResponse.json({ products });
}
