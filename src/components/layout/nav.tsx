"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWalletButton } from "@/components/connect-wallet-button";

const NAV_ITEMS = [
  { href: "/", label: "Trending", icon: "📈" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-white text-lg">
              NFT Pulse
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>

          <ConnectWalletButton />
        </div>
      </div>
    </nav>
  );
}
