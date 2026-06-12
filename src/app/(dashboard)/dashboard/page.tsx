import { Suspense }           from "react";
import { cookies }            from "next/headers";
import Link                   from "next/link";
import { ArrowRight }         from "lucide-react";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { fetchPrices, computePortfolioStats } from "@/lib/price-service";
import { PortfolioHero }      from "@/components/dashboard/portfolio-hero";
import { StatsRow }           from "@/components/dashboard/stats-row";
import { AllocationChart }    from "@/components/dashboard/allocation-chart";
import { PortfolioChart }     from "@/components/dashboard/portfolio-chart";
import { EmptyDashboard }     from "@/components/dashboard/empty-dashboard";
import { ROUTES }             from "@/lib/constants";
import type { HoldingInput }  from "@/lib/price-service";

async function getDashboardData() {
  try {
    const cookieStore   = cookies();
    const sessionCookie = cookieStore.get("pp_session")?.value;
    if (!sessionCookie) return null;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid     = decoded.uid;

    // Fetch user preferences
    const userDoc      = await adminDb.collection("users").doc(uid).get();
    const baseCurrency = (
      userDoc.data()?.preferences?.baseCurrency ?? "INR"
    ) as "INR" | "USD";

    // Fetch active holdings
    const holdingsSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("holdings")
      .where("deletedAt", "==", null)
      .orderBy("addedAt", "desc")
      .get();

    if (holdingsSnap.empty) {
      return { empty: true as const, uid, baseCurrency };
    }

    const holdings = holdingsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as {
        symbol:      string;
        name:        string;
        type:        "stock" | "crypto" | "mutual_fund" | "etf";
        exchange:    "NSE" | "BSE" | null;
        quantity:    number;
        avgBuyPrice: number;
        currency:    "INR" | "USD";
      }),
    }));

    // Fetch live prices
    const holdingInputs: HoldingInput[] = holdings.map((h) => ({
      symbol:      h.symbol,
      type:        h.type,
      exchange:    h.exchange,
      avgBuyPrice: h.avgBuyPrice,
      currency:    h.currency,
    }));

    const prices = await fetchPrices(holdingInputs);

    // Compute stats
    const { stats, enrichedHoldings } = await computePortfolioStats(
      holdings,
      prices,
      baseCurrency
    );

    return {
      empty:            false as const,
      uid,
      baseCurrency,
      stats,
      enrichedHoldings,
      holdingCount:     holdings.length,
    };
  } catch (err) {
    console.error("Dashboard data error:", err);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  // Error or not logged in
  if (!data) {
    return (
      <div className="p-10 text-center text-white/40">
        Unable to load dashboard. Please refresh.
      </div>
    );
  }

  // No holdings yet
  if (data.empty) {
    return (
      <div className="p-6 md:p-10">
        <EmptyDashboard />
      </div>
    );
  }

  // TypeScript now knows data.empty is false so stats/enrichedHoldings exist
  const {
    stats,
    enrichedHoldings,
    holdingCount,
    baseCurrency,
  } = data;

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-[1400px] mx-auto">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-white/40 mt-1">
          {holdingCount} holding{holdingCount !== 1 ? "s" : ""} ·
          Prices in {baseCurrency} · Updates every 60 seconds
        </p>
      </div>

      {/* Hero — total value and daily P&L */}
      <PortfolioHero
        totalValue={stats.totalValue}
        totalInvested={stats.totalInvested}
        totalPnL={stats.totalPnL}
        totalPnLPercent={stats.totalPnLPercent}
        dayPnL={stats.dayPnL}
        dayPnLPercent={stats.dayPnLPercent}
        baseCurrency={baseCurrency}
      />

      {/* Stats row */}
      <StatsRow
        totalInvested={stats.totalInvested}
        totalPnLPercent={stats.totalPnLPercent}
        bestPerformer={stats.bestPerformer}
        worstPerformer={stats.worstPerformer}
        holdingCount={holdingCount}
        baseCurrency={baseCurrency}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart
          allocationByType={stats.allocationByType}
        />
        <PortfolioChart
          totalValue={stats.totalValue}
          totalPnLPercent={stats.totalPnLPercent}
        />
      </div>

      {/* Link to detailed portfolio positions */}
      <div className="flex justify-end pt-2">
        <Link
          href={ROUTES.portfolio}
          className="inline-flex items-center gap-2 text-sm font-medium
                     text-accent-400 hover:text-accent-300 transition-colors
                     group bg-white/[0.02] hover:bg-white/[0.04] px-5 py-3.5
                     rounded-xl border border-glass-border hover:border-glass-border-hover"
        >
          <span>View Detailed Portfolio &amp; Positions</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

    </div>
  );
}

export const dynamic    = "force-dynamic";
export const revalidate = 0;