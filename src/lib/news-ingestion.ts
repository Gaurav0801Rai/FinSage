import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { fetchAllRSSFeeds }    from "./rss-fetcher";
import { fetchRedditRSS }      from "./reddit-ingestion";
import { matchTickersInText, isMacroEvent } from "./ticker-dictionary";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { RawNewsItem } from "./rss-fetcher";

// ─── Simple hash for deduplication ───────────────────────────────────────────
// We hash the article URL to create a stable dedup key.
// Same URL from two sources = same article = skip.

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash       = (hash << 5) - hash + char;
    hash      |= 0; // convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ─── Fetch from NewsAPI ───────────────────────────────────────────────────────

async function fetchNewsAPI(): Promise<RawNewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.log("NEWS_API_KEY not set, skipping NewsAPI");
    return [];
  }

  const queries = [
    { q: "Indian stock market NSE BSE Sensex Nifty", category: "stock" as const },
    { q: "Bitcoin Ethereum cryptocurrency India",    category: "crypto" as const },
    { q: "RBI monetary policy India economy budget", category: "macro"  as const },
  ];

  const items: RawNewsItem[] = [];

  for (const query of queries) {
    try {
      const url = new URL("https://newsapi.org/v2/everything");
      url.searchParams.set("q",        query.q);
      url.searchParams.set("language", "en");
      url.searchParams.set("sortBy",   "publishedAt");
      url.searchParams.set("pageSize", "20");
      url.searchParams.set("apiKey",   apiKey);

      const res = await fetch(url.toString(), {
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        console.warn(`NewsAPI failed for query "${query.q}": ${res.status}`);
        continue;
      }

      const data = await res.json();

      if (data.status !== "ok" || !Array.isArray(data.articles)) continue;

      for (const article of data.articles) {
        if (!article.title || !article.url) continue;
        if (article.title === "[Removed]")  continue;

        const text    = `${article.title} ${article.description ?? ""}`;
        const tickers = matchTickersInText(text);
        const macro   = isMacroEvent(text);

        items.push({
          title:       article.title,
          summary:     (article.description ?? "").slice(0, 500),
          url:         article.url,
          source:      article.source?.name ?? "NewsAPI",
          sourceType:  "rss", // treating NewsAPI same as RSS for simplicity
          category:    macro ? "macro" : query.category,
          publishedAt: new Date(article.publishedAt ?? Date.now()),
          imageUrl:    article.urlToImage ?? undefined,
          tickers,
          isMacro:     macro,
        });
      }

      console.log(
        `  ✓ NewsAPI "${query.q}": ${data.articles.length} articles`
      );
    } catch (err) {
      console.warn(`NewsAPI error for query "${query.q}":`, err);
    }
  }

  return items;
}

// ─── Main ingestion function ──────────────────────────────────────────────────

export interface IngestionResult {
  fetched:    number;
  duplicates: number;
  noMatch:    number;
  saved:      number;
  errors:     number;
}

export async function runNewsIngestion(): Promise<IngestionResult> {
  const result: IngestionResult = {
    fetched:    0,
    duplicates: 0,
    noMatch:    0,
    saved:      0,
    errors:     0,
  };

  try {
    // ── Step 1: Fetch from all sources in parallel ──────────────────────────
    const [rssItems, newsApiItems, redditItems] = await Promise.all([
      fetchAllRSSFeeds(),
      fetchNewsAPI(),
      fetchRedditRSS(),
    ]);

    const allItems = [...rssItems, ...newsApiItems, ...redditItems];
    result.fetched = allItems.length;
    console.log(`\nTotal fetched: ${allItems.length} articles`);

    if (allItems.length === 0) return result;

    // ── Step 2: Dedup — check which URLs we've already stored ───────────────
    const dedupKeys    = allItems.map((item) => simpleHash(item.url));
    const uniqueKeys   = [...new Set(dedupKeys)];

    // Check Firestore for existing dedup keys in batches of 30
    const existingKeys = new Set<string>();
    const BATCH_SIZE   = 30;

    for (let i = 0; i < uniqueKeys.length; i += BATCH_SIZE) {
      const batch = uniqueKeys.slice(i, i + BATCH_SIZE);
      const snap  = await adminDb
        .collection("news")
        .where("dedupKey", "in", batch)
        .select("dedupKey")
        .get();

      snap.docs.forEach((doc) => {
        existingKeys.add(doc.data().dedupKey);
      });
    }

    // ── Step 3: Filter new items ────────────────────────────────────────────
    const newItems = allItems.filter((item, index) => {
      const key = dedupKeys[index];
      if (existingKeys.has(key)) {
        result.duplicates++;
        return false;
      }
      return true;
    });

    console.log(
      `After dedup: ${newItems.length} new articles ` +
      `(${result.duplicates} duplicates skipped)`
    );

    // ── Step 4: Stage 1 filter — only save articles that match tickers ──────
    // OR are macro events (which affect everyone)
    const relevantItems = newItems.filter((item) => {
      if (item.tickers.length > 0) return true; // matches a known ticker
      if (item.isMacro)            return true; // macro event
      result.noMatch++;
      return false;
    });

    console.log(
      `After Stage 1 filter: ${relevantItems.length} relevant articles ` +
      `(${result.noMatch} no ticker match)`
    );

    if (relevantItems.length === 0) return result;

    // ── Step 5: Write to Firestore in batches ───────────────────────────────
    const WRITE_BATCH = 400; // Firestore batch limit is 500

    for (let i = 0; i < relevantItems.length; i += WRITE_BATCH) {
      const batch      = adminDb.batch();
      const itemsSlice = relevantItems.slice(i, i + WRITE_BATCH);

      for (const item of itemsSlice) {
        try {
          const docRef  = adminDb.collection("news").doc();
          const dedupKey = simpleHash(item.url);

          batch.set(docRef, {
            source:      item.source,
            sourceUrl:   item.url,
            sourceType:  item.sourceType,
            title:       item.title,
            summary:     item.summary,
            publishedAt: Timestamp.fromDate(item.publishedAt),
            fetchedAt:   FieldValue.serverTimestamp(),
            category:    item.category,
            tickers:     item.tickers,
            isMacro:     item.isMacro,
            processed:   false,  // Stage 2 AI picks these up
            imageUrl:    item.imageUrl ?? null,
            dedupKey,
          });

          result.saved++;
        } catch (err) {
          console.error("Error preparing news item:", err);
          result.errors++;
        }
      }

      await batch.commit();
    }

    console.log(
      `\n✓ Ingestion complete: ${result.saved} saved, ` +
      `${result.duplicates} duplicates, ` +
      `${result.noMatch} no match, ` +
      `${result.errors} errors`
    );

    return result;
  } catch (err) {
    console.error("Ingestion error:", err);
    result.errors++;
    return result;
  }
}