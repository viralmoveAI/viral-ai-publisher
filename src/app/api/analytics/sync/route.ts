import { NextRequest, NextResponse } from "next/server";
import { admin, adminDb } from "@/lib/firebase/admin";
import { decryptToken } from "@/lib/utils/encryption";
import { refreshYouTubeAccessToken } from "@/lib/services/social/youtubeRefresh.service";
import { verifySession } from "@/lib/firebase/verifySession";

import { getFacebookPageStats, getFacebookPostStats } from "@/lib/services/social/facebook.service";
import { getInstagramAccountStats, getInstagramMediaStats } from "@/lib/services/social/instagram.service";
import { getTikTokCreatorInfo, getTikTokVideoStats, getTikTokPublishStatus } from "@/lib/services/social/tiktok.service";
import { getYouTubeChannelStats, getYouTubeVideoStats } from "@/lib/services/social/youtube.service";

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // 1. Fetch connected accounts using Admin SDK
    const accountsSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("social_accounts")
      .get();
    const accounts = accountsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    // Sync account follower statistics
    const accountSyncPromises = accounts.map(async (acc) => {
      // Skip mock accounts
      if (acc.accessToken && !acc.accessToken.startsWith("mock_")) {
        try {
          let decryptedToken = decryptToken(acc.accessToken);
          let followers = acc.followerCount || 0;

          if (acc.platform === "facebook") {
            const stats = await getFacebookPageStats(acc.accountId, decryptedToken);
            followers = stats.followerCount;
          } else if (acc.platform === "instagram") {
            const stats = await getInstagramAccountStats(acc.accountId, decryptedToken);
            followers = stats.followerCount;
          } else if (acc.platform === "tiktok") {
            const stats = await getTikTokCreatorInfo(decryptedToken);
            followers = stats.followerCount;
          } else if (acc.platform === "youtube") {
            // Refresh token first if needed
            const refreshResult = await refreshYouTubeAccessToken(workspaceId, acc.id);
            if (!refreshResult.error) {
              decryptedToken = refreshResult.accessToken;
            }
            const stats = await getYouTubeChannelStats(acc.accountId, decryptedToken);
            followers = stats.subscriberCount;
          }

          // Update Firestore using Admin SDK
          await adminDb
            .collection("workspaces")
            .doc(workspaceId)
            .collection("social_accounts")
            .doc(acc.id)
            .update({
              followerCount: followers,
            });
        } catch (accountErr) {
          console.error(`Error syncing follower count for account ${acc.id}:`, accountErr);
        }
      }
    });

    await Promise.all(accountSyncPromises);

    // 2. Fetch and sync post engagement statistics (last 30 days logs) using Admin SDK
    const logsSnap = await adminDb
      .collection("workspaces")
      .doc(workspaceId)
      .collection("publishing_logs")
      .get();
    const logs = logsSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() })) as any[];

    const logsSyncPromises = logs.map(async (log) => {
      // Skip sync if log is mock or failed
      if (log.isMock || log.status === "failed") return;

      const account = accounts.find(a => a.id === log.socialAccountId);
      if (!account || !account.accessToken) return;

      try {
        const decryptedToken = decryptToken(account.accessToken);

        // A. Handle TikTok Async Polling Check
        if (log.platform === "tiktok" && log.publishStatus === "processing" && log.platformPostId) {
          const statusCheck = await getTikTokPublishStatus(log.platformPostId, decryptedToken);
          if (statusCheck.status === "success") {
            await log.ref.update({
              status: "success",
              publishStatus: "success",
              completedAt: new Date(),
            });
            // Refetch log details to fetch metrics next loop
            log.publishStatus = "success";
          } else if (statusCheck.status === "failed") {
            await log.ref.update({
              status: "failed",
              publishStatus: "failed",
              errorCode: "TIKTOK_PROCESSING_FAILED",
              errorMessage: statusCheck.error || "TikTok processing failed.",
              completedAt: new Date(),
            });
            return;
          } else {
            // Still processing, skip metrics pull
            return;
          }
        }

        // B. Pull Post Level Engagement Metrics
        if (log.platformPostId && (log.publishStatus === "success" || !log.publishStatus)) {
          let stats = { likeCount: 0, commentCount: 0, viewCount: 0, shareCount: 0 };

          if (log.platform === "facebook") {
            stats = await getFacebookPostStats(log.platformPostId, decryptedToken);
          } else if (log.platform === "instagram") {
            stats = await getInstagramMediaStats(log.platformPostId, decryptedToken);
          } else if (log.platform === "tiktok") {
            stats = await getTikTokVideoStats(log.platformPostId, decryptedToken);
          } else if (log.platform === "youtube") {
            let activeToken = decryptedToken;
            const refreshResult = await refreshYouTubeAccessToken(workspaceId, log.socialAccountId);
            if (!refreshResult.error) {
              activeToken = refreshResult.accessToken;
            }
            stats = await getYouTubeVideoStats(log.platformPostId, activeToken);
          }

          // Update log using Admin SDK
          await log.ref.update({
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            viewCount: stats.viewCount,
            shareCount: stats.shareCount,
            lastSyncedAt: admin.firestore.Timestamp.now(),
          });
        }
      } catch (logErr) {
        console.error(`Error syncing metrics for publishing log ${log.id}:`, logErr);
      }
    });

    await Promise.all(logsSyncPromises);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Sync route error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync metrics" }, { status: 500 });
  }
}
