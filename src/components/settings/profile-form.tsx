"use client";

import { useState } from "react";
import { User, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateDisplayName } from "@/app/actions/settings";

interface ProfileFormProps {
  initialName: string;
  email:       string;
}

export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [name, setName]       = useState(initialName);
  const [status, setStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError]     = useState("");

  const handleSave = async () => {
    if (name.trim() === initialName || status === "saving") return;

    setStatus("saving");
    setError("");

    const result = await updateDisplayName(name);

    if (result.success) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setError(result.error ?? "Something went wrong.");
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-accent-500/10
                        border border-accent-500/20
                        flex items-center justify-center">
          <User className="w-4 h-4 text-accent-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white/90">Profile</h2>
          <p className="text-xs text-white/40">Update your display name</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Display name */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Display Name
          </label>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setStatus("idle");
              }}
              placeholder="Your name"
              maxLength={50}
              className={cn(
                "flex-1 px-3 py-2.5 rounded-xl text-sm",
                "bg-white/[0.04] border transition-colors",
                "placeholder-white/20 text-white/90",
                "focus:outline-none focus:border-accent-400/60",
                "border-white/10 hover:border-white/20"
              )}
            />
            <button
              onClick={handleSave}
              disabled={
                status === "saving" ||
                name.trim() === initialName ||
                !name.trim()
              }
              className={cn(
                "px-4 py-2.5 rounded-xl text-sm font-medium",
                "transition-all flex items-center gap-2",
                status === "saved"
                  ? "bg-gain/20 text-gain border border-gain/30"
                  : "btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {status === "saving" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {status === "saved" && (
                <Check className="w-3.5 h-3.5" />
              )}
              {status === "saved" ? "Saved" : "Save"}
            </button>
          </div>
          {error && (
            <p className="text-xs text-loss mt-1.5">{error}</p>
          )}
        </div>

        {/* Email — read only */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Email Address
          </label>
          <input
            value={email}
            readOnly
            className="w-full px-3 py-2.5 rounded-xl text-sm
                       bg-white/[0.02] border border-white/[0.06]
                       text-white/40 cursor-not-allowed"
          />
          <p className="text-xs text-white/25 mt-1">
            Email cannot be changed here.
          </p>
        </div>
      </div>
    </div>
  );
}