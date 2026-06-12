import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap, Bell, LineChart, Brain, TrendingUp } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ROUTES, APP_NAME } from "@/lib/constants";

export default function LandingPage() {
  return (
    <main className="relative">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-canvas/60 border-b border-glass-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <nav className="flex items-center gap-1">
            <Link
              href={ROUTES.login}
              className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.signup}
              className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-glass-border-hover rounded-lg transition-all"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full glass-card text-xs font-medium text-white/80 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-accent-400" />
            <span>Powered by Gemini AI</span>
            <span className="text-white/30">·</span>
            <span className="text-accent-400">Built for NSE, BSE & crypto</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6 animate-fade-in-up">
            <span className="text-gradient">Your portfolio,</span>
            <br />
            <span className="text-gradient-amber">intelligently watched.</span>
          </h1>

          {/* Sub */}
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-white/60 leading-relaxed mb-10 animate-fade-in-up [animation-delay:100ms] [animation-fill-mode:backwards]">
            {APP_NAME} monitors news, markets, and social signals across your
            holdings — and surfaces only what matters. No noise. No predictions.
            Just the events that move your money.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
            <Link
              href={ROUTES.signup}
              className="group inline-flex items-center gap-2 px-6 py-3 btn-glow rounded-xl font-medium"
            >
              Start tracking free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 glass-card glass-card-hover font-medium"
            >
              See how it works
            </Link>
          </div>

          {/* Trust line */}
          <p className="mt-8 text-xs text-white/40 animate-fade-in [animation-delay:400ms] [animation-fill-mode:backwards]">
            Not financial advice · Not a trading platform · You make the decisions
          </p>
        </div>

        {/* Hero visual — preview mockup */}
        <div className="relative mx-auto max-w-5xl mt-20 animate-fade-in-up [animation-delay:300ms] [animation-fill-mode:backwards]">
          <div className="relative glass-card p-1.5 ring-glow-amber bg-white/[0.02]">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="relative px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-accent-400 mb-3">
              How it works
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              <span className="text-gradient">Signal over noise.</span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              The hard part isn't tracking your portfolio. It's knowing which of
              the hundreds of daily news items actually matters to you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              icon={Brain}
              title="AI relevance filter"
              description="Every article passes through a two-stage filter: ticker match, then Gemini-powered impact analysis against your specific holdings."
            />
            <FeatureCard
              icon={Bell}
              title="Alerts that matter"
              description="High, medium, low severity — calibrated to your portfolio exposure. Push, email, or in-app. You set the threshold."
            />
            <FeatureCard
              icon={LineChart}
              title="Live dashboard"
              description="P&L, allocation, sector breakdown, top movers. Real-time prices from NSE, BSE, and crypto markets."
            />
            <FeatureCard
              icon={Zap}
              title="Upload by screenshot"
              description="Snap your broker's holdings screen. AI extracts everything — quantity, symbols, average price — in seconds."
            />
            <FeatureCard
              icon={Sparkles}
              title="Why it matters"
              description="Every alert includes an AI-generated summary explaining the connection to your holdings. No jargon, no fluff."
            />
            <FeatureCard
              icon={Shield}
              title="You stay in control"
              description="We don't trade for you. We don't advise. We monitor, filter, and surface — your decisions stay yours."
            />
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-3xl text-center glass-card p-12 ring-glow-amber">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-gradient">
            Stop refreshing news. Start being told.
          </h2>
          <p className="text-white/60 mb-8">
            Upload your portfolio in 30 seconds. Get your first intelligent alert
            today.
          </p>
          <Link
            href={ROUTES.signup}
            className="inline-flex items-center gap-2 px-8 py-3.5 btn-glow rounded-xl font-medium"
          >
            Create your account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-12 border-t border-glass-border">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} {APP_NAME}. For informational purposes
            only. Not financial advice.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group glass-card glass-card-hover p-6">
      <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4 group-hover:bg-accent-500/15 transition-colors">
        <Icon className="w-5 h-5 text-accent-400" />
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full bg-canvas/30 rounded-xl overflow-hidden border border-white/[0.04] text-left">
      {/* Mock App Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs text-white/40 font-mono hidden sm:inline">portfolio-pulse.app/dashboard</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-medium text-white/50">
          <span className="text-accent-400 text-2xs uppercase tracking-wider font-semibold">Live feed active</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Value */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="text-xs text-white/40 font-medium">Portfolio Value</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular">
              ₹8,42,150.00
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono tabular">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+₹18,420.00 (2.23%)</span>
            </div>
          </div>
          {/* Card 2: Invested */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="text-xs text-white/40 font-medium">Total Invested</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-white/95 tabular">
              ₹7,25,000.00
            </div>
            <span className="text-xs text-white/30 font-mono">4 active holdings</span>
          </div>
          {/* Card 3: Total Return */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="text-xs text-white/40 font-medium">Total Return</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular">
              +16.16%
            </div>
            <span className="text-xs text-emerald-500/80 font-mono tabular">+₹1,17,150.00</span>
          </div>
        </div>

        {/* Chart & Holdings grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Chart Widget (3 cols) */}
          <div className="lg:col-span-3 p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between min-h-[260px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-semibold text-white/70">Performance Trend</h4>
                <span className="text-[10px] text-white/40 font-mono">30-day value history</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-white font-medium">30D</span>
                <span className="px-2 py-0.5 rounded text-white/40 hover:text-white/60 cursor-pointer">6M</span>
                <span className="px-2 py-0.5 rounded text-white/40 hover:text-white/60 cursor-pointer">1Y</span>
              </div>
            </div>

            {/* SVG line chart */}
            <div className="relative w-full h-[140px] mt-2">
              <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area path */}
                <path
                  d="M0 120 L0 80 Q50 60 100 90 T200 40 T300 70 T400 20 L400 120 Z"
                  fill="url(#chart-glow)"
                />
                {/* Line path */}
                <path
                  d="M0 80 Q50 60 100 90 T200 40 T300 70 T400 20"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Reference line */}
                <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                {/* Glow dot */}
                <circle cx="400" cy="20" r="4.5" fill="#10B981" />
              </svg>
            </div>
          </div>

          {/* Holdings Widget (2 cols) */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold text-white/70">Top Holdings</h4>
              <span className="text-[10px] text-accent-400 font-semibold font-mono">NSE / Crypto</span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-around">
              <HoldingRow symbol="RELIANCE" name="Reliance Industries" value="₹2,64,500.00" change="+1.84%" isPositive={true} />
              <HoldingRow symbol="BTC" name="Bitcoin" value="₹3,45,200.00" change="+3.12%" isPositive={true} />
              <HoldingRow symbol="ETH" name="Ethereum" value="₹1,48,900.00" change="-0.85%" isPositive={false} />
              <HoldingRow symbol="TCS" name="Tata Consultancy" value="₹83,550.00" change="+0.45%" isPositive={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HoldingRow({ symbol, name, value, change, isPositive }: { symbol: string; name: string; value: string; change: string; isPositive: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.02] last:border-0">
      <div>
        <div className="font-semibold text-white/95">{symbol}</div>
        <div className="text-[10px] text-white/40 mt-0.5">{name}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-white/90 tabular">{value}</div>
        <div className={`text-[10px] font-mono mt-0.5 tabular ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {change}
        </div>
      </div>
    </div>
  );
}