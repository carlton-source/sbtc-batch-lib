import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Layers, Wallet, Menu, LayoutGrid, Clock, BarChart3,
  CheckCircle2, ChevronDown, Copy, LogOut, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BtcTicker } from "@/components/BtcTicker";
import { StxTicker } from "@/components/StxTicker";
import { TestnetIndicator, TestnetBanner } from "@/components/TestnetBanner";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "App", href: "/app", icon: LayoutGrid },
  { label: "History", href: "/history", icon: Clock },
  { label: "Stats", href: "/stats", icon: BarChart3 },
];

function truncateAddr(addr: string | null | undefined) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export function NavBar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { stxAddress, walletName, disconnect, connectWallet, isConnecting } = useWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected", {
        description: "Connected to Stacks Testnet"
      });
    } catch (error: any) {
      const message = error?.message || '';
      // Check if it's a testnet requirement error
      if (message.includes('testnet') || message.includes('switch')) {
        toast.error("Testnet Required", {
          description: "Please switch your wallet to Testnet mode and try again.",
          duration: 6000,
        });
      } else if (!message.includes('cancel') && !message.includes('Cancel')) {
        toast.error("Connection failed", {
          description: message || "Please try again"
        });
      }
    }
  };

  const handleCopy = () => {
    if (!stxAddress) return;
    navigator.clipboard.writeText(stxAddress);
    toast.success("Address copied");
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
  };

  // --- Connected wallet button (desktop) ---
  const ConnectedButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:border-primary/60 transition-all duration-200 hover:shadow-violet-glow font-mono"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{truncateAddr(stxAddress!)}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="font-mono text-xs text-muted-foreground break-all leading-relaxed">{stxAddress}</p>
          {walletName && (
            <p className="text-xs text-muted-foreground/60 mt-1">via {walletName}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          <Copy className="mr-2 h-3.5 w-3.5" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // --- Disconnected wallet button (desktop) ---
  const DisconnectedButton = (
    <Button
      size="sm"
      className="gap-2 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:border-primary/60 transition-all duration-200 hover:shadow-violet-glow"
      variant="outline"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
      <span className="sm:hidden">{isConnecting ? "..." : "Connect"}</span>
    </Button>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40 group-hover:ring-primary/70 transition-all duration-300 group-hover:shadow-violet-glow">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Batch<span className="text-primary">Pay</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  location.pathname === link.href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side group */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <StxTicker />
              <BtcTicker />
            </div>

            {/* Testnet indicator */}
            <TestnetIndicator className="hidden sm:flex" />

            {stxAddress ? ConnectedButton : DisconnectedButton}

            {/* Mobile Hamburger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background border-r border-border/50">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b border-border/30">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 group w-fit"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">
                      Batch<span className="text-primary">Pay</span>
                    </span>
                  </Link>
                </SheetHeader>

                {/* Nav Links */}
                <nav className="flex flex-col gap-1 px-3 py-4">
                  {navLinks.map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Link
                        to={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200",
                          location.pathname === link.href
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <link.icon className="h-4 w-4 flex-shrink-0" />
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                {/* Prices Section */}
                <div className="border-t border-border/30 px-6 py-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prices</p>
                  <StxTicker />
                  <BtcTicker />
                </div>

                {/* Wallet Section */}
                <div className="mt-auto border-t border-border/30 px-6 py-4">
                  {stxAddress ? (
                    <div className="space-y-2">
                      <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
                        <p className="font-mono text-xs text-primary break-all">{stxAddress}</p>
                        {walletName && (
                          <p className="text-xs text-muted-foreground mt-0.5">via {walletName}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-xs"
                          onClick={() => { handleCopy(); setOpen(false); }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => { handleDisconnect(); setOpen(false); }}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full gap-2 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:border-primary/60 transition-all duration-200"
                      variant="outline"
                      onClick={() => { setOpen(false); handleConnect(); }}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Testnet notification banner */}
      <TestnetBanner />
    </>
  );
}
