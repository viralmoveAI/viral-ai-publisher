"use client";

import React, { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Hash, Link2, Image, Video, AlertCircle, Info, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { usePosts } from "@/lib/hooks/usePosts";
import { usePostMedia } from "@/lib/hooks/usePostMedia";
import { Post, PostFormData, SocialPlatform } from "@/lib/types/post.types";

const PLATFORMS: SocialPlatform[] = ["TikTok", "Instagram", "YouTube", "LinkedIn", "Facebook"];

interface PostFormProps {
  /** Existing post when editing; undefined when creating */
  existing?: Post;
}

export default function PostForm({ existing }: PostFormProps) {
  const router = useRouter();
  const { createPost, updatePost } = usePosts();
  const isEditing = Boolean(existing);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [caption, setCaption] = useState(existing?.caption ?? "");
  const [platform, setPlatform] = useState<SocialPlatform>(existing?.platform ?? null);
  const [hashtags, setHashtags] = useState<string[]>(existing?.hashtags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Media URL hook
  const { mediaURL, mediaType, urlError, handleChange: handleMediaChange, clear: clearMedia } = usePostMedia(
    existing?.mediaURL ?? null
  );

  // ── Tag helpers ────────────────────────────────────────────────────────────
  const addTag = () => {
    const raw = tagInput.trim().replace(/^#/, "");
    if (!raw) return;
    const tag = `#${raw}`;
    if (!hashtags.includes(tag)) setHashtags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && tagInput === "" && hashtags.length > 0) {
      setHashtags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setHashtags((prev) => prev.filter((t) => t !== tag));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !caption.trim()) {
      toast.error("Title and caption are required.");
      return;
    }
    if (urlError) {
      toast.error("Please fix the media URL before saving.");
      return;
    }

    setSaving(true);
    try {
      const data: PostFormData = {
        title: title.trim(),
        caption: caption.trim(),
        hashtags,
        platform,
        mediaURL: mediaURL.trim() || null,
        mediaType: mediaURL.trim() ? mediaType : null,
      };

      if (isEditing && existing) {
        await updatePost(existing.id, data);
        toast.success("Post updated!", { description: "Your changes have been saved." });
      } else {
        await createPost(data);
        toast.success("Draft saved!", { description: "Your post has been saved as a draft." });
      }
      router.push("/posts");
    } catch {
      toast.error("Failed to save post.", { description: "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-300">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g. 5 AI Tools That Will Replace Your Entire Team"
          className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition-colors"
          required
        />
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-300">
          Caption <span className="text-red-400">*</span>
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={7}
          placeholder="Write your full post caption here..."
          className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
          required
        />
        <p className="text-xs text-slate-500 text-right">{caption.length} characters</p>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-300">Target Platform</label>
        <select
          value={platform ?? ""}
          onChange={(e) => setPlatform((e.target.value as SocialPlatform) || null)}
          className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60 transition-colors"
        >
          <option value="">— Select platform —</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p ?? undefined}>{p}</option>
          ))}
        </select>
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
          <Hash className="size-3.5 text-violet-400" />
          Hashtags
          <span className="text-slate-500 font-normal">(Press Enter or comma to add)</span>
        </label>
        <div className="min-h-[52px] flex flex-wrap gap-2 items-center bg-[#0A0A0F] border border-[#1E1E2D] rounded-xl px-3 py-2.5 focus-within:border-violet-500/60 transition-colors">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-violet-600/15 border border-violet-500/20 text-violet-300"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-violet-400 hover:text-white transition-colors ml-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={hashtags.length === 0 ? "#fitness #gym …" : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── Media Section ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
          <Link2 className="size-3.5 text-violet-400" />
          Media URL
          <span className="text-slate-500 font-normal">(optional)</span>
        </label>

        {/* Info banner — explains why direct upload is unavailable */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06]">
          <CloudOff className="size-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-300">Direct file upload is not available</p>
            <p className="text-xs text-amber-400/80 leading-relaxed">
              This project runs on the Firebase Spark (free) plan which does not include Firebase Storage.
              As a workaround, paste a publicly accessible link to your image or video below —
              for example, a Cloudinary URL, Google Drive share link, or a direct CDN link.
            </p>
          </div>
        </div>

        {/* URL input */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Link2 className="size-4" />
          </div>
          <input
            type="url"
            value={mediaURL}
            onChange={(e) => handleMediaChange(e.target.value)}
            placeholder="https://example.com/your-image-or-video.jpg"
            className={`w-full bg-[#0A0A0F] border rounded-xl pl-10 pr-10 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
              urlError
                ? "border-red-500/50 focus:border-red-500/60"
                : mediaURL && !urlError
                ? "border-emerald-500/40 focus:border-emerald-500/60"
                : "border-[#1E1E2D] focus:border-violet-500/60"
            }`}
          />
          {/* Clear button */}
          {mediaURL && (
            <button
              type="button"
              onClick={clearMedia}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
              title="Clear URL"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Validation error */}
        {urlError && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="size-3.5 shrink-0" />
            {urlError}
          </div>
        )}

        {/* Auto-detected media type badge */}
        {mediaURL && !urlError && mediaType && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            {mediaType === "image" ? (
              <Image className="size-3.5 shrink-0" />
            ) : (
              <Video className="size-3.5 shrink-0" />
            )}
            Detected as <span className="font-semibold capitalize">{mediaType}</span>
          </div>
        )}

        {/* Could not auto-detect — neutral hint */}
        {mediaURL && !urlError && !mediaType && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="size-3.5 shrink-0" />
            Could not auto-detect media type — it will be saved as a generic link.
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving || Boolean(urlError)}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold transition-all cursor-pointer"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/posts")}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
