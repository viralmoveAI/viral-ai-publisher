export interface TikTokPublishResult {
  success: boolean;
  publishId?: string;
  error?: string;
}

export interface TikTokCreatorStats {
  followerCount: number;
}

export interface TikTokVideoStats {
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
}

/**
 * Publishes a video to TikTok using the Direct Post API.
 * The video must be hosted on a public URL. TikTok returns a publish_id
 * which is processed asynchronously. Status must be fetched via polling or webhooks.
 */
export async function publishVideoToTikTok(
  openId: string,
  accessToken: string,
  videoUrl: string,
  caption: string,
  options?: {
    privacyLevel?: "PUBLIC" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
    allowComment?: boolean;
    allowDuet?: boolean;
    allowStitch?: boolean;
    isAigc?: boolean;
    brandContent?: boolean;
    brandOrganic?: boolean;
  }
): Promise<TikTokPublishResult> {
  try {
    const endpoint = "https://open.tiktokapis.com/v2/post/publish/video/init/";
    
    let privacyVal = "PUBLIC_TO_EVERYONE";
    if (options?.privacyLevel === "MUTUAL_FOLLOW_FRIENDS") {
      privacyVal = "MUTUAL_FOLLOW_FRIENDS";
    } else if (options?.privacyLevel === "SELF_ONLY") {
      privacyVal = "SELF_ONLY";
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: caption.substring(0, 150), // TikTok title limit
          privacy_level: privacyVal,
          disable_duet: options?.allowDuet === false,
          disable_stitch: options?.allowStitch === false,
          disable_comment: options?.allowComment === false,
          video_cover_timestamp_ms: 1000,
          is_aigc: options?.isAigc ?? false,
          brand_content_toggle: options?.brandContent ?? false,
          brand_organic_toggle: options?.brandOrganic ?? false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: 50000000, // Dummy estimated size in bytes
          chunk_size: 50000000,
          total_chunk_count: 1,
        },
      }),
    });


    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message || "TikTok initialization failed" };
    }

    const uploadUrl = data.data?.upload_url;
    const publishId = data.data?.publish_id;

    if (!uploadUrl) {
      return { success: false, error: "Upload URL not returned by TikTok" };
    }

    // Swapping local file chunks or using fetch to stream the public URL into TikTok's uploadUrl
    const videoFetch = await fetch(videoUrl);
    if (!videoFetch.ok) {
      return { success: false, error: "Failed to download video from storage to stream to TikTok" };
    }
    const videoBlob = await videoFetch.blob();

    const pushRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes 0-${videoBlob.size - 1}/${videoBlob.size}`,
        "Content-Type": videoBlob.type || "video/mp4",
      },
      body: videoBlob,
    });

    if (!pushRes.ok) {
      return { success: false, error: "Failed to upload video stream to TikTok storage servers" };
    }

    return {
      success: true,
      publishId,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Polls or gets the asynchronous video status for a publishId.
 */
export async function getTikTokPublishStatus(
  publishId: string,
  accessToken: string
): Promise<{ status: "processing" | "success" | "failed"; error?: string }> {
  try {
    const endpoint = `https://open.tiktokapis.com/v2/post/publish/status/get/`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });

    if (!res.ok) return { status: "processing" };
    const data = await res.json();
    const status = data.data?.status;

    if (status === "SUCCESS") {
      return { status: "success" };
    }
    if (status === "FAILED") {
      return { status: "failed", error: data.data?.fail_reason || "Unknown upload error" };
    }
    return { status: "processing" };
  } catch {
    return { status: "processing" };
  }
}

/**
 * Fetches creator details (follower count, etc.).
 */
export async function getTikTokCreatorInfo(
  accessToken: string
): Promise<TikTokCreatorStats> {
  const endpoint = "https://open.tiktokapis.com/v2/user/info/?fields=follower_count";
  const res = await fetch(endpoint, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch TikTok creator info");
  }
  const data = await res.json();
  return {
    followerCount: data.data?.user?.follower_count || 0,
  };
}

/**
 * Fetches specific video analytics metrics.
 */
export async function getTikTokVideoStats(
  videoId: string,
  accessToken: string
): Promise<TikTokVideoStats> {
  const endpoint = "https://open.tiktokapis.com/v2/video/query/?fields=like_count,comment_count,view_count,share_count";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filters: { video_ids: [videoId] } }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch TikTok video stats");
  }
  const data = await res.json();
  const video = data.data?.videos?.[0];
  return {
    likeCount: video?.like_count || 0,
    commentCount: video?.comment_count || 0,
    viewCount: video?.view_count || 0,
    shareCount: video?.share_count || 0,
  };
}
