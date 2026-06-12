import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

// Returns the verified Firebase user from the session cookie.
// Returns null if the session is missing or invalid.
export async function getAuthenticatedUser() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("pp_session")?.value;

    if (!sessionCookie) return null;

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch {
    return null;
  }
}