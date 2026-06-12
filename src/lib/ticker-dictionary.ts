// Master ticker dictionary for Stage 1 news filtering.
// Maps ticker symbols to arrays of search terms (company names, aliases).
// An article matches if its title or summary contains ANY of these terms.
// Keep terms specific enough to avoid false positives.

export interface TickerEntry {
  symbol:   string;
  name:     string;
  type:     "stock" | "crypto" | "etf" | "mutual_fund";
  exchange: "NSE" | "BSE" | null;
  terms:    string[]; // search terms — all lowercase
}

// ─── Indian Large Cap Stocks (NSE) ───────────────────────────────────────────

export const INDIAN_STOCKS: TickerEntry[] = [
  {
    symbol: "RELIANCE", name: "Reliance Industries", type: "stock",
    exchange: "NSE",
    terms: ["reliance industries", "reliance jio", "mukesh ambani", "ril"],
  },
  {
    symbol: "TCS", name: "Tata Consultancy Services", type: "stock",
    exchange: "NSE",
    terms: ["tata consultancy", "tcs", "tata consulting"],
  },
  {
    symbol: "HDFCBANK", name: "HDFC Bank", type: "stock",
    exchange: "NSE",
    terms: ["hdfc bank", "hdfcbank", "hdfc ltd"],
  },
  {
    symbol: "INFY", name: "Infosys", type: "stock",
    exchange: "NSE",
    terms: ["infosys", "infy", "narayana murthy"],
  },
  {
    symbol: "ICICIBANK", name: "ICICI Bank", type: "stock",
    exchange: "NSE",
    terms: ["icici bank", "icicibank"],
  },
  {
    symbol: "HINDUNILVR", name: "Hindustan Unilever", type: "stock",
    exchange: "NSE",
    terms: ["hindustan unilever", "hul", "unilever india"],
  },
  {
    symbol: "SBIN", name: "State Bank of India", type: "stock",
    exchange: "NSE",
    terms: ["state bank of india", "sbi", "sbin"],
  },
  {
    symbol: "BHARTIARTL", name: "Bharti Airtel", type: "stock",
    exchange: "NSE",
    terms: ["bharti airtel", "airtel", "bharti enterprises"],
  },
  {
    symbol: "ITC", name: "ITC Limited", type: "stock",
    exchange: "NSE",
    terms: ["itc limited", "itc ltd", " itc "],
  },
  {
    symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", type: "stock",
    exchange: "NSE",
    terms: ["kotak mahindra", "kotak bank", "kotakbank"],
  },
  {
    symbol: "LT", name: "Larsen & Toubro", type: "stock",
    exchange: "NSE",
    terms: ["larsen toubro", "l&t", "larsen & toubro"],
  },
  {
    symbol: "AXISBANK", name: "Axis Bank", type: "stock",
    exchange: "NSE",
    terms: ["axis bank", "axisbank"],
  },
  {
    symbol: "ASIANPAINT", name: "Asian Paints", type: "stock",
    exchange: "NSE",
    terms: ["asian paints", "asianpaint"],
  },
  {
    symbol: "MARUTI", name: "Maruti Suzuki", type: "stock",
    exchange: "NSE",
    terms: ["maruti suzuki", "maruti", "suzuki india"],
  },
  {
    symbol: "SUNPHARMA", name: "Sun Pharmaceutical", type: "stock",
    exchange: "NSE",
    terms: ["sun pharma", "sun pharmaceutical"],
  },
  {
    symbol: "TATAMOTORS", name: "Tata Motors", type: "stock",
    exchange: "NSE",
    terms: ["tata motors", "tatamotors", "jaguar land rover", "jlr"],
  },
  {
    symbol: "TATASTEEL", name: "Tata Steel", type: "stock",
    exchange: "NSE",
    terms: ["tata steel", "tatasteel"],
  },
  {
    symbol: "WIPRO", name: "Wipro", type: "stock",
    exchange: "NSE",
    terms: ["wipro"],
  },
  {
    symbol: "HCLTECH", name: "HCL Technologies", type: "stock",
    exchange: "NSE",
    terms: ["hcl tech", "hcltech", "hcl technologies"],
  },
  {
    symbol: "BAJFINANCE", name: "Bajaj Finance", type: "stock",
    exchange: "NSE",
    terms: ["bajaj finance", "bajfinance"],
  },
  {
    symbol: "ADANIENT", name: "Adani Enterprises", type: "stock",
    exchange: "NSE",
    terms: ["adani enterprises", "adani group", "gautam adani"],
  },
  {
    symbol: "ADANIPORTS", name: "Adani Ports", type: "stock",
    exchange: "NSE",
    terms: ["adani ports", "mundra port"],
  },
  {
    symbol: "ULTRACEMCO", name: "UltraTech Cement", type: "stock",
    exchange: "NSE",
    terms: ["ultratech cement", "ultratech"],
  },
  {
    symbol: "NESTLEIND", name: "Nestle India", type: "stock",
    exchange: "NSE",
    terms: ["nestle india", "nestleind", "maggi"],
  },
  {
    symbol: "POWERGRID", name: "Power Grid Corporation", type: "stock",
    exchange: "NSE",
    terms: ["power grid", "powergrid"],
  },
  {
    symbol: "NTPC", name: "NTPC Limited", type: "stock",
    exchange: "NSE",
    terms: ["ntpc"],
  },
  {
    symbol: "ONGC", name: "Oil and Natural Gas", type: "stock",
    exchange: "NSE",
    terms: ["ongc", "oil natural gas"],
  },
  {
    symbol: "JSWSTEEL", name: "JSW Steel", type: "stock",
    exchange: "NSE",
    terms: ["jsw steel", "jswsteel"],
  },
  {
    symbol: "DRREDDY", name: "Dr Reddy's Laboratories", type: "stock",
    exchange: "NSE",
    terms: ["dr reddy", "dr. reddy", "drreddy"],
  },
  {
    symbol: "TECHM", name: "Tech Mahindra", type: "stock",
    exchange: "NSE",
    terms: ["tech mahindra", "techm"],
  },
  {
    symbol: "BAJAJFINSV", name: "Bajaj Finserv", type: "stock",
    exchange: "NSE",
    terms: ["bajaj finserv", "bajajfinsv"],
  },
  {
    symbol: "TITAN", name: "Titan Company", type: "stock",
    exchange: "NSE",
    terms: ["titan company", "titan watches", "tanishq"],
  },
  {
    symbol: "GRASIM", name: "Grasim Industries", type: "stock",
    exchange: "NSE",
    terms: ["grasim"],
  },
  {
    symbol: "INDUSINDBK", name: "IndusInd Bank", type: "stock",
    exchange: "NSE",
    terms: ["indusind bank", "indusindbk"],
  },
  {
    symbol: "ZOMATO", name: "Zomato", type: "stock",
    exchange: "NSE",
    terms: ["zomato"],
  },
  {
    symbol: "PAYTM", name: "One97 Communications (Paytm)", type: "stock",
    exchange: "NSE",
    terms: ["paytm", "one97 communications"],
  },
  {
    symbol: "NYKAA", name: "FSN E-Commerce (Nykaa)", type: "stock",
    exchange: "NSE",
    terms: ["nykaa", "fsn ecommerce"],
  },
  {
    symbol: "DMART", name: "Avenue Supermarts (DMart)", type: "stock",
    exchange: "NSE",
    terms: ["dmart", "avenue supermarts", "d-mart"],
  },
  {
    symbol: "IRCTC", name: "IRCTC", type: "stock",
    exchange: "NSE",
    terms: ["irctc", "indian railway catering"],
  },
  {
    symbol: "HAL", name: "Hindustan Aeronautics", type: "stock",
    exchange: "NSE",
    terms: ["hindustan aeronautics", "hal ltd"],
  },
];

