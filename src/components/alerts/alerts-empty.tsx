"use client";

import { motion } from "framer-motion";
import { Bell, Sparkles } from "lucide-react";

export function AlertsEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center
                 py-24 text-center"
    >
      {/* Icon */}
      <div className="relative mb-6">
        <div
          className="w-16 h-16 rounded-[12px] bg-accent-500/10
                      border border-accent-500/20
                      flex items-center justify-center"
        >
          <Bell className="w-7 h-7 text-accent-400/60" />
        </div>
        <div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full
                      bg-canvas border border-accent-500/30
                      flex items-center justify-center"
        >
          <Sparkles className="w-3 h-3 text-accent-400" />
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
      <p className="text-sm text-white/40 max-w-xs leading-relaxed mb-2">
        When news impacts your holdings, AI-generated alerts will appear
        here with an explanation of why it matters to you.
      </p>
      <p className="text-xs text-white/25">
        The pipeline checks for new news every 15 minutes.
      </p>
    </motion.div>
  );
}