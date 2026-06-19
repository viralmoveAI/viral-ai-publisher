"use client";

import React, { useState } from "react";
import { Loader2, Link2Off } from "lucide-react";
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
import { SocialPlatformId } from "@/lib/types/social.types";

interface DisconnectAccountDialogProps {
  accountId: string;
  accountName: string;
  platform: SocialPlatformId;
  onConfirm: (accountId: string) => Promise<void>;
}

export default function DisconnectAccountDialog({
  accountId,
  accountName,
  platform,
  onConfirm,
}: DisconnectAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await onConfirm(accountId);
      toast.success("Account disconnected", {
        description: `"${accountName}" was successfully disconnected from your workspace.`,
      });
      setOpen(false);
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect account", {
        description: "Please try again.",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-medium transition-all duration-200 cursor-pointer"
          title={`Disconnect ${platformLabel} account`}
        >
          <Link2Off className="size-3.5" />
          <span>Disconnect</span>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-[#13131A] border border-[#1E1E2D] text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Disconnect {platformLabel} Account?</DialogTitle>
          <DialogDescription className="text-slate-400 mt-1.5">
            Are you sure you want to disconnect{" "}
            <span className="font-semibold text-slate-200">"{accountName}"</span> from this workspace? 
            You will no longer be able to publish posts to this {platformLabel} account from ViralMove.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
          <DialogClose asChild>
            <button className="px-4 py-2 rounded-xl border border-[#1E1E2D] bg-white/[0.02] text-slate-300 hover:text-white hover:border-white/10 text-sm font-medium transition-all cursor-pointer">
              Cancel
            </button>
          </DialogClose>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-all cursor-pointer"
          >
            {disconnecting && <Loader2 className="size-4 animate-spin" />}
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
