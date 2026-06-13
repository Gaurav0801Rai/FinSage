import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { callMcpTool } from "@/lib/mcp-client";
import { callGroq } from "@/lib/groq";


const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function analyseNewsItem(
  title: string,
  summary: string,
  tickers: string[]
): Promise<{
  baseImpact: string;
  affectedSectors: string[];
  affectedSymbols: string[];
  severity: "high" | "medium" | "low";
  confidence: number;
  tokensUsed: number;
} | null> {
  // Simple prompt — no JSON template in the prompt body
  // to avoid confusing the model
  const prompt = `You are a financial analyst for Indian investors.

Analyse this news article and return a JSON object.

Article Title: ${title}
Article Summary: ${summary}
Detected Tickers: ${tickers.length > 0 ? tickers.join(", ") : "none"}

Return ONLY a valid JSON object with these exact keys:
- baseImpact: string (max 80 words explaining the impact. Do NOT use unescaped double quotes inside text values; use single quotes 'like this' instead)
- affectedSectors: array of strings (e.g. ["banking", "technology"])
- affectedSymbols: array of ticker strings that are directly affected (only from the detected tickers list above)
- severity: exactly one of "high", "medium", or "low"
- confidence: number between 0 and 1

Severity guide:
- high: major earnings, acquisition, fraud, regulatory action, crisis
- medium: analyst rating, minor earnings, sector news
- low: general update, background context

Do not include any explanation outside the JSON. Return raw JSON only.`;

  let geminiResult: { rawText: string; tokens: number } | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.status === 429) {
        const errText = await res.text();
        console.log(`Gemini 429 Rate limited/Quota exceeded:`, errText.slice(0, 150));
        if (errText.toLowerCase().includes("quota")) {
          console.log("Gemini quota exhausted. Breaking attempt loop to trigger Groq fallback.");
          break;
        }
        console.log(
          `Rate limited on attempt ${attempt + 1}, waiting 5s...`
        );
        await sleep(5000);
        continue;
      }

      if (res.status === 400) {
        const errBody = await res.text();
        console.warn(`Gemini 400 error:`, errBody.slice(0, 300));
        break;
      }

      if (!res.ok) {
        console.warn(`Gemini failed with status: ${res.status}`);
        break;
      }

      const data = await res.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const tokens = data?.usageMetadata?.totalTokenCount ?? 0;

      if (rawText) {
        geminiResult = { rawText, tokens };
        break;
      }
    } catch (err) {
      console.warn(`Gemini attempt ${attempt + 1} threw:`, err);
      if (attempt < 2) await sleep(5000);
    }
  }

  let rawText = geminiResult?.rawText ?? "";
  let tokensUsed = geminiResult?.tokens ?? 0;

  // Fallback to Groq if Gemini failed/exhausted quota
  const hasGroqKeys = !!(process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS);
  if (!rawText && hasGroqKeys) {
    console.log("Attempting fallback to Groq API for news analysis...");
    try {
      const data = await callGroq({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst. You must return ONLY raw valid JSON matching the schema requested. No markdown formatting, no explanation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      rawText = data?.choices?.[0]?.message?.content ?? "";
      tokensUsed = data?.usage?.total_tokens ?? 0;
      console.log("Groq fallback successful!");
    } catch (err) {
      console.error("Groq fallback error:", err);
    }
  }

  if (!rawText) {
    console.warn("Both Gemini and Groq fallback failed to return analysis text.");
    return null;
  }

  // Aggressively clean the response
  let cleaned = rawText.trim();

  // Remove markdown code fences
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/```\s*$/i, "");
  cleaned = cleaned.trim();

  // Find the JSON object — extract from first { to last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    console.warn(
      "No valid JSON object found in response:",
      cleaned.slice(0, 200)
    );
    return null;
  }

  const jsonString = cleaned.slice(firstBrace, lastBrace + 1);

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(jsonString);
  } catch (parseErr) {
    console.warn(
      "JSON parse failed:",
      jsonString.slice(0, 200)
    );
    return null;
  }

  if (!parsed.baseImpact || !parsed.severity) {
    console.warn("Response missing required fields:", parsed);
    return null;
  }

  return {
    baseImpact: String(parsed.baseImpact).slice(0, 500),
    affectedSectors: Array.isArray(parsed.affectedSectors)
      ? (parsed.affectedSectors as string[]).slice(0, 10)
      : [],
    affectedSymbols: Array.isArray(parsed.affectedSymbols)
      ? (parsed.affectedSymbols as string[]).slice(0, 10)
      : [],
    severity: (
      ["high", "medium", "low"].includes(
        parsed.severity as string
      )
        ? parsed.severity
        : "low"
    ) as "high" | "medium" | "low",
    confidence:
      typeof parsed.confidence === "number"
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.5,
    tokensUsed: tokensUsed,
  };
}

const SEVERITY_LEVELS: Record<string, number> = { low: 1, medium: 2, high: 3 };

async function createUserAlerts(
  newsId: string,
  affectedSymbols: string[],
  analysis: {
    baseImpact: string;
    severity: "high" | "medium" | "low";
    confidence: number;
  },
  newsTitle: string,
  emailQueue: Array<{
    uid: string;
    email: string;
    emailAlerts: boolean;
    severityThreshold: string;
    symbol: string;
    title: string;
    severity: string;
    whyItMatters: string;
  }>
): Promise<number> {
  if (affectedSymbols.length === 0) return 0;

  let alertsCreated = 0;

  try {
    const holdingsSnap = await adminDb
      .collectionGroup("holdings")
      .where("symbol", "in", affectedSymbols.slice(0, 10))
      .where("deletedAt", "==", null)
      .get();

    const userHoldings = new Map<string, Array<{ holdingId: string; symbol: string }>>();

    for (const doc of holdingsSnap.docs) {
      const uid = doc.ref.parent.parent?.id;
      const holdingId = doc.id;
      const symbol = doc.data().symbol as string;

      if (!uid) continue;

      if (!userHoldings.has(uid)) userHoldings.set(uid, []);
      userHoldings.get(uid)!.push({ holdingId, symbol });
    }

    if (userHoldings.size === 0) return 0;

    // Fetch user preferences in parallel
    const uids = Array.from(userHoldings.keys());
    const userDocs = await Promise.all(
      uids.map((uid) => adminDb.collection("users").doc(uid).get())
    );

    const userSettings = new Map<string, { email: string; emailAlerts: boolean; severityThreshold: string }>();
    for (const doc of userDocs) {
      if (!doc.exists) continue;
      const data = doc.data()!;
      const email = data.email || "";
      const prefs = data.preferences || {};
      const emailAlerts = prefs.emailAlerts !== false; // defaults to true
      const severityThreshold = prefs.alertSeverityThreshold || "medium"; // defaults to medium
      
      userSettings.set(doc.id, { email, emailAlerts, severityThreshold });
    }

    const batch = adminDb.batch();

    for (const [uid, holdings] of userHoldings.entries()) {
      const alertRef = adminDb
        .collection("users")
        .doc(uid)
        .collection("alerts")
        .doc();

      batch.set(alertRef, {
        newsId,
        severity: analysis.severity,
        affectedHoldings: holdings.map((h) => h.holdingId),
        affectedSymbols: holdings.map((h) => h.symbol),
        whyItMatters: analysis.baseImpact,
        impactSummary: analysis.baseImpact,
        confidence: analysis.confidence,
        createdAt: FieldValue.serverTimestamp(),
        readAt: null,
        dismissed: false,
      });

      alertsCreated++;

      // Queue email alert details if user enabled it and it is high severity
      const settings = userSettings.get(uid);
      if (settings && settings.email && settings.emailAlerts && analysis.severity === "high") {
        const alertLevel = SEVERITY_LEVELS[analysis.severity] || 1;
        const userThreshold = SEVERITY_LEVELS[settings.severityThreshold] || 2;

        if (alertLevel >= userThreshold) {
          holdings.forEach((h) => {
            emailQueue.push({
              uid,
              email: settings.email,
              emailAlerts: settings.emailAlerts,
              severityThreshold: settings.severityThreshold,
              symbol: h.symbol,
              title: newsTitle,
              severity: analysis.severity,
              whyItMatters: analysis.baseImpact,
            });
          });
        }
      }
    }

    if (alertsCreated > 0) await batch.commit();

    return alertsCreated;
  } catch (err) {
    console.error("Error creating user alerts:", err);
    return 0;
  }
}

async function generateCombinedSummary(
  symbol: string,
  alerts: Array<{ title: string; whyItMatters: string }>
): Promise<string> {
  if (alerts.length === 1) return alerts[0].whyItMatters;

  const prompt = `You are a financial analyst. Summarize these multiple news events affecting ${symbol} into a single, cohesive 2-sentence summary of what they mean for the investor:
  
  ${alerts.map((a, i) => `Event ${i+1}: ${a.title}\nAnalysis: ${a.whyItMatters}`).join("\n\n")}
  
  Return only the 2-sentence summary.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 250,
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    }
  } catch (err) {
    console.error("Combined summary Gemini error:", err);
  }

  // Try Groq fallback
  const hasGroqKeys = !!(process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS);
  if (hasGroqKeys) {
    try {
      console.log("Attempting fallback to Groq for combined summary...");
      const data = await callGroq({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst. Return only the 2-sentence summary requested.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      });

      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log("Groq combined summary fallback successful!");
        return text;
      }
    } catch (err) {
      console.error("Combined summary Groq fallback error:", err);
    }
  }

  return alerts.map(a => `- ${a.whyItMatters}`).join("\n");
}


