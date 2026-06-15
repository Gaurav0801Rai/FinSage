import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

function cleanEnvValue(val: string | undefined): string | undefined {
  if (!val) return undefined;
  return val.replace(/\\n/g, "").replace(/\\r/g, "").replace(/[\r\n]+/g, "").trim();
}

const firebaseConfig = {
  apiKey: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// Singleton pattern — Next.js HMR can re-import, this prevents duplicate init
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export { app };