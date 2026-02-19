import { Connection, PublicKey } from "@solana/web3.js";

/**
 * NFT-gated premium access.
 *
 * Checks whether a wallet holds at least one NFT from the designated
 * "NFT Pulse Premium" collection.  The collection mint is configured via
 * NEXT_PUBLIC_PREMIUM_COLLECTION env var.
 *
 * Uses Helius DAS `getAssetsByOwner` for efficient lookup (avoids scanning
 * every token account manually).
 */

const HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY ?? ""}`;

const PREMIUM_COLLECTION =
  process.env.NEXT_PUBLIC_PREMIUM_COLLECTION ?? "";

export interface PremiumStatus {
  isPremium: boolean;
  /** Number of qualifying NFTs held */
  nftCount: number;
  /** First qualifying mint (for display) */
  mint?: string;
}

/**
 * Server-side check: does `walletAddress` hold a premium NFT?
 * Uses Helius DAS API (works on free tier).
 */
export async function checkPremiumAccess(
  walletAddress: string
): Promise<PremiumStatus> {
  if (!PREMIUM_COLLECTION) {
    // No collection configured — everyone is free-tier
    return { isPremium: false, nftCount: 0 };
  }

  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "nft-gate",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 1000,
          displayOptions: { showCollectionMetadata: false },
        },
      }),
    });

    const data = await res.json();
    const items: Array<{
      id: string;
      grouping?: Array<{ group_key: string; group_value: string }>;
    }> = data?.result?.items ?? [];

    const matching = items.filter((item) =>
      item.grouping?.some(
        (g) =>
          g.group_key === "collection" &&
          g.group_value === PREMIUM_COLLECTION
      )
    );

    return {
      isPremium: matching.length > 0,
      nftCount: matching.length,
      mint: matching[0]?.id,
    };
  } catch (err) {
    console.error("[nft-gate] Failed to check premium access:", err);
    return { isPremium: false, nftCount: 0 };
  }
}
