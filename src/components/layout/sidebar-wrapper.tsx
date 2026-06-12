import { Sidebar } from "./sidebar";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function getUnreadCount(): Promise<number> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("pp_session")?.value;
    if (!sessionCookie) return 0;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    const snap = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("alerts")
      .where("readAt", "==", null)
      .where("dismissed", "==", false)
      .count()
      .get();

    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function SidebarWrapper() {
  const unreadCount = await getUnreadCount();
  return <Sidebar unreadAlertCount={unreadCount} />;
}