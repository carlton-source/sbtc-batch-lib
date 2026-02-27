import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

type Status = "confirmed" | "pending" | "failed" | "duplicate" | "valid" | "invalid";

const statusConfig: Record<Status, { label: string; icon: React.ElementType; className: string }> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-emerald/10 text-emerald-400 border-emerald/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-gold/10 text-gold border-gold/30",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  duplicate: {
    label: "Duplicate",
    icon: AlertCircle,
    className: "bg-gold/10 text-gold-300 border-gold/20",
  },
  valid: {
    label: "Valid",
    icon: CheckCircle2,
    className: "bg-emerald/10 text-emerald-400 border-emerald/20",
  },
  invalid: {
    label: "Invalid",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

interface TransactionStatusBadgeProps {
  status: Status;
  className?: string;
}

export function TransactionStatusBadge({ status, className }: TransactionStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
