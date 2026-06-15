import "server-only";
import { getUSDToINR } from "./exchange-rate";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LivePrice {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  currency: "INR" | "USD";
  source: "yahoo" | "coingecko" | "fallback";
  fetchedAt: number;
}

export type PriceMap = Record<string, LivePrice>;

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Simple object cache. Resets on server restart.
// Good enough for dev and low-traffic production.

interface CacheEntry {
  data: LivePrice;
  expiresAt: number;
}

const priceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCached(symbol: string): LivePrice | null {
  const entry = priceCache.get(symbol);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    priceCache.delete(symbol);
    return null;
  }
  return entry.data;
}

function setCache(symbol: string, data: LivePrice): void {
  priceCache.set(symbol, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ─── CoinGecko ID mapping ─────────────────────────────────────────────────────
// Maps common crypto symbols to their CoinGecko IDs

const COINGECKO_IDS: Record<string, string> = {
  BTC:   "bitcoin",
  ETH:   "ethereum",
  BNB:   "binancecoin",
  SOL:   "solana",
  ADA:   "cardano",
  XRP:   "ripple",
  DOT:   "polkadot",
  DOGE:  "dogecoin",
  AVAX:  "avalanche-2",
  MATIC: "matic-network",
  LINK:  "chainlink",
  LTC:   "litecoin",
  UNI:   "uniswap",
  ATOM:  "cosmos",
  NEAR:  "near",
};

// ─── Yahoo Finance fetcher ────────────────────────────────────────────────────
// Yahoo Finance query2 API — no auth needed, works for NSE/BSE stocks

async function fetchYahooPrice(
  symbol: string,
  exchange: "NSE" | "BSE" | null
): Promise<LivePrice | null> {
  // Build the Yahoo ticker symbol
  // NSE stocks get .NS suffix, BSE get .BO suffix
  let yahooSymbol = symbol;
  if (exchange === "NSE") yahooSymbol = `${symbol}.NS`;
  else if (exchange === "BSE") yahooSymbol = `${symbol}.BO`;

  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;

  try {
    const res = await fetch(url, {
      headers: {
        // Yahoo blocks requests without a user agent
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 0 }, // Always fetch fresh to respect our in-memory 60s cache limit
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) return null;

    const price          = meta.regularMarketPrice ?? 0;
    const previousClose  = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change         = price - previousClose;
    const changePercent  = previousClose > 0
      ? (change / previousClose) * 100
      : 0;

    return {
      symbol,
      price,
      previousClose,
      change,
      changePercent,
      dayHigh: meta.regularMarketDayHigh ?? price,
      dayLow:  meta.regularMarketDayLow  ?? price,
      currency: "INR",
      source: "yahoo",
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

// ─── CoinGecko fetcher ────────────────────────────────────────────────────────
// Fetches multiple crypto prices in one API call (more efficient)

async function fetchCoinGeckoPrices(
  symbols: string[]
): Promise<PriceMap> {
  const ids = symbols
    .map((s) => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean)
    .join(",");

  if (!ids) return {};

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${ids}&vs_currencies=usd,inr` +
    `&include_24hr_change=true` +
    `&include_24hr_vol=true`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!res.ok) return {};

    const data = await res.json();
    const result: PriceMap = {};

    for (const symbol of symbols) {
      const id = COINGECKO_IDS[symbol.toUpperCase()];
      if (!id || !data[id]) continue;

      const coinData      = data[id];
      const price         = coinData.usd ?? 0;
      const changePercent = coinData.usd_24h_change ?? 0;
      const change        = price * (changePercent / 100);
      const previousClose = price - change;

      result[symbol] = {
        symbol,
        price,
        previousClose,
        change,
        changePercent,
        dayHigh: price * 1.02, // CoinGecko simple API doesn't give day high/low
        dayLow:  price * 0.98,
        currency: "USD",
        source: "coingecko",
        fetchedAt: Date.now(),
      };
    }

    return result;
  } catch {
    return {};
  }
}

// ─── Fallback price ───────────────────────────────────────────────────────────
// Returns a zero-change price using the holding's avgBuyPrice
// so the UI doesn't break when a price fetch fails

function makeFallbackPrice(
  symbol: string,
  avgBuyPrice: number,
  currency: "INR" | "USD"
): LivePrice {
  return {
    symbol,
    price: avgBuyPrice,
    previousClose: avgBuyPrice,
    change: 0,
    changePercent: 0,
    dayHigh: avgBuyPrice,
    dayLow: avgBuyPrice,
    currency,
    source: "fallback",
    fetchedAt: Date.now(),
  };
}

// ─── Main export: fetch prices for a list of holdings ─────────────────────────

export interface HoldingInput {
  symbol: string;
  type: "stock" | "crypto" | "mutual_fund" | "etf";
  exchange: "NSE" | "BSE" | null;
  avgBuyPrice: number;
  currency: "INR" | "USD";
}

export async function fetchPrices(
  holdings: HoldingInput[]
): Promise<PriceMap> {
  if (holdings.length === 0) return {};

  const result: PriceMap = {};

  // Separate stocks and crypto
  const stocks = holdings.filter(
    (h) => h.type === "stock" || h.type === "etf" || h.type === "mutual_fund"
  );
  const cryptos = holdings.filter((h) => h.type === "crypto");

  // ── Fetch stock prices ──────────────────────────────────────────────────
  for (const holding of stocks) {
    // Check cache first
    const cached = getCached(holding.symbol);
    if (cached) {
      result[holding.symbol] = cached;
      continue;
    }

    const price = await fetchYahooPrice(holding.symbol, holding.exchange);

    if (price) {
      setCache(holding.symbol, price);
      result[holding.symbol] = price;
    } else {
      // Use fallback so UI doesn't break
      const fallback = makeFallbackPrice(
        holding.symbol,
        holding.avgBuyPrice,
        holding.currency
      );
      result[holding.symbol] = fallback;
    }
  }

  // ── Fetch crypto prices (batch) ─────────────────────────────────────────
  const uncachedCryptos = cryptos.filter((h) => !getCached(h.symbol));
  const cachedCryptos   = cryptos.filter((h) =>  getCached(h.symbol));

  // Add cached crypto to result
  for (const h of cachedCryptos) {
    result[h.symbol] = getCached(h.symbol)!;
  }

  // Fetch uncached crypto in one batch call
  if (uncachedCryptos.length > 0) {
    const cryptoPrices = await fetchCoinGeckoPrices(
      uncachedCryptos.map((h) => h.symbol)
    );

    for (const holding of uncachedCryptos) {
      if (cryptoPrices[holding.symbol]) {
        setCache(holding.symbol, cryptoPrices[holding.symbol]);
        result[holding.symbol] = cryptoPrices[holding.symbol];
      } else {
        // Fallback if CoinGecko doesn't know this symbol
        const fallback = makeFallbackPrice(
          holding.symbol,
          holding.avgBuyPrice,
          holding.currency
        );
        result[holding.symbol] = fallback;
      }
    }
  }

  return result;
}

// ─── Portfolio calculations ───────────────────────────────────────────────────
// These run on the server after prices are fetched.
// We compute everything here so components just receive clean numbers.

export interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  dayPnLPercent: number;
  bestPerformer: { symbol: string; changePercent: number } | null;
  worstPerformer: { symbol: string; changePercent: number } | null;
  allocationByType: Record<string, number>; // e.g. { stock: 72, crypto: 28 }
}

export interface EnrichedHolding {
  id: string;
  symbol: string;
  name: string;
  type: string;
  exchange: string | null;
  quantity: number;
  avgBuyPrice: number;
  currency: "INR" | "USD";
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  priceSource: string;
}

export async function computePortfolioStats(
  holdings: Array<{
    id: string;
    symbol: string;
    name: string;
    type: string;
    exchange: string | null;
    quantity: number;
    avgBuyPrice: number;
    currency: "INR" | "USD";
  }>,
  prices: PriceMap,
  baseCurrency: "INR" | "USD" = "INR"
): Promise<{ stats: PortfolioStats; enrichedHoldings: EnrichedHolding[] }> {
  const usdToInrRate = await getUSDToINR();

  let totalValue    = 0;
  let totalInvested = 0;
  let dayPnL        = 0;

  const enrichedHoldings: EnrichedHolding[] = holdings.map((h) => {
    const price = prices[h.symbol];
    
    // Get native prices and their currencies
    const nativePriceVal = price?.price ?? h.avgBuyPrice;
    const priceCurrency = price?.currency ?? h.currency;

    // 1. Convert currentPrice from priceCurrency to baseCurrency
    let currentPrice = nativePriceVal;
    if (priceCurrency !== baseCurrency) {
      if (baseCurrency === "INR") {
        currentPrice = nativePriceVal * usdToInrRate;
      } else {
        currentPrice = nativePriceVal / usdToInrRate;
      }
    }

    // 2. Convert avgBuyPrice from h.currency to baseCurrency
    let avgBuyPrice = h.avgBuyPrice;
    if (h.currency !== baseCurrency) {
      if (baseCurrency === "INR") {
        avgBuyPrice = h.avgBuyPrice * usdToInrRate;
      } else {
        avgBuyPrice = h.avgBuyPrice / usdToInrRate;
      }
    }

    const marketValue  = currentPrice * h.quantity;
    const invested     = avgBuyPrice * h.quantity;
    const pnl          = marketValue - invested;
    const pnlPercent   = invested > 0 ? (pnl / invested) * 100 : 0;
    
    // 3. Convert dayChange from priceCurrency to baseCurrency
    const nativeDayChange = price?.change ?? 0;
    let dayChangeVal = nativeDayChange;
    if (priceCurrency !== baseCurrency) {
      if (baseCurrency === "INR") {
        dayChangeVal = nativeDayChange * usdToInrRate;
      } else {
        dayChangeVal = nativeDayChange / usdToInrRate;
      }
    }
    const dayChange = dayChangeVal * h.quantity;
    const dayChangePct = price?.changePercent ?? 0;

    totalValue    += marketValue;
    totalInvested += invested;
    dayPnL        += dayChange;

    return {
      id:               h.id,
      symbol:           h.symbol,
      name:             h.name,
      type:             h.type,
      exchange:         h.exchange,
      quantity:         h.quantity,
      avgBuyPrice,
      currency:         baseCurrency, // Align to user's currency preference for layout rendering
      currentPrice,
      marketValue,
      pnl,
      pnlPercent,
      dayChange,
      dayChangePercent: dayChangePct,
      priceSource:      price?.source ?? "fallback",
    };
  });

  const totalPnL        = totalValue - totalInvested;
  const totalPnLPercent = totalInvested > 0
    ? (totalPnL / totalInvested) * 100
    : 0;
  const dayPnLPercent   = totalValue > 0
    ? (dayPnL / (totalValue - dayPnL)) * 100
    : 0;

  // Best and worst performers by day change
  const sorted = [...enrichedHoldings].sort(
    (a, b) => b.dayChangePercent - a.dayChangePercent
  );

  const bestPerformer  = sorted[0]
    ? { symbol: sorted[0].symbol,  changePercent: sorted[0].dayChangePercent }
    : null;
  const worstPerformer = sorted[sorted.length - 1]
    ? {
        symbol:        sorted[sorted.length - 1].symbol,
        changePercent: sorted[sorted.length - 1].dayChangePercent,
      }
    : null;

  // Allocation by type
  const allocationByType: Record<string, number> = {};
  for (const h of enrichedHoldings) {
    const existing = allocationByType[h.type] ?? 0;
    allocationByType[h.type] = existing + h.marketValue;
  }
  // Convert to percentages
  for (const key of Object.keys(allocationByType)) {
    allocationByType[key] = totalValue > 0
      ? (allocationByType[key] / totalValue) * 100
      : 0;
  }

  return {
    stats: {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      dayPnL,
      dayPnLPercent,
      bestPerformer,
      worstPerformer,
      allocationByType,
    },
    enrichedHoldings,
  };
}