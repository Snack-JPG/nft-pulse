import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/nft-gate";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req);
  if (limited) return limited;

  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  const status = await checkPremiumAccess(wallet);
  return NextResponse.json(status, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
