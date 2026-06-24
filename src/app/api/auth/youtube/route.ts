import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/youtube/callback`;
  
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.redirect(`${appUrl}/accounts?error=missing_workspace`);
  }

  if (!clientId) {
    return NextResponse.redirect(
      `${appUrl}/accounts?error=missing_credentials&platform=youtube`
    );
  }

  // Scopes required for video uploading and statistics querying
  const scopes = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.profile"
  ];

  const state = JSON.stringify({ workspaceId, platform: "youtube" });
  const encodedState = Buffer.from(state).toString("base64");

  // Google OAuth 2.0 Auth URL construction
  // 'access_type=offline' forces Google to issue a refreshToken
  // 'prompt=consent' ensures the user is prompted to authorize, ensuring we get the refreshToken every time
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scopes.join(" "))}&state=${encodedState}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
