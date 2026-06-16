"use client";

import React, { useState } from "react";
import { Bookmark, Loader2, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSavedTopics } from "@/lib/hooks/useSavedTopics";
import SavedTopicCard from "@/components/saved/SavedTopicCard";
import { Button } from "@/components/ui/button";

export default function SavedTopicsPage() {
  const { savedTopics, loading, removeTopic } = useSavedTopics();
  const [filterNiche, setFilterNiche] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("All");

  const niches = Array.from(
    new Set(savedTopics.map((topic) => topic.trendSnapshot.niche))
  ).filter(Boolean);

  const filteredTopics = savedTopics.filter((topic) => {
    const matchesNiche = filterNiche
      ? topic.trendSnapshot.niche.toLowerCase().includes(filterNiche.toLowerCase())
      : true;
    const matchesPlatform =
      filterPlatform === "All"
        ? true
        : topic.trendSnapshot.platform.toLowerCase() === filterPlatform.toLowerCase();
    return matchesNiche && matchesPlatform;
  });

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
        {savedTopics.length > 0 && (
          <Link href="/trends">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 cursor-pointer">
              <Search className="size-4" />
              Discover More Trends
            </Button>
          </Link>
        )}
      </div>

      {/* Main Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-violet-500 mb-4" />
          <p className="text-sm text-slate-400">Loading your saved library...</p>
        </div>
      ) : savedTopics.length === 0 ? (
        <div className="text-center py-20 border border-[#1E1E2D] bg-[#13131A]/30 rounded-2xl p-8 space-y-4">
          <Bookmark className="size-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-300">Your library is empty</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You haven't bookmarked any viral trends yet. Find trending ideas and hooks in Trend Discovery and save them here.
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
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-[#1E1E2D] bg-[#13131A]/60">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Filter by Niche
              </label>
              <input
                type="text"
                placeholder="Type to filter..."
                value={filterNiche}
                onChange={(e) => setFilterNiche(e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Platform
              </label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2D] rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
              >
                <option value="All">All Platforms</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>
          </div>

          {/* Topics Grid */}
          {filteredTopics.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#1E1E2D] rounded-xl text-slate-400">
              No saved topics match your filters.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredTopics.map((topic) => (
                <SavedTopicCard key={topic.id} topic={topic} onRemove={removeTopic} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
