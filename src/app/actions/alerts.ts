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

// Mark all alerts read for a specific symbol/category
export async function markCategoryAlertsRead(symbol: string): Promise<void> {
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
    let count = 0;

    unreadSnap.docs.forEach((doc) => {
      const data = doc.data();
      const affectedSymbols = (data.affectedSymbols as string[]) ?? [];
      const belongsToCategory =
        (symbol === "" && affectedSymbols.length === 0) ||
        (symbol !== "" && affectedSymbols.some((s) => s.toUpperCase() === symbol.toUpperCase()));

      if (belongsToCategory) {
        batch.update(doc.ref, { readAt: now });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      revalidatePath("/alerts");
    }
  } catch (err) {
    console.error("markCategoryAlertsRead error:", err);
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
      .get();

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const count = snap.docs.filter((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() ?? new Date();
      return createdAt >= fortyEightHoursAgo;
    }).length;

    return count;
  } catch {
    return 0;
  }
}