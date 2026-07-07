import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK for secure server-side operations
try {
  if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (privateKey && clientEmail && projectId) {
      // Format the private key to replace escaped newlines and strip surrounding quotes
      const formattedKey = privateKey
        .replace(/^["']|["']$/g, "") // Remove surrounding quotes
        .replace(/\\n/g, "\n");       // Replace escaped newlines
        
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      });
    } else {
      // In local development, fall back to Application Default Credentials (ADC) or project configuration
      initializeApp({
        projectId: projectId || "viral-ai-publisher",
      });
    }
  }
} catch (error) {
  console.error("Firebase Admin SDK Initialization Error:", error);
}

// Export the administrative Firestore reference
const adminDb = getFirestore();

// Export the administrative Auth reference for server-side token verification
const adminAuth = getAuth();

// Mock/Adapter to maintain compatibility with existing usages of admin.firestore.Timestamp
const admin = {
  firestore: {
    Timestamp,
  },
};

export { admin, adminDb, adminAuth };
