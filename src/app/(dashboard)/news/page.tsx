import { cookies }            from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { NewsCard }           from "@/components/news/news-card";
import { Newspaper }          from "lucide-react";
import { Timestamp }          from "firebase-admin/firestore";

async function getNewsData() {
  try {
    const cookieStore   = cookies();
    const sessionCookie = cookieStore.get("pp_session")?.value;
    if (!sessionCookie) return { news: [], userSymbols: [] };

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid     = decoded.uid;

    // Get user's holding symbols
    const holdingsSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("holdings")
      .where("deletedAt", "==", null)
      .get();

    const userSymbols = holdingsSnap.docs.map(
      (doc) => doc.data().symbol as string
    );

    // Only fetch news from the last 48 hours
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);

    const newsSnap = await adminDb
      .collection("news")
      .where("publishedAt", ">=", Timestamp.fromDate(cutoff))
      .orderBy("publishedAt", "desc")
      .limit(50)
      .get();

    const allNews = newsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id:          doc.id,
        title:       data.title      as string,
        summary:     data.summary    as string,
        source:      data.source     as string,
        sourceUrl:   data.sourceUrl  as string,
        category:    data.category   as string,
        tickers:    (data.tickers    as string[]) ?? [],
        isMacro:    (data.isMacro    as boolean)  ?? false,
        imageUrl:    data.imageUrl   as string | null,
        publishedAt: (data.publishedAt as Timestamp)
                       ?.toDate?.()?.toISOString()
                     ?? new Date().toISOString(),
        processed:   data.processed  as boolean,
      };
    });

    // Filter to articles relevant to user's holdings
    const relevantNews = userSymbols.length > 0
      ? allNews.filter((item) =>
          item.isMacro ||
          item.tickers.some((t) => userSymbols.includes(t))
        )
      : allNews;

    return { news: relevantNews, userSymbols };
  } catch (err) {
    console.error("News page error:", err);
    return { news: [], userSymbols: [] };
  }
}

export default async function NewsPage() {
  const { news, userSymbols } = await getNewsData();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          News Feed
        </h1>
        <p className="text-sm text-white/40">
          {userSymbols.length > 0
            ? `Filtered to your ${userSymbols.length} holdings · Last 48 hours · Updates every 15 minutes`
            : "All market news · Last 48 hours · Upload a portfolio to personalise"
          }
        </p>
      </div>

      {/* News list */}
      {news.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center
                     py-24 text-center"
        >
          <Newspaper className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/50 text-sm mb-1">No recent news</p>
          <p className="text-white/30 text-xs">
            Showing news from the last 48 hours only.
            Run the ingestion cron to fetch fresh articles.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              userSymbols={userSymbols}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic    = "force-dynamic";
export const revalidate = 0;