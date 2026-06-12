import "server-only";
import { matchTickersInText, isMacroEvent } from "./ticker-dictionary";
import type { RawNewsItem } from "./rss-fetcher";

const REDDIT_SUBREDDITS = [
  {
    name: "r/IndiaInvestments",
    url: "https://www.reddit.com/r/IndiaInvestments/.rss",
    category: "stock" as const,
  },
  {
    name: "r/CryptoCurrency",
    url: "https://www.reddit.com/r/CryptoCurrency/.rss",
    category: "crypto" as const,
  },
];

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

function parseRedditAtom(xml: string): Array<{
  title: string;
  content: string;
  link: string;
  updated: string;
}> {
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  const entries = [];
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const title   = extractBetweenTags(entryXml, "title");
    const content = extractBetweenTags(entryXml, "content");
    
    // Find link href
    const linkMatch = entryXml.match(/<link[^>]+href="([^"]+)"/i);
    const link = linkMatch?.[1] ?? "";
    
    const updated = extractBetweenTags(entryXml, "updated") || extractBetweenTags(entryXml, "published");

    if (title && link) {
      entries.push({ title, content, link, updated });
    }
  }

  return entries;
}

export async function fetchRedditRSS(): Promise<RawNewsItem[]> {
  const items: RawNewsItem[] = [];

  for (const sub of REDDIT_SUBREDDITS) {
    try {
      console.log(`Fetching Reddit RSS for ${sub.name}...`);
      const res = await fetch(sub.url, {
        headers: {
          // Reddit blocks requests without a unique, descriptive User-Agent
          "User-Agent": "Mozilla/5.0 (compatible; PortfolioPulseBot/1.0; +https://portfoliopulse.app)",
          "Accept": "application/atom+xml, application/xml",
        },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        console.warn(`Reddit RSS fetch failed for ${sub.name}: ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const entries = parseRedditAtom(xml);

      for (const entry of entries) {
        const text = `${entry.title} ${entry.content}`;
        const tickers = matchTickersInText(text);
        const macro = isMacroEvent(text);

        let category: RawNewsItem["category"] = sub.category;
        if (macro && category === "stock") category = "macro";

        items.push({
          title: entry.title,
          summary: entry.content.slice(0, 500),
          url: entry.link,
          source: sub.name,
          sourceType: "rss",
          category,
          publishedAt: new Date(entry.updated || Date.now()),
          tickers,
          isMacro: macro,
        });
      }

      console.log(`  ✓ ${sub.name}: ${entries.length} items parsed`);
    } catch (err) {
      console.warn(`Reddit RSS error for ${sub.name}:`, err);
    }
  }

  return items;
}
