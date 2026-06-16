"use client";

import React, { useState } from "react";
import {
  Trash2,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Copy,
  Check,
  Globe,
  MonitorPlay,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { SavedTopic } from "@/lib/hooks/useSavedTopics";

interface SavedTopicCardProps {
  topic: SavedTopic;
  onRemove: (docId: string) => Promise<void>;
}

export default function SavedTopicCard({ topic, onRemove }: SavedTopicCardProps) {
  const [removing, setRemoving] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { trendSnapshot } = topic;

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await onRemove(topic.id);
      toast.success("Topic removed", {
        description: `"${trendSnapshot.keyword}" has been removed from your saved topics.`,
      });
    } catch {
      toast.error("Failed to remove", {
        description: "Something went wrong. Please try again.",
      });
      setRemoving(false);
    }
  };

  const handleCopy = (angle: string, idx: number) => {
    navigator.clipboard.writeText(angle);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getProbabilityStyles = (prob: string) => {
    switch (prob) {
      case "High":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      case "Medium":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      default:
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
    }
  };

  const savedDate = topic.savedAt?.seconds
    ? new Date(topic.savedAt.seconds * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-6 shadow-lg transition-all duration-300 hover:border-violet-500/30 hover:-translate-y-0.5 group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-600/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="size-3" />
              {trendSnapshot.growthRate}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getProbabilityStyles(trendSnapshot.viralProbability)}`}>
              {trendSnapshot.viralProbability} Viral Chance
            </span>
          </div>

          {/* Keyword */}
          <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors leading-snug pr-4">
            {trendSnapshot.keyword}
          </h3>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Tag className="size-3" />
              {trendSnapshot.niche}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="size-3" />
              {trendSnapshot.country}
            </span>
            <span className="flex items-center gap-1">
              <MonitorPlay className="size-3" />
              {trendSnapshot.platform}
            </span>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] text-slate-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all duration-200 cursor-pointer disabled:cursor-default shrink-0"
          title="Remove topic"
        >
          {removing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </button>
      </div>

      {/* Trend Score bar */}
      <div className="my-5 border-t border-[#1E1E2D] pt-4 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Trend Score</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-200">{trendSnapshot.trendScore}/100</span>
            <div className="w-24 h-1.5 bg-[#0A0A0F] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full"
                style={{ width: `${trendSnapshot.trendScore}%` }}
              />
            </div>
          </div>
        </div>
        <span className="text-xs text-slate-600">Saved {savedDate}</span>
      </div>

      {/* Content Angles */}
      {trendSnapshot.contentAngles?.length > 0 && (
        <div className="space-y-3 pt-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="size-3 text-violet-400" />
            AI Suggested Angles &amp; Hooks:
          </span>
          <div className="space-y-2">
            {trendSnapshot.contentAngles.map((angle, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start gap-3 p-3 rounded-lg border border-white/[0.02] bg-[#0A0A0F] text-sm text-slate-300 hover:text-slate-200 transition-colors group/angle"
              >
                <p className="leading-relaxed flex-1 select-all">{angle}</p>
                <button
                  onClick={() => handleCopy(angle, idx)}
                  className="p-1 rounded-md text-slate-500 hover:text-violet-400 hover:bg-white/[0.02] transition-all duration-200 opacity-0 group-hover/angle:opacity-100 cursor-pointer shrink-0"
                  title="Copy Hook"
                >
                  {copiedIndex === idx ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
