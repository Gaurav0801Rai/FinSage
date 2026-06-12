"use client";

import { useState }              from "react";
import { useRouter }             from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus,
  Trash2, ArrowRight, Loader2,
} from "lucide-react";
import { cn, formatINR, formatPercent } from "@/lib/utils";
import {
  removeFromWatchlist,
  moveToPortfolio,
  type WatchlistItem,
} from "@/app/actions/watchlist";
import type { LivePrice } from "@/lib/price-service";

interface WatchlistTableProps {
  items:  WatchlistItem[];
  prices: Record<string, LivePrice>;
}

function MoveToPortfolioModal({
  item,
  onClose,
  onSuccess,
}: {
  item:    WatchlistItem;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [quantity,     setQuantity]     = useState("");
  const [avgBuyPrice,  setAvgBuyPrice]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const handleMove = async () => {
    const qty   = parseFloat(quantity);
    const price = parseFloat(avgBuyPrice);

    if (!qty   || qty   <= 0) { setError("Enter a valid quantity."); return; }
    if (!price || price <= 0) { setError("Enter a valid price.");    return; }

    setLoading(true);
    const result = await moveToPortfolio(item, qty, price);

    if (result.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(result.error ?? "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{   opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl p-6 w-full max-w-sm
                   border border-glass-border-hover"
      >
        <h3 className="text-base font-semibold mb-1">
          Add {item.symbol} to portfolio
        </h3>
        <p className="text-xs text-white/40 mb-5">
          Enter the details of your purchase.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Quantity *
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setError(""); }}
              placeholder="e.g. 10"
              min="0"
              step="any"
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono
                         bg-white/[0.04] border border-white/10
                         focus:border-accent-400/60 text-white/90
                         placeholder-white/20 focus:outline-none
                         transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Avg Buy Price *
            </label>
            <input
              type="number"
              value={avgBuyPrice}
              onChange={(e) => { setAvgBuyPrice(e.target.value); setError(""); }}
              placeholder="e.g. 2450.00"
              min="0"
              step="any"
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono
                         bg-white/[0.04] border border-white/10
                         focus:border-accent-400/60 text-white/90
                         placeholder-white/20 focus:outline-none
                         transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-loss mt-3">{error}</p>
        )}

        <div className="flex gap-3 mt-5 pt-4 border-t border-glass-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/60
                       hover:text-white/90 glass-card transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium
                       btn-glow flex items-center justify-center gap-2
                       disabled:opacity-40"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add to portfolio
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function WatchlistTable({ items, prices }: WatchlistTableProps) {
  const router = useRouter();
  const [removingId, setRemovingId]   = useState<string | null>(null);
  const [movingItem,  setMovingItem]  = useState<WatchlistItem | null>(null);
  const [localItems,  setLocalItems]  = useState(items);

  // Sync state if items prop changes (e.g. from router.refresh())
  useState(() => {
    setLocalItems(items);
  });

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const result = await removeFromWatchlist(id);
    if (result.success) {
      setLocalItems((prev) => prev.filter((i) => i.id !== id));
      router.refresh();
    }
    setRemovingId(null);
  };

  if (localItems.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <TrendingUp className="w-10 h-10 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm mb-1">
          Your watchlist is empty
        </p>
        <p className="text-white/30 text-xs">
          Add assets you want to track using the button above.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Move to portfolio modal */}
      <AnimatePresence>
        {movingItem && (
          <MoveToPortfolioModal
            item={movingItem}
            onClose={() => setMovingItem(null)}
            onSuccess={() => {
              setLocalItems((prev) => prev.filter((i) => i.id !== movingItem.id));
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table header */}
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_auto]
                     gap-4 px-5 py-3 border-b border-glass-border
                     text-xs font-medium text-white/40
                     uppercase tracking-wider"
        >
          <span>Asset</span>
          <span className="text-right">Price</span>
          <span className="text-right">Day Change</span>
          <span className="text-right">Source</span>
          <span />
        </div>

        {/* Rows */}
        <AnimatePresence initial={false}>
          {localItems.map((item) => {
            const price      = prices[item.symbol];
            const isGain     = (price?.changePercent ?? 0) >= 0;
            const isFlat     = Math.abs(price?.changePercent ?? 0) < 0.01;
            const isRemoving = removingId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: "auto" }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{   opacity: 0, height: 0       }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "grid grid-cols-[2fr_1fr_1fr_1fr_auto]",
                  "gap-4 px-5 py-4 items-center",
                  "border-b border-glass-border last:border-b-0",
                  "hover:bg-white/[0.02] transition-colors",
                  isRemoving && "opacity-50"
                )}
              >
                {/* Asset */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl bg-accent-500/10
                                border border-accent-500/20
                                flex items-center justify-center shrink-0"
                  >
                    <span
                      className="text-xs font-bold font-mono
                                 text-accent-400"
                    >
                      {item.symbol ? item.symbol.slice(0, 2) : "—"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-sm font-semibold font-mono
                                   text-white/90 truncate"
                      >
                        {item.symbol}
                      </p>
                      {item.exchange && (
                        <span
                          className="text-2xs font-mono text-white/30
                                     border border-white/[0.08]
                                     px-1 py-0.5 rounded hidden sm:inline"
                        >
                          {item.exchange}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 truncate">
                      {item.name}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  {price && typeof price.price === "number" ? (
                    <>
                      <p className="text-sm font-mono text-white/90">
                        {item.currency === "INR"
                          ? formatINR(price.price)
                          : `$${price.price.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                        }
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {item.type ? item.type.replace("_", " ") : "—"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white/30">—</p>
                  )}
                </div>

                {/* Day change */}
                <div className="text-right">
                  {price && typeof price.changePercent === "number" ? (
                    <div
                      className={cn(
                        "inline-flex items-center gap-1 justify-end",
                        isFlat
                          ? "text-white/40"
                          : isGain ? "text-gain" : "text-loss"
                      )}
                    >
                      {isFlat
                        ? <Minus        className="w-3 h-3" />
                        : isGain
                        ? <TrendingUp   className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />
                      }
                      <span className="text-sm font-mono">
                        {formatPercent(price.changePercent)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-white/30">—</p>
                  )}
                </div>

                {/* Price source */}
                <div className="text-right">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-md border font-mono",
                      price?.source === "fallback"
                        ? "text-white/30 border-white/[0.08] bg-white/[0.02]"
                        : "text-gain/70 border-gain/20 bg-gain/[0.06]"
                    )}
                  >
                    {price?.source === "fallback"
                      ? "offline"
                      : price?.source ?? "—"
                    }
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMovingItem(item)}
                    title="Add to portfolio"
                    className="p-2 rounded-lg text-white/30
                               hover:text-accent-400 hover:bg-accent-500/10
                               transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isRemoving}
                    title="Remove from watchlist"
                    className="p-2 rounded-lg text-white/30
                               hover:text-loss hover:bg-loss/10
                               transition-colors
                               disabled:opacity-40"
                  >
                    {isRemoving
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2  className="w-4 h-4" />
                    }
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}