export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isValidCronSecret =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    authHeader === `Bearer pp-cron-2026-secret`;

  if (process.env.NODE_ENV === "production" && !isValidCronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("\n═══ News Processing Cron Started ═══");
    const startTime = Date.now();

    const emailQueue: Array<{
      uid: string;
      email: string;
      emailAlerts: boolean;
      severityThreshold: string;
      symbol: string;
      title: string;
      severity: string;
      whyItMatters: string;
    }> = [];

    const unprocessedSnap = await adminDb
      .collection("news")
      .where("processed", "==", false)
      .orderBy("fetchedAt", "asc")
      .limit(BATCH_SIZE)
      .get();

    if (unprocessedSnap.empty) {
      console.log("No unprocessed articles found.");
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No articles to process",
      });
    }

    console.log(
      `Processing ${unprocessedSnap.docs.length} articles...`
    );

    let processed = 0;
    let alertsCreated = 0;
    let skipped = 0;

    for (const doc of unprocessedSnap.docs) {
      const newsData = doc.data();
      const newsId = doc.id;

      try {
        const analysis = await analyseNewsItem(
          (newsData.title as string) ?? "",
          (newsData.summary as string) ?? "",
          (newsData.tickers as string[]) ?? []
        );

        if (!analysis) {
          await doc.ref.update({
            processed: true,
            processingError: "AI analysis failed",
          });
          skipped++;
          continue;
        }

        await adminDb.collection("news_analyses").doc(newsId).set({
          newsId,
          baseImpact: analysis.baseImpact,
          affectedSectors: analysis.affectedSectors,
          affectedSymbols: analysis.affectedSymbols,
          severity: analysis.severity,
          confidence: analysis.confidence,
          model: GEMINI_MODEL,
          generatedAt: FieldValue.serverTimestamp(),
          tokensUsed: analysis.tokensUsed,
        });

        const newAlerts = await createUserAlerts(
          newsId,
          analysis.affectedSymbols,
          analysis,
          (newsData.title as string) ?? "",
          emailQueue
        );
        alertsCreated += newAlerts;

        await doc.ref.update({ processed: true });
        processed++;

        console.log(
          `  ✓ [${analysis.severity}] ${(newsData.title as string)?.slice(0, 50)}... → ${newAlerts} alerts`
        );

        // Wait between AI calls to avoid rate limits
        await sleep(1500);
      } catch (err) {
        console.error(`Error processing ${newsId}:`, err);
        await doc.ref
          .update({
            processed: true,
            processingError: String(err),
          })
          .catch(() => {});
        skipped++;
      }
    }

    // Process consolidated email alerts
    if (emailQueue.length > 0) {
      const userEmails: Record<string, typeof emailQueue> = {};
      emailQueue.forEach((item) => {
        if (!userEmails[item.uid]) userEmails[item.uid] = [];
        userEmails[item.uid].push(item);
      });

      const emailPromises = Object.entries(userEmails).map(async ([uid, items]) => {
        const email = items[0].email;
        
        const symbolGroups: Record<string, Array<{ title: string; whyItMatters: string; severity: string }>> = {};
        items.forEach((item) => {
          if (!symbolGroups[item.symbol]) symbolGroups[item.symbol] = [];
          if (!symbolGroups[item.symbol].some(x => x.title === item.title)) {
            symbolGroups[item.symbol].push({
              title: item.title,
              whyItMatters: item.whyItMatters,
              severity: item.severity,
            });
          }
        });

        let emailBody = `Hello,\n\nFinSage has detected market events that affect your portfolio holdings:\n\n`;

        for (const [symbol, alerts] of Object.entries(symbolGroups)) {
          emailBody += `========================================\n`;
          emailBody += `${symbol.toUpperCase()}\n`;
          emailBody += `========================================\n`;

          alerts.forEach((alert) => {
            emailBody += `• Alert: "${alert.title}"\n`;
            emailBody += `  Impact: ${alert.severity.toUpperCase()}\n`;
            emailBody += `  Analysis: ${alert.whyItMatters}\n\n`;
          });

          if (alerts.length > 1) {
            const combined = await generateCombinedSummary(symbol, alerts);
            emailBody += `Summary of ${symbol} events:\n${combined}\n\n`;
          }
        }

        emailBody += `You can view all your active alerts and details directly in your FinSage dashboard.\n\n`;
        emailBody += `Regards,\nFinSage AI Alerts`;

        const subjectSymbols = Object.keys(symbolGroups).join(", ");
        const emailSubject = `[FinSage Alert] Impact Detected: ${subjectSymbols}`;

        try {
          await callMcpTool("gmail_send_message", {
            to: email,
            subject: emailSubject,
            body: emailBody,
            userId: "me",
            message: {
              to: email,
              subject: emailSubject,
              raw: Buffer.from(
                `To: ${email}\r\n` +
                `Subject: ${emailSubject}\r\n\r\n` +
                emailBody
              ).toString("base64url")
            }
          });
        } catch (err) {
          console.error(`[MCP Gmail Alert] Failed to send consolidated email for user ${uid} (${email}):`, err);
        }
      });

      await Promise.all(emailPromises);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `═══ Completed in ${duration}s: ${processed} processed, ` +
        `${alertsCreated} alerts, ${skipped} skipped ═══\n`
    );

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      processed,
      alertsCreated,
      skipped,
    });
  } catch (err) {
    console.error("Process cron error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

export const maxDuration = 60; // 60 seconds max timeout on Vercel Hobby
export const dynamic = "force-dynamic";