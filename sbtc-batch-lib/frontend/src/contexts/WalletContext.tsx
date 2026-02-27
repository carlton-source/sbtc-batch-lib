import React, { createContext, useContext, useState, useEffect } from "react";

type WalletName = "Leather" | "Xverse";

interface WalletContextValue {
  stxAddress: string | null;
  walletName: WalletName | null;
  isConnecting: boolean;
  connectingWallet: WalletName | null;
  connectAs: (wallet: WalletName) => Promise<void>;
  disconnect: () => void;
}

const FAKE_ADDRESSES: Record<WalletName, string> = {
  Leather: "SP2MXJQJ3A6WFG9HF3CKR1B4NK8VTZ2YPDSF",
  Xverse: "SP3FG7A1KMNQ5TZ9PY8B2JR4HVX6WCDNE5RT4",
};

const STORAGE_KEY = "batchpay_wallet";

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [stxAddress, setStxAddress] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored).stxAddress ?? null;
    } catch {
      return null;
    }
  });

  const [walletName, setWalletName] = useState<WalletName | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored).walletName ?? null;
    } catch {
      return null;
    }
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<WalletName | null>(null);

  const connectAs = async (wallet: WalletName) => {
    setIsConnecting(true);
    setConnectingWallet(wallet);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const address = FAKE_ADDRESSES[wallet];
    setStxAddress(address);
    setWalletName(wallet);
    setIsConnecting(false);
    setConnectingWallet(null);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ stxAddress: address, walletName: wallet }));
    } catch { /* noop */ }
  };

  const disconnect = () => {
    setStxAddress(null);
    setWalletName(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
  };

  return (
    <WalletContext.Provider value={{ stxAddress, walletName, isConnecting, connectingWallet, connectAs, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
