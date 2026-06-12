"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUser } from "@/lib/firebase/session";
import { fetchPrices } from "@/lib/price-service";
import { getUSDToINR } from "@/lib/exchange-rate";


interface ChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

/**
 * Server Action that handles RAG Chatbot queries about the user's portfolio and market news.
 */
export async function askChatbot(
  history: ChatMessage[],
  userMessage: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: "Not logged in." };
    }

    // 1. Fetch User Data & Preferences
    const userDoc = await adminDb.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: "User profile not found." };
    }
    const userData = userDoc.data()!;
    const baseCurrency = userData.preferences?.baseCurrency || "INR";
    const displayName = userData.displayName || "FinSage Investor";

    // 2. Fetch User Holdings (active only)
    const holdingsSnap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("holdings")
      .where("deletedAt", "==", null)
      .get();

    const holdings = holdingsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        symbol: data.symbol as string,
        name: data.name as string,
        type: data.type as "stock" | "crypto" | "mutual_fund" | "etf",
        quantity: data.quantity as number,
        avgBuyPrice: data.avgBuyPrice as number,
        currency: data.currency as "INR" | "USD",
        exchange: data.exchange as "NSE" | "BSE" | null,
      };
    });

    // 3. Fetch Live Prices for Holdings to compute live performance for AI
    let livePricesContext = "No current holdings.";
    if (holdings.length > 0) {
      try {
        const prices = await fetchPrices(holdings);
        const holdingsDetails = holdings.map((h) => {
          const live = prices[h.symbol];
          const curPrice = live?.price ?? h.avgBuyPrice;
          const pctChange = live?.changePercent ?? 0;
          const pnl = (curPrice - h.avgBuyPrice) * h.quantity;
          const pnlPct = h.avgBuyPrice > 0 ? ((curPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100 : 0;
          
          return `- **${h.symbol}** (${h.name}): Held ${h.quantity} units, Avg Buy Price: ${h.currency} ${h.avgBuyPrice.toLocaleString()}, Current Price: ${live?.currency || h.currency} ${curPrice.toLocaleString()} (${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)}% today). Current P&L: ${baseCurrency} ${pnl.toFixed(2)} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%).`;
        });
        livePricesContext = holdingsDetails.join("\n");
      } catch (err) {
        console.warn("Failed to fetch live prices for chatbot context:", err);
        livePricesContext = holdings.map(h => `- **${h.symbol}** (${h.name}): ${h.quantity} units @ Avg Buy ${h.currency} ${h.avgBuyPrice}`).join("\n");
      }
    }

    // 4. Fetch News / Alerts context
    // First retrieve latest alerts specific to the user
    const alertsSnap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("alerts")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    let newsContext = "No recent alerts or news matches found.";
    
    if (!alertsSnap.empty) {
      const alerts = alertsSnap.docs.map((doc) => {
        const data = doc.data();
        return `- [${data.severity.toUpperCase()} Alert] affecting **${(data.affectedSymbols || []).join(", ")}**: "${data.whyItMatters || data.impactSummary}"`;
      });
      newsContext = alerts.join("\n");
    } else if (holdings.length > 0) {
      // Fallback: Fetch general news and filter locally for matches
      const newsSnap = await adminDb
        .collection("news")
        .orderBy("publishedAt", "desc")
        .limit(30)
        .get();

      const matchedNews = newsSnap.docs
        .map((doc) => doc.data())
        .filter((item) => {
          const tickers = item.tickers || [];
          const matchesTicker = tickers.some((t: string) => holdings.some((h) => h.symbol === t));
          return matchesTicker || item.isMacro === true;
        })
        .slice(0, 10);

      if (matchedNews.length > 0) {
        newsContext = matchedNews.map((item) => {
          const type = item.isMacro ? "Macro News" : `News for ${(item.tickers || []).join(", ")}`;
          return `- [${type}] **${item.title}**: ${item.summary || "No summary available."} (Source: ${item.source})`;
        }).join("\n");
      }
    }

    // Fetch USD to INR exchange rate to prevent AI rate assumptions
    const usdToInrRate = await getUSDToINR().catch(() => 83.5);

    // 5. Construct System Instructions
    const systemPrompt = `You are FinSage Assistant, a premium, intelligent financial advisor AI chatbot.
You are helping ${displayName} with their stock and cryptocurrency holdings.

Below is the user's active holdings, live performance (calculated in their preferred base currency: ${baseCurrency}), and recent matching news or macro events.

### CURRENT USD TO INR EXCHANGE RATE
- 1 USD = ${usdToInrRate.toFixed(2)} INR
(Note: You MUST use this exact exchange rate for converting currency values when analyzing holdings and prices. Do not assume or guess any other rate).

### USER PORTFOLIO COORDINATES (LIVE DATA)
${livePricesContext}

### RELEVANT NEWS & ALERTS
${newsContext}

### GUIDELINES
1. ONLY discuss topics related to the user's portfolio holdings, general macroeconomics, interest rates, or geopolitical news that might affect the financial markets.
2. If the user asks general questions unrelated to finance, stocks, crypto, or macroeconomics, politely decline to answer, indicating that your expertise is focused on their FinSage portfolio intelligence.
3. Be professional, direct, and concise. Avoid wordy introductions.
4. Format all financial figures beautifully. Use Geist Mono/tabular-nums styles implicitly where applicable (use markdown formatting e.g., code blocks or bold tags for numbers to make them stand out).
5. DO NOT provide direct trading advice (buy/sell commands). Frame your inputs as analysis, relevance summaries, and points to consider.

Maintain this context in your replies. Use the conversation history to provide coherent answers.`;

    // 6. Call AI API
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (GROQ_API_KEY) {
      console.log("[Chatbot] Routing request to Groq API...");
      const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
      const url = "https://api.groq.com/openai/v1/chat/completions";

      // Map conversation history to OpenAI-compatible messages format
      const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.parts[0]?.text || "",
        })),
        { role: "user", content: userMessage },
      ];

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.2,
        }),
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[Chatbot] Groq API error:", errBody);
        return { success: false, error: "Failed to generate AI response via Groq. Status: " + response.status };
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;

      if (!reply) {
        return { success: false, error: "Received empty reply from Groq." };
      }

      return { success: true, response: reply };
    } else {
      console.log("[Chatbot] GROQ_API_KEY not found. Falling back to Gemini API...");
      
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        return { success: false, error: "Neither Groq nor Gemini API Key is configured on the server." };
      }

      const GEMINI_MODEL = "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const contents = [
        ...history,
        { role: "user", parts: [{ text: userMessage }] }
      ];

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          }
        }),
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("[Chatbot] Gemini API error:", errBody);
        return { success: false, error: "Failed to generate AI response via Gemini. Status: " + response.status };
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) {
        return { success: false, error: "Received empty reply from Gemini." };
      }

      return { success: true, response: reply };
    }
  } catch (err) {
    console.error("askChatbot error:", err);
    return { success: false, error: "An unexpected error occurred: " + String(err) };
  }
}
