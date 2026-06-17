"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Plus, Loader2, AlertCircle } from "lucide-react";
import { usePosts } from "@/lib/hooks/usePosts";
import PostCard from "@/components/posts/PostCard";
import { PostStatus } from "@/lib/types/post.types";

const STATUS_TABS: Array<PostStatus | "All"> = ["All", "Draft", "Published", "Failed"];

const EMPTY_MESSAGES: Record<string, string> = {
  All:       "You haven't created any posts yet.",
  Draft:     "No drafts yet. Start writing your first post!",
  Published: "No published posts yet.",
  Failed:    "No failed posts — great work!",
};

export default function PostsPage() {
  const { posts, loading, error, deletePost } = usePosts();
  const [activeTab, setActiveTab] = useState<PostStatus | "All">("All");

  const filtered = activeTab === "All"
    ? posts
    : posts.filter((p) => p.status === activeTab);

  const counts = {
    All:       posts.length,
    Draft:     posts.filter((p) => p.status === "Draft").length,
    Published: posts.filter((p) => p.status === "Published").length,
    Failed:    posts.filter((p) => p.status === "Failed").length,
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
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

      {/* Status Filter Tabs */}
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
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${
              activeTab === tab ? "bg-violet-600/30 text-violet-300" : "bg-[#0A0A0F] text-slate-500"
            }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-violet-500 mb-4" />
          <p className="text-sm text-slate-400">Loading your posts...</p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} onDelete={deletePost} />
          ))}
        </div>
      )}

      {/* Empty State */}
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
    </div>
  );
}
