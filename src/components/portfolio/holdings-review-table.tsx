"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import type { ExtractedHolding } from "@/types/portfolio";

interface HoldingsReviewTableProps {
  holdings: ExtractedHolding[];
  onChange: (id: string, updated: Partial<ExtractedHolding>) => void;
  onDelete: (id: string) => void;
}

export function HoldingsReviewTable({
  holdings,
  onChange,
  onDelete,
}: HoldingsReviewTableProps) {
  // Check if a row has potentially bad data (flagged with warning icon)
  const hasWarning = useCallback((h: ExtractedHolding) => {
    return h.quantity <= 0 || h.avgBuyPrice <= 0;
  }, []);

  if (holdings.length === 0) {
    return (
      <div className="glass-card rounded-[12px] p-12 text-center">
        <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">
          No holdings yet. Add one using the button below.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[12px] overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto]
                      gap-3 px-4 py-3 border-b border-glass-border
                      text-xs font-medium text-white/40 uppercase tracking-wider">
        <span>Symbol / Name</span>
        <span>Type / Exchange</span>
        <span>Quantity</span>
        <span>Avg Buy Price</span>
        <span>Currency</span>
        <span />
      </div>

      {/* Table rows */}
      <AnimatePresence initial={false}>
        {holdings.map((holding, index) => (
          <motion.div
            key={holding.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={cn(
                "grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto]",
                "gap-3 px-4 py-4 items-center",
                "border-b border-glass-border last:border-b-0",
                "hover:bg-white/[0.02] transition-colors",
                hasWarning(holding) && "bg-[#E2B659]/[0.03]"
              )}
            >
              {/* Col 1 — Symbol and Name */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  {hasWarning(holding) && (
                    <AlertTriangle className="w-3.5 h-3.5 text-accent-400
                                              shrink-0" />
                  )}
                  <input
                    value={holding.symbol}
                    onChange={(e) =>
                      onChange(holding.id, {
                        symbol: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SYMBOL"
                    className={cn(
                      "w-full bg-transparent font-mono text-sm font-semibold",
                      "text-white/90 placeholder-white/30",
                      "border-b border-transparent",
                      "hover:border-white/20 focus:border-accent-400",
                      "focus:outline-none transition-colors py-0.5"
                    )}
                  />
                </div>
                <input
                  value={holding.name}
                  onChange={(e) =>
                    onChange(holding.id, { name: e.target.value })
                  }
                  placeholder="Company name"
                  className={cn(
                    "w-full bg-transparent text-xs text-white/50",
                    "placeholder-white/20",
                    "border-b border-transparent",
                    "hover:border-white/10 focus:border-white/30",
                    "focus:outline-none transition-colors py-0.5"
                  )}
                />
              </div>

              {/* Col 2 — Type and Exchange */}
              <div className="flex flex-col gap-1.5">
                <select
                  value={holding.type}
                  onChange={(e) =>
                    onChange(holding.id, {
                      type: e.target.value as ExtractedHolding["type"],
                    })
                  }
                  className={cn(
                    "bg-transparent text-sm text-white/80",
                    "border border-white/10 rounded-lg px-2 py-1",
                    "focus:outline-none focus:border-accent-400/50",
                    "transition-colors cursor-pointer",
                    "[&>option]:bg-canvas"
                  )}
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="etf">ETF</option>
                </select>

                {/* Exchange selector — only for stocks */}
                {holding.type === "stock" && (
                  <select
                    value={holding.exchange ?? "NSE"}
                    onChange={(e) =>
                      onChange(holding.id, {
                        exchange: e.target.value as "NSE" | "BSE",
                      })
                    }
                    className={cn(
                      "bg-transparent text-xs text-white/60",
                      "border border-white/[0.06] rounded-md px-2 py-1",
                      "focus:outline-none focus:border-white/20",
                      "transition-colors cursor-pointer",
                      "[&>option]:bg-canvas"
                    )}
                  >
                    <option value="NSE">NSE</option>
                    <option value="BSE">BSE</option>
                  </select>
                )}
              </div>

              {/* Col 3 — Quantity */}
              <div>
                <input
                  type="number"
                  value={holding.quantity || ""}
                  onChange={(e) =>
                    onChange(holding.id, {
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                  step="any"
                  className={cn(
                    "w-full bg-transparent font-mono text-sm",
                    "text-white/90 placeholder-white/30",
                    "border-b border-transparent",
                    "hover:border-white/20 focus:border-accent-400",
                    "focus:outline-none transition-colors py-0.5",
                    holding.quantity <= 0 && "text-accent-400"
                  )}
                />
              </div>

              {/* Col 4 — Avg Buy Price */}
              <div>
                <input
                  type="number"
                  value={holding.avgBuyPrice || ""}
                  onChange={(e) =>
                    onChange(holding.id, {
                      avgBuyPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  min="0"
                  step="any"
                  className={cn(
                    "w-full bg-transparent font-mono text-sm",
                    "text-white/90 placeholder-white/30",
                    "border-b border-transparent",
                    "hover:border-white/20 focus:border-accent-400",
                    "focus:outline-none transition-colors py-0.5",
                    holding.avgBuyPrice <= 0 && "text-accent-400"
                  )}
                />
                {/* Show formatted value below the input */}
                {holding.avgBuyPrice > 0 && (
                  <p className="text-xs text-white/30 mt-0.5 font-mono">
                    {holding.currency === "INR"
                      ? formatINR(holding.avgBuyPrice)
                      : `$${holding.avgBuyPrice.toLocaleString()}`}
                  </p>
                )}
              </div>

              {/* Col 5 — Currency */}
              <div>
                <select
                  value={holding.currency}
                  onChange={(e) =>
                    onChange(holding.id, {
                      currency: e.target.value as "INR" | "USD",
                    })
                  }
                  className={cn(
                    "bg-transparent text-sm text-white/80",
                    "border border-white/10 rounded-lg px-2 py-1",
                    "focus:outline-none focus:border-accent-400/50",
                    "transition-colors cursor-pointer",
                    "[&>option]:bg-canvas"
                  )}
                >
                  <option value="INR">INR ₹</option>
                  <option value="USD">USD $</option>
                </select>
              </div>

              {/* Col 6 — Delete button */}
              <button
                onClick={() => onDelete(holding.id)}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  "text-white/20 hover:text-loss hover:bg-loss/10"
                )}
                title="Remove this holding"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Warning row — shown below if data looks bad */}
            {hasWarning(holding) && (
              <div className="px-4 py-2 bg-accent-500/[0.04]
                              border-b border-glass-border">
                <p className="text-xs text-accent-400/80">
                  ⚠ Quantity or price looks incorrect — please check and
                  correct this row before saving.
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Footer summary */}
      <div className="px-4 py-3 bg-white/[0.01] flex items-center
                      justify-between">
        <p className="text-xs text-white/40">
          {holdings.length} holding{holdings.length !== 1 ? "s" : ""}
          {holdings.filter(hasWarning).length > 0 && (
            <span className="text-accent-400 ml-2">
              · {holdings.filter(hasWarning).length} need attention
            </span>
          )}
        </p>
        <p className="text-xs text-white/30">
          Click any cell to edit
        </p>
      </div>
    </div>
  );
}