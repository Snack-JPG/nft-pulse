import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { parseHeliusWebhook, verifyHeliusWebhook } from "@/lib/helius";

export async function POST(req: NextRequest) {
  // Verify webhook authenticity
  const authHeader = req.headers.get("authorization") ?? "";
  const secret = process.env.HELIUS_WEBHOOK_SECRET ?? "";

  if (secret && !verifyHeliusWebhook("", authHeader, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const sales = parseHeliusWebhook(body);

    if (sales.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    // Batch insert sales
    await db
      .insert(schema.nftSales)
      .values(
        sales.map((s) => ({
          signature: s.signature,
          collectionId: s.collectionId,
          marketplace: s.marketplace,
          priceSol: s.priceSol.toString(),
          buyer: s.buyer,
          seller: s.seller,
          mint: s.mint,
          timestamp: s.timestamp,
        }))
      )
      .onConflictDoNothing({ target: schema.nftSales.signature });

    return NextResponse.json({ processed: sales.length });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
