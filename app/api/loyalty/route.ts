import { NextRequest, NextResponse } from "next/server";
import { getLoyaltyStatus } from "@/lib/customers";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ purchaseCount: 0, freeRewardUnlocked: false, freeRewardClaimed: false });
  }
  return NextResponse.json(getLoyaltyStatus(email));
}
