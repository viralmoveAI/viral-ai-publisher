import { adminDb } from "@/lib/firebase/admin";
import { decryptToken, encryptToken } from "@/lib/utils/encryption";

export interface RefreshedTokenResult {
  accessToken: string;
  error?: string;
}

/**
 * Checks if a TikTok account's access token is expired or close to expiring (within 5 minutes).
 * If expired, it calls TikTok's OAuth refresh token endpoint using the stored refreshToken,
 * updates the Firestore document with the new credentials, and returns the decrypted accessToken.
 * Utilizes the privileged adminDb instance to bypass client-level security rules.
 *
 * TikTok access tokens typically expire in 24 hours. Refresh tokens are valid for 365 days.
 */
export async function refreshTikTokAccessToken(
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
      return { accessToken: "", error: "No refresh token available to renew TikTok credentials." };
    }

    const decryptedRefreshToken = decryptToken(acc.refreshToken);

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      return { accessToken: "", error: "Missing TikTok Client Credentials in environment config." };
    }

    // TikTok refresh token endpoint
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        refresh_token: decryptedRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      return {
        accessToken: "",
        error: `TikTok Token Refresh Failed: ${errData.error_description || errData.error || "Unknown Error"}`,
      };
    }

    const tokenData = await res.json();
    const newAccessToken = tokenData.access_token;
    const newRefreshToken = tokenData.refresh_token;
    const expiresSeconds = tokenData.expires_in || 86400; // TikTok default: 24 hours

    if (!newAccessToken) {
      return { accessToken: "", error: "TikTok token refresh response missing access_token." };
    }

    // Calculate new expiry timestamp
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresSeconds);

    // Save newly generated tokens (encrypted) back to Firestore
    // TikTok rotates the refresh token on each refresh, so we must update both
    const updatePayload: Record<string, any> = {
      accessToken: encryptToken(newAccessToken),
      tokenExpiresAt: expiryDate,
    };

    if (newRefreshToken) {
      updatePayload.refreshToken = encryptToken(newRefreshToken);
    }

    await accountRef.update(updatePayload);

    console.log(`Successfully refreshed TikTok Access Token via Admin SDK for account: ${accountId}`);

    return { accessToken: newAccessToken };
  } catch (err: any) {
    console.error("refreshTikTokAccessToken error:", err);
    return { accessToken: "", error: err.message || "Failed to refresh TikTok credentials." };
  }
}
