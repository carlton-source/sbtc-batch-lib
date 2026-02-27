import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useBtcPrice } from "@/hooks/useBtcPrice";

type Unit = "sats" | "sBTC" | "BTC";

const SATS_PER_BTC = 100_000_000;

function toSats(amount: number, unit: Unit): number {
  if (unit === "sats") return amount;
  if (unit === "BTC") return amount * SATS_PER_BTC;
  if (unit === "sBTC") return amount * SATS_PER_BTC;
  return 0;
}

function satsToUsd(sats: number, btcPrice: number): string {
  const btc = sats / SATS_PER_BTC;
  return (btc * btcPrice).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

interface AmountInputProps {
  value: string;
  unit: Unit;
  onChange: (value: string) => void;
  onUnitChange: (unit: Unit) => void;
  label?: string;
  maxBalance?: number;
  className?: string;
}

export function AmountInput({ value, unit, onChange, onUnitChange, label, maxBalance, className }: AmountInputProps) {
  const [unitOpen, setUnitOpen] = useState(false);
  const { price: btcPrice } = useBtcPrice();
  const units: Unit[] = ["sats", "sBTC", "BTC"];

  const numVal = parseFloat(value) || 0;
  const sats = toSats(numVal, unit);
  const usdVal = sats > 0 ? satsToUsd(sats, btcPrice) : null;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </Label>
      )}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            min="0"
            className="font-mono text-lg font-semibold bg-surface-2 border-border/60 focus:border-primary/60 focus:ring-primary/20"
          />
        </div>

        {maxBalance !== undefined && (
          <button
            type="button"
            onClick={() => onChange(String(maxBalance))}
            className="flex-shrink-0 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors px-1 py-0.5 rounded hover:bg-violet-400/10"
          >
            MAX
          </button>
        )}

        {/* Unit selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUnitOpen(!unitOpen)}
            className="flex items-center gap-1.5 h-10 px-3 rounded-md border border-border/60 bg-surface-2 hover:bg-surface-3 text-sm font-mono font-medium transition-colors"
          >
            {unit}
            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", unitOpen && "rotate-180")} />
          </button>
          {unitOpen && (
            <div className="absolute top-full right-0 mt-1 z-10 rounded-md border border-border/60 bg-surface-3 shadow-card-dark overflow-hidden min-w-[80px]">
              {units.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { onUnitChange(u); setUnitOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm font-mono hover:bg-surface-4 transition-colors",
                    u === unit && "text-primary bg-primary/10"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {usdVal && (
        <p className="text-xs text-muted-foreground font-mono">
          ≈ {usdVal} · {sats.toLocaleString()} sats
        </p>
      )}
    </div>
  );
}
