"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Upload, TrendingUp, Bell, BarChart3 } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export function EmptyDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center
                 min-h-[60vh] text-center px-4"
    >
      {/* Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-accent-500/10
                        border border-accent-500/20
                        flex items-center justify-center">
          <TrendingUp className="w-9 h-9 text-accent-400" />
        </div>
        <div className="absolute -inset-2 rounded-3xl border
                        border-accent-500/10 animate-pulse" />
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-3">
        Your dashboard is empty
      </h2>
      <p className="text-white/50 max-w-sm mb-8 leading-relaxed">
        Upload a screenshot of your broker portfolio and AI will extract
        your holdings automatically. Takes about 30 seconds.
      </p>

      {/* CTA */}
      <Link
        href={ROUTES.upload}
        className="inline-flex items-center gap-2.5 px-6 py-3.5
                   btn-glow rounded-xl font-medium mb-10"
      >
        <Upload className="w-4 h-4" />
        Upload portfolio screenshot
      </Link>

      {/* Feature pills */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {[
          { icon: BarChart3, text: "Live prices" },
          { icon: Bell,      text: "AI alerts" },
          { icon: TrendingUp, text: "P&L tracking" },
        ].map((f) => (
          <div
            key={f.text}
            className="flex items-center gap-2 px-3 py-2
                       glass-card rounded-full text-xs text-white/50"
          >
            <f.icon className="w-3.5 h-3.5 text-accent-400/70" />
            {f.text}
          </div>
        ))}
      </div>
    </motion.div>
  );
}