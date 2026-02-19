import { z } from "zod/v4";

// Helius enhanced transaction types for NFT sales
const NftEventSchema = z.object({
  seller: z.string(),
  buyer: z.string(),
  amount: z.number(), // in lamports
});

const HeliusNftSaleSchema = z.object({
  signature: z.string(),
  type: z.literal("NFT_SALE"),
  timestamp: z.number(),
  tokenTransfers: z.array(z.object({
    mint: z.string(),
    fromUserAccount: z.string().optional(),
    toUserAccount: z.string().optional(),
  })).optional(),
  events: z.object({
    nft: NftEventSchema.optional(),
  }).optional(),
  nativeTransfers: z.array(z.object({
    amount: z.number(),
    fromUserAccount: z.string(),
    toUserAccount: z.string(),
  })).optional(),
  source: z.string().optional(),
});

const HeliusWebhookPayloadSchema = z.array(HeliusNftSaleSchema);

export type HeliusNftSale = z.infer<typeof HeliusNftSaleSchema>;
export type HeliusWebhookPayload = z.infer<typeof HeliusWebhookPayloadSchema>;

export interface ParsedNftSale {
  signature: string;
  collectionId: string;
  marketplace: string;
  priceSol: number;
  buyer: string;
  seller: string;
  mint: string;
  timestamp: Date;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

function mapSource(source?: string): string {
  if (!source) return "unknown";
  const s = source.toLowerCase();
  if (s.includes("tensor")) return "tensor";
  if (s.includes("magic") || s.includes("magiceden")) return "magic_eden";
  if (s.includes("hadeswap")) return "hadeswap";
  if (s.includes("solanart")) return "solanart";
  return s;
}

export function parseHeliusWebhook(body: unknown): ParsedNftSale[] {
  const result = HeliusWebhookPayloadSchema.safeParse(body);
  if (!result.success) {
    console.error("Failed to parse Helius webhook:", result.error);
    return [];
  }

  return result.data
    .filter((tx) => tx.type === "NFT_SALE")
    .map((tx) => {
      const nft = tx.events?.nft;
      const mint = tx.tokenTransfers?.[0]?.mint ?? "unknown";
      const priceLamports = nft?.amount ?? 0;

      return {
        signature: tx.signature,
        // Collection ID derived from mint — in production, resolve via DAS API
        collectionId: mint,
        marketplace: mapSource(tx.source),
        priceSol: priceLamports / LAMPORTS_PER_SOL,
        buyer: nft?.buyer ?? "unknown",
        seller: nft?.seller ?? "unknown",
        mint,
        timestamp: new Date(tx.timestamp * 1000),
      };
    });
}

export function verifyHeliusWebhook(
  body: string,
  signature: string,
  secret: string
): boolean {
  // Helius uses a simple authorization header check
  return signature === secret;
}

// --- Collection Resolution via Helius DAS API ---

// In-memory cache: mint → collectionId (or null if unresolvable)
const collectionCache = new Map<string, string | null>();

/**
 * Resolve a mint address to its verified collection address using Helius DAS API.
 * Returns the collection address (grouping key), or falls back to the mint itself.
 * Results are cached in memory to avoid repeated API calls for the same mint.
 */
export async function resolveCollectionId(mint: string): Promise<string> {
  if (mint === "unknown") return "unknown";

  const cached = collectionCache.get(mint);
  if (cached !== undefined) return cached ?? mint;

  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) return mint; // No key, can't resolve

  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "resolve-collection",
        method: "getAsset",
        params: { id: mint },
      }),
    });

    if (!res.ok) {
      collectionCache.set(mint, null);
      return mint;
    }

    const json = await res.json() as {
      result?: {
        grouping?: Array<{ group_key: string; group_value: string }>;
      };
    };

    const collection = json.result?.grouping?.find(
      (g) => g.group_key === "collection"
    );

    if (collection?.group_value) {
      collectionCache.set(mint, collection.group_value);
      return collection.group_value;
    }

    collectionCache.set(mint, null);
    return mint;
  } catch (err) {
    console.error(`[helius] Failed to resolve collection for mint ${mint}:`, err);
    collectionCache.set(mint, null);
    return mint;
  }
}
