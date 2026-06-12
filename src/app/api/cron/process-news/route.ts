import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

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

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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
        console.log(
          `Rate limited on attempt ${attempt + 1}, waiting 60s...`
        );
        await sleep(60000);
        continue;
      }

      if (res.status === 400) {
        const errBody = await res.text();
        console.warn(`Gemini 400 error:`, errBody.slice(0, 300));
        return null;
      }

      if (!res.ok) {
        console.warn(`Gemini failed with status: ${res.status}`);
        return null;
      }

      const data = await res.json();
      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const tokens = data?.usageMetadata?.totalTokenCount ?? 0;

      if (!rawText) {
        console.warn("Gemini returned empty response");
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
        tokensUsed: tokens,
      };
    } catch (err) {
      console.warn(`Gemini attempt ${attempt + 1} threw:`, err);
      if (attempt < 2) await sleep(5000);
    }
  }

  return null;
}

async function createUserAlerts(
  newsId: string,
  affectedSymbols: string[],
  analysis: {
    baseImpact: string;
    severity: "high" | "medium" | "low";
    confidence: number;
  }
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
    }

    if (alertsCreated > 0) await batch.commit();

    return alertsCreated;
  } catch (err) {
    console.error("Error creating user alerts:", err);
    return 0;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("\n═══ News Processing Cron Started ═══");
    const startTime = Date.now();

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
          analysis
        );
        alertsCreated += newAlerts;

        await doc.ref.update({ processed: true });
        processed++;

        console.log(
          `  ✓ [${analysis.severity}] ${(newsData.title as string)?.slice(0, 50)}... → ${newAlerts} alerts`
        );

        // Wait between AI calls to avoid rate limits
        await sleep(3000);
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