// ─── Crypto ───────────────────────────────────────────────────────────────────

export const CRYPTO_TICKERS: TickerEntry[] = [
  {
    symbol: "BTC", name: "Bitcoin", type: "crypto", exchange: null,
    terms: ["bitcoin", "btc", "satoshi"],
  },
  {
    symbol: "ETH", name: "Ethereum", type: "crypto", exchange: null,
    terms: ["ethereum", "eth", "ether"],
  },
  {
    symbol: "BNB", name: "BNB", type: "crypto", exchange: null,
    terms: ["bnb", "binance coin", "binance smart chain"],
  },
  {
    symbol: "SOL", name: "Solana", type: "crypto", exchange: null,
    terms: ["solana", "sol crypto"],
  },
  {
    symbol: "XRP", name: "XRP", type: "crypto", exchange: null,
    terms: ["xrp", "ripple"],
  },
  {
    symbol: "ADA", name: "Cardano", type: "crypto", exchange: null,
    terms: ["cardano", "ada crypto"],
  },
  {
    symbol: "DOGE", name: "Dogecoin", type: "crypto", exchange: null,
    terms: ["dogecoin", "doge"],
  },
  {
    symbol: "DOT", name: "Polkadot", type: "crypto", exchange: null,
    terms: ["polkadot", "dot crypto"],
  },
  {
    symbol: "MATIC", name: "Polygon", type: "crypto", exchange: null,
    terms: ["polygon", "matic"],
  },
  {
    symbol: "LINK", name: "Chainlink", type: "crypto", exchange: null,
    terms: ["chainlink", "link crypto"],
  },
  {
    symbol: "AVAX", name: "Avalanche", type: "crypto", exchange: null,
    terms: ["avalanche", "avax"],
  },
  {
    symbol: "UNI", name: "Uniswap", type: "crypto", exchange: null,
    terms: ["uniswap", "uni crypto"],
  },
  {
    symbol: "LTC", name: "Litecoin", type: "crypto", exchange: null,
    terms: ["litecoin", "ltc"],
  },
  {
    symbol: "ATOM", name: "Cosmos", type: "crypto", exchange: null,
    terms: ["cosmos", "atom crypto"],
  },
  {
    symbol: "NEAR", name: "NEAR Protocol", type: "crypto", exchange: null,
    terms: ["near protocol", "near crypto"],
  },
];

