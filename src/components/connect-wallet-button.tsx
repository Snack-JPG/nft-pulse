"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import type { PremiumStatus } from "@/lib/nft-gate";

/**
 * Wallet connect button + premium badge.
 *
 * When connected, calls /api/premium?wallet=<addr> to check NFT ownership.
 * Shows a ✦ PREMIUM badge if the wallet holds a qualifying NFT.
 */
export function ConnectWalletButton() {
  const { publicKey, connected } = useWallet();
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      setPremium(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/premium?wallet=${publicKey.toBase58()}`)
      .then((r) => r.json())
      .then((data: PremiumStatus) => {
        if (!cancelled) setPremium(data);
      })
      .catch(() => {
        if (!cancelled) setPremium({ isPremium: false, nftCount: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connected, publicKey]);

  return (
    <div className="flex items-center gap-3">
      {connected && premium?.isPremium && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
          ✦ PREMIUM
        </span>
      )}
      {connected && loading && (
        <span className="text-xs text-zinc-500 animate-pulse">Checking…</span>
      )}
      <WalletMultiButton
        style={{
          backgroundColor: "rgb(39 39 42)", // zinc-800
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          height: "2.25rem",
        }}
      />
    </div>
  );
}
