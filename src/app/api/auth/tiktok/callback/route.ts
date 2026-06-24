import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/utils/encryption";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const encodedState = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !encodedState) {
    console.error("TikTok OAuth callback error:", error);
    return NextResponse.redirect(
      `${appUrl}/accounts?error=oauth_failed&details=${encodeURIComponent(
        error || "OAuth authorization code missing"
      )}`
    );
  }

  try {
    // 1. Decode state
    const stateStr = Buffer.from(encodedState, "base64").toString("utf-8");
    const { workspaceId, platform } = JSON.parse(stateStr);

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      console.error("Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_SECRET");
      return NextResponse.redirect(`${appUrl}/accounts?error=missing_credentials&platform=tiktok`);
    }

    const redirectUri = `${appUrl}/api/auth/tiktok/callback`;

    // 2. Exchange authorization code for tokens
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json();
      throw new Error(`Failed to exchange code: ${errData.error_description || errData.error || "Unknown error"}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const openId = tokenData.open_id;
    const expiresIn = tokenData.expires_in || 86400; // Default 24 hours
    const scopes = tokenData.scope ? tokenData.scope.split(",") : [];

    if (!accessToken || !openId) {
      throw new Error("TikTok token response missing access_token or open_id");
    }

    // 3. Fetch user profile from TikTok User Info API
    const userInfoRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,follower_count",
      {
        headers: { "Authorization": `Bearer ${accessToken}` },
      }
    );

    let displayName = "TikTok Account";
    let avatarUrl: string | null = null;
    let followerCount = 0;

    if (userInfoRes.ok) {
      const userData = await userInfoRes.json();
      const user = userData.data?.user;
      if (user) {
        displayName = user.display_name || displayName;
        avatarUrl = user.avatar_url || null;
        followerCount = user.follower_count || 0;
      }
    }

    // 4. Structure connected account payload - Encrypt tokens for database storage protection
    const availableAccount = {
      accountId: openId,
      accountName: displayName,
      accessToken: encryptToken(accessToken),
      refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      profilePictureURL: avatarUrl,
      followerCount,
      platform: "tiktok",
      expiresIn,
      scopes,
    };

    // 5. Store session in cookie (same mechanism as YouTube)
    const response = NextResponse.redirect(
      `${appUrl}/accounts?select_platform=tiktok&workspaceId=${workspaceId}`
    );

    response.cookies.set("tt_temp_account", JSON.stringify(availableAccount), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes validity
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("TikTok Callback Route Error:", err);
    return NextResponse.redirect(
      `${appUrl}/accounts?error=callback_error&details=${encodeURIComponent(err.message || "")}`
    );
  }
}
