"use client";

import { useState, useEffect }            from "react";
import { useRouter }                      from "next/navigation";
import { motion }                         from "framer-motion";
import { Plus, Eye }                      from "lucide-react";
import { WatchlistTable }                 from "@/components/watchlist/watchlist-table";
import { AddToWatchlistForm }             from "@/components/watchlist/add-to-watchlist-form";
import type { WatchlistItem }             from "@/app/actions/watchlist";
import type { LivePrice }                 from "@/lib/price-service";

interface WatchlistClientProps {
  initialItems: WatchlistItem[];
  initialPrices: Record<string, LivePrice>;
}

export function WatchlistClient({ initialItems, initialPrices }: WatchlistClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  // Sync state with props when server component refreshes
  const [items, setItems] = useState(initialItems);
  const [prices, setPrices] = useState(initialPrices);

  useEffect(() => {
    setItems(initialItems);
    setPrices(initialPrices);
  }, [initialItems, initialPrices]);

  const handleFormSuccess = () => {
    setShowForm(false);
    router.refresh();
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">
            Watchlist
          </h1>
          <p className="text-sm text-white/40">
            {items.length > 0
              ? `${items.length} asset${items.length !== 1 ? "s" : ""} · prices update every 60 seconds`
              : "Track assets you are interested in"
            }
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5
                       btn-glow rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add asset
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6">
          <AddToWatchlistForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Watchlist Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <WatchlistTable items={items} prices={prices} />
      </motion.div>

      {/* Info note */}
      {items.length > 0 && (
        <div className="mt-4 flex items-start gap-2 text-white/25">
          <Eye className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">
            Click the arrow icon on any row to move an asset to your
            portfolio once you have bought it.
          </p>
        </div>
      )}
    </div>
  );
}
