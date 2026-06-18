"use client";

import React, { useState } from "react";
import { Loader2, Send, AlertCircle, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Post } from "@/lib/types/post.types";
import { SocialAccount } from "@/lib/types/social.types";
import { PlatformIcon } from "@/components/accounts/PlatformIcons";
import { usePublishing } from "@/lib/hooks/usePublishing";

interface PublishPostDialogProps {
  post: Post;
  accounts: SocialAccount[];
  onSuccess?: () => void;
}

export default function PublishPostDialog({ post, accounts, onSuccess }: PublishPostDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  const { publishPost } = usePublishing();

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const isMock = selectedAccount?.accessToken?.startsWith("mock_") || selectedAccount?.accountId?.includes("mock");

  const handlePublish = async () => {
    if (!selectedAccount) return;
    setPublishing(true);
    setResult(null);

    try {
      const res = await publishPost(post, selectedAccount);
      setResult({ success: res.success, error: res.errorMessage });

      if (res.success) {
        toast.success("Post published!", {
          description: `"${post.title}" was successfully published to ${selectedAccount.accountName}.`,
        });
        onSuccess?.();
      } else {
        toast.error("Publishing failed", {
          description: res.errorMessage || "An unexpected error occurred.",
        });
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
      toast.error("Publishing error", { description: err.message });
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!publishing) {
      setOpen(isOpen);
      if (!isOpen) {
        setResult(null);
        setSelectedAccountId("");
      }
    }
  };

  const platformBrandColor: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E1306C",
    tiktok: "#ffffff",
    youtube: "#FF0000",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all duration-200 cursor-pointer"
          title="Publish post"
        >
          <Send className="size-3.5" />
          <span>Publish Now</span>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-[#13131A] border border-[#1E1E2D] text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Send className="size-4 text-violet-400" />
            Publish Post
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Select a connected social account to publish{" "}
            <span className="font-semibold text-slate-200">"{post.title}"</span> immediately.
          </DialogDescription>
        </DialogHeader>

        {/* Post preview strip */}
        <div className="rounded-xl border border-[#1E1E2D] bg-[#0C0C12] p-4 space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Post Preview</p>
          <p className="text-sm text-slate-200 font-medium">{post.title}</p>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{post.caption}</p>
          {post.hashtags?.length > 0 && (
            <p className="text-xs text-violet-400/70">
              {post.hashtags.slice(0, 5).join(" ")}
            </p>
          )}
        </div>

        {/* Account selector */}
        {accounts.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span>No social accounts connected. Go to <strong>Social Accounts</strong> to connect one first.</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Choose Destination
            </p>
            <div className="grid gap-2 max-h-52 overflow-y-auto pr-1">
              {accounts.map((account) => {
                const color = platformBrandColor[account.platform] || "#a78bfa";
                const isSelected = selectedAccountId === account.id;
                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer w-full ${
                      isSelected
                        ? "border-violet-500/40 bg-violet-600/10"
                        : "border-[#1E1E2D] bg-[#0C0C12] hover:border-white/[0.06] hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Avatar */}
                    {account.profilePictureURL ? (
                      <img
                        src={account.profilePictureURL}
                        alt={account.accountName}
                        className="size-9 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                      />
                    ) : (
                      <div
                        className="size-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-white/10"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        <PlatformIcon platform={account.platform} className="size-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{account.accountName}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{account.platform}</p>
                    </div>

                    {/* Mock badge */}
                    {(account.accessToken?.startsWith("mock_") || account.accountId?.includes("mock")) && (
                      <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded font-semibold shrink-0">
                        SIM
                      </span>
                    )}

                    {isSelected && (
                      <CheckCircle2 className="size-4 text-violet-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mock mode notice */}
        {isMock && selectedAccountId && (
          <div className="flex items-start gap-2 p-3 rounded-xl border border-violet-500/10 bg-violet-600/5 text-xs text-violet-300">
            <Sparkles className="size-3.5 shrink-0 mt-0.5 animate-pulse" />
            <span>
              This is a <strong>simulated</strong> account. Publishing will simulate the API flow with realistic timing (no actual social post will be created).
            </span>
          </div>
        )}

        {/* Result state */}
        {result && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
              result.success
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                : "border-red-500/20 bg-red-500/5 text-red-400"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {result.success ? "Successfully published!" : "Publishing failed"}
              </p>
              {result.error && <p className="text-xs mt-0.5 opacity-80">{result.error}</p>}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <DialogClose asChild>
            <button
              disabled={publishing}
              className="px-4 py-2 rounded-xl border border-[#1E1E2D] bg-white/[0.02] text-slate-300 hover:text-white hover:border-white/10 text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              {result?.success ? "Close" : "Cancel"}
            </button>
          </DialogClose>

          {!result?.success && (
            <button
              onClick={handlePublish}
              disabled={!selectedAccountId || publishing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all cursor-pointer"
            >
              {publishing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Publish Now
                </>
              )}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
