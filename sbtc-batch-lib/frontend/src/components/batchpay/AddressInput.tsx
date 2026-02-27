import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";

function validateStacksAddress(addr: string): boolean {
  if (!addr) return false;
  // Stacks mainnet: SP (standard principal), SM (multisig principal)
  return /^(SP|SM)[A-Z0-9]{30,}$/.test(addr);
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  shake?: boolean;
  className?: string;
}

export function AddressInput({
  value,
  onChange,
  placeholder = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ...",
  label,
  shake,
  className,
}: AddressInputProps) {
  const [focused, setFocused] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce validation by 300ms
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedValue(value), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  const isValid = debouncedValue.length > 0 && validateStacksAddress(debouncedValue);
  const isInvalid = debouncedValue.length > 5 && !validateStacksAddress(debouncedValue);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text.trim());
    } catch {
      // Clipboard access denied
    }
  }, [onChange]);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            "font-mono text-sm pr-20 transition-all duration-200 bg-surface-2 border-border/60",
            "focus:border-primary/60 focus:ring-primary/20",
            isValid && "border-emerald-500/50 focus:border-emerald-500/70 bg-emerald-950/20",
            isInvalid && "border-destructive/50 focus:border-destructive/70",
            shake && "animate-shake",
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isValid && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {isInvalid && <XCircle className="h-4 w-4 text-destructive" />}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
