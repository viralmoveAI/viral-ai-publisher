"use client";

import React from "react";
import { Users, Calendar } from "lucide-react";
import { SocialAccount } from "@/lib/types/social.types";
import { PlatformIcon } from "./PlatformIcons";
import DisconnectAccountDialog from "./DisconnectAccountDialog";

interface SocialAccountCardProps {
  account: SocialAccount;
  onDisconnect: (id: string) => Promise<void>;
}

export default function SocialAccountCard({ account, onDisconnect }: SocialAccountCardProps) {
  const { id, platform, accountName, accountId, profilePictureURL, followerCount, connectedAt } = account;

  // Safe date formatting helper for Firestore Timestamp or Date objects
  const getFormattedDate = (val: any) => {
    if (!val) return "—";
    try {
      if (val.toDate) {
        return val.toDate().toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
      return new Date(val).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "—";
    }
  };


  // Follower count abbreviation helper
  const formatFollowers = (count: number | null) => {
    if (count === null || count === undefined) return "—";
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  // Platform brand styles
  const brandColors: Record<string, { bg: string; border: string; text: string }> = {
    facebook: {
      bg: "bg-[#1877F2]/10",
      border: "border-[#1877F2]/20",
      text: "text-[#1877F2]",
    },
    instagram: {
      bg: "bg-[#E1306C]/10",
      border: "border-[#E1306C]/20",
      text: "text-[#E1306C]",
    },
    tiktok: {
      bg: "bg-white/[0.04]",
      border: "border-white/10",
      text: "text-slate-100",
    },
    youtube: {
      bg: "bg-[#FF0000]/10",
      border: "border-[#FF0000]/20",
      text: "text-[#FF0000]",
    },
  };

  const currentBrand = brandColors[platform] || brandColors.facebook;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-5 shadow-lg transition-all duration-300 hover:border-white/[0.08] hover:bg-[#161622] hover:-translate-y-0.5">
      {/* Decorative platform brand glow */}
      <div
        className={`absolute -right-10 -top-10 w-24 h-24 rounded-full filter blur-[40px] opacity-10 transition-opacity group-hover:opacity-20 ${
          platform === "facebook" ? "bg-[#1877F2]" : platform === "instagram" ? "bg-[#E1306C]" : "bg-white"
        }`}
      />

      <div className="flex items-start gap-4">
        {/* Avatar / Profile Picture */}
        <div className="relative shrink-0">
          {profilePictureURL ? (
            <img
              src={profilePictureURL}
              alt={accountName}
              className="size-12 rounded-xl object-cover ring-1 ring-white/10"
              onError={(e) => {
                // If image fails, fallback to platform placeholder
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className={`size-12 rounded-xl flex items-center justify-center ring-1 ring-white/10 ${currentBrand.bg} ${currentBrand.text}`}>
              <PlatformIcon platform={platform} className="size-6" />
            </div>
          )}
          
          {/* Small badge for Platform Icon overlay */}
          <div className={`absolute -bottom-1.5 -right-1.5 p-1 rounded-md border border-[#13131A] ring-1 ring-white/5 ${currentBrand.bg} ${currentBrand.text}`}>
            <PlatformIcon platform={platform} className="size-3" />
          </div>
        </div>

        {/* Account Info */}
        <div className="min-w-0 flex-1">
          <h4 className="font-heading font-medium text-white truncate">{accountName}</h4>
          <p className="text-slate-500 text-xs truncate mt-0.5">ID: {accountId}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-400">
            {/* Followers */}
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-slate-500" />
              <span>
                <span className="font-semibold text-slate-200">{formatFollowers(followerCount)}</span>{" "}
                {platform === "youtube" ? "subscribers" : "followers"}
              </span>
            </div>

            {/* Connection Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-slate-500" />
              <span>Connected {getFormattedDate(connectedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings & Action Row */}
      <div className="mt-5 pt-4 border-t border-[#1E1E2D] flex items-center justify-between gap-4">
        {/* Connection Status */}
        <div>
          <div className="text-[10px] text-slate-600 bg-white/[0.01] px-2 py-1 rounded border border-white/[0.02] uppercase tracking-wider font-semibold">
            Active Connection
          </div>
        </div>


        {/* Disconnect dialog trigger */}
        <DisconnectAccountDialog
          accountId={id}
          accountName={accountName}
          platform={platform}
          onConfirm={onDisconnect}
        />
      </div>
    </div>
  );
}
