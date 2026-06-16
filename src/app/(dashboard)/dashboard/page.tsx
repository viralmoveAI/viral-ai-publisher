"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, Bookmark, FileEdit, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const { userProfile, user } = useAuth();
  
  const displayName = userProfile?.displayName || user?.displayName || "Creator";

  const stats = [
    { name: "Total Searches", value: "0", description: "Across all niches", icon: TrendingUp },
    { name: "Saved Topics", value: "0", description: "Viral topics saved", icon: Bookmark },
    { name: "Draft Posts", value: "0", description: "Ready to review", icon: FileEdit },
    { name: "Published Posts", value: "0", description: "Successfully published", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2D] bg-gradient-to-r from-[#13131A] to-[#1F1F2E] p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-slate-400 max-w-xl text-base">
            Start researching viral niches, planning content, and managing your social channels from one unified, AI-driven workspace.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-[#13131A] border-[#1E1E2D] hover:border-violet-500/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                {stat.name}
              </span>
              <stat.icon className="size-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card className="bg-[#13131A] border-[#1E1E2D] p-6">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="size-5 text-violet-400" />
            Getting Started with ViralAI
          </CardTitle>
          <CardDescription className="text-slate-400">
            Follow these simple steps to start publishing high-reach contents
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-5 rounded-lg border border-[#1E1E2D] bg-[#0A0A0F] space-y-2">
              <div className="size-7 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-semibold text-slate-200">Discover Trends</h3>
              <p className="text-sm text-slate-400">
                Navigate to the Trends search tab to find popular topics, growth numbers, and viral content angles.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[#1E1E2D] bg-[#0A0A0F] space-y-2">
              <div className="size-7 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-semibold text-slate-200">Connect Accounts</h3>
              <p className="text-sm text-slate-400">
                Add your Facebook Page or LinkedIn profile to grant publishing access securely via OAuth.
              </p>
            </div>

            <div className="p-5 rounded-lg border border-[#1E1E2D] bg-[#0A0A0F] space-y-2">
              <div className="size-7 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-semibold text-slate-200">Create & Publish</h3>
              <p className="text-sm text-slate-400">
                Draft post contents directly from saved trends, upload media files, and publish directly to connected channels.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
