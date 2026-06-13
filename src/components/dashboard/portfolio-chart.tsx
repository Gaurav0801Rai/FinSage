"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface PortfolioChartProps {
  totalValue: number;
  totalPnLPercent: number;
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card px-3 py-2 rounded-xl text-sm
                    border border-glass-border-hover">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="font-mono font-medium text-white/90">
        ₹{payload[0].value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

export function PortfolioChart({
  totalValue,
  totalPnLPercent,
}: PortfolioChartProps) {
  const isGain = totalPnLPercent >= 0;

  // Generate simulated 30-day data based on current value and P&L
  // Real historical data replaces this in Phase 4
  const chartData = useMemo(() => {
    const days = 30;
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const label = date.toLocaleDateString("en-IN", {
        month: "short",
        day:   "numeric",
      });

      // Simulate a gradual trend from invested amount to current value
      const progress   = (days - i) / days;
      const easedProg  = 1 - Math.pow(1 - progress, 2);
      // Add small random daily noise so it looks realistic
      const noise      = (Math.random() - 0.5) * 0.008 * totalValue;
      const baseValue  = totalValue * (1 - (totalPnLPercent / 100) * (1 - easedProg));
      const value      = Math.max(0, Math.round(baseValue + noise));

      data.push({ label, value });
    }

    // Last point is always the exact current value
    data[data.length - 1].value = Math.round(totalValue);
    return data;
  }, [totalValue, totalPnLPercent]);

  const gradientId = "portfolioGradient";
  const strokeColor   = isGain ? "#10B981" : "#F43F5E";
  const gradientStart = isGain
    ? "rgba(16, 185, 129, 0.3)"
    : "rgba(244, 63, 94, 0.3)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="glass-card rounded-[12px] p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/80">
          Portfolio Performance
        </h3>
        <span className={cn(
          "text-xs font-mono px-2.5 py-1 rounded-lg border",
          isGain
            ? "text-gain bg-gain/10 border-gain/20"
            : "text-loss bg-loss/10 border-loss/20"
        )}>
          30d {isGain ? "+" : ""}
          {totalPnLPercent.toFixed(2)}%
        </span>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={gradientStart} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r:           4,
                fill:        strokeColor,
                strokeWidth: 0,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-white/25 mt-3 text-center">
        Simulated trend · Real history available in Phase 4
      </p>
    </motion.div>
  );
}