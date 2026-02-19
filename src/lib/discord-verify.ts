import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { checkPremiumAccess } from "./nft-gate";

/**
 * Verify Discord interaction request signature (Ed25519).
 * Used by the /api/discord interactions endpoint.
 */
export async function verifyDiscordRequest(
  body: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error("DISCORD_PUBLIC_KEY not set");
    return false;
  }

  try {
    const keyBytes = Buffer.from(publicKey, "hex");
    const sigBytes = Buffer.from(signature, "hex");
    const msgBytes = Buffer.from(timestamp + body);

    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    return await crypto.subtle.verify("Ed25519", key, sigBytes, msgBytes);
  } catch {
    return false;
  }
}

/**
 * NFT-gated Discord role verification.
 *
 * Flow:
 * 1. User connects wallet on the dashboard and signs a message
 * 2. Frontend calls /api/discord/verify with wallet + Discord user ID
 * 3. We check NFT ownership via Helius DAS
 * 4. If they hold a qualifying NFT, grant the premium role
 *
 * The premium role gives access to #alpha and other gated channels.
 */
export async function verifyAndGrantRole(
  walletAddress: string,
  discordUserId: string
): Promise<{ granted: boolean; reason: string }> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_ROLE_PREMIUM;
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !roleId || !token) {
    return { granted: false, reason: "Discord verification not configured" };
  }

  // Check NFT ownership
  const status = await checkPremiumAccess(walletAddress);

  if (!status.isPremium) {
    return {
      granted: false,
      reason: "No qualifying NFT found in this wallet",
    };
  }

  // Grant the premium role
  try {
    const rest = new REST({ version: "10" }).setToken(token);

    await rest.put(
      Routes.guildMemberRole(guildId, discordUserId, roleId)
    );

    return {
      granted: true,
      reason: `Verified! Found ${status.nftCount} qualifying NFT(s). Premium role granted.`,
    };
  } catch (err) {
    console.error("Failed to grant Discord role:", err);
    return { granted: false, reason: "Failed to grant role. Bot may lack permissions." };
  }
}

/**
 * Revoke the premium role (e.g., if NFT is transferred).
 */
export async function revokeRole(
  discordUserId: string
): Promise<boolean> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_ROLE_PREMIUM;
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !roleId || !token) return false;

  try {
    const rest = new REST({ version: "10" }).setToken(token);
    await rest.delete(
      Routes.guildMemberRole(guildId, discordUserId, roleId)
    );
    return true;
  } catch (err) {
    console.error("Failed to revoke Discord role:", err);
    return false;
  }
}
