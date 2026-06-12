import "server-only";

let cachedRate:    number | null = null;
let cacheExpiry:   number        = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getUSDToINR(): Promise<number> {
  if (cachedRate && Date.now() < cacheExpiry) {
    return cachedRate;
  }

  try {
    const res = await fetch(
      "https://query2.finance.yahoo.com/v8/finance/chart/USDINR=X?interval=1d&range=1d",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PortfolioPulseBot/1.0)",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) throw new Error("Exchange rate fetch failed");

    const data = await res.json();
    const rate = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    if (rate && typeof rate === "number") {
      cachedRate  = rate;
      cacheExpiry = Date.now() + CACHE_TTL_MS;
      return rate;
    }

    throw new Error("Invalid exchange rate response");
  } catch {
    // Fallback rate if API fails
    return cachedRate ?? 83.5;
  }
}

export async function convertINRtoUSD(inrAmount: number): Promise<number> {
  const rate = await getUSDToINR();
  return inrAmount / rate;
}

export async function convertUSDtoINR(usdAmount: number): Promise<number> {
  const rate = await getUSDToINR();
  return usdAmount * rate;
}