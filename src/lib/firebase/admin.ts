import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK for secure server-side operations
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (privateKey) {
    // If private key is configured (production deployment)
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Format the private key to replace escaped newlines
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // In local development, fall back to Application Default Credentials (ADC) or project configuration
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

// Export the administrative Firestore reference
const adminDb = getFirestore();

// Mock/Adapter to maintain compatibility with existing usages of admin.firestore.Timestamp
const admin = {
  firestore: {
    Timestamp,
  },
};

export { admin, adminDb };
