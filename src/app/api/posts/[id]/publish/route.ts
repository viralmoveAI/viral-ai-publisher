import { NextRequest, NextResponse } from "next/server";
import { decryptToken } from "@/lib/utils/encryption";
import { publishPhotoToFacebook, publishVideoToFacebook, publishTextToFacebook } from "@/lib/services/social/facebook.service";
import { publishToInstagram } from "@/lib/services/social/instagram.service";
import { publishVideoToTikTok } from "@/lib/services/social/tiktok.service";
import { uploadVideoToYouTube } from "@/lib/services/social/youtube.service";
import { refreshYouTubeAccessToken } from "@/lib/services/social/youtubeRefresh.service";
import { refreshTikTokAccessToken } from "@/lib/services/social/tiktokRefresh.service";

// Helper: simulate publishing with realistic random outcomes (fallback/mock mode)
async function simulatePublish(platform: string): Promise<{
  success: boolean;
  postId?: string;
  postUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
}> {
  const latency = 800 + Math.floor(Math.random() * 1400);
  await new Promise((resolve) => setTimeout(resolve, latency));

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
    const { 
      socialAccountId, 
      workspaceId, 
      caption, 
      mediaUrl, 
      mediaType, 
      platform, 
      accessToken, 
      isMock,
      ytMadeForKids,
      ytCategoryId,
      ttPrivacyLevel,
      ttAllowComment,
      ttAllowDuet,
      ttAllowStitch,
      ttIsAigc,
      ttBrandContent,
      ttBrandOrganic
    } = body;

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
      publishStatus?: "success" | "failed" | "processing";
    };

    if (isMock) {
      // Sandbox simulation
      const mockResult = await simulatePublish(platform);
      result = {
        ...mockResult,
        publishStatus: mockResult.success ? "success" : "failed",
      };
    } else if (!accessToken) {
      return NextResponse.json({ error: "Access token is missing for real integration" }, { status: 400 });
    } else {
      // Decrypt token for actual platform integration
      const decryptedToken = decryptToken(accessToken);
      
      // Real API Integrations
      const cleanPlatform = platform.toLowerCase();

      if (cleanPlatform === "facebook") {
        let fbRes;
        if (mediaUrl && mediaType === "video") {
          fbRes = await publishVideoToFacebook(socialAccountId, decryptedToken, mediaUrl, caption || "");
        } else if (mediaUrl) {
          fbRes = await publishPhotoToFacebook(socialAccountId, decryptedToken, mediaUrl, caption || "");
        } else {
          fbRes = await publishTextToFacebook(socialAccountId, decryptedToken, caption || "");
        }

        result = {
          success: fbRes.success,
          postId: fbRes.postId,
          postUrl: fbRes.postUrl,
          errorCode: fbRes.error ? "FACEBOOK_PUBLISH_ERROR" : undefined,
          errorMessage: fbRes.error,
          publishStatus: fbRes.success ? "success" : "failed",
        };
      } else if (cleanPlatform === "instagram") {
        if (!mediaUrl) {
          return NextResponse.json({ error: "Instagram requires an image or video" }, { status: 400 });
        }
        const igRes = await publishToInstagram(
          socialAccountId,
          decryptedToken,
          mediaType === "video" ? "video" : "image",
          mediaUrl,
          caption || ""
        );

        result = {
          success: igRes.success,
          postId: igRes.postId,
          postUrl: igRes.postUrl,
          errorCode: igRes.error ? "INSTAGRAM_PUBLISH_ERROR" : undefined,
          errorMessage: igRes.error,
          publishStatus: igRes.success ? "success" : "failed",
        };
      } else if (cleanPlatform === "tiktok") {
        if (!mediaUrl || mediaType !== "video") {
          return NextResponse.json({ error: "TikTok content posting API requires a video file" }, { status: 400 });
        }
        
        // Refresh token if expired
        const refreshResult = await refreshTikTokAccessToken(workspaceId, socialAccountId);
        if (refreshResult.error) {
          result = {
            success: false,
            errorCode: "TIKTOK_REFRESH_ERROR",
            errorMessage: refreshResult.error,
            publishStatus: "failed",
          };
        } else {
          const ttRes = await publishVideoToTikTok(socialAccountId, refreshResult.accessToken, mediaUrl, caption || "", {
            privacyLevel: ttPrivacyLevel,
            allowComment: ttAllowComment,
            allowDuet: ttAllowDuet,
            allowStitch: ttAllowStitch,
            isAigc: ttIsAigc,
            brandContent: ttBrandContent,
            brandOrganic: ttBrandOrganic
          });
          
          result = {
            success: ttRes.success,
            postId: ttRes.publishId,
            errorCode: ttRes.error ? "TIKTOK_PUBLISH_ERROR" : undefined,
            errorMessage: ttRes.error,
            publishStatus: ttRes.success ? "processing" : "failed",
          };
        }
      } else if (cleanPlatform === "youtube") {
        if (!mediaUrl || mediaType !== "video") {
          return NextResponse.json({ error: "YouTube Data API requires a video file" }, { status: 400 });
        }
        
        // Refresh token if expired
        const refreshResult = await refreshYouTubeAccessToken(workspaceId, socialAccountId);
        if (refreshResult.error) {
          result = {
            success: false,
            errorCode: "YOUTUBE_REFRESH_ERROR",
            errorMessage: refreshResult.error,
            publishStatus: "failed",
          };
        } else {
          const ytRes = await uploadVideoToYouTube(refreshResult.accessToken, mediaUrl, caption.substring(0, 100), caption, {
            categoryId: ytCategoryId,
            madeForKids: ytMadeForKids
          });

          result = {
            success: ytRes.success,
            postId: ytRes.postId || undefined,
            postUrl: ytRes.postUrl || undefined,
            errorCode: ytRes.error ? "YOUTUBE_PUBLISH_ERROR" : undefined,
            errorMessage: ytRes.error,
            publishStatus: ytRes.success ? "success" : "failed",
          };
        }
      } else {
        // Fallback simulation
        const mockResult = await simulatePublish(platform);
        result = {
          ...mockResult,
          publishStatus: mockResult.success ? "success" : "failed",
        };
      }
    }


    return NextResponse.json({
      success: result.success,
      platformPostId: result.postId || null,
      platformPostUrl: result.postUrl || null,
      errorCode: result.errorCode || null,
      errorMessage: result.errorMessage || null,
      publishStatus: result.publishStatus || (result.success ? "success" : "failed"),
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
