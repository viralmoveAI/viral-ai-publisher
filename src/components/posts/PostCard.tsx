"use client";

import React from "react";
import Link from "next/link";
import { FileText, MonitorPlay, Pencil, Clock } from "lucide-react";
import { Post } from "@/lib/types/post.types";
import DeletePostDialog from "./DeletePostDialog";

interface PostCardProps {
  post: Post;
  onDelete: (postId: string) => Promise<void>;
}

const STATUS_STYLES: Record<string, string> = {
  Draft:     "bg-amber-500/10 border-amber-500/20 text-amber-400",
  Published: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Failed:    "bg-red-500/10 border-red-500/20 text-red-400",
};

export default function PostCard({ post, onDelete }: PostCardProps) {
  const createdDate = post.createdAt?.seconds
    ? new Date(post.createdAt.seconds * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-5 transition-all duration-300 hover:border-violet-500/30 hover:-translate-y-0.5 group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-600/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/10 shrink-0">
            <FileText className="size-4 text-violet-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
              {post.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Status badge */}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${STATUS_STYLES[post.status] ?? STATUS_STYLES.Draft}`}>
                {post.status}
              </span>
              {/* Platform */}
              {post.platform && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MonitorPlay className="size-3" />
                  {post.platform}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/posts/${post.id}/edit`}
            className="p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] text-slate-400 hover:text-violet-400 hover:border-violet-500/20 hover:bg-violet-500/10 transition-all duration-200"
            title="Edit post"
          >
            <Pencil className="size-3.5" />
          </Link>
          <DeletePostDialog postTitle={post.title} postId={post.id} onConfirm={onDelete} />
        </div>
      </div>

      {/* Caption preview */}
      <p className="mt-4 text-xs text-slate-400 line-clamp-2 leading-relaxed">
        {post.caption}
      </p>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#1E1E2D] flex items-center justify-between text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {createdDate}
        </span>
        {post.hashtags?.length > 0 && (
          <span className="text-violet-500/70 truncate max-w-[160px]">
            {post.hashtags.slice(0, 3).join(" ")}
            {post.hashtags.length > 3 && " …"}
          </span>
        )}
      </div>
    </div>
  );
}
