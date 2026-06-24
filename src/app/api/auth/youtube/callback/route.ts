import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/utils/encryption";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const encodedState = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !encodedState) {
    console.error("YouTube OAuth callback error:", error);
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

    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET");
      return NextResponse.redirect(`${appUrl}/accounts?error=missing_credentials`);
    }

    const redirectUri = `${appUrl}/api/auth/youtube/callback`;

    // 2. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json();
      throw new Error(`Failed to exchange code: ${errData.error_description || errData.error || "Unknown error"}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token; // Received when prompt=consent & access_type=offline
    const expiresSeconds = tokenData.expires_in || 3600;

    // 3. Fetch Channel Details from YouTube Data API v3
    // Fetch channels associated with authorized Google Account
    const channelsRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!channelsRes.ok) {
      throw new Error("Failed to fetch YouTube channel details");
    }

    const channelsData = await channelsRes.json();
    const channelItem = channelsData.items?.[0];

    if (!channelItem) {
      return NextResponse.redirect(
        `${appUrl}/accounts?error=no_accounts_found&platform=youtube`
      );
    }

    const channelId = channelItem.id;
    const channelTitle = channelItem.snippet?.title || "YouTube Channel";
    const profilePictureURL = channelItem.snippet?.thumbnails?.default?.url || null;
    const subscriberCount = parseInt(channelItem.statistics?.subscriberCount || "0", 10);

    // 4. Structure connected account payload - Encrypt tokens for database storage protection
    const availableAccount = {
      accountId: channelId,
      accountName: channelTitle,
      accessToken: encryptToken(accessToken),
      refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      profilePictureURL: profilePictureURL,
      followerCount: subscriberCount,
      platform: "youtube",
      expiresIn: expiresSeconds,
    };

    // 5. Store session in cookie (same mechanism as Meta)
    const response = NextResponse.redirect(
      `${appUrl}/accounts?select_platform=youtube&workspaceId=${workspaceId}`
    );

    response.cookies.set("yt_temp_account", JSON.stringify(availableAccount), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("YouTube Callback Route Error:", err);
    return NextResponse.redirect(
      `${appUrl}/accounts?error=callback_error&details=${encodeURIComponent(err.message || "")}`
    );
  }
}