// ─── Macro / market-wide keywords ────────────────────────────────────────────
// These terms trigger a "macro" category alert affecting ALL holdings.
// Not tied to a specific ticker.

export const MACRO_TERMS = [
  "rbi rate", "repo rate", "interest rate", "rbi policy",
  "monetary policy", "inflation", "gdp", "federal reserve",
  "fed rate", "us recession", "global recession",
  "sebi", "stock market crash", "market crash", "sensex crash",
  "nifty crash", "circuit breaker", "market circuit",
  "budget 2025", "union budget", "india budget",
  "geopolitical", "russia ukraine", "middle east conflict",
  "oil price", "crude oil", "brent crude",
  "dollar index", "usd inr", "rupee falls", "rupee crash",
];

// ─── Combined dictionary ──────────────────────────────────────────────────────

export const ALL_TICKERS: TickerEntry[] = [
  ...INDIAN_STOCKS,
  ...CRYPTO_TICKERS,
];

// ─── Stage 1 filter function ──────────────────────────────────────────────────
// Takes article title + summary, returns matched ticker symbols.
// This runs on every article BEFORE any AI call.
// Must be fast — pure string matching, no async.

export function matchTickersInText(
  text: string,
  userSymbols?: string[] // if provided, only match tickers the user holds
): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();

  const tickersToCheck = userSymbols
    ? ALL_TICKERS.filter((t) => userSymbols.includes(t.symbol))
    : ALL_TICKERS;

  for (const ticker of tickersToCheck) {
    for (const term of ticker.terms) {
      if (lower.includes(term)) {
        matched.add(ticker.symbol);
        break; // found a match for this ticker, no need to check other terms
      }
    }
  }

  return Array.from(matched);
}

// ─── Macro matcher ────────────────────────────────────────────────────────────

export function isMacroEvent(text: string): boolean {
  const lower = text.toLowerCase();
  return MACRO_TERMS.some((term) => lower.includes(term));
}

// ─── Build a user-specific ticker set ────────────────────────────────────────
// Call this once per user when setting up their alert preferences.
// Returns all search terms for symbols the user actually holds.

export function buildUserTickerSet(userSymbols: string[]): Set<string> {
  const terms = new Set<string>();

  for (const ticker of ALL_TICKERS) {
    if (userSymbols.includes(ticker.symbol)) {
      for (const term of ticker.terms) {
        terms.add(term);
      }
    }
  }

  return terms;
}