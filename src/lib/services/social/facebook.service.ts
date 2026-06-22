export interface FacebookPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface FacebookPageStats {
  followerCount: number;
}

export interface FacebookPostStats {
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
}

/**
 * Publishes a photo to a Facebook Page's feed.
 */
export async function publishPhotoToFacebook(
  pageId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<FacebookPublishResult> {
  try {
    const endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        message: caption,
        access_token: accessToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || "Failed to publish photo" };
    }

    return {
      success: true,
      postId: data.post_id || data.id,
      postUrl: `https://www.facebook.com/${data.post_id || data.id}`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Publishes a video to a Facebook Page's feed.
 */
export async function publishVideoToFacebook(
  pageId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<FacebookPublishResult> {
  try {
    const endpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_url: videoUrl,
        description: caption,
        access_token: accessToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || "Failed to publish video" };
    }

    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.facebook.com/${pageId}/videos/${data.id}`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Fallback feed text posting to a Facebook Page's feed.
 */
export async function publishTextToFacebook(
  pageId: string,
  accessToken: string,
  message: string,
  linkUrl?: string
): Promise<FacebookPublishResult> {
  try {
    const endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const body: Record<string, string> = {
      message,
      access_token: accessToken,
    };
    if (linkUrl) {
      body.link = linkUrl;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || "Failed to publish text post" };
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

/**
 * Fetches page followers count.
 */
export async function getFacebookPageStats(
  pageId: string,
  accessToken: string
): Promise<FacebookPageStats> {
  const endpoint = `https://graph.facebook.com/v19.0/${pageId}?fields=fan_count&access_token=${accessToken}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error("Failed to fetch Facebook Page stats");
  }
  const data = await res.json();
  return {
    followerCount: data.fan_count || 0,
  };
}

/**
 * Fetches post-level engagement metrics.
 */
export async function getFacebookPostStats(
  postId: string,
  accessToken: string
): Promise<FacebookPostStats> {
  const fields = "shares,likes.summary(true).limit(0),comments.summary(true).limit(0)";
  const endpoint = `https://graph.facebook.com/v19.0/${postId}?fields=${fields}&access_token=${accessToken}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error("Failed to fetch Facebook Post stats");
  }
  const data = await res.json();
  return {
    likeCount: data.likes?.summary?.total_count || 0,
    commentCount: data.comments?.summary?.total_count || 0,
    viewCount: 0, // Facebook Graph API does not return organic view counts on standard posts via this endpoint
    shareCount: data.shares?.count || 0,
  };
}
