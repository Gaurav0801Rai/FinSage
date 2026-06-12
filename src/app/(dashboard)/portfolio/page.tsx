import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { fetchPrices, computePortfolioStats } from "@/lib/price-service";
import { CategorizedHoldings } from "@/components/portfolio/categorized-holdings";
import type { HoldingInput } from "@/lib/price-service";

async function getPortfolioData() {
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
      return { empty: true as const, uid, baseCurrency, holdings: [] };
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

    // Compute stats & enrich
    const { enrichedHoldings } = await computePortfolioStats(
      holdings,
      prices,
      baseCurrency
    );

    return {
      empty: false as const,
      uid,
      baseCurrency,
      holdings: enrichedHoldings,
    };
  } catch (err) {
    console.error("Portfolio page data error:", err);
    return null;
  }
}

export default async function PortfolioPage() {
  const data = await getPortfolioData();

  if (!data) {
    return (
      <div className="p-10 text-center text-white/40">
        Unable to load portfolio. Please refresh.
      </div>
    );
  }

  const { holdings, baseCurrency } = data;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio Positions</h1>
        <p className="text-sm text-white/40 mt-1">
          Manage your holdings, view live values, and add or delete positions.
        </p>
      </div>

      <CategorizedHoldings initialHoldings={holdings} baseCurrency={baseCurrency} />
    </div>
  );
}

export const dynamic    = "force-dynamic";
export const revalidate = 0;
