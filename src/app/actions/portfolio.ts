"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUser } from "@/lib/firebase/session";
import { FieldValue } from "firebase-admin/firestore";
import type { ExtractedHolding, SaveHoldingsResult } from "@/types/portfolio";
import { callGemini } from "@/lib/gemini";

// ─── Gemini API direct fetch ──────────────────────────────────────────────────
// We call the REST API directly instead of using the SDK because the SDK
// version we have forces v1beta which has broken quota for some models.
// Direct fetch lets us use /v1/ explicitly which has proper free tier limits.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

// Models tried in order. If one is rate-limited or missing, next one is tried.
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
];

async function callGeminiVision(
  base64Image: string,
  mimeType: string
): Promise<string> {
  let lastError = "";

  for (const model of MODELS_TO_TRY) {
    try {
      const data = await callGemini(
        `models/${model}:generateContent`,
        {
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
                { text: OCR_PROMPT },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        },
        "v1"
      );

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        lastError = `${model}: empty response`;
        continue;
      }

      console.log(`✓ Gemini responded using model: ${model} (via key rotation)`);
      return text;

    } catch (err: any) {
      lastError = `${model}: ${err.message || String(err)}`;
      continue;
    }
  }

  throw new Error(`All Gemini models/keys failed. Last error: ${lastError}`);
}

// ─── OCR Prompt ───────────────────────────────────────────────────────────────
// Written very specifically so Gemini returns clean parseable JSON every time.
const OCR_PROMPT = `
You are a financial data extraction assistant.

Analyse this portfolio screenshot and extract all stock, crypto, mutual fund,
or ETF holdings visible in the image.

Return ONLY a valid JSON array. No explanation, no markdown, no code blocks.
Just the raw JSON array.

Each item in the array must have exactly these fields:
{
  "symbol": "TICKER_SYMBOL_IN_UPPERCASE",
  "name": "Full company or asset name",
  "quantity": number_of_units_as_a_number,
  "avgBuyPrice": average_buy_price_as_a_number,
  "type": "stock" or "crypto" or "mutual_fund" or "etf",
  "exchange": "NSE" or "BSE" or null,
  "currency": "INR" or "USD"
}

Rules:
- symbol must be uppercase letters only, no spaces
  (e.g. RELIANCE, HDFCBANK, BTC, INFY)
- For Indian stocks set exchange to "NSE" or "BSE".
  If unsure, default to "NSE".
- For crypto set exchange to null and currency to "USD"
  unless clearly shown in INR.
- quantity must be a plain number not a string (e.g. 10 not "10")
- avgBuyPrice must be a plain number with no currency symbols or commas
  (e.g. 2450.50 not "2,450.50" and not "Rs2450")
- Indian lakh format: 1,50,000 means 150000. Convert correctly.
- If you cannot read a value clearly, make your best reasonable estimate.
- If the image does not show a portfolio, return an empty array: []
- Remove any duplicate entries for the same symbol.

Example output:
[
  {
    "symbol": "RELIANCE",
    "name": "Reliance Industries Ltd",
    "quantity": 10,
    "avgBuyPrice": 2450.50,
    "type": "stock",
    "exchange": "NSE",
    "currency": "INR"
  },
  {
    "symbol": "BTC",
    "name": "Bitcoin",
    "quantity": 0.05,
    "avgBuyPrice": 3500000,
    "type": "crypto",
    "exchange": null,
    "currency": "USD"
  }
]
`;

