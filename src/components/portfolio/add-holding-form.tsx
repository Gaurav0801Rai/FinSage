"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedHolding } from "@/types/portfolio";

interface AddHoldingFormProps {
  onAdd: (holding: ExtractedHolding) => void;
  onCancel: () => void;
  existingSymbols: string[];
}

const EMPTY_FORM = {
  symbol: "",
  name: "",
  type: "stock" as ExtractedHolding["type"],
  exchange: "NSE" as "NSE" | "BSE" | null,
  quantity: "",
  avgBuyPrice: "",
  currency: "INR" as "INR" | "USD",
};

export function AddHoldingForm({
  onAdd,
  onCancel,
  existingSymbols,
}: AddHoldingFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field when user starts typing
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    } else if (
      existingSymbols.includes(form.symbol.trim().toUpperCase())
    ) {
      newErrors.symbol = "This symbol is already in your list";
    }

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      newErrors.quantity = "Enter a valid quantity";
    }

    if (!form.avgBuyPrice || parseFloat(form.avgBuyPrice) <= 0) {
      newErrors.avgBuyPrice = "Enter a valid price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const newHolding: ExtractedHolding = {
      id: `manual-${Date.now()}`,
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
      type: form.type,
      exchange:
        form.type === "stock"
          ? (form.exchange as "NSE" | "BSE")
          : null,
      quantity: parseFloat(form.quantity),
      avgBuyPrice: parseFloat(form.avgBuyPrice),
      currency: form.currency,
      confidence: 1, // user-entered, so confidence is 100%
    };

    onAdd(newHolding);
    setForm(EMPTY_FORM); // reset for next entry
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white/90">
          Add holding manually
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
            placeholder="e.g. RELIANCE, BTC, HDFC"
            className={cn(
              "w-full px-3 py-2.5 rounded-xl text-sm font-mono",
              "bg-white/[0.04] border transition-colors",
              "placeholder-white/20 text-white/90",
              "focus:outline-none focus:border-accent-400/60",
              errors.symbol
                ? "border-loss/50"
                : "border-white/10 hover:border-white/20"
            )}
          />
          {errors.symbol && (
            <p className="text-xs text-loss mt-1">{errors.symbol}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Company / Asset Name *
          </label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Reliance Industries Ltd"
            className={cn(
              "w-full px-3 py-2.5 rounded-xl text-sm",
              "bg-white/[0.04] border transition-colors",
              "placeholder-white/20 text-white/90",
              "focus:outline-none focus:border-accent-400/60",
              errors.name
                ? "border-loss/50"
                : "border-white/10 hover:border-white/20"
            )}
          />
          {errors.name && (
            <p className="text-xs text-loss mt-1">{errors.name}</p>
          )}
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
              // When switching away from stock, clear exchange
              if (e.target.value !== "stock") {
                update("exchange", "");
              } else {
                update("exchange", "NSE");
              }
            }}
            className={cn(
              "w-full px-3 py-2.5 rounded-xl text-sm",
              "bg-white/[0.04] border border-white/10",
              "text-white/80 cursor-pointer",
              "focus:outline-none focus:border-accent-400/60",
              "transition-colors [&>option]:bg-canvas"
            )}
          >
            <option value="stock">Stock</option>
            <option value="crypto">Crypto</option>
            <option value="mutual_fund">Mutual Fund</option>
            <option value="etf">ETF</option>
          </select>
        </div>

        {/* Exchange — only for stocks */}
        {form.type === "stock" && (
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Exchange *
            </label>
            <select
              value={form.exchange ?? "NSE"}
              onChange={(e) => update("exchange", e.target.value)}
              className={cn(
                "w-full px-3 py-2.5 rounded-xl text-sm",
                "bg-white/[0.04] border border-white/10",
                "text-white/80 cursor-pointer",
                "focus:outline-none focus:border-accent-400/60",
                "transition-colors [&>option]:bg-canvas"
              )}
            >
              <option value="NSE">NSE (National Stock Exchange)</option>
              <option value="BSE">BSE (Bombay Stock Exchange)</option>
            </select>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Quantity *
          </label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            placeholder="e.g. 10 or 0.5"
            min="0"
            step="any"
            className={cn(
              "w-full px-3 py-2.5 rounded-xl text-sm font-mono",
              "bg-white/[0.04] border transition-colors",
              "placeholder-white/20 text-white/90",
              "focus:outline-none focus:border-accent-400/60",
              errors.quantity
                ? "border-loss/50"
                : "border-white/10 hover:border-white/20"
            )}
          />
          {errors.quantity && (
            <p className="text-xs text-loss mt-1">{errors.quantity}</p>
          )}
        </div>

        {/* Avg Buy Price */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Avg Buy Price *
          </label>
          <input
            type="number"
            value={form.avgBuyPrice}
            onChange={(e) => update("avgBuyPrice", e.target.value)}
            placeholder="e.g. 2450.50"
            min="0"
            step="any"
            className={cn(
              "w-full px-3 py-2.5 rounded-xl text-sm font-mono",
              "bg-white/[0.04] border transition-colors",
              "placeholder-white/20 text-white/90",
              "focus:outline-none focus:border-accent-400/60",
              errors.avgBuyPrice
                ? "border-loss/50"
                : "border-white/10 hover:border-white/20"
            )}
          />
          {errors.avgBuyPrice && (
            <p className="text-xs text-loss mt-1">{errors.avgBuyPrice}</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Currency *
          </label>
          <select
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
            className={cn(
              "w-full px-3 py-2.5 rounded-xl text-sm",
              "bg-white/[0.04] border border-white/10",
              "text-white/80 cursor-pointer",
              "focus:outline-none focus:border-accent-400/60",
              "transition-colors [&>option]:bg-canvas"
            )}
          >
            <option value="INR">INR — Indian Rupee ₹</option>
            <option value="USD">USD — US Dollar $</option>
          </select>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 mt-6
                      pt-5 border-t border-glass-border">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-white/60
                     hover:text-white/90 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5
                     btn-glow rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add to list
        </button>
      </div>
    </motion.div>
  );
}