"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TrendSearchFormProps {
  onSearch: (params: { niche: string; country: string; platform: string }) => void;
  loading: boolean;
}

const POPULAR_NICHES = ["Fitness", "AI Agents", "Personal Finance", "Healthy Cooking", "Coding"];
const COUNTRIES = [
  { code: "Global", name: "🌍 Global" },
  { code: "US", name: "🇺🇸 United States" },
  { code: "GB", name: "🇬🇧 United Kingdom" },
  { code: "CA", name: "🇨🇦 Canada" },
  { code: "AU", name: "🇦🇺 Australia" },
  { code: "DE", name: "🇩🇪 Germany" },
  { code: "FR", name: "🇫🇷 France" },
];
const PLATFORMS = ["General", "TikTok", "Instagram", "YouTube", "LinkedIn", "Facebook"];

export default function TrendSearchForm({ onSearch, loading }: TrendSearchFormProps) {
  const [niche, setNiche] = useState("");
  const [country, setCountry] = useState("Global");
  const [platform, setPlatform] = useState("General");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) {
      setError("Please enter a niche to search.");
      return;
    }
    setError(null);
    onSearch({ niche: niche.trim(), country, platform });
  };

  const handleSuggestionClick = (suggestedNiche: string) => {
    setNiche(suggestedNiche);
    setError(null);
    onSearch({ niche: suggestedNiche, country, platform });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#13131A] p-6 rounded-2xl border border-[#1E1E2D] shadow-xl">
      <div className="space-y-4">
        {/* Niche Input & Suggestions */}
        <div className="space-y-2">
          <Label htmlFor="niche" className="text-sm font-semibold text-slate-300">
            Niche or Industry
          </Label>
          <div className="relative">
            <Input
              id="niche"
              type="text"
              value={niche}
              onChange={(e) => {
                setNiche(e.target.value);
                if (error) setError(null);
              }}
              placeholder="What niche do you want to research? (e.g. Fitness, AI Agents, Gardening)"
              disabled={loading}
              className={`w-full ${error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            />
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          
          {/* Quick Suggestions Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <span className="text-xs text-slate-500 mr-1">Suggestions:</span>
            {POPULAR_NICHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSuggestionClick(item)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-full border border-white/[0.04] bg-white/[0.02] text-slate-400 hover:text-violet-300 hover:border-violet-500/30 hover:bg-violet-600/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Group */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-semibold text-slate-300">
              Target Country
            </Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
              className="w-full h-10 rounded-md border border-border bg-[#13131A] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Social Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-sm font-semibold text-slate-300">
              Social Media Platform
            </Label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              disabled={loading}
              className="w-full h-10 rounded-md border border-border bg-[#13131A] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Analyzing market trends...
          </>
        ) : (
          <>
            <Search className="size-4" />
            Discover Trends
          </>
        )}
      </Button>
    </form>
  );
}
