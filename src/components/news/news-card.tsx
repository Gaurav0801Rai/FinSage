"use client";

import { motion } from "framer-motion";
import { ExternalLink, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: string;
  tickers: string[];
  isMacro: boolean;
  imageUrl: string | null;
  publishedAt: string;
  processed: boolean;
}

interface NewsCardProps {
  item: NewsItem;
  userSymbols: string[];
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffM < 1) return "just now";
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  return `${diffD}d ago`;
}

const CATEGORY_COLORS: Record<string, string> = {
  stock: "text-accent-400 bg-accent-500/10 border-accent-500/20",
  crypto: "text-gain bg-gain/10 border-gain/20",
  macro: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  geopolitical: "text-loss bg-loss/10 border-loss/20",
};

export function NewsCard({ item, userSymbols }: NewsCardProps) {
  const matchedTickers = item.tickers.filter((t) =>
    userSymbols.includes(t)
  );

  const categoryColor =
    CATEGORY_COLORS[item.category] ??
    "text-white/50 bg-white/5 border-white/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card glass-card-hover rounded-2xl p-5 group"
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges and time */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span
              className={cn(
                "text-2xs font-medium px-2 py-0.5 rounded-full border",
                categoryColor
              )}
            >
              {item.category.charAt(0).toUpperCase() +
                item.category.slice(1)}
            </span>

            {item.isMacro && (
              <span
                className="text-2xs font-medium px-2 py-0.5 rounded-full
                           border text-accent-400 bg-accent-500/10
                           border-accent-500/20"
              >
                Market-wide
              </span>
            )}

            {matchedTickers.slice(0, 3).map((ticker) => (
              <span
                key={ticker}
                className="text-2xs font-mono font-semibold px-2 py-0.5
                           rounded-full border text-white/80
                           bg-white/[0.06] border-white/10"
              >
                {ticker}
              </span>
            ))}

            <div className="flex items-center gap-1 ml-auto text-white/30">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{timeAgo(item.publishedAt)}</span>
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-sm font-semibold text-white/90 leading-snug
                       mb-2 line-clamp-2 group-hover:text-white
                       transition-colors"
          >
            {item.title}
          </h3>

          {/* Summary */}
          {item.summary && (
            <p
              className="text-xs text-white/45 leading-relaxed
                         line-clamp-2 mb-3"
            >
              {item.summary}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white/30">
              <Globe className="w-3 h-3" />
              <span className="text-xs">{item.source}</span>
            </div>

            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs
                         text-accent-400/70 hover:text-accent-400
                         transition-colors"
            >
              Read more
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Image thumbnail */}
        {item.imageUrl && (
          <div
            className="w-20 h-20 rounded-xl overflow-hidden shrink-0
                       bg-white/[0.03] hidden sm:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover opacity-70
                         group-hover:opacity-90 transition-opacity"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}