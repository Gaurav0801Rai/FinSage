"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteAllHoldings } from "@/app/actions/settings";
import { ROUTES } from "@/lib/constants";

export function DangerZone() {
  const router                          = useRouter();
  const [showConfirm, setShowConfirm]   = useState(false);
  const [confirmText, setConfirmText]   = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const canDelete = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!canDelete || loading) return;

    setLoading(true);
    setError("");

    const result = await deleteAllHoldings();

    if (result.success) {
      router.push(ROUTES.upload);
      router.refresh();
    } else {
      setError(result.error ?? "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-loss/20">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-loss/10
                        border border-loss/20
                        flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-loss" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-loss">Danger Zone</h2>
          <p className="text-xs text-white/40">
            Irreversible actions
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/80 font-medium">
            Delete all holdings
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            Removes all holdings from your portfolio. This cannot be undone.
            You will be redirected to upload a new portfolio.
          </p>
        </div>
        {!showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium
                       text-loss border border-loss/30 bg-loss/10
                       hover:bg-loss/20 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {/* Confirmation step */}
      {showConfirm && (
        <div className="mt-5 pt-5 border-t border-loss/20">
          <p className="text-xs text-white/60 mb-3">
            Type{" "}
            <span className="font-mono font-bold text-loss">DELETE</span>
            {" "}to confirm:
          </p>
          <div className="flex gap-3">
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              className="flex-1 px-3 py-2 rounded-xl text-sm font-mono
                         bg-white/[0.04] border border-loss/30
                         text-white/90 placeholder-white/20
                         focus:outline-none focus:border-loss/60
                         transition-colors"
            />
            <button
              onClick={handleDelete}
              disabled={!canDelete || loading}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium",
                "flex items-center gap-2 transition-all",
                canDelete
                  ? "bg-loss text-white hover:bg-loss/80"
                  : "bg-loss/20 text-loss/40 cursor-not-allowed"
              )}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm
            </button>
            <button
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
                setError("");
              }}
              className="px-4 py-2 rounded-xl text-sm text-white/50
                         hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="text-xs text-loss mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}