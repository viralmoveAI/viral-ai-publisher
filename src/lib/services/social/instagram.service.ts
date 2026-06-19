export interface InstagramPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface InstagramAccountStats {
  followerCount: number;
}

export interface InstagramPostStats {
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
}

/**
 * Helper to poll container status until it is 'FINISHED'
 */
async function pollInstagramContainer(
  containerId: string,
  accessToken: string,
  maxAttempts = 10,
  intervalMs = 4000
): Promise<boolean> {
  const endpoint = `https://graph.facebook.com/v19.0/${containerId}?fields=status_code,status&access_token=${accessToken}`;
  
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.status_code === "FINISHED") {
        return true;
      }
      if (data.status_code === "ERROR") {
        throw new Error(data.error?.message || "Container creation failed with status code ERROR");
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

/**
 * Publishes an image or video to an Instagram Business account.
 * Instagram requires a 2-step process: Create Container -> Publish Container.
 */
export async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  mediaType: "image" | "video",
  mediaUrl: string,
  caption: string
): Promise<InstagramPublishResult> {
  try {
    // 1. Create Media Container
    const containerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media`;
    const containerParams: Record<string, string> = {
      caption,
      access_token: accessToken,
    };

    if (mediaType === "video") {
      containerParams.media_type = "REELS";
      containerParams.video_url = mediaUrl;
    } else {
      containerParams.image_url = mediaUrl;
    }

    const containerRes = await fetch(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(containerParams),
    });

    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData.error) {
      return { success: false, error: containerData.error?.message || "Failed to create media container" };
    }

    const containerId = containerData.id;

    // Videos (Reels) need to finish processing before publication
    if (mediaType === "video") {
      const finished = await pollInstagramContainer(containerId, accessToken);
      if (!finished) {
        return { success: false, error: "Video processing timed out on Instagram servers" };
      }
    }

    // 2. Publish Media Container
    const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error) {
      return { success: false, error: publishData.error?.message || "Failed to publish media container" };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://www.instagram.com/p/${publishData.id}`, // Placeholder or construct from media lookup later
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Fetches Instagram account follower analytics.
 */
export async function getInstagramAccountStats(
  igUserId: string,
  accessToken: string
): Promise<InstagramAccountStats> {
  const endpoint = `https://graph.facebook.com/v19.0/${igUserId}?fields=followers_count&access_token=${accessToken}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error("Failed to fetch Instagram account stats");
  }
  const data = await res.json();
  return {
    followerCount: data.followers_count || 0,
  };
}

/**
 * Fetches Instagram media post-level analytics.
 */
export async function getInstagramMediaStats(
  mediaId: string,
  accessToken: string
): Promise<InstagramPostStats> {
  const endpoint = `https://graph.facebook.com/v19.0/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error("Failed to fetch Instagram media stats");
  }
  const data = await res.json();
  return {
    likeCount: data.like_count || 0,
    commentCount: data.comments_count || 0,
    viewCount: 0, // Organic view counts require specialized business insights API permissions
    shareCount: 0,
  };
}
