"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatINR, formatPercent } from "@/lib/utils";

interface PortfolioHeroProps {
  totalValue:      number;
  totalInvested:   number;
  totalPnL:        number;
  totalPnLPercent: number;
  dayPnL:          number;
  dayPnLPercent:   number;
  baseCurrency?:   "INR" | "USD";
}

function useCountUp(target: number, duration = 1200) {
  const [current, setCurrent]      = useState(0);
  const startTime                  = useRef<number | null>(null);
  const rafRef                     = useRef<number>();

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed  = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

function formatValue(value: number, currency: "INR" | "USD"): string {
  if (currency === "USD") {
    return `$${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return formatINR(value);
}

export function PortfolioHero({
  totalValue,
  totalInvested,
  totalPnL,
  totalPnLPercent,
  dayPnL,
  dayPnLPercent,
  baseCurrency = "INR",
}: PortfolioHeroProps) {
  const animatedValue = useCountUp(totalValue);

  const isTotalGain = totalPnL >= 0;
  const isDayGain   = dayPnL >= 0;
  const isDayFlat   = Math.abs(dayPnLPercent) < 0.01;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-6 md:p-8 ring-glow-amber"
    >
      <div className="flex flex-col md:flex-row md:items-end
                      md:justify-between gap-6">

        {/* Left — total value */}
        <div>
          <p className="text-sm text-white/50 mb-2 font-medium">
            Total Portfolio Value
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="text-4xl md:text-5xl font-semibold
                         font-mono tabular tracking-tight text-white"
            >
              {formatValue(animatedValue, baseCurrency)}
            </span>
          </div>

          {/* Total P&L */}
          <div
            className={cn(
              "flex items-center gap-2 mt-3",
              isTotalGain ? "text-gain" : "text-loss"
            )}
          >
            {isTotalGain
              ? <TrendingUp   className="w-4 h-4" />
              : <TrendingDown className="w-4 h-4" />
            }
            <span className="text-sm font-mono font-medium">
              {isTotalGain ? "+" : "-"}
              {formatValue(totalPnL, baseCurrency)}
            </span>
            <span className="text-sm font-mono opacity-80">
              ({formatPercent(totalPnLPercent)})
            </span>
            <span className="text-xs text-white/30 font-sans">
              all time
            </span>
          </div>
        </div>

        {/* Right — today's change */}
        <div
          className={cn(
            "flex flex-col items-start md:items-end",
            "px-5 py-4 rounded-xl border",
            isDayFlat
              ? "border-white/10 bg-white/[0.02]"
              : isDayGain
              ? "border-gain/20 bg-gain/[0.06]"
              : "border-loss/20 bg-loss/[0.06]"
          )}
        >
          <p className="text-xs text-white/40 mb-1">Today</p>
          <div
            className={cn(
              "flex items-center gap-2",
              isDayFlat
                ? "text-white/60"
                : isDayGain ? "text-gain" : "text-loss"
            )}
          >
            {isDayFlat
              ? <Minus        className="w-4 h-4" />
              : isDayGain
              ? <TrendingUp   className="w-4 h-4" />
              : <TrendingDown className="w-4 h-4" />
            }
            <span className="text-2xl font-mono font-semibold tabular">
              {isDayGain && !isDayFlat ? "+" : ""}
              {formatValue(dayPnL, baseCurrency)}
            </span>
          </div>
          <span
            className={cn(
              "text-sm font-mono mt-0.5",
              isDayFlat
                ? "text-white/40"
                : isDayGain ? "text-gain/80" : "text-loss/80"
            )}
          >
            {formatPercent(dayPnLPercent)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">
            Invested: {formatValue(totalInvested, baseCurrency)}
          </span>
          <span className="text-xs text-white/40">
            Current: {formatValue(totalValue, baseCurrency)}
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width:
                totalInvested > 0
                  ? `${Math.min(
                      (totalValue / totalInvested) * 100,
                      200
                    )}%`
                  : "100%",
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "h-full rounded-full",
              isTotalGain
                ? "bg-gradient-to-r from-gain/60 to-gain"
                : "bg-gradient-to-r from-loss/60 to-loss"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}