import { TrendingUp, TrendingDown } from "lucide-react";
import { useBtcPrice } from "@/hooks/useBtcPrice";
import { cn } from "@/lib/utils";

export function BtcTicker() {
  const { price, change24h, isLoading, isError, isStale } = useBtcPrice();

  const isPositive = change24h >= 0;
  const hasData = price > 0;

  if (isLoading && !hasData) {
    return (
      <div className="rounded-lg border border-border/50 bg-surface-2/50 px-3 py-1.5">
        <div className="h-4 w-28 animate-pulse rounded bg-surface-3" />
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 rounded-lg border border-border/50 bg-surface-2/50 px-3 py-1.5"
      title={isStale ? "Price may be outdated" : undefined}
    >
      {/* Live dot */}
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full flex-shrink-0",
          isError && !hasData ? "bg-muted" : 
          isStale ? "bg-amber-500" : 
          "bg-emerald animate-pulse"
        )}
      />

      {/* Label */}
      <span className="text-xs font-medium tracking-wide text-muted-foreground">
        BTC
      </span>

      {/* Price */}
      {hasData && (
        <>
          <span
            className={cn(
              "font-mono text-xs font-semibold",
              isStale ? "text-muted-foreground" : "text-foreground"
            )}
          >
            ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>

          {/* Change */}
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isStale
                ? "text-muted-foreground"
                : isPositive
                ? "text-emerald"
                : "text-destructive"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(change24h).toFixed(2)}%
          </span>
        </>
      )}

      {/* Error state with no data at all */}
      {isError && !hasData && (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}
