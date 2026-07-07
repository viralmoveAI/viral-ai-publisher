import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/constants/session";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Verify token with Firebase Admin
    await adminAuth.verifyIdToken(idToken);

    // Initialize the cookies store
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    return NextResponse.json({ success: true }, { status: 200 });
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
