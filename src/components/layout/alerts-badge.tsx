import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { cn } from "@/lib/utils";

export async function AlertsBadge() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("pp_session")?.value;
    if (!sessionCookie) return null;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    const snap = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("alerts")
      .where("readAt", "==", null)
      .where("dismissed", "==", false)
      .count()
      .get();

    const count = snap.data().count;
    if (count === 0) return null;

    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          "min-w-[20px] h-5 px-1.5 rounded-full",
          "text-xs font-semibold font-mono",
          "bg-loss text-white"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  } catch {
    return null;
  }
}