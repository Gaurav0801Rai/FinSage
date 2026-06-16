"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AlertCard } from "./alert-card";
import { MarkCategoryReadButton } from "./mark-category-read-button";

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

interface Group {
  symbol: string;
  name: string;
  alerts: Alert[];
  unreadCount: number;
}

interface CollapsibleAlertsListProps {
  sortedGroups: Group[];
}

export function CollapsibleAlertsList({ sortedGroups }: CollapsibleAlertsListProps) {
  // Store open/close state for each group by its symbol (or "GENERAL")
  // By default, expand groups that have unread alerts
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sortedGroups.forEach((group) => {
      const key = group.symbol || "GENERAL";
      initial[key] = group.unreadCount > 0;
    });
    return initial;
  });

  const toggleGroup = (key: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-5">
      {sortedGroups.map((group) => {
        const key = group.symbol || "GENERAL";
        const isOpen = !!openStates[key];

        return (
          <div
            key={key}
            className="glass-card rounded-[12px] border border-white/[0.06] bg-[#121820] overflow-hidden transition-all duration-300"
          >
            {/* Header Row */}
            <div
              onClick={() => toggleGroup(key)}
              className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-white/90">
                  {group.name}
                </h2>
                {group.symbol && (
                  <span className="text-[10px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-white/50">
                    {group.symbol}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Mark all read button */}
                {group.unreadCount > 0 && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <MarkCategoryReadButton symbol={group.symbol} />
                  </div>
                )}

                {/* Counts badges */}
                <div className="flex items-center gap-1.5">
                  {group.unreadCount > 0 ? (
                    <span className="text-xs font-semibold text-accent-400 bg-accent-500/[0.04] border border-accent-500/10 px-2.5 py-1 rounded-full">
                      {group.unreadCount} new
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-white/40 bg-white/[0.02] border border-white/[0.04] px-2.5 py-1 rounded-full">
                      {group.alerts.length} total
                    </span>
                  )}
                </div>

                {/* Chevron icon */}
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-white/40"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </div>
            </div>

            {/* Collapsible alerts content */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-4 md:p-5 pt-0 border-t border-white/[0.04] bg-[#0E131A]/30 space-y-4">
                    {group.alerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
