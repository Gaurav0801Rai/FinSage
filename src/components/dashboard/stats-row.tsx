"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
} from "lucide-react";
import { cn, formatINR, formatPercent } from "@/lib/utils";

interface StatsRowProps {
  totalInvested: number;
  totalPnLPercent: number;
  bestPerformer:  { symbol: string; changePercent: number } | null;
  worstPerformer: { symbol: string; changePercent: number } | null;
  holdingCount: number;
  baseCurrency?: "INR" | "USD";
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function StatsRow({
  totalInvested,
  totalPnLPercent,
  bestPerformer,
  worstPerformer,
  holdingCount,
  baseCurrency = "INR",
}: StatsRowProps) {
  const isOverallGain = totalPnLPercent >= 0;

  const stats = [
    {
      label:   "Total Invested",
      value:   baseCurrency === "USD"
        ? `$${totalInvested.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : formatINR(totalInvested),
      sub:     `${holdingCount} holdings`,
      icon:    Wallet,
      color:   "text-accent-400",
      bgColor: "bg-accent-500/10",
      border:  "border-accent-500/20",
    },
    {
      label: "Total Return",
      value: formatPercent(totalPnLPercent),
      sub:   isOverallGain ? "All time gain" : "All time loss",
      icon:  isOverallGain ? TrendingUp : TrendingDown,
      color:   isOverallGain ? "text-gain" : "text-loss",
      bgColor: isOverallGain ? "bg-gain/10"  : "bg-loss/10",
      border:  isOverallGain ? "border-gain/20" : "border-loss/20",
    },
    {
      label: "Best Today",
      value: bestPerformer
        ? `${bestPerformer.symbol}`
        : "—",
      sub: bestPerformer
        ? formatPercent(bestPerformer.changePercent)
        : "No data",
      icon:    Award,
      color:   "text-gain",
      bgColor: "bg-gain/10",
      border:  "border-gain/20",
    },
    {
      label: "Worst Today",
      value: worstPerformer
        ? `${worstPerformer.symbol}`
        : "—",
      sub: worstPerformer
        ? formatPercent(worstPerformer.changePercent)
        : "No data",
      icon:    AlertTriangle,
      color:   "text-loss",
      bgColor: "bg-loss/10",
      border:  "border-loss/20",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={cardVariants}
          className="glass-card glass-card-hover rounded-2xl p-5"
        >
          {/* Icon */}
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center mb-4",
            "border",
            stat.bgColor,
            stat.border
          )}>
            <stat.icon className={cn("w-4 h-4", stat.color)} />
          </div>

          {/* Value */}
          <p className={cn(
            "text-xl font-semibold font-mono tabular tracking-tight mb-1",
            stat.color
          )}>
            {stat.value}
          </p>

          {/* Label */}
          <p className="text-xs text-white/50 font-medium">
            {stat.label}
          </p>

          {/* Sub */}
          <p className="text-xs text-white/30 mt-0.5">
            {stat.sub}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );
}