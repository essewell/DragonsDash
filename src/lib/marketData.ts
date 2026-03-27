// ============================================================
// DragonsDash — Market Data Service
// ============================================================
// Fetches quotes from CoinGecko (free, no key) and proxies
// stock data through user-provided API keys.
// All prices labeled with recency and source.
// ============================================================

import type { Quote, CryptoQuote, EconomicIndicator, DataRecency } from "@/types";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Rate limiting for CoinGecko free tier (10-30 calls/min)
let lastCoinGeckoCall = 0;
const COINGECKO_COOLDOWN = 3000; // 3 seconds between calls

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastCoinGeckoCall;
  if (elapsed < COINGECKO_COOLDOWN) {
    await new Promise((r) => setTimeout(r, COINGECKO_COOLDOWN - elapsed));
  }
  lastCoinGeckoCall = Date.now();
  return fetch(url);
}

/**
 * Fetch crypto quotes from CoinGecko (free tier, no API key).
 * Returns price in CAD.
 */
export async function fetchCryptoQuotes(
  ids: string[],
): Promise<CryptoQuote[]> {
  if (ids.length === 0) return [];

  try {
    const response = await rateLimitedFetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids.join(",")}&vs_currencies=cad&include_24hr_change=true`,
    );

    if (!response.ok) {
      console.error("CoinGecko API error:", response.status);
      return [];
    }

    const data = await response.json();
    const now = new Date().toISOString();

    return ids.map((id) => {
      const entry = data[id];
      if (!entry) {
        return {
          id,
          symbol: id.toUpperCase(),
          name: id,
          priceCAD: 0,
          change24h: 0,
          changePercent24h: 0,
          fetchedAt: now,
        };
      }

      return {
        id,
        symbol: id.toUpperCase(),
        name: id,
        priceCAD: entry.cad ?? 0,
        change24h: 0, // CoinGecko free tier doesn't return absolute change
        changePercent24h: entry.cad_24h_change ?? 0,
        fetchedAt: now,
      };
    });
  } catch (error) {
    console.error("CoinGecko fetch error:", error);
    return [];
  }
}

/**
 * Fetch a single crypto quote.
 */
export async function fetchCryptoQuote(id: string): Promise<CryptoQuote | null> {
  const results = await fetchCryptoQuotes([id]);
  return results[0] ?? null;
}

/**
 * Fetch stock quote using user-provided API key.
 * Supports IEX Cloud, Alpha Vantage, or Polygon.io.
 */
export async function fetchStockQuote(
  symbol: string,
  provider: "iex" | "alphavantage" | "polygon",
  apiKey: string,
): Promise<Quote | null> {
  if (!apiKey) return null;

  try {
    let url: string;
    let recency: DataRecency = "delayed_15min";

    switch (provider) {
      case "iex":
        url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${apiKey}`;
        recency = "delayed_15min";
        break;
      case "alphavantage":
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        recency = "delayed_15min";
        break;
      case "polygon":
        url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`;
        recency = "delayed_15min";
        break;
      default:
        return null;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const now = new Date().toISOString();

    // Parse based on provider
    if (provider === "iex") {
      return {
        symbol: data.symbol ?? symbol,
        price: data.latestPrice ?? 0,
        change: data.change ?? 0,
        changePercent: (data.changePercent ?? 0) * 100,
        volume: data.latestVolume ?? 0,
        marketCap: data.marketCap ?? undefined,
        recency,
        fetchedAt: now,
      };
    }

    if (provider === "alphavantage") {
      const quote = data["Global Quote"];
      if (!quote) return null;
      return {
        symbol: quote["01. symbol"] ?? symbol,
        price: parseFloat(quote["05. price"]) || 0,
        change: parseFloat(quote["09. change"]) || 0,
        changePercent:
          parseFloat(quote["10. change percent"]?.replace("%", "")) || 0,
        volume: parseInt(quote["06. volume"]) || 0,
        recency,
        fetchedAt: now,
      };
    }

    if (provider === "polygon") {
      const result = data.results?.[0];
      if (!result) return null;
      return {
        symbol,
        price: result.c ?? 0,
        change: (result.c ?? 0) - (result.o ?? 0),
        changePercent: result.o
          ? (((result.c ?? 0) - result.o) / result.o) * 100
          : 0,
        volume: result.v ?? 0,
        recency,
        fetchedAt: now,
      };
    }

    return null;
  } catch (error) {
    console.error("Stock quote fetch error:", error);
    return null;
  }
}

/**
 * Fetch multiple stock quotes in batch.
 * Returns a map of symbol -> Quote.
 */
export async function fetchStockQuotes(
  symbols: string[],
  provider: "iex" | "alphavantage" | "polygon",
  apiKey: string,
): Promise<Map<string, Quote>> {
  const results = new Map<string, Quote>();

  // Fetch sequentially to respect rate limits
  for (const symbol of symbols) {
    const quote = await fetchStockQuote(symbol, provider, apiKey);
    if (quote) {
      results.set(symbol, quote);
    }
    // Small delay between calls
    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

/**
 * Hardcoded economic indicator data.
 * In production, these would be fetched from official APIs:
 * - Bank of Canada: https://www.bankofcanada.ca/valet/
 * - Statistics Canada: https://www.statcan.gc.ca/
 * - Federal Reserve: https://fred.stlouisfed.org/
 * - BLS: https://www.bls.gov/
 *
 * For the initial build, we use reasonable defaults with clear labeling.
 */
export function getDefaultEconomicIndicators(): EconomicIndicator[] {
  const now = new Date().toISOString();

  return [
    {
      id: "boc-overnight-rate",
      name: "Bank of Canada Overnight Rate",
      value: 0,
      unit: "%",
      source: "Bank of Canada",
      sourceUrl: "https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "fed-funds-rate",
      name: "US Federal Funds Rate",
      value: 0,
      unit: "%",
      source: "Federal Reserve",
      sourceUrl: "https://www.federalreserve.gov/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "cpi-canada",
      name: "Canada CPI YoY",
      value: 0,
      unit: "%",
      source: "Statistics Canada",
      sourceUrl: "https://www.statcan.gc.ca/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "cpi-us",
      name: "US CPI YoY",
      value: 0,
      unit: "%",
      source: "BLS",
      sourceUrl: "https://www.bls.gov/cpi/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "unemployment-canada",
      name: "Canada Unemployment Rate",
      value: 0,
      unit: "%",
      source: "Statistics Canada",
      sourceUrl: "https://www.statcan.gc.ca/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "usdcad",
      name: "USD/CAD Exchange Rate",
      value: 0,
      unit: "",
      source: "Bank of Canada",
      sourceUrl: "https://www.bankofcanada.ca/rates/exchange/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "goc-bond-10y",
      name: "10-Year GoC Bond Yield",
      value: 0,
      unit: "%",
      source: "Bank of Canada",
      sourceUrl: "https://www.bankofcanada.ca/rates/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "us-treasury-10y",
      name: "10-Year US Treasury Yield",
      value: 0,
      unit: "%",
      source: "US Treasury",
      sourceUrl: "https://home.treasury.gov/",
      lastUpdated: now,
      trend90d: [],
    },
    {
      id: "vix",
      name: "VIX",
      value: 0,
      unit: "",
      source: "CBOE (delayed)",
      sourceUrl: "https://www.cboe.com/tradable_products/vix/",
      lastUpdated: now,
      trend90d: [],
    },
  ];
}
