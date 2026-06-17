"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Pencil, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { usePosts } from "@/lib/hooks/usePosts";
import { Post } from "@/lib/types/post.types";
import PostForm from "@/components/posts/PostForm";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { getPost } = usePosts();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPost(id)
      .then((p) => {
        if (!p) setNotFound(true);
        else setPost(p);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to Content
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Pencil className="size-6 text-violet-400" />
          Edit Post
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Update your post content and save your changes.
        </p>
      </div>

      {/* Body */}
      <div className="bg-[#13131A] border border-[#1E1E2D] rounded-2xl p-6 md:p-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-violet-500 mb-4" />
            <p className="text-sm text-slate-400">Loading post...</p>
          </div>
        )}

        {!loading && notFound && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle className="size-10 text-slate-600" />
            <p className="text-slate-300 font-semibold">Post not found</p>
            <p className="text-sm text-slate-500">This post may have been deleted.</p>
            <Link href="/posts">
              <button className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all cursor-pointer">
                Back to Content
              </button>
            </Link>
          </div>
        )}

        {!loading && post && <PostForm existing={post} />}
      </div>
    </div>
  );
}
