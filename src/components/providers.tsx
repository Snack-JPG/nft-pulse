"use client";

import { FC, ReactNode } from "react";
import { SolanaWalletProvider } from "@/components/wallet-provider";

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
};
