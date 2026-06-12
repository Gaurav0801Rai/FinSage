"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatINR, formatPercent } from "@/lib/utils";
import type { Holding } from "@/types/index";

interface HoldingsListProps {
  holdings: Holding[];
  // Optional: pass current prices if available
  // In Phase 2 we show static data; Phase 3 wires live prices
  prices?: Record<string, { price: number; changePercent: number }>;
}

// Stagger animation for the list rows
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function HoldingsList({ holdings, prices = {} }: HoldingsListProps) {
  if (holdings.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm mb-1">No holdings yet</p>
        <p className="text-white/30 text-xs">
          Upload a portfolio screenshot to get started
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="grid grid-cols-[2fr_1fr_1fr_1fr]
                   gap-4 px-5 py-3 border-b border-glass-border
                   text-xs font-medium text-white/40
                   uppercase tracking-wider"
      >
        <span>Asset</span>
        <span className="text-right">Quantity</span>
        <span className="text-right">Avg Price</span>
        <span className="text-right">Value</span>
      </div>

      {/* Rows */}
      {holdings.map((holding) => {
        const livePrice = prices[holding.symbol];
        const currentPrice = livePrice?.price ?? holding.avgBuyPrice;
        const changePercent = livePrice?.changePercent ?? 0;
        const marketValue = currentPrice * holding.quantity;
        const pnl = (currentPrice - holding.avgBuyPrice) * holding.quantity;
        const pnlPercent =
          ((currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100;

        const isGain = pnl > 0;
        const isLoss = pnl < 0;

        return (
          <motion.div
            key={holding.id}
            variants={rowVariants}
            className={cn(
              "grid grid-cols-[2fr_1fr_1fr_1fr]",
              "gap-4 px-5 py-4 items-center",
              "border-b border-glass-border last:border-b-0",
              "hover:bg-white/[0.02] transition-colors group"
            )}
          >
            {/* Asset info */}
            <div className="flex items-center gap-3">
              {/* Symbol badge */}
              <div
                className="w-9 h-9 rounded-xl bg-accent-500/10
                              border border-accent-500/20
                              flex items-center justify-center
                              shrink-0"
              >
                <span className="text-xs font-bold font-mono text-accent-400">
                  {holding.symbol.slice(0, 2)}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold font-mono text-white/90 truncate">
                  {holding.symbol}
                </p>
                <p className="text-xs text-white/40 truncate">{holding.name}</p>
              </div>

              {/* Exchange badge */}
              {holding.exchange && (
                <span
                  className="hidden sm:inline-flex px-1.5 py-0.5
                               text-2xs font-mono text-white/40
                               border border-white/[0.08] rounded-md"
                >
                  {holding.exchange}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="text-right">
              <p className="text-sm font-mono text-white/80">
                {holding.quantity % 1 === 0
                  ? holding.quantity.toLocaleString("en-IN")
                  : holding.quantity.toFixed(4)}
              </p>
              <p className="text-xs text-white/30 capitalize">
                {holding.type.replace("_", " ")}
              </p>
            </div>

            {/* Avg buy price */}
            <div className="text-right">
              <p className="text-sm font-mono text-white/80">
                {holding.currency === "INR"
                  ? formatINR(holding.avgBuyPrice)
                  : `$${holding.avgBuyPrice.toLocaleString()}`}
              </p>
              <p className="text-xs text-white/30">avg buy</p>
            </div>

            {/* Market value + P&L */}
            <div className="text-right">
              <p className="text-sm font-mono text-white/90 font-medium">
                {holding.currency === "INR"
                  ? formatINR(marketValue)
                  : `$${marketValue.toLocaleString()}`}
              </p>

              {/* P&L — only show if we have live prices */}
              {livePrice ? (
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-0.5",
                    isGain && "text-gain",
                    isLoss && "text-loss",
                    !isGain && !isLoss && "text-white/40"
                  )}
                >
                  {isGain && <TrendingUp className="w-3 h-3" />}
                  {isLoss && <TrendingDown className="w-3 h-3" />}
                  {!isGain && !isLoss && <Minus className="w-3 h-3" />}
                  <span className="text-xs font-mono">
                    {formatPercent(pnlPercent)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-white/30 mt-0.5">
                  at cost price
                </p>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Footer */}
      <div
        className="px-5 py-3 bg-white/[0.01]
                   border-t border-glass-border
                   flex items-center justify-between"
      >
        <p className="text-xs text-white/30">
          {holdings.length} holding{holdings.length !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-white/20">
          Live prices in Phase 3
        </p>
      </div>
    </motion.div>
  );
}