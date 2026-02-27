import { useState, useEffect } from "react";

export interface CoinPriceData {
  price: number;
  change24h: number;
  isLoading: boolean;
  isError: boolean;
  lastUpdated: Date | null;
}

export function useCoinPrice(coinId: string): CoinPriceData {
  const [state, setState] = useState<CoinPriceData>({
    price: 0,
    change24h: 0,
    isLoading: true,
    isError: false,
    lastUpdated: null,
  });

  useEffect(() => {
    let controller = new AbortController();

    async function fetchPrice() {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setState({
          price: data[coinId].usd,
          change24h: data[coinId].usd_24h_change,
          isLoading: false,
          isError: false,
          lastUpdated: new Date(),
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState((prev) => ({ ...prev, isLoading: false, isError: true }));
        }
      }
    }

    fetchPrice();

    const interval = setInterval(() => {
      controller.abort();
      controller = new AbortController();
      fetchPrice();
    }, 30_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [coinId]);

  return state;
}

// Backward-compatible alias
export function useBtcPrice(): CoinPriceData {
  return useCoinPrice("bitcoin");
}
