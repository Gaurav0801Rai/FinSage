"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
} from "lucide-react";
import { cn, formatINR, formatPercent } from "@/lib/utils";
import type { EnrichedHolding } from "@/lib/price-service";

interface HoldingsTableProps {
  holdings: EnrichedHolding[];
  baseCurrency?: "INR" | "USD";
  onEdit?: (holding: EnrichedHolding) => void;
  onDelete?: (holding: EnrichedHolding) => void;
}

type SortKey = "symbol" | "marketValue" | "pnl" | "dayChange";
type SortDir = "asc" | "desc";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function HoldingsTable({
  holdings,
  baseCurrency = "INR",
  onEdit,
  onDelete,
}: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("marketValue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...holdings].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    if (sortKey === "symbol") {
      aVal = a.symbol;
      bVal = b.symbol;
    } else if (sortKey === "marketValue") {
      aVal = a.marketValue;
      bVal = b.marketValue;
    } else if (sortKey === "pnl") {
      aVal = a.pnlPercent;
      bVal = b.pnlPercent;
    } else if (sortKey === "dayChange") {
      aVal = a.dayChangePercent;
      bVal = b.dayChangePercent;
    }

    if (typeof aVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }

    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) {
      return <ChevronDown className="w-3 h-3 opacity-20" />;
    }
    return sortDir === "asc"
      ? <ChevronUp   className="w-3 h-3 text-accent-400" />
      : <ChevronDown className="w-3 h-3 text-accent-400" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4
                      border-b border-glass-border">
        <h3 className="text-sm font-semibold text-white/80">Holdings</h3>
        <span className="text-xs text-white/30">
          {holdings.length} position{holdings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table header row */}
      <div className={cn(
        "grid gap-4 px-5 py-3 border-b border-glass-border text-xs text-white/40",
        (onEdit || onDelete)
          ? "grid-cols-[2fr_1fr_1fr_1fr_1fr_80px]"
          : "grid-cols-[2fr_1fr_1fr_1fr_1fr]"
      )}>

        <button
          onClick={() => handleSort("symbol")}
          className="flex items-center gap-1 hover:text-white/70
                     transition-colors text-left"
        >
          Asset <SortIcon col="symbol" />
        </button>

        <span className="text-right">Price</span>

        <button
          onClick={() => handleSort("marketValue")}
          className="flex items-center justify-end gap-1
                     hover:text-white/70 transition-colors"
        >
          Value <SortIcon col="marketValue" />
        </button>

        <button
          onClick={() => handleSort("pnl")}
          className="flex items-center justify-end gap-1
                     hover:text-white/70 transition-colors"
        >
          P&amp;L <SortIcon col="pnl" />
        </button>

        <button
          onClick={() => handleSort("dayChange")}
          className="flex items-center justify-end gap-1
                     hover:text-white/70 transition-colors"
        >
          Today <SortIcon col="dayChange" />
        </button>

        {(onEdit || onDelete) && <span className="text-right">Actions</span>}
      </div>

      {/* Rows */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sorted.map((holding) => {
          const isPnlGain  = holding.pnl >= 0;
          const isDayGain  = holding.dayChange >= 0;
          const isDayFlat  = Math.abs(holding.dayChangePercent) < 0.01;

          return (
            <motion.div
              key={holding.id}
              variants={rowVariants}
              className={cn(
                "grid gap-4 px-5 py-4 items-center border-b border-glass-border last:border-b-0 hover:bg-white/[0.02] transition-colors group",
                (onEdit || onDelete)
                  ? "grid-cols-[2fr_1fr_1fr_1fr_1fr_80px]"
                  : "grid-cols-[2fr_1fr_1fr_1fr_1fr]"
              )}
            >
              {/* Asset */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent-500/10
                                border border-accent-500/20
                                flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold font-mono
                                   text-accent-400">
                    {holding.symbol.slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold font-mono
                                  text-white/90 truncate">
                      {holding.symbol}
                    </p>
                    {holding.exchange && (
                      <span className="hidden sm:inline text-2xs
                                       font-mono text-white/30
                                       border border-white/[0.08]
                                       px-1 py-0.5 rounded">
                        {holding.exchange}
                      </span>
                    )}
                    {holding.priceSource === "fallback" && (
                      <span className="hidden sm:inline text-2xs
                                       text-accent-400/60">
                        est.
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">
                    {holding.name}
                  </p>
                </div>
              </div>

              {/* Current price */}
              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-white/90">
                  {holding.currency === "INR"
                    ? formatINR(holding.currentPrice)
                    : `$${holding.currentPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                  }
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  {holding.quantity % 1 === 0
                    ? holding.quantity.toLocaleString("en-IN")
                    : holding.quantity.toFixed(4)
                  } units
                </p>
              </div>

              {/* Market value */}
              <div className="text-right">
                <p className="text-sm font-mono font-semibold text-white/95">
                  {holding.currency === "INR"
                    ? formatINR(holding.marketValue)
                    : `$${holding.marketValue.toLocaleString()}`
                  }
                </p>
              </div>

              {/* Total P&L */}
              <div className="text-right">
                <p className={cn(
                  "text-sm font-mono font-semibold",
                  isPnlGain ? "text-gain" : "text-loss"
                )}>
                  {isPnlGain ? "+" : ""}
                  {holding.currency === "INR"
                    ? formatINR(holding.pnl)
                    : `$${holding.pnl.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                  }
                </p>
                <p className={cn(
                  "text-xs font-mono mt-0.5",
                  isPnlGain ? "text-gain/70" : "text-loss/70"
                )}>
                  {formatPercent(holding.pnlPercent)}
                </p>
              </div>

              {/* Day change */}
              <div className="text-right">
                <div className={cn(
                  "inline-flex items-center gap-1 justify-end",
                  isDayFlat
                    ? "text-white/40"
                    : isDayGain ? "text-gain" : "text-loss"
                )}>
                  {isDayFlat
                    ? <Minus      className="w-3 h-3" />
                    : isDayGain
                    ? <TrendingUp   className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  <span className="text-sm font-mono font-semibold">
                    {formatPercent(holding.dayChangePercent)}
                  </span>
                </div>
              </div>

              {(onEdit || onDelete) && (
                <div className="flex items-center justify-end gap-2">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(holding);
                      }}
                      className="text-white/40 hover:text-accent-400 p-1 transition-colors"
                      title="Edit Position"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(holding);
                      }}
                      className="text-white/40 hover:text-loss p-1 transition-colors"
                      title="Delete Position"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}