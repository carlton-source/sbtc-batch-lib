import { cn } from "@/lib/utils";
import { Users, Zap, TrendingUp, DollarSign } from "lucide-react";
import type { Recipient } from "./RecipientCard";
import { useBtcPrice } from "@/hooks/useBtcPrice";
import { Skeleton } from "@/components/ui/skeleton";

const SATS_PER_BTC = 100_000_000;

function toSats(amount: string, unit: string): number {
  const n = parseFloat(amount) || 0;
  if (unit === "sats") return n;
  if (unit === "BTC" || unit === "sBTC") return n * SATS_PER_BTC;
  return 0;
}

interface BatchSummaryCardProps {
  recipients: Recipient[];
  className?: string;
}

export function BatchSummaryCard({ recipients, className }: BatchSummaryCardProps) {
  const { price: btcPrice, isLoading: priceLoading } = useBtcPrice();
  const validRecipients = recipients.filter((r) => r.status === "valid");
  const totalSats = recipients.reduce((acc, r) => acc + toSats(r.amount, r.unit), 0);
  const totalBTC = totalSats / SATS_PER_BTC;
  const totalUSD = totalBTC * btcPrice;
  const estimatedFee = Math.max(500, Math.ceil(totalSats * 0.001));
  const gasSavingsPct = 95;

  const stat = (label: string, value: string, sub?: string, icon?: React.ReactNode) => (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-mono font-semibold text-foreground">{value}</div>
      {sub && <div className="font-mono text-xs text-muted-foreground">{sub}</div>}
    </div>
  );

  return (
    <div className={cn("rounded-xl border border-border/50 bg-surface-1 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Batch Summary</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 border border-emerald/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            <Zap className="h-3 w-3" />
            {gasSavingsPct}% Gas Saved
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          {stat(
            "Recipients",
            String(recipients.length),
            `${validRecipients.length} valid`,
            <Users className="h-3 w-3" />
          )}
          {stat(
            "Total Amount",
            totalSats > 0 ? `${totalSats.toLocaleString()} sats` : "—",
            totalBTC > 0 ? `${totalBTC.toFixed(8)} BTC` : undefined,
            <TrendingUp className="h-3 w-3" />
          )}
        </div>

        {totalSats > 0 && (
          <div className="rounded-lg bg-surface-3 px-4 py-3">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              USD Value
            </div>
            {priceLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <div className="font-mono text-lg font-bold shimmer-gold">
                {totalUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </div>
            )}
          </div>
        )}

        {/* Fee estimate */}
        <div className="border-t border-border/40 pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Est. Network Fee</span>
            <span className="font-mono text-muted-foreground">~{estimatedFee.toLocaleString()} sats</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">vs. Individual TXs</span>
            <span className="font-mono text-emerald-400">Save ~{(estimatedFee * 18).toLocaleString()} sats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
