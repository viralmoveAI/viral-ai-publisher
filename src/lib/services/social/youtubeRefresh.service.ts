import { adminDb } from "@/lib/firebase/admin";
import { decryptToken, encryptToken } from "@/lib/utils/encryption";

export interface RefreshedTokenResult {
  accessToken: string;
  error?: string;
}

/**
 * Checks if a YouTube account's access token is expired or close to expiring (within 5 minutes).
 * If expired, it calls Google OAuth token endpoint using the stored refreshToken,
 * updates the Firestore document with the new credentials, and returns the decrypted accessToken.
 * Utilizes the privileged adminDb instance to bypass client-level security rules.
 */
export async function refreshYouTubeAccessToken(
  workspaceId: string,
  accountId: string
): Promise<RefreshedTokenResult> {
  try {
    const accountRef = adminDb.collection("workspaces").doc(workspaceId).collection("social_accounts").doc(accountId);
    const accountSnap = await accountRef.get();

    if (!accountSnap.exists) {
      return { accessToken: "", error: "Social account document not found in database." };
    }

    const acc = accountSnap.data();
    if (!acc) {
      return { accessToken: "", error: "Social account document has no data." };
    }

    const now = new Date();

    // Check if tokenExpiresAt exists and if it is still valid (with a 5-minute buffer)
    if (acc.tokenExpiresAt) {
      // Handle both Admin Firestore Timestamp and JS Date
      const expiry = acc.tokenExpiresAt.toDate ? acc.tokenExpiresAt.toDate() : new Date(acc.tokenExpiresAt);
      const bufferTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins buffer

      if (expiry > bufferTime) {
        // Token is still valid, return decrypted token directly
        return { accessToken: decryptToken(acc.accessToken) };
      }
    }

    // Token is expired or expiring soon, let's refresh it
    if (!acc.refreshToken) {
      return { accessToken: "", error: "No refresh token available to renew credentials." };
    }

    const decryptedRefreshToken = decryptToken(acc.refreshToken);

    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { accessToken: "", error: "Missing YouTube Client Credentials in environment config." };
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: decryptedRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      return {
        accessToken: "",
        error: `Google Token Refresh Failed: ${errData.error_description || errData.error || "Unknown Error"}`,
      };
    }

    const tokenData = await res.json();
    const newAccessToken = tokenData.access_token;
    const expiresSeconds = tokenData.expires_in || 3600;

    // Calculate new expiry timestamp
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresSeconds);

    // Save newly generated access token (encrypted) back to Firestore
    await accountRef.update({
      accessToken: encryptToken(newAccessToken),
      tokenExpiresAt: expiryDate,
    });

    console.log(`Successfully refreshed Google Access Token via Admin SDK for account: ${accountId}`);

    return { accessToken: newAccessToken };
  } catch (err: any) {
    console.error("refreshYouTubeAccessToken error:", err);
    return { accessToken: "", error: err.message || "Failed to refresh YouTube credentials." };
  }
}
