"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Upload,
  Briefcase,
  AlertCircle,
  X,
  Trash2,
  Edit2,
  TrendingUp,
} from "lucide-react";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { AddHoldingForm } from "@/components/portfolio/add-holding-form";
import { deleteHolding, updateHolding, addSingleHolding } from "@/app/actions/portfolio";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EnrichedHolding } from "@/lib/price-service";

interface CategorizedHoldingsProps {
  initialHoldings: EnrichedHolding[];
  baseCurrency?: "INR" | "USD";
}

export function CategorizedHoldings({
  initialHoldings,
  baseCurrency = "INR",
}: CategorizedHoldingsProps) {
  const router = useRouter();

  const [holdings, setHoldings] = useState<EnrichedHolding[]>(initialHoldings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal and Form States
  const [isAdding, setIsAdding] = useState(false);
  const [editingHolding, setEditingHolding] = useState<EnrichedHolding | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editAvgBuyPrice, setEditAvgBuyPrice] = useState("");
  const [deletingHolding, setDeletingHolding] = useState<EnrichedHolding | null>(null);

  // Sync state when server components revalidate
  useEffect(() => {
    setHoldings(initialHoldings);
  }, [initialHoldings]);

  // Categorize holdings
  const stocks = holdings.filter(
    (h) => h.type === "stock" || h.type === "etf"
  );
  const crypto = holdings.filter((h) => h.type === "crypto");
  const mutualFunds = holdings.filter((h) => h.type === "mutual_fund");

  // Handlers
  const handleAddHolding = async (holding: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await addSingleHolding({
        symbol: holding.symbol,
        name: holding.name,
        type: holding.type,
        exchange: holding.exchange,
        quantity: holding.quantity,
        avgBuyPrice: holding.avgBuyPrice,
        currency: holding.currency,
      });

      if (res.success) {
        setIsAdding(false);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to add holding.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInit = (holding: EnrichedHolding) => {
    setEditingHolding(holding);
    setEditQuantity(String(holding.quantity));
    setEditAvgBuyPrice(String(holding.avgBuyPrice));
  };

  const handleEditSave = async () => {
    if (!editingHolding) return;
    const qty = parseFloat(editQuantity);
    const price = parseFloat(editAvgBuyPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      setError("Please enter valid positive numbers.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await updateHolding(editingHolding.id, qty, price);
      if (res.success) {
        setEditingHolding(null);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to update holding.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHolding) return;

    setLoading(true);
    setError(null);
    try {
      const res = await deleteHolding(deletingHolding.id);
      if (res.success) {
        setDeletingHolding(null);
        router.refresh();
      } else {
        setError(res.error ?? "Failed to delete holding.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const existingSymbols = holdings.map((h) => h.symbol);

  return (
    <div className="space-y-8">
      {/* Errors */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-loss/10 border border-loss/20 text-loss text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-loss/70 hover:text-loss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[12px] glass-card border border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-accent-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">Portfolio Assets</p>
            <p className="text-xs text-white/40">
              {holdings.length} total position{holdings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(ROUTES.upload)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass-border hover:border-glass-border-hover text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Screenshot
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 btn-glow rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add manually
          </button>
        </div>
      </div>

      {/* Empty State */}
      {holdings.length === 0 && (
        <div className="glass-card rounded-[12px] p-16 text-center max-w-lg mx-auto">
          <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white/90 mb-1">No holdings registered</h2>
          <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
            Upload your portfolio screenshot or add your assets manually to begin monitoring signals.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push(ROUTES.upload)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-glass-border hover:border-glass-border-hover text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Screenshot
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2.5 btn-glow rounded-xl text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add manually
            </button>
          </div>
        </div>
      )}

      {/* Equities & ETFs */}
      {stocks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-md font-semibold text-white/60 px-1 uppercase tracking-wider text-xs">
            Equities &amp; ETFs ({stocks.length})
          </h2>
          <HoldingsTable
            holdings={stocks}
            baseCurrency={baseCurrency}
            onEdit={handleEditInit}
            onDelete={setDeletingHolding}
          />
        </div>
      )}

      {/* Cryptocurrencies */}
      {crypto.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-md font-semibold text-white/60 px-1 uppercase tracking-wider text-xs">
            Cryptocurrencies ({crypto.length})
          </h2>
          <HoldingsTable
            holdings={crypto}
            baseCurrency={baseCurrency}
            onEdit={handleEditInit}
            onDelete={setDeletingHolding}
          />
        </div>
      )}

      {/* Mutual Funds */}
      {mutualFunds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-md font-semibold text-white/60 px-1 uppercase tracking-wider text-xs">
            Mutual Funds ({mutualFunds.length})
          </h2>
          <HoldingsTable
            holdings={mutualFunds}
            baseCurrency={baseCurrency}
            onEdit={handleEditInit}
            onDelete={setDeletingHolding}
          />
        </div>
      )}

      {/* ── Add Manually Modal ── */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg"
            >
              <AddHoldingForm
                onAdd={handleAddHolding}
                onCancel={() => setIsAdding(false)}
                existingSymbols={existingSymbols}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editingHolding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card rounded-[12px] p-6 border border-glass-border"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-glass-border">
                <h3 className="text-sm font-semibold text-white/90">
                  Edit Position: {editingHolding.symbol}
                </h3>
                <button
                  onClick={() => setEditingHolding(null)}
                  className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-white/[0.04] border border-white/10 text-white/90 focus:outline-none focus:border-accent-400/60"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">
                    Avg Buy Price ({editingHolding.currency})
                  </label>
                  <input
                    type="number"
                    value={editAvgBuyPrice}
                    onChange={(e) => setEditAvgBuyPrice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono bg-white/[0.04] border border-white/10 text-white/90 focus:outline-none focus:border-accent-400/60"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-glass-border">
                <button
                  onClick={() => setEditingHolding(null)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={loading}
                  className="px-5 py-2 btn-glow rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Modal ── */}
      <AnimatePresence>
        {deletingHolding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card rounded-[12px] p-6 border border-glass-border"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-glass-border">
                <h3 className="text-sm font-semibold text-white/90">Delete Position</h3>
                <button
                  onClick={() => setDeletingHolding(null)}
                  className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 text-sm text-white/60">
                Are you sure you want to remove <span className="font-semibold text-white/90">{deletingHolding.symbol}</span> ({deletingHolding.name}) from your portfolio? This action can be undone later through support audits.
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-glass-border">
                <button
                  onClick={() => setDeletingHolding(null)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-5 py-2 bg-loss hover:bg-loss/85 border border-loss/20 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
