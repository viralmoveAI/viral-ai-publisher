import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;
  
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const platform = searchParams.get("platform") || "facebook";

  if (!workspaceId) {
    return NextResponse.redirect(`${appUrl}/accounts?error=missing_workspace`);
  }

  if (!appId) {
    // Redirect back to accounts with error flag so we can display instructions or prompt to use simulation mode
    return NextResponse.redirect(
      `${appUrl}/accounts?error=missing_credentials&platform=${platform}`
    );
  }

  // Scopes required for page management and publishing (both Facebook & Instagram Business)
  const scopes = [
    "public_profile",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish"
  ];

  const state = JSON.stringify({ workspaceId, platform });
  const encodedState = Buffer.from(state).toString("base64");

  const fbAuthUrl = `https://www.facebook.com/v25.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scopes.join(",")}&state=${encodedState}`;

  return NextResponse.redirect(fbAuthUrl);
}
