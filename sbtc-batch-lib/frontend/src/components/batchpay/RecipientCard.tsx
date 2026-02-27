import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TransactionStatusBadge } from "./TransactionStatusBadge";
import { cn } from "@/lib/utils";
import { Copy, Check, Pencil, Trash2 } from "lucide-react";

export interface Recipient {
  id: string;
  address: string;
  amount: string;
  unit: "sats" | "sBTC" | "BTC";
  status: "valid" | "invalid" | "duplicate";
}

interface RecipientCardProps {
  recipient: Recipient;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  animationDelay?: number;
  isMobile?: boolean;
}

function truncateAddress(addr: string, long = false): string {
  const limit = long ? 20 : 16;
  if (addr.length <= limit) return addr;
  return `${addr.slice(0, long ? 10 : 8)}...${addr.slice(-6)}`;
}

const statusBorderClass: Record<Recipient["status"], string> = {
  valid: "border-l-emerald-500/60",
  invalid: "border-l-destructive/60",
  duplicate: "border-l-[hsl(var(--gold)/0.6)]",
};

const statusBgClass: Record<Recipient["status"], string> = {
  valid: "",
  invalid: "bg-destructive/5",
  duplicate: "bg-[hsl(var(--gold)/0.05)]",
};

export function RecipientCard({ recipient, index, onDelete, onEdit, animationDelay = 0 }: RecipientCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(recipient.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLargeAmount = recipient.unit === "sats" && parseFloat(recipient.amount) >= 1_000_000;

  return (
    <div
      className={cn(
        "animate-slide-up flex items-center gap-3 rounded-lg border border-border/40 border-l-[3px] px-4 py-3 hover:border-border/70 hover:bg-surface-3 transition-all duration-200 group",
        statusBorderClass[recipient.status],
        statusBgClass[recipient.status],
        !statusBgClass[recipient.status] && "bg-surface-2"
      )}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "both" }}
    >
      {/* Index */}
      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-surface-4 text-xs font-mono text-muted-foreground">
        {index + 1}
      </span>

      {/* Address */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-foreground truncate hidden sm:inline">{truncateAddress(recipient.address, true)}</span>
          <span className="font-mono text-sm text-foreground truncate sm:hidden">{truncateAddress(recipient.address, false)}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Amount */}
      <span className={cn("font-mono text-sm font-semibold flex-shrink-0", isLargeAmount ? "text-primary" : "text-foreground")}>
        {parseFloat(recipient.amount).toLocaleString()} <span className="text-muted-foreground font-normal">{recipient.unit}</span>
      </span>

      {/* Status */}
      <TransactionStatusBadge status={recipient.status} className="flex-shrink-0" />

      {/* Actions — always visible on mobile, hover-only on sm+ */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={() => onEdit(recipient.id)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(recipient.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

