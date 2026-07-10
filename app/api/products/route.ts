import { NextResponse } from "next/server";
import { getActiveProductsAsync } from "@/lib/products";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  const products = await getActiveProductsAsync();
  return NextResponse.json({ products }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    }
  });
}
