import { NextRequest } from "next/server";

/**
 * Verify cron endpoint authorization.
 * Accepts either:
 * - Vercel Cron: `x-vercel-cron-auth-token` header (auto-sent by Vercel)
 * - Manual: `Authorization: Bearer <CRON_SECRET>` header
 */
export function verifyCronAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  // Vercel Cron sends this header automatically
  const vercelToken = req.headers.get("x-vercel-cron-auth-token");
  if (vercelToken === secret) return true;

  // Manual invocation via Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return false;
}
