// Types used specifically during the portfolio upload / OCR flow.
// After holdings are saved to Firestore, the main Holding type
// from src/types/index.ts takes over.

export interface ExtractedHolding {
  id: string;           // temporary ID for the review table UI
  symbol: string;       // e.g. "RELIANCE"
  name: string;         // e.g. "Reliance Industries Ltd"
  quantity: number;     // e.g. 10
  avgBuyPrice: number;  // e.g. 2450.50
  type: "stock" | "crypto" | "mutual_fund" | "etf";
  exchange: "NSE" | "BSE" | null;
  currency: "INR" | "USD";
  confidence?: number;  // 0-1, how confident Gemini is (optional)
}

export interface SaveHoldingsResult {
  success: boolean;
  count?: number;
  error?: string;
}