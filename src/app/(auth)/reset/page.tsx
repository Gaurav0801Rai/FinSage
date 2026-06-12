"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  sendPasswordResetEmail,
  getFirebaseErrorMessage,
} from "@/lib/firebase/auth";
import { ROUTES } from "@/lib/constants";

type State = "idle" | "loading" | "sent" | "error";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError(null);
    try {
      await sendPasswordResetEmail(email);
      setState("sent");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getFirebaseErrorMessage(code));
      setState("error");
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8">
        <Link href={ROUTES.home}>
          <Logo size="md" />
        </Link>
      </div>

      <div className="glass-card ring-glow-amber p-8">
        {state === "sent" ? (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gain/10 border border-gain/20 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-gain" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Check your email</h1>
            <p className="text-sm text-white/50 mb-6">
              We sent a reset link to{" "}
              <span className="text-white/80">{email}</span>. It expires in 1
              hour.
            </p>
            <Link
              href={ROUTES.login}
              className="inline-flex items-center gap-2 text-sm text-accent-400 hover:text-accent-300 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold mb-1">Reset password</h1>
              <p className="text-sm text-white/50">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white/[0.04] border border-glass-border rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-accent-500/50 focus:bg-white/[0.06] transition-all text-sm"
                />
              </div>

              {(state === "error" || error) && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-loss/10 border border-loss/20 text-sm text-loss">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full flex items-center justify-center gap-2 py-3 btn-glow rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state === "loading" ? "Sending…" : "Send reset link"}
                {state !== "loading" && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="mt-6 text-center">
              <Link
                href={ROUTES.login}
                className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
