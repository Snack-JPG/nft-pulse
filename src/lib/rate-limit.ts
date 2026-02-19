import { NextResponse } from "next/server";

/**
 * Simple in-memory sliding window rate limiter.
 * For production, swap with Upstash Redis (@upstash/ratelimit).
 */

interface WindowEntry {
  timestamps: number[];
}

const windows = new Map<string, WindowEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, entry] of windows) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) windows.delete(key);
  }
}, 300_000);

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export function rateLimit(
  ip: string,
  config: RateLimitConfig = { limit: 60, windowSeconds: 60 }
): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = `${ip}`;

  let entry = windows.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    windows.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);

  if (entry.timestamps.length >= config.limit) {
    return { success: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  return { success: true, remaining: config.limit - entry.timestamps.length };
}

/**
 * Helper: extract IP from request headers (works on Vercel + local dev)
 */
export function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

/**
 * Returns a 429 response if rate limited, or null if OK.
 */
export function checkRateLimit(
  req: Request,
  config?: RateLimitConfig
): NextResponse | null {
  const ip = getIP(req);
  const result = rateLimit(ip, config);

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(config?.windowSeconds ?? 60),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
