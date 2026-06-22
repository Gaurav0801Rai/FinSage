"use client";

import { useState } from "react";
import { Bell, Wallet, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updatePreferences,
  type PreferencesInput,
} from "@/app/actions/settings";

interface PreferencesFormProps {
  initial: PreferencesInput;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked:     boolean;
  onChange:    (v: boolean) => void;
  label:       string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3
                    border-b border-glass-border last:border-b-0">
      <div>
        <p className="text-sm text-white/80 font-medium">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-6 rounded-full shrink-0 transition-colors",
          "focus:outline-none mt-0.5",
          checked ? "bg-accent-500" : "bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white",
            "transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function PreferencesForm({ initial }: PreferencesFormProps) {
  const [prefs, setPrefs]   = useState<PreferencesInput>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError]   = useState("");

  const update = (key: keyof PreferencesInput, value: unknown) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  };

  const handleSave = async () => {
    setStatus("saving");
    setError("");
    const result = await updatePreferences(prefs);
    if (result.success) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setError(result.error ?? "Failed to save.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Portfolio preferences */}
      <div className="glass-card rounded-[12px] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10
                          border border-accent-500/20
                          flex items-center justify-center">
            <Wallet className="w-4 h-4 text-accent-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90">
              Portfolio
            </h2>
            <p className="text-xs text-white/40">
              Display and currency settings
            </p>
          </div>
        </div>

        {/* Base currency */}
        <div className="mb-4">
          <label className="block text-xs text-white/50 mb-2">
            Base Currency
          </label>
          <div className="flex gap-2">
            {(["INR", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => update("baseCurrency", c)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium",
                  "border transition-all",
                  prefs.baseCurrency === c
                    ? "bg-accent-500/10 border-accent-500/30 text-accent-400"
                    : "border-white/10 text-white/50 hover:border-white/20"
                )}
              >
                {c === "INR" ? "₹ INR" : "$ USD"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert preferences */}
      <div className="glass-card rounded-[12px] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10
                          border border-accent-500/20
                          flex items-center justify-center">
            <Bell className="w-4 h-4 text-accent-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/90">
              Alert Preferences
            </h2>
            <p className="text-xs text-white/40">
              Control what alerts you receive
            </p>
          </div>
        </div>

        {/* Severity threshold */}
        <div className="mb-5">
          <label className="block text-xs text-white/50 mb-2">
            Minimum Instant Alert Severity
          </label>
          <p className="text-xs text-white/30 mb-3">
            Only receive real-time email alerts at this level or higher.
          </p>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((s) => {
              const colors = {
                low:    "text-blue-400  bg-blue-500/10  border-blue-500/30",
                medium: "text-accent-400 bg-accent-500/10 border-accent-500/30",
                high:   "text-loss      bg-loss/10      border-loss/30",
              };
              return (
                <button
                  key={s}
                  onClick={() => update("alertSeverityThreshold", s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium",
                    "border transition-all capitalize",
                    prefs.alertSeverityThreshold === s
                      ? colors[s]
                      : "border-white/10 text-white/50 hover:border-white/20"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div>
          <Toggle
            checked={prefs.emailAlerts}
            onChange={(v) => update("emailAlerts", v)}
            label="Email Alerts"
            description="Receive important alerts by email"
          />
          <Toggle
            checked={prefs.pushAlerts}
            onChange={(v) => update("pushAlerts", v)}
            label="Push Notifications"
            description="Browser push notifications (requires permission)"
          />
          <Toggle
            checked={prefs.dailyDigest}
            onChange={(v) => update("dailyDigest", v)}
            label="Daily Digest"
            description="Morning summary of news affecting your portfolio"
          />
        </div>

        {/* Digest time & severity — only shown if daily digest is on */}
        {prefs.dailyDigest && (
          <div className="mt-4 pt-4 border-t border-glass-border space-y-4">
            {/* Delivery Time */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5">
                Digest Delivery Time
              </label>
              <input
                type="time"
                value={prefs.digestTime}
                onChange={(e) => update("digestTime", e.target.value)}
                className="px-3 py-2 rounded-xl text-sm
                           bg-white/[0.04] border border-white/10
                           text-white/80 focus:outline-none
                           focus:border-accent-400/60 transition-colors"
              />
            </div>

            {/* Severity threshold for Daily Digest */}
            <div>
              <label className="block text-xs text-white/50 mb-2">
                Minimum Digest Severity
              </label>
              <p className="text-xs text-white/30 mb-3">
                Only include alerts at this level or higher in your daily digest.
              </p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((s) => {
                  const colors = {
                    low:    "text-blue-400  bg-blue-500/10  border-blue-500/30",
                    medium: "text-accent-400 bg-accent-500/10 border-accent-500/30",
                    high:   "text-loss      bg-loss/10      border-loss/30",
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => update("digestSeverityThreshold", s)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium",
                        "border transition-all capitalize",
                        prefs.digestSeverityThreshold === s
                          ? colors[s]
                          : "border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      {error && (
        <p className="text-xs text-loss">{error}</p>
      )}
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className={cn(
          "w-full py-3 rounded-xl text-sm font-medium transition-all",
          "flex items-center justify-center gap-2",
          status === "saved"
            ? "bg-gain/20 text-gain border border-gain/30"
            : "btn-glow disabled:opacity-40"
        )}
      >
        {status === "saving" && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {status === "saved" && (
          <Check className="w-4 h-4" />
        )}
        {status === "saved" ? "Preferences saved" : "Save preferences"}
      </button>
    </div>
  );
}