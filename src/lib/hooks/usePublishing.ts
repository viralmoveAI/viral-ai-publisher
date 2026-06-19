"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { SocialAccount } from "@/lib/types/social.types";
import { Post } from "@/lib/types/post.types";
import { PublishingLog, WorkspaceStats } from "@/lib/types/publishing.types";

export function usePublishing() {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState<PublishingLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);

  const workspaceId: string | null = userProfile?.workspaceId || null;

  // ─── Real-time publishing logs ────────────────────────────────────────────
  useEffect(() => {
    if (!user || !workspaceId) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }

    setLogsLoading(true);
    const logsRef = collection(db, "workspaces", workspaceId, "publishing_logs");
    const q = query(logsRef, orderBy("attemptedAt", "desc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: PublishingLog[] = [];
        snapshot.forEach((d) => {
          result.push({ id: d.id, ...(d.data() as Omit<PublishingLog, "id">) });
        });
        setLogs(result);
        setLogsLoading(false);
      },
      (err) => {
        console.error("usePublishing logs error:", err);
        setLogsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, workspaceId]);

  // ─── Publish a post ───────────────────────────────────────────────────────
  const publishPost = async (
    post: Post,
    account: SocialAccount
  ): Promise<{ success: boolean; errorMessage?: string }> => {
    if (!user || !workspaceId) throw new Error("Authentication required.");

    const isMock = account.accountId.includes("mock") || account.accessToken.startsWith("mock_");
    const startTime = Date.now();

    // 1. Call our server-side publish route (keeps tokens off the client for real accounts)
    let result: {
      success: boolean;
      platformPostId: string | null;
      platformPostUrl: string | null;
      errorCode: string | null;
      errorMessage: string | null;
      durationMs: number;
    };

    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialAccountId: account.accountId,
          workspaceId,
          caption: post.caption,
          mediaUrl: post.mediaURL || null,
          platform: account.platform,
          accessToken: account.accessToken,
          accountName: account.accountName,
          isMock,
        }),
      });

      result = await res.json();
    } catch (err: any) {
      result = {
        success: false,
        platformPostId: null,
        platformPostUrl: null,
        errorCode: "NETWORK_ERROR",
        errorMessage: err.message || "Failed to reach publishing server.",
        durationMs: Date.now() - startTime,
      };
    }

    // 2. Update post status in Firestore
    const postRef = doc(db, "workspaces", workspaceId, "posts", post.id);
    await updateDoc(postRef, {
      status: result.success ? "Published" : "Failed",
      publishedAt: result.success ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });

    // 3. Write publishing log
    await addDoc(collection(db, "workspaces", workspaceId, "publishing_logs"), {
      workspaceId,
      postId: post.id,
      postTitle: post.title,
      triggeredBy: user.uid,
      platform: account.platform,
      socialAccountId: account.accountId,
      accountName: account.accountName,
      status: result.success ? "success" : "failed",
      platformPostId: result.platformPostId,
      platformPostUrl: result.platformPostUrl,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      attemptedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      durationMs: result.durationMs,
      isMock,
    });

    return {
      success: result.success,
      errorMessage: result.errorMessage || undefined,
    };
  };

  // ─── Aggregate workspace stats ────────────────────────────────────────────
  const fetchStats = async (): Promise<WorkspaceStats> => {
    if (!workspaceId) return { savedTopicsCount: 0, draftCount: 0, publishedCount: 0, failedCount: 0, connectedAccountsCount: 0, recentLogs: [] };

    // Posts stats
    const postsSnap = await getDocs(collection(db, "workspaces", workspaceId, "posts"));
    let draftCount = 0, publishedCount = 0, failedCount = 0;
    postsSnap.forEach((d) => {
      const s = d.data().status;
      if (s === "Draft") draftCount++;
      else if (s === "Published") publishedCount++;
      else if (s === "Failed") failedCount++;
    });

    // Social accounts
    const accountsSnap = await getDocs(collection(db, "workspaces", workspaceId, "social_accounts"));
    const connectedAccountsCount = accountsSnap.size;

    // Saved topics — must use where("userId") to satisfy Firestore security rule:
    // allow read: if isAuthenticated() && resource.data.userId == request.auth.uid
    let savedTopicsCount = 0;
    if (user?.uid) {
      const savedSnap = await getDocs(
        query(collection(db, "saved_trends"), where("userId", "==", user.uid))
      );
      savedTopicsCount = savedSnap.size;
    }

    const result: WorkspaceStats = {
      savedTopicsCount,
      draftCount,
      publishedCount,
      failedCount,
      connectedAccountsCount,
      recentLogs: logs.slice(0, 5),
    };

    setStats(result);
    return result;
  };

  return { logs, logsLoading, stats, publishPost, fetchStats, workspaceId };
}
