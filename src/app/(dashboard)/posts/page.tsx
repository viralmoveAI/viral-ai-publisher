"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  History,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
import { usePosts } from "@/lib/hooks/usePosts";
import { usePublishing } from "@/lib/hooks/usePublishing";
import PostCard from "@/components/posts/PostCard";
import { PlatformIcon } from "@/components/accounts/PlatformIcons";
import { PostStatus } from "@/lib/types/post.types";
import { SocialPlatformId } from "@/lib/types/social.types";

const STATUS_TABS: Array<PostStatus | "All"> = ["All", "Draft", "Published", "Failed"];

const EMPTY_MESSAGES: Record<string, string> = {
  All:       "You haven't created any posts yet.",
  Draft:     "No drafts yet. Start writing your first post!",
  Published: "No published posts yet.",
  Failed:    "No failed posts — great work!",
};

type MainTab = "posts" | "history";

export default function PostsPage() {
  const { posts, loading, error, deletePost } = usePosts();
  const { logs, logsLoading, hasMore, isFetchingNext, fetchNextLogs } = usePublishing();
  const [mainTab, setMainTab] = useState<MainTab>("posts");
  const [activeTab, setActiveTab] = useState<PostStatus | "All">("All");

  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mainTab !== "history" || !hasMore || isFetchingNext) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextLogs();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [mainTab, hasMore, isFetchingNext, fetchNextLogs]);

  const filtered = activeTab === "All"
    ? posts
    : posts.filter((p) => p.status === activeTab);

  const counts = {
    All:       posts.length,
    Draft:     posts.filter((p) => p.status === "Draft").length,
    Published: posts.filter((p) => p.status === "Published").length,
    Failed:    posts.filter((p) => p.status === "Failed").length,
  };


  const safeDate = (ts: any) => {
    if (!ts) return "—";
    try {
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <FileText className="size-6 text-violet-400" />
            Content
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create, manage, and publish your social media posts.
          </p>
        </div>
        <Link href="/posts/new">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all cursor-pointer">
            <Plus className="size-4" />
            New Post
          </button>
        </Link>
      </div>

      {/* Main Tab: Posts / History */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#13131A] border border-[#1E1E2D] w-fit">
        <button
          onClick={() => setMainTab("posts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mainTab === "posts"
              ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="size-3.5" />
          Posts
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${mainTab === "posts" ? "bg-violet-600/30 text-violet-300" : "bg-[#0A0A0F] text-slate-500"}`}>
            {posts.length}
          </span>
        </button>
        <button
          onClick={() => setMainTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mainTab === "history"
              ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="size-3.5" />
          History
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${mainTab === "history" ? "bg-violet-600/30 text-violet-300" : "bg-[#0A0A0F] text-slate-500"}`}>
            {logs.length}
          </span>
        </button>
      </div>

      {/* ── POSTS TAB ─────────────────────────────────────────────────────── */}
      {mainTab === "posts" && (
        <>
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#13131A] border border-[#1E1E2D] w-fit">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-violet-600/20 text-violet-400 border border-violet-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
                <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab ? "bg-violet-600/30 text-violet-300" : "bg-[#0A0A0F] text-slate-500"}`}>
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-violet-500 mb-4" />
              <p className="text-sm text-slate-400">Loading your posts...</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {filtered.map((post) => (
                <PostCard key={post.id} post={post} onDelete={deletePost} />
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20 border border-[#1E1E2D] bg-[#13131A]/30 rounded-2xl p-8 space-y-4">
              <FileText className="size-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-300">{EMPTY_MESSAGES[activeTab]}</h3>
              {activeTab === "All" && (
                <Link href="/posts/new">
                  <button className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all cursor-pointer">
                    <Plus className="size-4" />
                    Create Your First Post
                  </button>
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────────────── */}
      {mainTab === "history" && (
        <div className="space-y-3">
          {logsLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-7 animate-spin text-violet-500 mb-3" />
              <p className="text-sm text-slate-400">Loading publishing history...</p>
            </div>
          )}

          {!logsLoading && logs.length === 0 && (
            <div className="text-center py-16 border border-[#1E1E2D] bg-[#13131A]/30 rounded-2xl space-y-3">
              <History className="size-10 text-slate-700 mx-auto" />
              <p className="text-slate-400 text-sm font-medium">No publishing history yet</p>
              <p className="text-slate-500 text-xs">Publish a post to start building your log.</p>
            </div>
          )}

          {!logsLoading && logs.length > 0 && (
            <div className="rounded-2xl border border-[#1E1E2D] overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 text-[10px] uppercase tracking-wider text-slate-600 font-semibold px-5 py-3 border-b border-[#1E1E2D] bg-[#0C0C12]">
                <span>Status</span>
                <span className="pl-4">Post</span>
                <span className="pr-8">Platform</span>
                <span>Date</span>
              </div>

              <div className="divide-y divide-[#1E1E2D]">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-5 py-4 bg-[#13131A] hover:bg-[#161622] transition-colors group"
                  >
                    {/* Status icon */}
                    <div className="flex items-center justify-center">
                      {log.status === "success" ? (
                        <CheckCircle2 className="size-4 text-emerald-400" />
                      ) : log.status === "pending" ? (
                        <Loader2 className="size-4 text-amber-400 animate-spin" />
                      ) : (
                        <XCircle className="size-4 text-red-400" />
                      )}
                    </div>

                    {/* Post info */}
                    <div className="pl-4 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{log.postTitle}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 truncate">{log.accountName}</span>
                        {log.isMock && (
                          <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded font-semibold">
                            SIM
                          </span>
                        )}
                        {log.status === "failed" && (
                          <span className="text-[10px] text-red-400/80 truncate max-w-[200px]">
                            Error
                          </span>
                        )}
                      </div>
                    </div>


                    {/* Platform */}
                    <div className="flex items-center gap-2 pr-8">
                      <PlatformIcon platform={log.platform as SocialPlatformId} className="size-4 text-slate-400" />
                      <span className="text-xs text-slate-500 capitalize hidden sm:block">{log.platform}</span>
                    </div>

                    {/* Date + external link */}
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="size-3" />
                      <span className="hidden md:block">{safeDate(log.attemptedAt)}</span>
                      {log.platformPostUrl && (
                        <a
                          href={log.platformPostUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-400 hover:text-violet-300"
                          title="View live post"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading Skeleton for Next Chunk */}
                {isFetchingNext && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={`skeleton-${i}`}
                        className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-5 py-4 bg-[#13131A] border-t border-[#1E1E2D] animate-pulse"
                      >
                        <div className="size-4 bg-slate-800 rounded-full" />
                        <div className="pl-4 space-y-2">
                          <div className="h-4 bg-slate-850 rounded w-1/3" />
                          <div className="h-3 bg-slate-850 rounded w-1/4" />
                        </div>
                        <div className="h-4 bg-slate-850 rounded w-16 mr-8" />
                        <div className="h-4 bg-slate-850 rounded w-20" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Infinite Scroll Trigger Anchor */}
          {hasMore && !logsLoading && (
            <div ref={observerTargetRef} className="py-6 flex justify-center">
              <Loader2 className="size-5 animate-spin text-violet-500" />
            </div>
          )}
        </div>
      )}

    </div>
  );
}
