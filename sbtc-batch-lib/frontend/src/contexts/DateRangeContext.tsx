import React, { createContext, useContext, useState } from "react";
import type { DateRange } from "react-day-picker";

interface DateRangeContextValue {
  sharedDateRange: DateRange | undefined;
  setSharedDateRange: (range: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [sharedDateRange, setSharedDateRangeState] = useState<DateRange | undefined>(() => {
    try {
      const stored = sessionStorage.getItem("batchpay_date_range");
      if (!stored) return undefined;
      const { from, to } = JSON.parse(stored);
      return {
        from: from ? new Date(from) : undefined,
        to:   to   ? new Date(to)   : undefined,
      };
    } catch { return undefined; }
  });

  const setSharedDateRange = (range: DateRange | undefined) => {
    setSharedDateRangeState(range);
    try {
      if (range?.from) {
        sessionStorage.setItem("batchpay_date_range", JSON.stringify({
          from: range.from.toISOString(),
          to:   range.to?.toISOString() ?? null,
        }));
      } else {
        sessionStorage.removeItem("batchpay_date_range");
      }
    } catch { /* noop */ }
  };

  return (
    <DateRangeContext.Provider value={{ sharedDateRange, setSharedDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used inside DateRangeProvider");
  return ctx;
}
