import "server-only"; // throws if imported into a client component
import {
  initializeApp,
  getApps,
  cert,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function cleanPrivateKey(key: string): string {
  let cleaned = key.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  cleaned = cleaned.replace(/\\n/g, "\n");
  cleaned = cleaned.replace(/\r/g, "");

  const header = "-----BEGIN PRIVATE KEY-----";
  const footer = "-----END PRIVATE KEY-----";

  if (cleaned.includes(header) && cleaned.includes(footer)) {
    let body = cleaned
      .replace(header, "")
      .replace(footer, "")
      .trim();

    body = body.replace(/[\s\r\n]+/g, "");

    return `${header}\n${body}\n${footer}`;
  }

  return cleaned;
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const privateKey = rawKey ? cleanPrivateKey(rawKey) : undefined;

  if (!privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error(
      "Firebase Admin env vars missing. Check FIREBASE_ADMIN_* in .env.local"
    );
  }

  try {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } catch (err: any) {
    const errorDetails = {
      message: err.message,
      keyLength: privateKey?.length,
      startsWithBegin: privateKey?.startsWith("-----BEGIN PRIVATE KEY-----"),
      endsWithEnd: privateKey?.trim().endsWith("-----END PRIVATE KEY-----"),
      containsEscapedN: privateKey?.includes("\\n"),
      containsNewline: privateKey?.includes("\n"),
      first50: privateKey?.substring(0, 50),
      last50: privateKey?.substring((privateKey?.length || 0) - 50),
    };
    console.error("Firebase cert init failed. Key details:", JSON.stringify(errorDetails));
    throw err;
  }
}

let cachedDb: Firestore | undefined;
let cachedAuth: Auth | undefined;

export const adminDb = new Proxy<Firestore>({} as Firestore, {
  get(target, prop, receiver) {
    if (!cachedDb) {
      cachedDb = getFirestore(getAdminApp());
    }
    const value = Reflect.get(cachedDb, prop, receiver);
    return typeof value === "function" ? value.bind(cachedDb) : value;
  }
});

export const adminAuth = new Proxy<Auth>({} as Auth, {
  get(target, prop, receiver) {
    if (!cachedAuth) {
      cachedAuth = getAuth(getAdminApp());
    }
    const value = Reflect.get(cachedAuth, prop, receiver);
    return typeof value === "function" ? value.bind(cachedAuth) : value;
  }
});

/**
 * Verifies a Firebase session cookie and returns the decoded claims.
 * Throws if the cookie is invalid or revoked.
 */
export async function verifySessionCookie(
  cookie: string
): Promise<DecodedIdToken> {
  return adminAuth.verifySessionCookie(cookie, true); // true = check revoked
}
