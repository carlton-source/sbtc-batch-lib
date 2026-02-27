import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Bookmark } from "lucide-react";

interface SaveTemplateModalProps {
  isOpen: boolean;
  recipientCount: number;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}

export function SaveTemplateModal({ isOpen, recipientCount, onSave, onCancel }: SaveTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave(name.trim(), description.trim());
    setName("");
    setDescription("");
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canSave) handleSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border/50 bg-surface-1 shadow-card-dark overflow-hidden">
        {/* Gradient top border */}
        <div className="h-px w-full bg-gradient-to-r from-primary/0 via-primary to-gold/50" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20">
                <Bookmark className="h-4 w-4 text-sky-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Save as Template</h2>
                <p className="text-xs text-muted-foreground">Saving {recipientCount} recipient{recipientCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Template name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Q1 Payroll, Community Round 2…"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                onKeyDown={handleKeyDown}
                autoFocus
                className="bg-surface-2 border-border/50 focus-visible:ring-primary/50 text-sm"
              />
              <p className="text-xs text-muted-foreground/60 mt-1 text-right">{name.length}/40</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">
                Description <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <Input
                placeholder="Short note about this template…"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 80))}
                className="bg-surface-2 border-border/50 focus-visible:ring-primary/50 text-sm"
              />
              <p className="text-xs text-muted-foreground/60 mt-1 text-right">{description.length}/80</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-border/60 hover:bg-surface-3"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 font-semibold gap-2"
              onClick={handleSave}
              disabled={!canSave}
            >
              <Bookmark className="h-3.5 w-3.5" />
              Save Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
