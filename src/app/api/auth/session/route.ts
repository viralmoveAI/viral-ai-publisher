import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/constants/session";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Verify token with Firebase Admin
    await adminAuth.verifyIdToken(idToken);

    const response = NextResponse.json({ success: true });
    
    // Set HTTP-only secure session cookie
    response.cookies.set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour (Firebase ID token lifespan)
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Session creation error:", err);
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
