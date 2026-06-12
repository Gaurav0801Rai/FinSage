export const APP_NAME = "FinSage";
export const APP_TAGLINE = "AI-powered portfolio intelligence";
export const APP_DESCRIPTION =
  "Monitor your stocks, crypto, and mutual funds. Get AI-powered alerts when news and market events impact your holdings.";

/** Asset types supported by the platform */
export const ASSET_TYPES = ["stock", "crypto", "mutual_fund", "etf"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

/** Indian stock exchanges */
export const INDIAN_EXCHANGES = ["NSE", "BSE"] as const;
export type IndianExchange = (typeof INDIAN_EXCHANGES)[number];

/** Alert severity levels */
export const ALERT_SEVERITIES = ["high", "medium", "low"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

/** Routes — single source of truth, never hardcode paths */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  reset: "/reset",
  dashboard: "/dashboard",
  portfolio: "/portfolio",
  upload: "/portfolio/upload",
  news: "/news",
  alerts: "/alerts",
  watchlist: "/watchlist",
  settings: "/settings",
} as const;