// ─── Job 1: Extract holdings from a screenshot using Gemini Vision ────────────
export async function extractHoldingsFromImage(
  base64Image: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp"
): Promise<{ success: true; holdings: ExtractedHolding[] } | { success: false; error: string }> {
  try {
    const rawText = await callGeminiVision(base64Image, mimeType);

    // Strip markdown code fences if Gemini added them despite instructions
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: ExtractedHolding[];

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Gemini returned non-JSON:", rawText);
      return {
        success: false,
        error:
          "Could not read the image clearly. Please try a clearer " +
          "screenshot or add holdings manually.",
      };
    }

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        error: "Unexpected response format. Please try again.",
      };
    }

    // Normalise and clean each extracted holding
    const normalised: ExtractedHolding[] = parsed
      .filter(
        (h) => h.symbol && h.quantity != null && h.avgBuyPrice != null
      )
      .map((h, index) => ({
        id: `extracted-${index}`,
        symbol: String(h.symbol).toUpperCase().trim(),
        name: String(h.name || h.symbol).trim(),
        quantity: Number(h.quantity) || 0,
        avgBuyPrice: Number(h.avgBuyPrice) || 0,
        type: h.type || "stock",
        exchange: h.exchange || null,
        currency: h.currency || "INR",
        confidence: 0.85,
      }));

    return { success: true, holdings: normalised };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Gemini Vision error:", message);

    if (message.includes("rate limited") || message.includes("429")) {
      return {
        success: false,
        error:
          "AI service is busy. Please wait 1 minute and try again.",
      };
    }

    if (message.includes("All Gemini models failed")) {
      return {
        success: false,
        error:
          "Could not connect to AI. Please check your GEMINI_API_KEY " +
          "in .env.local and restart the server.",
      };
    }

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

// ─── Job 2: Save confirmed holdings to Firestore ──────────────────────────────
export async function saveHoldings(
  holdings: ExtractedHolding[],
  source: "ocr" | "manual"
): Promise<SaveHoldingsResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to save holdings.",
      };
    }

    if (holdings.length === 0) {
      return { success: false, error: "No holdings to save." };
    }

    const holdingsRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("holdings");

    // Batch write — all holdings save together or none do
    const batch = adminDb.batch();
    const now = FieldValue.serverTimestamp();

    for (const holding of holdings) {
      const docRef = holdingsRef.doc();

      batch.set(docRef, {
        symbol:       holding.symbol.toUpperCase(),
        name:         holding.name,
        type:         holding.type,
        exchange:     holding.exchange ?? null,
        quantity:     holding.quantity,
        avgBuyPrice:  holding.avgBuyPrice,
        currency:     holding.currency,
        source,
        addedAt:      now,
        updatedAt:    now,
        deletedAt:    null,
      });
    }

    await batch.commit();

    // Mark portfolio as uploaded in onboarding state
    await adminDb
      .collection("users")
      .doc(user.uid)
      .update({
        "onboarding.portfolioUploaded": true,
        lastActiveAt: now,
      });

    return { success: true, count: holdings.length };

  } catch (err) {
    console.error("Save holdings error:", err);
    return {
      success: false,
      error: "Failed to save holdings. Please try again.",
    };
  }
}

export async function deleteHolding(
  holdingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "You must be logged in to delete holdings." };
    }

    const docRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("holdings")
      .doc(holdingId);

    await docRef.update({
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    console.error("Delete holding error:", err);
    return { success: false, error: "Failed to delete holding." };
  }
}

export async function updateHolding(
  holdingId: string,
  quantity: number,
  avgBuyPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "You must be logged in to update holdings." };
    }

    const docRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("holdings")
      .doc(holdingId);

    await docRef.update({
      quantity,
      avgBuyPrice,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    console.error("Update holding error:", err);
    return { success: false, error: "Failed to update holding." };
  }
}

export async function addSingleHolding(
  holding: Omit<ExtractedHolding, "id" | "confidence">
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "You must be logged in to add holdings." };
    }

    const docRef = adminDb
      .collection("users")
      .doc(user.uid)
      .collection("holdings")
      .doc();

    const now = FieldValue.serverTimestamp();

    await docRef.set({
      symbol:       holding.symbol.toUpperCase(),
      name:         holding.name,
      type:         holding.type,
      exchange:     holding.exchange ?? null,
      quantity:     holding.quantity,
      avgBuyPrice:  holding.avgBuyPrice,
      currency:     holding.currency,
      source:       "manual",
      addedAt:      now,
      updatedAt:    now,
      deletedAt:    null,
    });

    // Mark onboarding updated
    await adminDb
      .collection("users")
      .doc(user.uid)
      .update({
        "onboarding.portfolioUploaded": true,
        lastActiveAt: now,
      });

    return { success: true };
  } catch (err) {
    console.error("Add single holding error:", err);
    return { success: false, error: "Failed to add holding." };
  }
}