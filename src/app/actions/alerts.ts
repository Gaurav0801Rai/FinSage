"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUser } from "@/lib/firebase/session";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

// Mark a single alert as read
export async function markAlertRead(alertId: string): Promise<void> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("alerts")
      .doc(alertId)
      .update({
        readAt: FieldValue.serverTimestamp(),
      });

    revalidatePath("/alerts");
  } catch (err) {
    console.error("markAlertRead error:", err);
  }
}

// Mark all alerts as read for the current user
export async function markAllAlertsRead(): Promise<void> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    const unreadSnap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("alerts")
      .where("readAt", "==", null)
      .where("dismissed", "==", false)
      .get();

    if (unreadSnap.empty) return;

    const batch = adminDb.batch();
    const now = FieldValue.serverTimestamp();

    unreadSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { readAt: now });
    });

    await batch.commit();
    revalidatePath("/alerts");
  } catch (err) {
    console.error("markAllAlertsRead error:", err);
  }
}

// Dismiss an alert (hides it from the list)
export async function dismissAlert(alertId: string): Promise<void> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return;

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("alerts")
      .doc(alertId)
      .update({
        dismissed: true,
        readAt: FieldValue.serverTimestamp(),
      });

    revalidatePath("/alerts");
  } catch (err) {
    console.error("dismissAlert error:", err);
  }
}

// Get unread alert count for the current user
// Used by the sidebar badge
export async function getUnreadAlertCount(): Promise<number> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return 0;

    const snap = await adminDb
      .collection("users")
      .doc(user.uid)
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