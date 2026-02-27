import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { Recipient } from "./RecipientCard";

interface ValidationSummaryProps {
  recipients: Recipient[];
  className?: string;
}

export function ValidationSummary({ recipients, className }: ValidationSummaryProps) {
  const valid = recipients.filter((r) => r.status === "valid").length;
  const invalid = recipients.filter((r) => r.status === "invalid").length;
  const duplicates = recipients.filter((r) => r.status === "duplicate").length;

  if (recipients.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-4 rounded-lg border border-border/40 bg-surface-2 px-4 py-2.5 text-sm", className)}>
      <span className="flex items-center gap-1.5 text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-mono font-medium">{valid}</span>
        <span className="text-muted-foreground">valid</span>
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1.5 text-destructive">
        <XCircle className="h-3.5 w-3.5" />
        <span className="font-mono font-medium">{invalid}</span>
        <span className="text-muted-foreground">invalid</span>
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1.5 text-gold">
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="font-mono font-medium">{duplicates}</span>
        <span className="text-muted-foreground">duplicate{duplicates !== 1 ? "s" : ""}</span>
      </span>
    </div>
  );
}
