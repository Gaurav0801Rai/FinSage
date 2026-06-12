"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Info,
  Zap,
  ExternalLink,
  X,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markAlertRead, dismissAlert } from "@/app/actions/alerts";

interface Alert {
  id: string;
  newsId: string;
  severity: "high" | "medium" | "low";
  affectedSymbols: string[];
  whyItMatters: string;
  confidence: number;
  createdAt: string;
  readAt: string | null;
  dismissed: boolean;
  newsTitle: string;
  newsUrl: string;
  newsSource: string;
}

interface AlertCardProps {
  alert: Alert;
}

const SEVERITY_CONFIG = {
  high: {
    icon: Zap,
    label: "High Impact",
    color: "text-loss",
    bg: "bg-loss/10",
    border: "border-loss/30",
    dot: "bg-loss",
    headerBg: "bg-loss/[0.06]",
  },
  medium: {
    icon: AlertTriangle,
    label: "Medium Impact",
    color: "text-accent-400",
    bg: "bg-accent-500/10",
    border: "border-accent-500/30",
    dot: "bg-accent-400",
    headerBg: "bg-accent-500/[0.06]",
  },
  low: {
    icon: Info,
    label: "Low Impact",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
    headerBg: "bg-blue-500/[0.06]",
  },
};

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

export function AlertCard({ alert }: AlertCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [read, setRead] = useState(!!alert.readAt);
  const [loading, setLoading] = useState(false);

  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;
  const isUnread = !read;

  const handleMarkRead = async () => {
    if (read || loading) return;
    setLoading(true);
    setRead(true);
    await markAlertRead(alert.id);
    setLoading(false);
  };

  const handleDismiss = async () => {
    setLoading(true);
    setDismissed(true);
    await dismissAlert(alert.id);
    setLoading(false);
  };

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleMarkRead}
      className={cn(
        "glass-card rounded-2xl overflow-hidden cursor-pointer",
        "border transition-all duration-300",
        isUnread
          ? `${config.border} ring-1 ring-inset ${config.border}`
          : "border-glass-border",
        "hover:border-glass-border-hover"
      )}
    >
      {/* Severity header bar */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5",
          config.headerBg,
          "border-b border-glass-border"
        )}
      >
        <div className="flex items-center gap-2">
          {/* Unread dot */}
          {isUnread && (
            <div
              className={cn(
                "w-2 h-2 rounded-full shrink-0 animate-pulse",
                config.dot
              )}
            />
          )}
          <Icon className={cn("w-3.5 h-3.5", config.color)} />
          <span className={cn("text-xs font-semibold", config.color)}>
            {config.label}
          </span>
          {/* Confidence */}
          <span className="text-xs text-white/30">
            · {Math.round(alert.confidence * 100)}% confidence
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-white/30">
          <Clock className="w-3 h-3" />
          <span className="text-xs">{timeAgo(alert.createdAt)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Affected holdings badges */}
        {alert.affectedSymbols.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs text-white/40 self-center">
              Affects:
            </span>
            {alert.affectedSymbols.map((symbol) => (
              <span
                key={symbol}
                className={cn(
                  "text-xs font-mono font-semibold px-2.5 py-1",
                  "rounded-lg border",
                  config.bg,
                  config.border,
                  config.color
                )}
              >
                {symbol}
              </span>
            ))}
          </div>
        )}

        {/* News title */}
        <p className="text-sm font-medium text-white/80 leading-snug mb-2">
          {alert.newsTitle}
        </p>

        {/* AI explanation */}
        <div
          className={cn(
            "p-3 rounded-xl mb-3",
            "bg-white/[0.03] border border-white/[0.06]"
          )}
        >
          <p className="text-xs text-white/30 font-medium mb-1.5 uppercase
                        tracking-wider">
            Why it matters
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            {alert.whyItMatters}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <a
            href={alert.newsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-white/40
                       hover:text-accent-400 transition-colors"
          >
            {alert.newsSource}
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkRead();
                }}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5
                           text-xs text-white/50 hover:text-white/80
                           glass-card rounded-lg transition-colors"
              >
                <Check className="w-3 h-3" />
                Mark read
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              disabled={loading}
              className="p-1.5 text-white/30 hover:text-loss
                         hover:bg-loss/10 rounded-lg transition-colors"
              title="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}