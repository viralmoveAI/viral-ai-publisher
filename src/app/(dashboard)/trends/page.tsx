"use client";

import React, { useState } from "react";
import { TrendingUp, AlertCircle, Sparkles } from "lucide-react";

import { useTrends } from "@/lib/hooks/useTrends";
import { useSavedTopics } from "@/lib/hooks/useSavedTopics";
import TrendSearchForm from "@/components/trends/TrendSearchForm";
import TrendCard from "@/components/trends/TrendCard";
import { Trend } from "@/lib/types/trend.types";

export default function TrendsPage() {
  const { trends, loading, error, searchTrends } = useTrends();
  const { isTopicSaved, saveTopic, removeTopic } = useSavedTopics();
  
  // Track parameters of the current search to save snapshot correctly
  const [currentFilters, setCurrentFilters] = useState<{
    niche: string;
    country: string;
    platform: string;
  } | null>(null);
  

  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (params: { niche: string; country: string; platform: string }) => {
    setCurrentFilters(params);
    setHasSearched(true);
    await searchTrends(params);
  };

  const handleSaveToggle = async (trend: Trend) => {
    if (!currentFilters) return;
    
    try {
      if (isTopicSaved(trend.id)) {
        await removeTopic(trend.id);
      } else {
        await saveTopic(
          trend,
          currentFilters.niche,
          currentFilters.country,
          currentFilters.platform
        );
      }
    } catch (err) {
      console.error("Save toggle failed:", err);
    }
  };

  const SkeletonCard = () => (
    <div className="rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-[#1E1E2D] rounded" />
            <div className="h-5 w-24 bg-[#1E1E2D] rounded" />
          </div>
          <div className="h-6 w-48 bg-[#1E1E2D] rounded mt-2" />
        </div>
        <div className="h-10 w-10 bg-[#1E1E2D] rounded-xl" />
      </div>
      <div className="h-4 w-32 bg-[#1E1E2D] rounded mt-4" />
      <div className="space-y-2 pt-2">
        <div className="h-10 w-full bg-[#1E1E2D] rounded-lg" />
        <div className="h-10 w-full bg-[#1E1E2D] rounded-lg" />
        <div className="h-10 w-full bg-[#1E1E2D] rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <TrendingUp className="size-6 text-violet-400" />
          Trend Discovery
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Search, evaluate, and save trending topics with AI-suggested content hooks.
        </p>
      </div>

      {/* Search Form */}
      <TrendSearchForm onSearch={handleSearch} loading={loading} />

      {/* Errors */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-6">
        {hasSearched && !loading && !error && trends.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="size-4 text-violet-400" />
              Top Trend Recommendations ({trends.length})
            </h2>
            <span className="text-xs text-slate-500">
              Platform: <span className="text-violet-400 font-semibold">{currentFilters?.platform}</span>
            </span>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results List */}
        {!loading && !error && trends.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {trends.map((trend) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                isSaved={isTopicSaved(trend.id)}
                onSave={handleSaveToggle}
              />
            ))}
          </div>
        )}

        {/* Empty / Intro State */}
        {!hasSearched && !loading && (
          <div className="text-center py-16 border border-[#1E1E2D] bg-[#13131A]/30 rounded-2xl p-8 space-y-3">
            <TrendingUp className="size-10 text-slate-600 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-300">Ready to find viral ideas?</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Type your industry or choose a suggested niche above to retrieve targeted growth scores and hooks.
            </p>
          </div>
        )}

        {/* No Results Fallback */}
        {hasSearched && !loading && !error && trends.length === 0 && (
          <div className="text-center py-16 border border-[#1E1E2D] bg-[#13131A]/30 rounded-2xl p-8 space-y-2">
            <AlertCircle className="size-8 text-slate-600 mx-auto" />
            <h3 className="text-md font-semibold text-slate-300">No trends found</h3>
            <p className="text-sm text-slate-400">
              Try adjusting your filters or search keywords.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
