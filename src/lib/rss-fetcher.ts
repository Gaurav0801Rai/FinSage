import "server-only";
import { matchTickersInText, isMacroEvent } from "./ticker-dictionary";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawNewsItem {
  title:       string;
  summary:     string;
  url:         string;
  source:      string;
  sourceType:  "rss";
  category:    "stock" | "crypto" | "macro" | "geopolitical";
  publishedAt: Date;
  imageUrl?:   string;
  tickers:     string[];
  isMacro:     boolean;
}

// ─── RSS Sources ──────────────────────────────────────────────────────────────

const RSS_SOURCES = [
  {
    name:     "Economic Times Markets",
    url:      "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    category: "stock" as const,
  },
  {
    name:     "MoneyControl News",
    url:      "https://www.moneycontrol.com/rss/latestnews.xml",
    category: "stock" as const,
  },
  {
    name:     "Reuters Business",
    url:      "https://feeds.reuters.com/reuters/businessNews",
    category: "macro" as const,
  },
  {
    name:     "CoinDesk",
    url:      "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "crypto" as const,
  },
  {
    name:     "CoinTelegraph",
    url:      "https://cointelegraph.com/rss",
    category: "crypto" as const,
  },
  {
    name:     "NDTV Profit",
    url:      "https://feeds.feedburner.com/ndtvprofit-latest",
    category: "stock" as const,
  },
];

// ─── Simple XML parser ────────────────────────────────────────────────────────
// We parse RSS XML without a library to keep dependencies minimal.
// RSS is a predictable format — this handles 99% of feeds correctly.

function extractBetweenTags(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/<[^>]+>/g, "") // strip any HTML tags
        .replace(/&amp;/g,  "&")
        .replace(/&lt;/g,   "<")
        .replace(/&gt;/g,   ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g,  "'")
        .trim();
    }
  }

  return "";
}

function parseRSSItems(xml: string): Array<{
  title:       string;
  description: string;
  link:        string;
  pubDate:     string;
  imageUrl?:   string;
}> {
  // Split by <item> tags
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const items     = [];
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title       = extractBetweenTags(itemXml, "title");
    const description = extractBetweenTags(itemXml, "description");
    const link        = extractBetweenTags(itemXml, "link");
    const pubDate     = extractBetweenTags(itemXml, "pubDate");

    // Try to extract image from media:content or enclosure
    const mediaMatch  = itemXml.match(/media:content[^>]+url="([^"]+)"/i);
    const enclosure   = itemXml.match(/enclosure[^>]+url="([^"]+)"/i);
    const imageUrl    = mediaMatch?.[1] ?? enclosure?.[1];

    if (title && link) {
      items.push({ title, description, link, pubDate, imageUrl });
    }
  }

  return items;
}

// ─── Fetch a single RSS feed ──────────────────────────────────────────────────

async function fetchRSSFeed(source: typeof RSS_SOURCES[0]): Promise<RawNewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PortfolioPulseBot/1.0; +https://portfoliopulse.app)",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout per feed
      next:   { revalidate: 0 },         // always fresh
    });

    if (!res.ok) {
      console.warn(`RSS fetch failed for ${source.name}: ${res.status}`);
      return [];
    }

    const xml   = await res.text();
    const items = parseRSSItems(xml);

    return items.map((item) => {
      const text    = `${item.title} ${item.description}`;
      const tickers = matchTickersInText(text);
      const macro   = isMacroEvent(text);

      // Determine category
      let category = source.category;
      if (macro && category === "stock") category = "macro";

      return {
        title:       item.title,
        summary:     item.description.slice(0, 500), // cap at 500 chars
        url:         item.link,
        source:      source.name,
        sourceType:  "rss",
        category,
        publishedAt: new Date(item.pubDate || Date.now()),
        imageUrl:    item.imageUrl,
        tickers,
        isMacro:     macro,
      };
    });
  } catch (err) {
    console.warn(`RSS error for ${source.name}:`, err);
    return [];
  }
}

// ─── Fetch all RSS feeds in parallel ─────────────────────────────────────────

export async function fetchAllRSSFeeds(): Promise<RawNewsItem[]> {
  console.log(`Fetching ${RSS_SOURCES.length} RSS feeds...`);

  const results = await Promise.allSettled(
    RSS_SOURCES.map((source) => fetchRSSFeed(source))
  );

  const items: RawNewsItem[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      items.push(...result.value);
      console.log(
        `  ✓ ${RSS_SOURCES[i].name}: ${result.value.length} items`
      );
    } else {
      console.warn(`  ✗ ${RSS_SOURCES[i].name}: failed`);
    }
  }

  console.log(`RSS total: ${items.length} items fetched`);
  return items;
}