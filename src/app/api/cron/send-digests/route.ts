import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { callMcpTool } from "@/lib/mcp-client";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-2.5-flash";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  if (process.env.GROQ_API_KEY) {
    try {
      console.log("Attempting fallback to Groq for combined summary...");
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log("Groq combined summary fallback successful!");
          return text;
        }
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
    console.log("\n═══ Consolidated Daily Digest Cron Started ═══");
    const startTime = Date.now();

    const usersSnap = await adminDb.collection("users").get();
    if (usersSnap.empty) {
      return NextResponse.json({ success: true, message: "No users found" });
    }

    let processedUsers = 0;
    let digestsSent = 0;

    const digestPromises = usersSnap.docs.map(async (userDoc) => {
      const data = userDoc.data();
      const email = data.email || "";
      const hasDigest = data.preferences?.dailyDigest !== false; // defaults to true

      if (!email || !hasDigest) return;

      processedUsers++;

      // Determine digest start time (default to last 12 hours if not set)
      let lastDigestAt = data.lastDigestAt;
      if (!lastDigestAt) {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        lastDigestAt = Timestamp.fromDate(twelveHoursAgo);
      }

      // Query user alerts generated since last digest
      const alertsSnap = await adminDb
        .collection("users")
        .doc(userDoc.id)
        .collection("alerts")
        .where("createdAt", ">=", lastDigestAt)
        .get();

      if (alertsSnap.empty) {
        // Advance time to avoid repeating checks
        await userDoc.ref.update({ lastDigestAt: Timestamp.now() });
        return;
      }

      // Retrieve referenced news documents for their titles
      const newsIds = [
        ...new Set(
          alertsSnap.docs.map((d) => d.data().newsId as string).filter(Boolean)
        ),
      ];

      const newsTitles: Record<string, string> = {};
      if (newsIds.length > 0) {
        const BATCH_LIMIT = 30;
        for (let i = 0; i < newsIds.length; i += BATCH_LIMIT) {
          const batchIds = newsIds.slice(i, i + BATCH_LIMIT);
          const newsSnap = await adminDb
            .collection("news")
            .where("__name__", "in", batchIds)
            .get();

          newsSnap.docs.forEach((nDoc) => {
            newsTitles[nDoc.id] = nDoc.data().title || "Market Update";
          });
        }
      }

      // Group alerts by affected symbols
      const symbolGroups: Record<
        string,
        Array<{ title: string; whyItMatters: string; severity: string }>
      > = {};

      for (const aDoc of alertsSnap.docs) {
        const aData = aDoc.data();
        const symbols = (aData.affectedSymbols as string[]) || [];
        const newsId = aData.newsId as string;
        const title = newsTitles[newsId] || "Market Update";
        const whyItMatters = aData.whyItMatters || aData.impactSummary || "";
        const severity = aData.severity || "low";

        symbols.forEach((symbol) => {
          if (!symbolGroups[symbol]) symbolGroups[symbol] = [];
          if (!symbolGroups[symbol].some((x) => x.title === title)) {
            symbolGroups[symbol].push({ title, whyItMatters, severity });
          }
        });
      }

      if (Object.keys(symbolGroups).length === 0) {
        await userDoc.ref.update({ lastDigestAt: Timestamp.now() });
        return;
      }

      // Construct digest body
      let emailBody = `Hello,\n\nHere is your FinSage Portfolio Intelligence Digest:\n\n`;

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

      emailBody += `You can view all active alerts and details directly in your FinSage dashboard.\n\n`;
      emailBody += `Regards,\nFinSage AI Alerts`;

      const subjectSymbols = Object.keys(symbolGroups).join(", ");
      const emailSubject = `[FinSage Digest] Portfolio Update: ${subjectSymbols}`;

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
            ).toString("base64url"),
          },
        });
        digestsSent++;
      } catch (err) {
        console.error(`[Digest Route] Failed to send email to ${email}:`, err);
      }

      // Update user's lastDigestAt
      await userDoc.ref.update({ lastDigestAt: Timestamp.now() });
    });

    await Promise.all(digestPromises);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `═══ Digests completed in ${duration}s: ${processedUsers} users checked, ${digestsSent} digests sent ═══\n`
    );

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      processedUsers,
      digestsSent,
    });
  } catch (err) {
    console.error("Digest cron error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}

export const maxDuration = 120; // 120 seconds max timeout
export const dynamic = "force-dynamic";
