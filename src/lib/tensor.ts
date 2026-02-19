const TENSOR_API_URL = "https://api.tensor.so/graphql";

interface TensorCollectionStats {
  slug: string;
  name: string;
  imageUri: string | null;
  floorPrice: string | null; // lamports
  volume24h: string | null;
  volume1h: string | null;
  salesCount24h: number | null;
  numListed: number | null;
  numMints: number | null;
}

interface TensorResponse {
  data?: {
    allCollections?: {
      collections: TensorCollectionStats[];
    };
    collectionStats?: TensorCollectionStats;
  };
  errors?: Array<{ message: string }>;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

function lamportsToSol(lamports: string | null): number {
  if (!lamports) return 0;
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export async function fetchTrendingCollections(
  limit = 50
): Promise<TensorCollectionStats[]> {
  const apiKey = process.env.TENSOR_API_KEY;
  if (!apiKey) throw new Error("TENSOR_API_KEY not set");

  const query = `
    query TrendingCollections($limit: Int) {
      allCollections(sortBy: "volume24h", limit: $limit) {
        collections {
          slug
          name
          imageUri
          floorPrice
          volume24h
          volume1h
          salesCount24h
          numListed
          numMints
        }
      }
    }
  `;

  const res = await fetch(TENSOR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TENSOR-API-KEY": apiKey,
    },
    body: JSON.stringify({ query, variables: { limit } }),
  });

  if (!res.ok) throw new Error(`Tensor API error: ${res.status}`);

  const json = (await res.json()) as TensorResponse;
  if (json.errors) throw new Error(json.errors[0].message);

  return json.data?.allCollections?.collections ?? [];
}

export async function fetchCollectionStats(
  slug: string
): Promise<TensorCollectionStats | null> {
  const apiKey = process.env.TENSOR_API_KEY;
  if (!apiKey) throw new Error("TENSOR_API_KEY not set");

  const query = `
    query CollectionStats($slug: String!) {
      collectionStats(slug: $slug) {
        slug
        name
        imageUri
        floorPrice
        volume24h
        volume1h
        salesCount24h
        numListed
        numMints
      }
    }
  `;

  const res = await fetch(TENSOR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TENSOR-API-KEY": apiKey,
    },
    body: JSON.stringify({ query, variables: { slug } }),
  });

  if (!res.ok) throw new Error(`Tensor API error: ${res.status}`);

  const json = (await res.json()) as TensorResponse;
  return json.data?.collectionStats ?? null;
}

export function normalizeTensorStats(raw: TensorCollectionStats) {
  return {
    id: raw.slug,
    name: raw.name,
    imageUrl: raw.imageUri,
    floorPriceSol: lamportsToSol(raw.floorPrice),
    volume1h: lamportsToSol(raw.volume1h),
    volume24h: lamportsToSol(raw.volume24h),
    salesCount24h: raw.salesCount24h ?? 0,
    listingsCount: raw.numListed ?? 0,
    totalSupply: raw.numMints ?? 0,
  };
}
