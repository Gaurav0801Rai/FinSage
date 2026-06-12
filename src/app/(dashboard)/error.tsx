"use client";

import { useEffect } from "react";
import { motion }    from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="p-6 md:p-10 flex items-center justify-center
                    min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="w-14 h-14 rounded-2xl bg-loss/10
                        border border-loss/20
                        flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-6 h-6 text-loss" />
        </div>
        <h2 className="text-lg font-semibold mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-white/50 mb-6 leading-relaxed">
          An error occurred while loading this page.
          Try refreshing — if the problem persists, check the console.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5
                     btn-glow rounded-xl text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </motion.div>
    </div>
  );
}