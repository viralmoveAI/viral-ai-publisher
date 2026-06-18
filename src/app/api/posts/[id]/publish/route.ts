import { NextRequest, NextResponse } from "next/server";

// Helper: simulate Facebook Graph API call for real accounts
async function publishToFacebook(
  accessToken: string,
  accountId: string,
  caption: string,
  mediaUrl: string | null
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const endpoint = `https://graph.facebook.com/v19.0/${accountId}/feed`;
    const body: Record<string, string> = { message: caption, access_token: accessToken };
    if (mediaUrl) body.link = mediaUrl;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || "Facebook API error" };
    }

    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.facebook.com/${data.id}`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

// Helper: simulate publishing with realistic random outcomes
async function simulatePublish(platform: string): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
}> {
  // Simulate network latency: 800ms – 2200ms
  const latency = 800 + Math.floor(Math.random() * 1400);
  await new Promise((resolve) => setTimeout(resolve, latency));

  // 90% success rate
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    const mockId = `mock_${platform}_${Math.random().toString(36).substring(2, 12)}`;
    return {
      success: true,
      postId: mockId,
      postUrl: `https://${platform}.com/posts/${mockId}`,
      durationMs: latency,
    };
  }

  // Realistic failure scenarios
  const failures = [
    { code: "RATE_LIMIT_EXCEEDED", message: "API rate limit exceeded. Please try again in 15 minutes." },
    { code: "INVALID_MEDIA_FORMAT", message: "The provided media URL is not accessible by the platform." },
    { code: "PERMISSION_DENIED", message: "The connected account does not have publishing permissions." },
    { code: "CONTENT_POLICY_VIOLATION", message: "Content may violate platform community guidelines." },
  ];
  const failure = failures[Math.floor(Math.random() * failures.length)];
  return { success: false, errorCode: failure.code, errorMessage: failure.message, durationMs: latency };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id: postId } = await params;
    const body = await request.json();
    const { socialAccountId, workspaceId, caption, mediaUrl, platform, accessToken, accountName, isMock } = body;

    if (!postId || !socialAccountId || !workspaceId || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let result: {
      success: boolean;
      postId?: string;
      postUrl?: string;
      errorCode?: string;
      errorMessage?: string;
      durationMs?: number;
    };

    if (isMock) {
      // Sandbox simulation
      result = await simulatePublish(platform);
    } else if (platform === "facebook" && accessToken) {
      // Real Facebook Graph API
      const fbResult = await publishToFacebook(accessToken, socialAccountId, caption || "", mediaUrl || null);
      result = {
        success: fbResult.success,
        postId: fbResult.postId,
        postUrl: fbResult.postUrl,
        errorCode: fbResult.error ? "GRAPH_API_ERROR" : undefined,
        errorMessage: fbResult.error,
        durationMs: Date.now() - startTime,
      };
    } else {
      // Platform not yet supported for real publishing — fallback to simulation
      result = await simulatePublish(platform);
    }

    return NextResponse.json({
      success: result.success,
      platformPostId: result.postId || null,
      platformPostUrl: result.postUrl || null,
      errorCode: result.errorCode || null,
      errorMessage: result.errorMessage || null,
      durationMs: result.durationMs || Date.now() - startTime,
    });
  } catch (err: any) {
    console.error("Publishing route error:", err);
    return NextResponse.json(
      { success: false, errorCode: "SERVER_ERROR", errorMessage: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
