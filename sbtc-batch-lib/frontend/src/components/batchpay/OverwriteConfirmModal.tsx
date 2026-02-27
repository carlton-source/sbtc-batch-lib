import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverwriteConfirmModalProps {
  isOpen: boolean;
  templateName: string;
  currentCount: number;
  incomingCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OverwriteConfirmModal({
  isOpen,
  templateName,
  currentCount,
  incomingCount,
  onConfirm,
  onCancel,
}: OverwriteConfirmModalProps) {
  if (!isOpen) return null;

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
              <h2 className="text-lg font-bold text-foreground">Replace Recipients?</h2>
              <p className="text-sm text-muted-foreground mt-0.5">This action cannot be undone</p>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Template info box */}
          <div className="rounded-xl bg-surface-3 p-4 mb-4 border border-border/40">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Loading template</p>
            <p className="text-sm font-semibold text-foreground">"{templateName}"</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              {incomingCount} recipient{incomingCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-6">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300/90">
              This will remove your{" "}
              <span className="font-semibold">
                {currentCount} current recipient{currentCount !== 1 ? "s" : ""}
              </span>
              . This cannot be undone.
            </p>
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
              variant="destructive"
              className="flex-1 font-semibold"
              onClick={onConfirm}
            >
              Replace
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
