"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, Loader2, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSavedTopics } from "@/lib/hooks/useSavedTopics";
import SavedTopicCard from "@/components/saved/SavedTopicCard";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";

export default function SavedTopicsPage() {
  const { 
    savedTopics, 
    loading, 
    error,
    removeTopic, 
    pageHistory, 
    hasMore, 
    isFetching, 
    fetchInitialTopics, 
    fetchNextPage, 
    fetchPrevPage 
  } = useSavedTopics();

  const platformAnchorRef = useComboboxAnchor();

  const [filterNiche, setFilterNiche] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [debouncedNiche, setDebouncedNiche] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedNiche(filterNiche);
    }, 500);
    return () => clearTimeout(handler);
  }, [filterNiche]);

  // Refetch initial page when debounced niche or platform filter changes
  useEffect(() => {
    fetchInitialTopics(debouncedNiche, filterPlatform);
  }, [debouncedNiche, filterPlatform]);

  const handleNextPage = () => {
    fetchNextPage(debouncedNiche, filterPlatform);
  };

  const handlePrevPage = () => {
    fetchPrevPage(debouncedNiche, filterPlatform);
  };

  const SkeletonCard = () => (
    <div className="rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-slate-800/60 rounded" />
          <div className="h-4 w-32 bg-slate-800/40 rounded mt-2" />
        </div>
        <div className="h-9 w-20 bg-slate-800/60 rounded-xl" />
      </div>
      <div className="h-4 w-full bg-slate-800/40 rounded mt-4" />
      <div className="h-4 w-5/6 bg-slate-800/40 rounded" />
    </div>
  );

  const showSkeleton = loading || isFetching;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Bookmark className="size-6 text-violet-400 fill-violet-400/10" />
            Saved Topics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your personal library of saved viral trends and hooks.
          </p>
        </div>
        <Link href="/trends">
          <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 cursor-pointer">
            <Search className="size-4" />
            Discover More Trends
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[#1E1E2D] bg-[#13131A]/60">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Filter by Niche
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Type to search niche..."
              value={filterNiche}
              onChange={(e) => setFilterNiche(e.target.value)}
              className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />
            {showSkeleton && (
              <Loader2 className="absolute right-3 size-4 animate-spin text-violet-500" />
            )}
          </div>
        </div>
        <div className="sm:w-48">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Platform
          </label>
          <Combobox value={filterPlatform} onValueChange={(val) => val && setFilterPlatform(val)}>
            <div ref={platformAnchorRef} className="w-full">
              <ComboboxTrigger className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-[#13131A] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50">
                <ComboboxValue placeholder="Select platform...">
                  {filterPlatform === "All" ? "All Platforms" : filterPlatform}
                </ComboboxValue>
              </ComboboxTrigger>
            </div>
            <ComboboxContent anchor={platformAnchorRef} className="bg-[#13131A] border border-[#1E1E2D] min-w-[192px]">
              <ComboboxList className="max-h-60 overflow-y-auto">
                <ComboboxItem value="All">All Platforms</ComboboxItem>
                <ComboboxItem value="TikTok">TikTok</ComboboxItem>
                <ComboboxItem value="Instagram">Instagram</ComboboxItem>
                <ComboboxItem value="YouTube">YouTube</ComboboxItem>
                <ComboboxItem value="Facebook">Facebook</ComboboxItem>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <Bookmark className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Body */}
      {showSkeleton ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={`saved-skeleton-${i}`} />
          ))}
        </div>
      ) : savedTopics.length === 0 ? (
        <div className="text-center py-20 border border-[#1E1E2D] bg-[#13131A]/30 rounded-2xl p-8 space-y-4">
          <Bookmark className="size-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-300">No topics found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Try adjusting your niche keywords or platform filters, or find new viral trends to save.
          </p>
          <Link href="/trends" className="inline-block mt-2">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 cursor-pointer">
              Go to Trend Discovery
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Topics Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {savedTopics.map((topic) => (
              <SavedTopicCard key={topic.id} topic={topic} onRemove={removeTopic} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#1E1E2D]">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={pageHistory.length === 0 || showSkeleton}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#13131A] hover:bg-[#161622] border border-[#1E1E2D] disabled:opacity-40 disabled:cursor-not-allowed text-slate-350 text-xs font-semibold transition-all cursor-pointer"
            >
              &larr; Prev
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Page <span className="text-slate-200">{pageHistory.length + 1}</span>
            </span>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!hasMore || showSkeleton}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#13131A] hover:bg-[#161622] border border-[#1E1E2D] disabled:opacity-40 disabled:cursor-not-allowed text-slate-350 text-xs font-semibold transition-all cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
