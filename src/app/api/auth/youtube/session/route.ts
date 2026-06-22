import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("yt_temp_account");

  if (!cookie || !cookie.value) {
    return NextResponse.json({ error: "Session expired" }, { status: 400 });
  }

  try {
    const rawData = JSON.parse(cookie.value);
    
    // Structure candidate account fields back
    const candidate = {
      accountId: rawData.accountId,
      accountName: rawData.accountName,
      accessToken: rawData.accessToken,
      refreshToken: rawData.refreshToken,
      profilePictureURL: rawData.profilePictureURL,
      followerCount: rawData.followerCount,
      platform: "youtube",
      expiresIn: rawData.expiresIn,
    };

    return NextResponse.json({ account: candidate });
  } catch (err) {
    return NextResponse.json({ error: "Invalid session cookie data" }, { status: 400 });
  }
}
