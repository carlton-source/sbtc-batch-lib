import { useState, useEffect, useCallback, useRef } from "react";

export interface CoinPriceData {
  price: number;
  change24h: number;
  isLoading: boolean;
  isError: boolean;
  isStale: boolean;
  lastUpdated: Date | null;
}

// Cache keys for localStorage
const CACHE_KEY_PREFIX = 'batchpay_price_cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedPrice {
  price: number;
  change24h: number;
  timestamp: number;
}

// Map of coin IDs to their various API identifiers
const COIN_API_IDS: Record<string, { coingecko: string; coincap: string; binance?: string }> = {
  bitcoin: { coingecko: 'bitcoin', coincap: 'bitcoin', binance: 'BTCUSDT' },
  blockstack: { coingecko: 'blockstack', coincap: 'stacks' }, // STX doesn't have a simple Binance pair
};

function loadCachedPrice(coinId: string): CachedPrice | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + coinId);
    if (!cached) return null;
    const data: CachedPrice = JSON.parse(cached);
    return data;
  } catch {
    return null;
  }
}

function saveCachedPrice(coinId: string, price: number, change24h: number): void {
  try {
    const data: CachedPrice = { price, change24h, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY_PREFIX + coinId, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

// Fetch from CoinGecko (primary)
async function fetchFromCoinGecko(coinId: string, signal: AbortSignal): Promise<{ price: number; change24h: number } | null> {
  try {
    const ids = COIN_API_IDS[coinId];
    if (!ids) return null;
    
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.coingecko}&vs_currencies=usd&include_24hr_change=true`,
      { signal, headers: { 'Accept': 'application/json' } }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const coinData = data[ids.coingecko];
    if (!coinData) return null;
    
    return {
      price: coinData.usd || 0,
      change24h: coinData.usd_24h_change || 0,
    };
  } catch {
    return null;
  }
}

// Fetch from CoinCap (fallback 1)
async function fetchFromCoinCap(coinId: string, signal: AbortSignal): Promise<{ price: number; change24h: number } | null> {
  try {
    const ids = COIN_API_IDS[coinId];
    if (!ids) return null;
    
    const res = await fetch(
      `https://api.coincap.io/v2/assets/${ids.coincap}`,
      { signal, headers: { 'Accept': 'application/json' } }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const coinData = data.data;
    if (!coinData) return null;
    
    return {
      price: parseFloat(coinData.priceUsd) || 0,
      change24h: parseFloat(coinData.changePercent24Hr) || 0,
    };
  } catch {
    return null;
  }
}

// Fetch from Binance (fallback 2 - BTC only)
async function fetchFromBinance(coinId: string, signal: AbortSignal): Promise<{ price: number; change24h: number } | null> {
  try {
    const ids = COIN_API_IDS[coinId];
    if (!ids?.binance) return null;
    
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${ids.binance}`,
      { signal, headers: { 'Accept': 'application/json' } }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    return {
      price: parseFloat(data.lastPrice) || 0,
      change24h: parseFloat(data.priceChangePercent) || 0,
    };
  } catch {
    return null;
  }
}

export function useCoinPrice(coinId: string): CoinPriceData {
  const [state, setState] = useState<CoinPriceData>(() => {
    // Initialize with cached data if available
    const cached = loadCachedPrice(coinId);
    if (cached && cached.price > 0) {
      const isStale = Date.now() - cached.timestamp > CACHE_EXPIRY_MS;
      return {
        price: cached.price,
        change24h: cached.change24h,
        isLoading: true, // Still loading fresh data
        isError: false,
        isStale,
        lastUpdated: new Date(cached.timestamp),
      };
    }
    return {
      price: 0,
      change24h: 0,
      isLoading: true,
      isError: false,
      isStale: false,
      lastUpdated: null,
    };
  });

  const retryCount = useRef(0);
  const maxRetries = 3;

  const fetchPrice = useCallback(async (signal: AbortSignal) => {
    // Try multiple sources in order
    let result = await fetchFromCoinGecko(coinId, signal);
    
    if (!result) {
      result = await fetchFromCoinCap(coinId, signal);
    }
    
    if (!result && COIN_API_IDS[coinId]?.binance) {
      result = await fetchFromBinance(coinId, signal);
    }

    if (result && result.price > 0) {
      retryCount.current = 0;
      saveCachedPrice(coinId, result.price, result.change24h);
      setState({
        price: result.price,
        change24h: result.change24h,
        isLoading: false,
        isError: false,
        isStale: false,
        lastUpdated: new Date(),
      });
      return true;
    }

    return false;
  }, [coinId]);

  useEffect(() => {
    let controller = new AbortController();
    let retryTimeout: ReturnType<typeof setTimeout>;

    async function doFetch() {
      const success = await fetchPrice(controller.signal);
      
      if (!success) {
        // Keep stale data if we have it, mark as error only if no data
        setState((prev) => {
          if (prev.price > 0) {
            // We have stale data, keep showing it
            return { ...prev, isLoading: false, isStale: true };
          }
          // No data at all
          return { ...prev, isLoading: false, isError: true };
        });

        // Retry with exponential backoff
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
          retryTimeout = setTimeout(() => {
            controller.abort();
            controller = new AbortController();
            doFetch();
          }, delay);
        }
      }
    }

    doFetch();

    // Refresh every 60 seconds (less aggressive to avoid rate limits)
    const interval = setInterval(() => {
      controller.abort();
      controller = new AbortController();
      doFetch();
    }, 60_000);

    return () => {
      controller.abort();
      clearInterval(interval);
      clearTimeout(retryTimeout);
    };
  }, [fetchPrice]);

  return state;
}

// Backward-compatible alias
export function useBtcPrice(): CoinPriceData {
  return useCoinPrice("bitcoin");
}
