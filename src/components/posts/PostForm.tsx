"use client";

import React, { useState, KeyboardEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Hash, UploadCloud, Image, Video, Film } from "lucide-react";
import { toast } from "sonner";
import { usePosts } from "@/lib/hooks/usePosts";
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

  // Cloudinary media state
  const [mediaURL, setMediaURL] = useState<string>(existing?.mediaURL ?? "");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(existing?.mediaType ?? null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validation
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Unsupported file type", { description: "Please upload an image or a video." });
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading file to Cloudinary...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setMediaURL(data.url);
      setMediaType(data.resourceType);
      toast.success("File uploaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to upload file to Cloudinary", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const clearMedia = () => {
    setMediaURL("");
    setMediaType(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !caption.trim()) {
      toast.error("Title and caption are required.");
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
        mediaType,
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

      {/* ── Media Upload Section ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-300 flex items-center gap-1.5">
          <UploadCloud className="size-3.5 text-violet-400" />
          Media File
          <span className="text-slate-500 font-normal">(Image or Video)</span>
        </label>

        {mediaURL ? (
          <div className="relative rounded-xl border border-[#1E1E2D] bg-[#0A0A0F] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 shrink-0">
                {mediaType === "video" ? <Film className="size-6" /> : <Image className="size-6" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate max-w-md">{mediaURL}</p>
                <p className="text-[10px] text-emerald-400 font-semibold capitalize mt-0.5">{mediaType} Uploaded</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearMedia}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-violet-500 bg-violet-500/5"
                : "border-[#1E1E2D] bg-[#0A0A0F] hover:border-slate-700"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="size-8 animate-spin text-violet-500 mb-2" />
                <p className="text-xs text-slate-400">Uploading to Cloudinary...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <UploadCloud className="size-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-violet-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-[10px] text-slate-500">Supports JPEG, PNG, MP4, and MOV files</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
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
