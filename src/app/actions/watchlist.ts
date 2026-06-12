"use server";

import { adminDb }             from "@/lib/firebase/admin";
import { getAuthenticatedUser } from "@/lib/firebase/session";
import { FieldValue }          from "firebase-admin/firestore";
import { revalidatePath }      from "next/cache";

export interface WatchlistItem {
  id:          string;
  symbol:      string;
  name:        string;
  type:        "stock" | "crypto" | "mutual_fund" | "etf";
  exchange:    "NSE" | "BSE" | null;
  currency:    "INR" | "USD";
  addedAt:     string;
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const snap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("watchlist")
      .where("deletedAt", "==", null)
      .orderBy("addedAt", "desc")
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id:       doc.id,
        symbol:   data.symbol   as string,
        name:     data.name     as string,
        type:     data.type     as WatchlistItem["type"],
        exchange: data.exchange as "NSE" | "BSE" | null,
        currency: data.currency as "INR" | "USD",
        addedAt:  data.addedAt?.toDate?.()?.toISOString()
                  ?? new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("getWatchlist error:", err);
    return [];
  }
}

export async function addToWatchlist(input: {
  symbol:   string;
  name:     string;
  type:     "stock" | "crypto" | "mutual_fund" | "etf";
  exchange: "NSE" | "BSE" | null;
  currency: "INR" | "USD";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Not logged in." };

    const symbol = input.symbol.trim().toUpperCase();
    if (!symbol) return { success: false, error: "Symbol is required." };

    // Check if already in watchlist
    const existing = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("watchlist")
      .where("symbol",    "==", symbol)
      .where("deletedAt", "==", null)
      .limit(1)
      .get();

    if (!existing.empty) {
      return {
        success: false,
        error:   `${symbol} is already in your watchlist.`,
      };
    }

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("watchlist")
      .add({
        symbol,
        name:      input.name.trim() || symbol,
        type:      input.type,
        exchange:  input.exchange ?? null,
        currency:  input.currency,
        quantity:  0,
        avgBuyPrice: 0,
        addedAt:   FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deletedAt: null,
        source:    "manual",
      });

    revalidatePath("/watchlist");
    return { success: true };
  } catch (err) {
    console.error("addToWatchlist error:", err);
    return { success: false, error: "Failed to add to watchlist." };
  }
}

export async function removeFromWatchlist(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Not logged in." };

    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("watchlist")
      .doc(itemId)
      .update({ deletedAt: FieldValue.serverTimestamp() });

    revalidatePath("/watchlist");
    return { success: true };
  } catch (err) {
    console.error("removeFromWatchlist error:", err);
    return { success: false, error: "Failed to remove item." };
  }
}

export async function moveToPortfolio(
  item: WatchlistItem,
  quantity: number,
  avgBuyPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return { success: false, error: "Not logged in." };

    if (quantity <= 0)    return { success: false, error: "Quantity must be greater than 0." };
    if (avgBuyPrice <= 0) return { success: false, error: "Price must be greater than 0." };

    const now = FieldValue.serverTimestamp();

    // Add to holdings
    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("holdings")
      .add({
        symbol:      item.symbol,
        name:        item.name,
        type:        item.type,
        exchange:    item.exchange ?? null,
        quantity,
        avgBuyPrice,
        currency:    item.currency,
        source:      "manual",
        addedAt:     now,
        updatedAt:   now,
        deletedAt:   null,
      });

    // Soft delete from watchlist
    await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("watchlist")
      .doc(item.id)
      .update({ deletedAt: now });

    revalidatePath("/watchlist");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("moveToPortfolio error:", err);
    return { success: false, error: "Failed to move to portfolio." };
  }
}