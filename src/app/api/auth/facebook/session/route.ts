import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = request.cookies;
  const cookie = cookieStore.get("fb_temp_accounts");

  if (!cookie || !cookie.value) {
    return NextResponse.json({ error: "Session expired or not found" }, { status: 404 });
  }

  try {
    const rawData = JSON.parse(cookie.value);
    
    if (!Array.isArray(rawData)) {
      throw new Error("Invalid session data format");
    }

    // Map the compressed keys back to full keys
    const accounts = rawData.map((item: any) => ({
      accountId: item.ai,
      accountName: item.an,
      accessToken: item.at,
      profilePictureURL: item.pp,
      followerCount: item.fc,
      platform: item.pl,
    }));

    const response = NextResponse.json({ accounts });
    
    // Clear cookie
    response.cookies.delete("fb_temp_accounts");
    
    return response;
  } catch (error: any) {
    console.error("Error reading Facebook session cookie:", error);
    return NextResponse.json({ error: "Failed to parse session data" }, { status: 500 });
  }
}
