"use client";

import React, { useState } from "react";
import { Bookmark, Sparkles, Copy, Check, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Trend } from "@/lib/types/trend.types";

interface TrendCardProps {
  trend: Trend;
  isSaved?: boolean;
  onSave?: (trend: Trend) => Promise<void>;
}

export default function TrendCard({ trend, isSaved = false, onSave }: TrendCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  const handleSave = async () => {
    if (!onSave || saving || saved) return;
    setSaving(true);
    try {
      await onSave(trend);
      setSaved(true);
      toast.success("Trend saved!", {
        description: `"${trend.topic}" has been added to your saved topics.`,
      });
    } catch {
      toast.error("Failed to save", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyAngle = (angle: string, index: number) => {
    navigator.clipboard.writeText(angle);
    setCopiedIndex(index);
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-6 shadow-lg transition-all duration-300 hover:border-violet-500/30 hover:shadow-violet-600/5 hover:-translate-y-0.5 group">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-600/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Growth Rate */}
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="size-3" />
              {trend.growthRate}
            </span>
            {/* Viral Probability */}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getProbabilityStyles(trend.viralProbability)}`}>
              {trend.viralProbability} Viral Chance
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors pt-2 pr-4">
            {trend.topic}
          </h3>
        </div>

        {/* Save / Bookmark Button */}
        {onSave && (
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer disabled:cursor-default ${
              saved
                ? "bg-violet-600/20 border-violet-500/30 text-violet-400"
                : saving
                ? "bg-white/[0.04] border-white/[0.08] text-slate-400"
                : "bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
            title={saved ? "Saved" : saving ? "Saving…" : "Save Trend"}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Bookmark className={`size-4 transition-all duration-200 ${saved ? "fill-violet-400" : ""}`} />
            )}
          </button>
        )}
      </div>

      {/* Stats Divider */}
      <div className="my-5 border-t border-[#1E1E2D] pt-4 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Trend Score</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-200">{trend.trendScore}/100</span>
            {/* Progress bar */}
            <div className="w-24 h-1.5 bg-[#0A0A0F] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full"
                style={{ width: `${trend.trendScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Angles */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sparkles className="size-3 text-violet-400" />
          AI Suggested Angles &amp; Hooks:
        </span>
        <div className="space-y-2">
          {trend.contentAngles.map((angle, idx) => (
            <div
              key={idx}
              className="flex justify-between items-start gap-3 p-3 rounded-lg border border-white/[0.02] bg-[#0A0A0F] text-sm text-slate-300 hover:text-slate-200 transition-colors group/angle"
            >
              <p className="leading-relaxed flex-1 select-all">{angle}</p>
              <button
                onClick={() => handleCopyAngle(angle, idx)}
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
    </div>
  );
}
