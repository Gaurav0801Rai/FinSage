"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  signUpWithEmail,
  signInWithGoogle,
  getFirebaseErrorMessage,
} from "@/lib/firebase/auth";
import { createSession, ensureUserDocument } from "@/app/actions/auth";
import { ROUTES } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const credential = await signUpWithEmail(email, password, name.trim());
      // Force-refresh so the displayName is baked into the token
      const idToken = await credential.user.getIdToken(true);
      await ensureUserDocument(credential.user.uid, {
        email: credential.user.email!,
        displayName: name.trim(),
        photoURL: null,
      });
      await createSession(idToken);
      router.push(ROUTES.dashboard);
    } catch (err: any) {
      const code = err.code ?? "";
      setError(`${getFirebaseErrorMessage(code)} [${code || err.message}]`);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    setError(null);
    try {
      const credential = await signInWithGoogle();
      const idToken = await credential.user.getIdToken();
      await ensureUserDocument(credential.user.uid, {
        email: credential.user.email!,
        displayName: credential.user.displayName,
        photoURL: credential.user.photoURL,
      });
      await createSession(idToken);
      router.push(ROUTES.dashboard);
    } catch (err: any) {
      const code = err.code ?? "";
      setError(`${getFirebaseErrorMessage(code)} [${code || err.message}]`);
    } finally {
      setGoogleLoading(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8">
        <Link href={ROUTES.home}>
          <Logo size="md" />
        </Link>
      </div>

      <div className="glass-card ring-glow-gold p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-white/50">
            Start tracking your portfolio with AI
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignUp}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-5 bg-white/[0.05] hover:bg-white/[0.08] border border-glass-border-hover rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {googleLoading ? "Creating account…" : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="relative flex items-center mb-5">
          <div className="flex-1 border-t border-glass-border" />
          <span className="px-3 text-xs text-white/30">or</span>
          <div className="flex-1 border-t border-glass-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Gaurav Kumar"
              autoComplete="name"
              className="w-full px-4 py-3 bg-white/[0.04] border border-glass-border rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-accent-500/50 focus:bg-white/[0.06] transition-all text-sm"
            />
          </div>

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

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 bg-white/[0.04] border border-glass-border rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-accent-500/50 focus:bg-white/[0.06] transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-loss/10 border border-loss/20 text-sm text-loss">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 btn-glow rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link
            href={ROUTES.login}
            className="text-accent-400 hover:text-accent-300 transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-white/25">
        Not financial advice · You make all decisions
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.251 17.64 11.943 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
