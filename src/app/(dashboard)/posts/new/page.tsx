"use client";

import React from "react";
import { PenLine, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PostForm from "@/components/posts/PostForm";

export default function NewPostPage() {
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
          <PenLine className="size-6 text-violet-400" />
          New Post
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Write your post and save it as a draft. You can publish it once a social account is connected.
        </p>
      </div>

      {/* Form */}
      <div className="bg-[#13131A] border border-[#1E1E2D] rounded-2xl p-6 md:p-8">
        <PostForm />
      </div>
    </div>
  );
}
