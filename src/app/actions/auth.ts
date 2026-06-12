"use server";

import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import {
  adminAuth,
  adminDb,
  verifySessionCookie,
} from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_MS,
  SESSION_EXPIRY_SECONDS,
} from "@/lib/auth-constants";

/**
 * Verifies an ID token from Firebase Client SDK, then creates an httpOnly
 * session cookie via Firebase Admin and sets it on the response.
 * Called immediately after a successful client-side sign-in.
 */
export async function createSession(idToken: string): Promise<void> {
  // Verify the ID token is valid before creating a session
  await adminAuth.verifyIdToken(idToken);

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_EXPIRY_SECONDS,
    sameSite: "lax",
  });
}

/**
 * Clears the session cookie and revokes the Firebase refresh tokens.
 * Does NOT redirect — caller handles navigation so sign-out stays testable.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decoded = await verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decoded.sub);
    } catch {
      // Cookie invalid or already expired — still clear it
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Creates the users/{uid} Firestore document on first sign-up,
 * or updates lastActiveAt on subsequent logins. Idempotent.
 */
export async function ensureUserDocument(
  uid: string,
  data: {
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
  }
): Promise<void> {
  const userRef = adminDb.collection("users").doc(uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    await userRef.set({
      email: data.email.toLowerCase(),
      displayName: data.displayName ?? null,
      photoURL: data.photoURL ?? null,
      createdAt: FieldValue.serverTimestamp(),
      lastActiveAt: FieldValue.serverTimestamp(),
      preferences: {
        baseCurrency: "INR",
        alertSeverityThreshold: "medium",
        emailAlerts: true,
        pushAlerts: false,
        dailyDigest: true,
        digestTime: "09:00",
        timezone: "Asia/Kolkata",
      },
      onboarding: {
        portfolioUploaded: false,
        alertsConfigured: false,
        completedAt: null,
      },
    });
  } else {
    await userRef.update({
      lastActiveAt: FieldValue.serverTimestamp(),
    });
  }
}
