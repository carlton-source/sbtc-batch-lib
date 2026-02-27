import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Zap, Users, ArrowRight } from "lucide-react";
import type { Recipient } from "./RecipientCard";

const SATS_PER_BTC = 100_000_000;
const BTC_PRICE_USD = 65000;

function toSats(amount: string, unit: string): number {
  const n = parseFloat(amount) || 0;
  if (unit === "sats") return n;
  return n * SATS_PER_BTC;
}

interface ConfirmBatchModalProps {
  isOpen: boolean;
  recipients: Recipient[];
  onConfirm: () => void;
  onCancel: () => void;
}

function truncateAddress(addr: string) {
  return addr.length > 20 ? `${addr.slice(0, 10)}...${addr.slice(-6)}` : addr;
}

export function ConfirmBatchModal({ isOpen, recipients, onConfirm, onCancel }: ConfirmBatchModalProps) {
  if (!isOpen) return null;

  const validRecipients = recipients.filter((r) => r.status === "valid");
  const totalSats = validRecipients.reduce((acc, r) => acc + toSats(r.amount, r.unit), 0);
  const totalBTC = totalSats / SATS_PER_BTC;
  const totalUSD = totalBTC * BTC_PRICE_USD;
  const fee = Math.max(500, Math.ceil(totalSats * 0.001));

  const preview = validRecipients.slice(0, 5);
  const remaining = validRecipients.length - preview.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in rounded-2xl border border-border/50 bg-surface-1 shadow-card-dark overflow-hidden">
        {/* Gradient top border */}
        <div className="h-px w-full bg-gradient-to-r from-primary/0 via-primary to-gold/50" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Confirm Batch</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Review before broadcasting</p>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Total amount */}
          <div className="rounded-xl bg-surface-3 p-4 mb-5 text-center border border-border/40">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Amount</p>
            <div className="shimmer-gold text-3xl font-bold font-mono mb-1">
              {totalSats.toLocaleString()} sats
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {totalBTC.toFixed(8)} BTC · {totalUSD.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Recipients", value: String(validRecipients.length), icon: Users },
              { label: "Est. Fee", value: `${fee.toLocaleString()} sats`, icon: Zap },
              { label: "Gas Saved", value: "95%", icon: ArrowRight },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-surface-2 border border-border/30 p-3 text-center">
                <Icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                <div className="font-mono text-sm font-semibold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Recipients preview */}
          <div className="rounded-lg border border-border/40 bg-surface-2 overflow-hidden mb-5">
            <div className="px-3 py-2 border-b border-border/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recipients Preview
            </div>
            <div className="divide-y divide-border/30">
              {preview.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono text-xs text-muted-foreground">{truncateAddress(r.address)}</span>
                  <span className="font-mono text-xs font-medium">{parseFloat(r.amount).toLocaleString()} {r.unit}</span>
                </div>
              ))}
              {remaining > 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  +{remaining} more recipients
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-border/60 hover:bg-surface-3"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 glow-pulse font-semibold"
              onClick={onConfirm}
            >
              Execute Batch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
