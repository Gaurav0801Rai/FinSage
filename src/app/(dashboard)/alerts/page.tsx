import { cookies }            from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { AlertCard }          from "@/components/alerts/alert-card";
import { AlertsEmpty }        from "@/components/alerts/alerts-empty";
import { Bell }               from "lucide-react";

async function getAlertsData() {
  try {
    const cookieStore   = cookies();
    const sessionCookie = cookieStore.get("pp_session")?.value;
    if (!sessionCookie) return { alerts: [], unreadCount: 0 };

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid     = decoded.uid;

    const alertsSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("alerts")
      .where("dismissed", "==", false)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    if (alertsSnap.empty) {
      return { alerts: [], unreadCount: 0 };
    }

    const alerts = await Promise.all(
      alertsSnap.docs.map(async (doc) => {
        const data = doc.data();

        let newsTitle  = "Market Update";
        let newsUrl    = "#";
        let newsSource = "Unknown";

        try {
          const newsDoc = await adminDb
            .collection("news")
            .doc(data.newsId)
            .get();

          if (newsDoc.exists) {
            const newsData = newsDoc.data()!;
            newsTitle  = newsData.title     as string;
            newsUrl    = newsData.sourceUrl as string;
            newsSource = newsData.source    as string;
          }
        } catch {
          // News item may have been deleted — use defaults
        }

        // Convert ALL Firestore Timestamps to plain strings or null.
        // Never pass Timestamp class instances to client components —
        // Next.js throws "Only plain objects can be passed" if you do.
        const createdAt =
          data.createdAt?.toDate?.()?.toISOString()
          ?? new Date().toISOString();

        const readAt =
          data.readAt?.toDate?.()?.toISOString() ?? null;

        return {
          id:              doc.id,
          newsId:          data.newsId        as string,
          severity:        data.severity      as "high" | "medium" | "low",
          affectedSymbols: (data.affectedSymbols as string[]) ?? [],
          whyItMatters:    data.whyItMatters  as string,
          confidence:      data.confidence    as number,
          createdAt,
          readAt,
          dismissed:       data.dismissed     as boolean,
          newsTitle,
          newsUrl,
          newsSource,
        };
      })
    );

    const unreadCount = alerts.filter((a) => !a.readAt).length;

    return { alerts, unreadCount, uid };
  } catch (err) {
    console.error("Alerts page error:", err);
    return { alerts: [], unreadCount: 0 };
  }
}

export default async function AlertsPage() {
  const { alerts, unreadCount } = await getAlertsData();

  // Load user's active holdings to map symbol -> name
  const cookieStore   = cookies();
  const sessionCookie = cookieStore.get("pp_session")?.value;
  let holdingsMap = new Map<string, string>();
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      const uid     = decoded.uid;
      const holdingsSnap = await adminDb
        .collection("users")
        .doc(uid)
        .collection("holdings")
        .where("deletedAt", "==", null)
        .get();
      holdingsSnap.docs.forEach((doc) => {
        const data = doc.data();
        holdingsMap.set(data.symbol.toUpperCase(), data.name || data.symbol);
      });
    } catch (e) {
      console.error("Error loading holdings for grouping:", e);
    }
  }

  // Group alerts by symbol
  const grouped: Record<string, { symbol: string; name: string; alerts: any[]; unreadCount: number }> = {};
  alerts.forEach((alert) => {
    const symbols = alert.affectedSymbols;
    if (symbols && symbols.length > 0) {
      symbols.forEach((sym) => {
        const uSym = sym.toUpperCase();
        const name = holdingsMap.get(uSym) || uSym;
        if (!grouped[uSym]) {
          grouped[uSym] = { symbol: uSym, name, alerts: [], unreadCount: 0 };
        }
        if (!grouped[uSym].alerts.some((a) => a.id === alert.id)) {
          grouped[uSym].alerts.push(alert);
          if (!alert.readAt) {
            grouped[uSym].unreadCount++;
          }
        }
      });
    } else {
      const genKey = "GENERAL";
      if (!grouped[genKey]) {
        grouped[genKey] = { symbol: "", name: "General Market Updates", alerts: [], unreadCount: 0 };
      }
      grouped[genKey].alerts.push(alert);
      if (!alert.readAt) {
        grouped[genKey].unreadCount++;
      }
    }
  });

  const sortedGroups = Object.values(grouped).sort((a, b) => {
    // Put groups with unread alerts first
    if (a.unreadCount !== b.unreadCount) {
      return b.unreadCount - a.unreadCount;
    }
    const latestA = Math.max(...a.alerts.map((al) => new Date(al.createdAt).getTime()));
    const latestB = Math.max(...b.alerts.map((al) => new Date(al.createdAt).getTime()));
    return latestB - latestA;
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">
            Alerts
          </h1>
          <p className="text-sm text-white/40">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"
            }
          </p>
        </div>

        {unreadCount > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5
                       bg-accent-500/10 border border-accent-500/20
                       rounded-full"
          >
            <Bell className="w-3.5 h-3.5 text-accent-400" />
            <span className="text-xs font-medium text-accent-400">
              {unreadCount} new
            </span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {alerts.length === 0 && <AlertsEmpty />}

      {/* Grouped alerts list */}
      {alerts.length > 0 && (
        <div className="space-y-10">
          {sortedGroups.map((group) => (
            <div key={group.symbol || "general"} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold text-white/90">
                    {group.name}
                  </h2>
                  {group.symbol && (
                    <span className="text-[10px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-white/50">
                      {group.symbol}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-accent-400 bg-accent-500/[0.04] border border-accent-500/10 px-2.5 py-1 rounded-full">
                  {group.unreadCount > 0
                    ? `${group.unreadCount} new`
                    : `${group.alerts.length} total`
                  }
                </span>
              </div>

              <div className="space-y-4">
                {group.alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic    = "force-dynamic";
export const revalidate = 0;