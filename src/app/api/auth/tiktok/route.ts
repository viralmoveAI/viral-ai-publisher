import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/tiktok/callback`;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.redirect(`${appUrl}/accounts?error=missing_workspace`);
  }

  if (!clientKey) {
    return NextResponse.redirect(
      `${appUrl}/accounts?error=missing_credentials&platform=tiktok`
    );
  }

  // Scopes required for video publishing, user info, and video data
  const scopes = [
    "user.info.basic",
    "video.publish",
    "video.upload",
  ];

  const state = JSON.stringify({ workspaceId, platform: "tiktok" });
  const encodedState = Buffer.from(state).toString("base64");

  // TikTok Login Kit v2 authorization URL
  const tiktokAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scopes.join(",")}&response_type=code&state=${encodedState}`;

  return NextResponse.redirect(tiktokAuthUrl);
}
