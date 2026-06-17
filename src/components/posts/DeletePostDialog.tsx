"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeletePostDialogProps {
  postId: string;
  postTitle: string;
  onConfirm: (postId: string) => Promise<void>;
}

export default function DeletePostDialog({ postId, postTitle, onConfirm }: DeletePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(postId);
      toast.success("Post deleted", {
        description: `"${postTitle}" has been permanently removed.`,
      });
      setOpen(false);
    } catch {
      toast.error("Failed to delete post", { description: "Please try again." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-lg border border-white/[0.04] bg-white/[0.02] text-slate-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
          title="Delete post"
        >
          <Trash2 className="size-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent className="bg-[#13131A] border border-[#1E1E2D] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Delete Post?</DialogTitle>
          <DialogDescription className="text-slate-400">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-slate-200">"{postTitle}"</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-2">
          <DialogClose asChild>
            <button className="px-4 py-2 rounded-xl border border-[#1E1E2D] bg-white/[0.02] text-slate-300 hover:text-white hover:border-white/10 text-sm font-medium transition-all cursor-pointer">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-all cursor-pointer"
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            {deleting ? "Deleting…" : "Delete Post"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
