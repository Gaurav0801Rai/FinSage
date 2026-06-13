"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { markCategoryAlertsRead } from "@/app/actions/alerts";

interface MarkCategoryReadButtonProps {
  symbol: string;
}

export function MarkCategoryReadButton({ symbol }: MarkCategoryReadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    await markCategoryAlertsRead(symbol);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-white/50 hover:text-accent-400 hover:border-accent-500/30 glass-card rounded-lg transition-all border border-white/[0.04] disabled:opacity-50 font-medium"
      title="Mark all in this category as read"
    >
      <Check className="w-3 h-3" />
      <span>Mark all read</span>
    </button>
  );
}
