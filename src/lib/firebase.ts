import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getConfig } from "./config";

/**
 * Firebase Admin SDK singleton.
 * Same pattern used in the TEDxUCC project — initialize once, reuse across requests.
 */
let app: App;
let db: Firestore;

export function getFirebaseAdmin(): { app: App; db: Firestore } {
  if (app && db) return { app, db };

  const config = getConfig();

  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        // Firebase private key comes with literal \n that need to be actual newlines
        privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);

  return { app, db };
}
