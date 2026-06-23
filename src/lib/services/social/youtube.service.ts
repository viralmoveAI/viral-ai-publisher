export interface YouTubePublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface YouTubeChannelStats {
  subscriberCount: number;
}

export interface YouTubeVideoStats {
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
}

/**
 * Uploads a video to YouTube using the YouTube Data API v3.
 * Fetches the public mediaUrl and pipes the stream directly to Google API.
 */
export async function uploadVideoToYouTube(
  accessToken: string,
  videoUrl: string,
  title: string,
  description: string,
  options?: {
    categoryId?: string;
    madeForKids?: boolean;
  }
): Promise<YouTubePublishResult> {
  try {
    // 1. Initial metadata insert request
    const metadataUrl = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";
    const initRes = await fetch(metadataUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          title: title.substring(0, 100),
          description: description.substring(0, 5000),
          categoryId: options?.categoryId || "22",
        },
        status: {
          privacyStatus: "private",
          selfDeclaredMadeForKids: options?.madeForKids ?? false,
        },
      }),
    });


    if (!initRes.ok) {
      const errText = await initRes.text();
      return { success: false, error: `Metadata upload initiation failed: ${errText}` };
    }

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) {
      return { success: false, error: "Resumable upload URL location header missing" };
    }

    // 2. Fetch the video stream and upload it
    const videoStreamRes = await fetch(videoUrl);
    if (!videoStreamRes.ok) {
      return { success: false, error: "Failed to download video to stream to YouTube" };
    }
    const videoBlob = await videoStreamRes.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": videoBlob.type || "video/mp4",
        "Content-Length": videoBlob.size.toString(),
      },
      body: videoBlob,
    });

    const data = await uploadRes.json();
    if (!uploadRes.ok || data.error) {
      return { success: false, error: data.error?.message || "YouTube upload stream failed" };
    }

    return {
      success: true,
      postId: data.id,
      postUrl: `https://www.youtube.com/watch?v=${data.id}`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

/**
 * Fetches subscriber counts for a channel.
 */
export async function getYouTubeChannelStats(
  channelId: string,
  accessToken: string
): Promise<YouTubeChannelStats> {
  const endpoint = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}`;
  const res = await fetch(endpoint, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch YouTube channel stats");
  }
  const data = await res.json();
  const channel = data.items?.[0];
  return {
    subscriberCount: parseInt(channel?.statistics?.subscriberCount || "0", 10),
  };
}

/**
 * Fetches video performance analytics (views, likes, comments).
 */
export async function getYouTubeVideoStats(
  videoId: string,
  accessToken: string
): Promise<YouTubeVideoStats> {
  const endpoint = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`;
  const res = await fetch(endpoint, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch YouTube video stats");
  }
  const data = await res.json();
  const video = data.items?.[0];
  return {
    likeCount: parseInt(video?.statistics?.likeCount || "0", 10),
    commentCount: parseInt(video?.statistics?.commentCount || "0", 10),
    viewCount: parseInt(video?.statistics?.viewCount || "0", 10),
    shareCount: 0, // YouTube API doesn't expose share count on standard items via this endpoint
  };
}
