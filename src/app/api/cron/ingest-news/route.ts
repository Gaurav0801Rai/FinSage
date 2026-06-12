import { NextResponse } from "next/server";
import { runNewsIngestion } from "@/lib/news-ingestion";

// Vercel Cron calls this endpoint on schedule.
// The CRON_SECRET header prevents anyone else from triggering it.

export async function GET(request: Request) {
  // Verify this is coming from Vercel Cron or our own test call
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("\n═══ News Ingestion Cron Started ═══");
    const startTime = Date.now();

    const result = await runNewsIngestion();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`═══ Completed in ${duration}s ═══\n`);

    return NextResponse.json({
      success:  true,
      duration: `${duration}s`,
      result,
    });
  } catch (err) {
    console.error("Cron job error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}