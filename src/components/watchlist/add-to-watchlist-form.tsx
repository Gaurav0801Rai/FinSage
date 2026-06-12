"use client";

import { useState }          from "react";
import { motion }            from "framer-motion";
import { Plus, X, Loader2 }  from "lucide-react";
import { cn }                from "@/lib/utils";
import { addToWatchlist }    from "@/app/actions/watchlist";

interface AddToWatchlistFormProps {
  onSuccess: () => void;
  onCancel:  () => void;
}

const EMPTY = {
  symbol:   "",
  name:     "",
  type:     "stock" as "stock" | "crypto" | "mutual_fund" | "etf",
  exchange: "NSE"   as "NSE" | "BSE" | null,
  currency: "INR"   as "INR" | "USD",
};

export function AddToWatchlistForm({
  onSuccess,
  onCancel,
}: AddToWatchlistFormProps) {
  const [form, setForm]     = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const update = (
    key: keyof typeof EMPTY,
    value: string
  ) => {
    setForm((p) => ({ ...p, [key]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.symbol.trim()) {
      setError("Symbol is required.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await addToWatchlist({
      symbol:   form.symbol.trim().toUpperCase(),
      name:     form.name.trim() || form.symbol.trim().toUpperCase(),
      type:     form.type,
      exchange: form.type === "stock" ? form.exchange : null,
      currency: form.currency,
    });

    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/90">
          Add to watchlist
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80
                     hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Symbol */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Ticker Symbol *
          </label>
          <input
            value={form.symbol}
            onChange={(e) => update("symbol", e.target.value.toUpperCase())}
            placeholder="e.g. RELIANCE, BTC"
            className="w-full px-3 py-2.5 rounded-xl text-sm font-mono
                       bg-white/[0.04] border border-white/10
                       hover:border-white/20 focus:border-accent-400/60
                       placeholder-white/20 text-white/90
                       focus:outline-none transition-colors"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Name (optional)
          </label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Reliance Industries"
            className="w-full px-3 py-2.5 rounded-xl text-sm
                       bg-white/[0.04] border border-white/10
                       hover:border-white/20 focus:border-accent-400/60
                       placeholder-white/20 text-white/90
                       focus:outline-none transition-colors"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Asset Type *
          </label>
          <select
            value={form.type}
            onChange={(e) => {
              update("type", e.target.value);
              if (e.target.value === "crypto") {
                update("currency", "USD");
                update("exchange", "");
              } else {
                update("currency", "INR");
                update("exchange", "NSE");
              }
            }}
            className="w-full px-3 py-2.5 rounded-xl text-sm
                       bg-white/[0.04] border border-white/10
                       text-white/80 cursor-pointer
                       focus:outline-none focus:border-accent-400/60
                       transition-colors [&>option]:bg-canvas"
          >
            <option value="stock">Stock</option>
            <option value="crypto">Crypto</option>
            <option value="mutual_fund">Mutual Fund</option>
            <option value="etf">ETF</option>
          </select>
        </div>

        {/* Exchange — stocks only */}
        {form.type === "stock" && (
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Exchange *
            </label>
            <select
              value={form.exchange ?? "NSE"}
              onChange={(e) => update("exchange", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm
                         bg-white/[0.04] border border-white/10
                         text-white/80 cursor-pointer
                         focus:outline-none focus:border-accent-400/60
                         transition-colors [&>option]:bg-canvas"
            >
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </div>
        )}

        {/* Currency */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Currency *
          </label>
          <select
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm
                       bg-white/[0.04] border border-white/10
                       text-white/80 cursor-pointer
                       focus:outline-none focus:border-accent-400/60
                       transition-colors [&>option]:bg-canvas"
          >
            <option value="INR">INR ₹</option>
            <option value="USD">USD $</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-loss mt-3">{error}</p>
      )}

      <div className="flex items-center justify-end gap-3 mt-5
                      pt-4 border-t border-glass-border">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-white/60
                     hover:text-white/90 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !form.symbol.trim()}
          className="flex items-center gap-2 px-5 py-2.5
                     btn-glow rounded-xl text-sm font-medium
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Plus    className="w-4 h-4" />
          }
          Add to watchlist
        </button>
      </div>
    </motion.div>
  );
}