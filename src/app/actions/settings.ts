"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUser } from "@/lib/firebase/session";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

export interface PreferencesInput {
  baseCurrency:              "INR" | "USD";
  alertSeverityThreshold:   "high" | "medium" | "low";
  digestSeverityThreshold:  "high" | "medium" | "low";
  emailAlerts:               boolean;
  pushAlerts:                boolean;
  dailyDigest:               boolean;
  digestTime:                string;
}

export async function updatePreferences(
  prefs: PreferencesInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Not logged in." };

    await adminDb
      .collection("users")
      .doc(user.uid)
      .update({
        "preferences.baseCurrency":            prefs.baseCurrency,
        "preferences.alertSeverityThreshold":  prefs.alertSeverityThreshold,
        "preferences.digestSeverityThreshold": prefs.digestSeverityThreshold,
        "preferences.emailAlerts":             prefs.emailAlerts,
        "preferences.pushAlerts":              prefs.pushAlerts,
        "preferences.dailyDigest":             prefs.dailyDigest,
        "preferences.digestTime":              prefs.digestTime,
        lastActiveAt:                          FieldValue.serverTimestamp(),
      });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updatePreferences error:", err);
    return { success: false, error: "Failed to save preferences." };
  }
}

export async function updateDisplayName(
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Not logged in." };

    const trimmed = displayName.trim();
    if (!trimmed) return { success: false, error: "Name cannot be empty." };
    if (trimmed.length > 50) {
      return { success: false, error: "Name must be under 50 characters." };
    }

    await adminDb
      .collection("users")
      .doc(user.uid)
      .update({
        displayName:  trimmed,
        lastActiveAt: FieldValue.serverTimestamp(),
      });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updateDisplayName error:", err);
    return { success: false, error: "Failed to update name." };
  }
}

export async function deleteAllHoldings(): Promise<{
  success: boolean;
  error?: string;
  count?: number;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Not logged in." };

    const holdingsSnap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("holdings")
      .where("deletedAt", "==", null)
      .get();

    if (holdingsSnap.empty) {
      return { success: true, count: 0 };
    }

    const batch = adminDb.batch();
    holdingsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        deletedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    // Reset onboarding state so user can re-upload
    await adminDb
      .collection("users")
      .doc(user.uid)
      .update({ "onboarding.portfolioUploaded": false });

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { success: true, count: holdingsSnap.size };
  } catch (err) {
    console.error("deleteAllHoldings error:", err);
    return { success: false, error: "Failed to delete holdings." };
  }
}

export async function getUserPreferences() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const doc = await adminDb
      .collection("users")
      .doc(user.uid)
      .get();

    if (!doc.exists) return null;

    const data = doc.data()!;
    return {
      displayName:             (data.displayName as string) ?? "",
      email:                   (data.email       as string) ?? "",
      baseCurrency:            (data.preferences?.baseCurrency            ?? "INR") as "INR" | "USD",
      alertSeverityThreshold:  (data.preferences?.alertSeverityThreshold  ?? "medium") as "high" | "medium" | "low",
      digestSeverityThreshold: (data.preferences?.digestSeverityThreshold ?? "low") as "high" | "medium" | "low",
      emailAlerts:             (data.preferences?.emailAlerts             ?? true)  as boolean,
      pushAlerts:              (data.preferences?.pushAlerts              ?? false) as boolean,
      dailyDigest:             (data.preferences?.dailyDigest             ?? true)  as boolean,
      digestTime:              (data.preferences?.digestTime              ?? "09:00") as string,
    };
  } catch {
    return null;
  }
}