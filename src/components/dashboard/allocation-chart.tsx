"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AllocationChartProps {
  allocationByType: Record<string, number>;
}

const TYPE_LABELS: Record<string, string> = {
  stock:       "Stocks",
  crypto:      "Crypto",
  mutual_fund: "Mutual Funds",
  etf:         "ETFs",
};

const TYPE_COLORS: Record<string, string> = {
  stock:       "#FBBF24", // amber
  crypto:      "#10B981", // emerald
  mutual_fund: "#3B82F6", // blue
  etf:         "#8B5CF6", // purple
};

const TYPE_BG: Record<string, string> = {
  stock:       "bg-accent-500/20",
  crypto:      "bg-gain/20",
  mutual_fund: "bg-blue-500/20",
  etf:         "bg-purple-500/20",
};

// Custom tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card px-3 py-2 rounded-xl text-sm border
                    border-glass-border-hover">
      <p className="font-medium text-white/90">{payload[0].name}</p>
      <p className="text-white/60 font-mono">
        {payload[0].value.toFixed(1)}%
      </p>
    </div>
  );
}

export function AllocationChart({ allocationByType }: AllocationChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = Object.entries(allocationByType)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({
      name:  TYPE_LABELS[type] ?? type,
      value: parseFloat(value.toFixed(1)),
      type,
      color: TYPE_COLORS[type] ?? "#94A3B8",
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center
                      justify-center h-[280px]">
        <p className="text-white/30 text-sm">No allocation data</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-sm font-semibold text-white/80 mb-5">
        Asset Allocation
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="w-[160px] h-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.type}
                    fill={entry.color}
                    opacity={
                      activeIndex === null || activeIndex === index
                        ? 1
                        : 0.4
                    }
                    style={{ cursor: "pointer", outline: "none" }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((entry, index) => (
            <div
              key={entry.type}
              className="flex items-center justify-between"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-white/70">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-mono font-medium text-white/90">
                {entry.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}