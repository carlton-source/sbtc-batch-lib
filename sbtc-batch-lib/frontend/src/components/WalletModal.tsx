import { Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWallet, type WalletName } from "@/contexts/WalletContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const wallets = [
  {
    name: "Leather" as WalletName,
    tagline: "Most popular",
    color: "hsl(43 96% 56%)", // amber/gold
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-9 w-9">
        <rect width="40" height="40" rx="10" fill="hsl(43 96% 56%)" />
        <path
          d="M10 28V14a2 2 0 0 1 2-2h10a6 6 0 0 1 0 12H12a2 2 0 0 1-2-2Z"
          fill="white"
          opacity="0.9"
        />
        <rect x="10" y="22" width="18" height="4" rx="2" fill="white" opacity="0.7" />
      </svg>
    ),
  },
  {
    name: "Xverse" as WalletName,
    tagline: "Mobile friendly",
    color: "hsl(25 95% 53%)", // orange
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="h-9 w-9">
        <rect width="40" height="40" rx="10" fill="hsl(25 95% 53%)" />
        <path
          d="M10 12h20L20 22 10 12ZM10 28h20L20 18l-10 10Z"
          fill="white"
          opacity="0.9"
        />
      </svg>
    ),
  },
];

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { connectWallet, isConnecting, connectingWallet, truncateAddress } = useWallet();

  const handleConnect = async (walletName: WalletName) => {
    try {
      await connectWallet(walletName);
      onOpenChange(false);
      toast.success("Wallet connected!", {
        description: "You can now create and execute batch transfers.",
      });
    } catch (error: any) {
      // User cancelled or error
      if (error?.message?.includes('cancelled') || error?.message?.includes('rejected')) {
        toast.info("Connection cancelled");
      } else {
        toast.error("Connection failed", {
          description: error?.message || "Please try again",
        });
      }
    }
  };

  // Also allow connecting without preference (shows wallet selector)
  const handleConnectAny = async () => {
    try {
      await connectWallet();
      onOpenChange(false);
      toast.success("Wallet connected!");
    } catch (error: any) {
      if (!error?.message?.includes('cancelled')) {
        toast.error("Connection failed", {
          description: error?.message || "Please try again",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isConnecting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md border border-border/50 bg-background">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-semibold">Connect a Wallet</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose your preferred Stacks wallet to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {wallets.map((wallet) => {
            const isThisConnecting = connectingWallet === wallet.name;
            const isOtherConnecting = isConnecting && !isThisConnecting;

            return (
              <button
                key={wallet.name}
                onClick={() => handleConnect(wallet.name)}
                disabled={isConnecting}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center",
                  "transition-all duration-200 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1",
                  isOtherConnecting
                    ? "opacity-40 cursor-not-allowed border-border/40 bg-muted/20"
                    : isThisConnecting
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30 cursor-wait"
                    : "border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 hover:ring-2 hover:ring-primary/20 cursor-pointer"
                )}
              >
                <div className="relative">
                  {wallet.icon}
                  {isThisConnecting && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{wallet.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Option to show all available wallets */}
        <button
          onClick={handleConnectAny}
          disabled={isConnecting}
          className={cn(
            "w-full py-2.5 px-4 rounded-lg border border-border/50 text-sm",
            "text-muted-foreground hover:text-foreground hover:bg-muted/30",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isConnecting && !connectingWallet ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </span>
          ) : (
            "Show all wallets"
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground pt-1">
          New to Stacks?{" "}
          <a
            href="https://www.stacks.co/wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
          >
            Get a wallet <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
