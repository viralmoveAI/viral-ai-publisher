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

  // YouTube specific options state
  const [ytMadeForKids, setYtMadeForKids] = useState<boolean>(existing?.ytMadeForKids ?? false);
  const [ytCategoryId, setYtCategoryId] = useState<string>(existing?.ytCategoryId ?? "22");

  // TikTok specific options state
  const [ttPrivacyLevel, setTtPrivacyLevel] = useState<"PUBLIC" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY">(existing?.ttPrivacyLevel ?? "PUBLIC");
  const [ttAllowComment, setTtAllowComment] = useState<boolean>(existing?.ttAllowComment ?? true);
  const [ttAllowDuet, setTtAllowDuet] = useState<boolean>(existing?.ttAllowDuet ?? true);
  const [ttAllowStitch, setTtAllowStitch] = useState<boolean>(existing?.ttAllowStitch ?? true);
  const [ttIsAigc, setTtIsAigc] = useState<boolean>(existing?.ttIsAigc ?? false);
  const [ttBrandContent, setTtBrandContent] = useState<boolean>(existing?.ttBrandContent ?? false);
  const [ttBrandOrganic, setTtBrandOrganic] = useState<boolean>(existing?.ttBrandOrganic ?? false);


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
        // YouTube options
        ytMadeForKids,
        ytCategoryId,
        // TikTok options
        ttPrivacyLevel,
        ttAllowComment,
        ttAllowDuet,
        ttAllowStitch,
        ttIsAigc,
        ttBrandContent,
        ttBrandOrganic,
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

      {/* YouTube Options */}
      {platform === "YouTube" && (
        <div className="p-4 rounded-xl border border-[#1E1E2D] bg-[#0A0A0F]/60 space-y-4">
          <h3 className="text-sm font-semibold text-violet-400">YouTube Publishing Options</h3>
          
          {/* Made for Kids */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Audience (COPPA Compliance) <span className="text-red-400">*</span></label>
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ytMadeForKids"
                  checked={ytMadeForKids}
                  onChange={() => setYtMadeForKids(true)}
                  className="accent-violet-500"
                />
                Yes, it's made for kids
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ytMadeForKids"
                  checked={!ytMadeForKids}
                  onChange={() => setYtMadeForKids(false)}
                  className="accent-violet-500"
                />
                No, it's not made for kids
              </label>
            </div>
            <p className="text-[10px] text-slate-500">
              Regardless of your location, you’re legally required to comply with the Children's Online Privacy Protection Act (COPPA).
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Video Category</label>
            <select
              value={ytCategoryId}
              onChange={(e) => setYtCategoryId(e.target.value)}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500/60 transition-colors"
            >
              <option value="22">People & Blogs</option>
              <option value="20">Gaming</option>
              <option value="27">Education</option>
              <option value="24">Entertainment</option>
              <option value="28">Science & Technology</option>
              <option value="17">Sports</option>
              <option value="1">Film & Animation</option>
              <option value="10">Music</option>
            </select>
          </div>

          {/* AI Disclosure Warning */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              ⚠️ AI Disclosure Requirement
            </p>
            <p className="text-slate-400">
              If this video contains altered or synthetic content (e.g. AI voiceovers, face-swaps, generated scenes), you must manually disclose it in **YouTube Studio** after uploading to avoid channel penalties.
            </p>
          </div>
        </div>
      )}

      {/* TikTok Options */}
      {platform === "TikTok" && (
        <div className="p-4 rounded-xl border border-[#1E1E2D] bg-[#0A0A0F]/60 space-y-4">
          <h3 className="text-sm font-semibold text-violet-400">TikTok Publishing Options</h3>

          {/* Privacy Level */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Privacy Settings</label>
            <select
              value={ttPrivacyLevel}
              onChange={(e) => setTtPrivacyLevel(e.target.value as any)}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500/60 transition-colors"
            >
              <option value="PUBLIC">Public (Everyone)</option>
              <option value="MUTUAL_FOLLOW_FRIENDS">Friends (Mutual Followers)</option>
              <option value="SELF_ONLY">Private (Only Me)</option>
            </select>
            <p className="text-[10px] text-slate-500">
              Note: Un-audited TikTok apps publish as Private (Only Me) by default on TikTok.
            </p>
          </div>

          {/* Interaction Toggles */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Allow Interactions</label>
            <div className="grid grid-cols-3 gap-3 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[#1E1E2D] bg-[#0A0A0F]">
                <input
                  type="checkbox"
                  checked={ttAllowComment}
                  onChange={(e) => setTtAllowComment(e.target.checked)}
                  className="accent-violet-500"
                />
                Comments
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[#1E1E2D] bg-[#0A0A0F]">
                <input
                  type="checkbox"
                  checked={ttAllowDuet}
                  onChange={(e) => setTtAllowDuet(e.target.checked)}
                  className="accent-violet-500"
                />
                Duet
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[#1E1E2D] bg-[#0A0A0F]">
                <input
                  type="checkbox"
                  checked={ttAllowStitch}
                  onChange={(e) => setTtAllowStitch(e.target.checked)}
                  className="accent-violet-500"
                />
                Stitch
              </label>
            </div>
          </div>

          {/* AI Content Disclosure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                AI-Generated Content (AIGC)
              </label>
              <input
                type="checkbox"
                checked={ttIsAigc}
                onChange={(e) => setTtIsAigc(e.target.checked)}
                className="size-4 accent-violet-500 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              TikTok policy requires declaring content generated or significantly altered by AI to avoid reach restrictions.
            </p>
          </div>

          {/* Commercial/Branded Disclosures */}
          <div className="space-y-3 pt-2 border-t border-[#1E1E2D]">
            <label className="block text-xs font-semibold text-slate-300">Content Disclosures</label>
            
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">
                Paid Partnership / Branded Content
              </label>
              <input
                type="checkbox"
                checked={ttBrandContent}
                onChange={(e) => setTtBrandContent(e.target.checked)}
                className="size-4 accent-violet-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300">
                Promotes My Own Brand / Business
              </label>
              <input
                type="checkbox"
                checked={ttBrandOrganic}
                onChange={(e) => setTtBrandOrganic(e.target.checked)}
                className="size-4 accent-violet-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}


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
          <div className="relative rounded-xl border border-[#1E1E2D] bg-[#0A0A0F] p-4 flex items-center justify-between overflow-x-hidden">
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
      <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full md:w-auto items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-semibold transition-all cursor-pointer"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Save as Draft"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/posts")}
          className="w-full md:w-auto text-sm text-slate-400 bg-[#1E1E2D] px-6 py-2.5 rounded-xl hover:text-slate-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
