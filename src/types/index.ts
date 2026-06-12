import type { AssetType, AlertSeverity, IndianExchange } from "@/lib/constants";

export type { AssetType, AlertSeverity, IndianExchange };

/** A user's portfolio holding */
export interface Holding {
  id: string;
  userId: string;
  symbol: string; // RELIANCE, BTC, etc.
  name: string; // Reliance Industries Ltd.
  type: AssetType;
  exchange?: IndianExchange; // for stocks
  quantity: number;
  avgBuyPrice: number;
  currency: "INR" | "USD";
  addedAt: number; // ms timestamp
  updatedAt: number;
}

/** Current price snapshot */
export interface PriceSnapshot {
  symbol: string;
  price: number;
  change: number; // absolute change today
  changePercent: number;
  dayHigh?: number;
  dayLow?: number;
  previousClose?: number;
  currency: "INR" | "USD";
  fetchedAt: number;
}

/** A holding enriched with current price data (computed, not stored) */
export interface EnrichedHolding extends Holding {
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

/** User profile */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
  preferences: UserPreferences;
}

export interface UserPreferences {
  baseCurrency: "INR" | "USD";
  alertSeverityThreshold: AlertSeverity;
  emailAlerts: boolean;
  pushAlerts: boolean;
  dailyDigest: boolean;
  digestTime: string; // "09:00" 24h format
}

/** A news/event item after ingestion */
export interface NewsItem {
  id: string;
  source: string; // "MoneyControl", "Reuters", etc.
  sourceUrl: string;
  title: string;
  summary: string;
  publishedAt: number;
  fetchedAt: number;
  category: "stock" | "crypto" | "macro" | "geopolitical" | "reddit";
  tickers: string[]; // detected via stage-1 filter
  processed: boolean;
  imageUrl?: string;
}

/** AI-generated alert tied to a user */
export interface Alert {
  id: string;
  userId: string;
  newsId: string;
  severity: AlertSeverity;
  affectedHoldings: string[]; // holding IDs
  whyItMatters: string; // 1-3 sentence AI explanation
  impactSummary: string;
  confidence: number; // 0-1
  createdAt: number;
  readAt?: number;
  dismissed: boolean;
}