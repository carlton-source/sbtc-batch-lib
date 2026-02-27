import { AlertTriangle, Beaker, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWallet, CURRENT_NETWORK } from "@/contexts/WalletContext";

export function TestnetBanner() {
  const { isTestnet } = useWallet();
  const [dismissed, setDismissed] = useState(false);

  // Only show on testnet
  if (!isTestnet || dismissed) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-500/40">
              <Beaker className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="font-medium text-amber-400">Testnet Mode</span>
          </div>
          <span className="hidden sm:inline text-muted-foreground">•</span>
          <p className="text-muted-foreground text-xs sm:text-sm">
            <span className="hidden sm:inline">
              This app is running on <strong className="text-amber-400/90">Stacks Testnet</strong>. 
              Please connect with a testnet wallet.
            </span>
            <span className="sm:hidden">
              Connect with a <strong className="text-amber-400/90">testnet wallet</strong>
            </span>
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="ml-auto rounded p-1 text-muted-foreground hover:text-foreground hover:bg-amber-500/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline testnet indicator for the navbar or other compact spaces
 */
export function TestnetIndicator({ className }: { className?: string }) {
  const { isTestnet } = useWallet();

  if (!isTestnet) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-amber-500/10 border border-amber-500/30",
        "text-amber-400 text-xs font-medium",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <span>Testnet</span>
    </div>
  );
}

/**
 * Wallet setup instructions for testnet
 */
export function TestnetWalletInstructions({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-amber-500/20 bg-amber-500/5 p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-400">Testnet Wallet Required</h4>
          <p className="text-sm text-muted-foreground">
            This app is running on Stacks Testnet. You need to switch your wallet to testnet mode:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 mt-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
              <span>
                <strong className="text-foreground">Leather:</strong>{" "}
                Settings → Network → Select "Testnet"
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
              <span>
                <strong className="text-foreground">Xverse:</strong>{" "}
                Settings → Network → Select "Testnet"
              </span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground/70 mt-3">
            Get testnet STX from the{" "}
            <a
              href="https://explorer.hiro.so/sandbox/faucet?chain=testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline"
            >
              Stacks Testnet Faucet
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
