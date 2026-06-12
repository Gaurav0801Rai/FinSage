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

  const unread = alerts.filter((a) => !a.readAt);
  const read   = alerts.filter((a) =>  a.readAt);

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

      {/* Unread alerts */}
      {unread.length > 0 && (
        <div className="mb-8">
          <p
            className="text-xs font-medium text-white/40 uppercase
                       tracking-wider mb-3"
          >
            New
          </p>
          <div className="space-y-3">
            {unread.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Read alerts */}
      {read.length > 0 && (
        <div>
          <p
            className="text-xs font-medium text-white/40 uppercase
                       tracking-wider mb-3"
          >
            Earlier
          </p>
          <div className="space-y-3">
            {read.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic    = "force-dynamic";
export const revalidate = 0;