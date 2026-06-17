import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const encodedState = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code || !encodedState) {
    console.error("Facebook OAuth callback error:", error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}/accounts?error=oauth_failed&details=${encodeURIComponent(
        errorDescription || error || "Unknown error"
      )}`
    );
  }

  try {
    // Decode state
    const stateStr = Buffer.from(encodedState, "base64").toString("utf-8");
    const { workspaceId, platform } = JSON.parse(stateStr);

    const appId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      console.error("Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET");
      return NextResponse.redirect(`${appUrl}/accounts?error=missing_credentials`);
    }

    const redirectUri = `${appUrl}/api/auth/facebook/callback`;

    // 1. Exchange code for user access token
    const tokenExchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${appSecret}&code=${code}`;

    const tokenRes = await fetch(tokenExchangeUrl);
    if (!tokenRes.ok) {
      const errData = await tokenRes.json();
      throw new Error(`Failed to exchange code: ${errData.error?.message || "Unknown error"}`);
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived User Access Token (lasts ~60 days)
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;

    const llRes = await fetch(longLivedUrl);
    if (!llRes.ok) {
      throw new Error("Failed to generate long-lived token");
    }
    const llData = await llRes.json();
    const longLivedUserToken = llData.access_token;

    const availableAccounts: any[] = [];

    // 3. Fetch managed Facebook Pages
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture{url},fan_count&limit=100&access_token=${longLivedUserToken}`;
    const pagesRes = await fetch(pagesUrl);
    if (!pagesRes.ok) {
      throw new Error("Failed to fetch managed Facebook Pages");
    }
    const pagesData = await pagesRes.json();

    if (pagesData.data && Array.isArray(pagesData.data)) {
      for (const page of pagesData.data) {
        if (platform === "facebook") {
          // If we want Facebook Page connection, store it directly
          availableAccounts.push({
            accountId: page.id,
            accountName: page.name,
            accessToken: page.access_token, // This is already a page access token
            profilePictureURL: page.picture?.data?.url || null,
            followerCount: page.fan_count || 0,
            platform: "facebook",
          });
        } else if (platform === "instagram") {
          // Fetch linked Instagram Business Account
          const igUrl = `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url,followers_count}&access_token=${page.access_token}`;
          const igRes = await fetch(igUrl);
          
          if (igRes.ok) {
            const igData = await igRes.json();
            const igAccount = igData.instagram_business_account;
            if (igAccount) {
              availableAccounts.push({
                accountId: igAccount.id,
                accountName: igAccount.username ? `@${igAccount.username}` : igAccount.name,
                accessToken: page.access_token, // Instagram publishing API uses the linked Page access token
                profilePictureURL: igAccount.profile_picture_url || null,
                followerCount: igAccount.followers_count || 0,
                platform: "instagram",
              });
            }
          }
        }
      }
    }

    if (availableAccounts.length === 0) {
      return NextResponse.redirect(
        `${appUrl}/accounts?error=no_accounts_found&platform=${platform}`
      );
    }

    // 4. Save accounts in temporary HttpOnly cookie
    const response = NextResponse.redirect(
      `${appUrl}/accounts?select_platform=${platform}&workspaceId=${workspaceId}`
    );

    // Limit cookie size (max 4KB) by picking essential fields
    const cookieData = JSON.stringify(
      availableAccounts.slice(0, 10).map((acc) => ({
        ai: acc.accountId,
        an: acc.accountName,
        at: acc.accessToken,
        pp: acc.profilePictureURL,
        fc: acc.followerCount,
        pl: acc.platform,
      }))
    );

    response.cookies.set("fb_temp_accounts", cookieData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes validity
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Facebook Callback Route Error:", err);
    return NextResponse.redirect(
      `${appUrl}/accounts?error=callback_error&details=${encodeURIComponent(err.message || "")}`
    );
  }
}
