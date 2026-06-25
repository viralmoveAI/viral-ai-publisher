"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  LayoutDashboard,
  TrendingUp,
  Bookmark,
  FileEdit,
  CheckCircle2,
  Share2,
  XCircle,
  ExternalLink,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { usePublishing } from "@/lib/hooks/usePublishing";
import { PlatformIcon } from "@/components/accounts/PlatformIcons";
import { SocialPlatformId } from "@/lib/types/social.types";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";

export default function DashboardPage() {
  const { userProfile, user } = useAuth();
  const { logs, logsLoading, fetchStats } = usePublishing();
  const [stats, setStats] = useState<{
    savedTopicsCount: number;
    draftCount: number;
    publishedCount: number;
    failedCount: number;
    connectedAccountsCount: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const displayName = userProfile?.displayName || user?.displayName || "Creator";

  useEffect(() => {
    if (userProfile?.workspaceId) {
      fetchStats()
        .then((s) => setStats(s))
        .finally(() => setStatsLoading(false));
    } else {
      setStatsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.workspaceId]);

  const statCards = [
    {
      name: "Saved Topics",
      value: stats?.savedTopicsCount ?? 0,
      description: "Viral topics bookmarked",
      icon: Bookmark,
      color: "text-sky-400",
      bg: "bg-sky-400/10",
      href: "/saved",
    },
    {
      name: "Draft Posts",
      value: stats?.draftCount ?? 0,
      description: "Awaiting publication",
      icon: FileEdit,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      href: "/posts",
    },
    {
      name: "Published Posts",
      value: stats?.publishedCount ?? 0,
      description: "Successfully delivered",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      href: "/posts",
    },
    {
      name: "Connected Accounts",
      value: stats?.connectedAccountsCount ?? 0,
      description: "Social destinations",
      icon: Share2,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      href: "/accounts",
    },
  ];

  const safeDate = (ts: any) => {
    if (!ts) return "—";
    try {
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
  };

  const recentLogs = logs.slice(0, 5);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2D] bg-gradient-to-r from-[#13131A] to-[#1F1F2E] p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-600/5 rounded-full blur-3xl pointer-events-none -ml-10 -mb-10" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-slate-400 max-w-xl text-base">
            Research viral niches, draft content, connect social channels, and publish — all from one workspace.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link href="/trends">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all cursor-pointer">
                <TrendingUp className="size-4" />
                Discover Trends
              </button>
            </Link>
            <Link href="/posts/new">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1E1E2D] bg-white/[0.02] hover:bg-white/[0.04] text-slate-300 hover:text-white text-sm font-medium transition-all cursor-pointer">
                <FileEdit className="size-4" />
                New Post
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.href} className="group block">
            <Card className="bg-[#13131A] border-[#1E1E2D] hover:border-violet-500/30 transition-all duration-300 h-full cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {stat.name}
                </span>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {statsLoading ? (
                  <div className="h-9 w-14 bg-white/10 animate-pulse rounded-lg" />
                ) : (
                  <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                )}
                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two-column lower section */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Analytics Chart */}
        <AnalyticsCharts logs={logs} />

        {/* Recent Activity */}
        <div className="rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-violet-400" />
              <h3 className="font-semibold text-white text-sm">Recent Activity</h3>
            </div>
            <Link href="/posts" className="text-xs text-slate-500 hover:text-violet-400 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          {logsLoading && (
            Array.from({length: 5, }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#1E1E2D] bg-[#0C0C12] hover:bg-[#161622] transition-colors group">
                <div className="size-4 bg-white/10 animate-pulse rounded-full shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-1/2 bg-white/10 animate-pulse rounded-lg mb-1.5" />
                  <div className="h-3 w-1/3 bg-white/10 animate-pulse rounded-lg" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-3 w-6 bg-white/10 animate-pulse rounded-lg" />
                  <div className="h-3 w-8 bg-white/10 animate-pulse rounded-lg" />
                </div>
              </div>
            ))
          )}

          {!logsLoading && recentLogs.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <LayoutDashboard className="size-8 text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500">No activity yet. Publish a post to see it here.</p>
            </div>
          )}

          {!logsLoading && recentLogs.length > 0 && (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#1E1E2D] bg-[#0C0C12] hover:bg-[#161622] transition-colors group"
                >
                  {/* Status dot */}
                  {log.status === "success" ? (
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  ) : log.status === "pending" ? (
                    <Loader2 className="size-4 text-amber-400 animate-spin shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-red-400 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{log.postTitle}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PlatformIcon platform={log.platform as SocialPlatformId} className="size-3 text-slate-500" />
                      <span className="text-[10px] text-slate-500 truncate">{log.accountName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-600">{safeDate(log.attemptedAt)}</span>
                    {log.platformPostUrl && (
                      <a
                        href={log.platformPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-violet-400"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Start Guide — only show if no published posts */}
      {!statsLoading && (stats?.publishedCount ?? 0) === 0 && (
        <Card className="bg-[#13131A] border-[#1E1E2D] p-6">
          <div className="flex items-center gap-2 mb-4">
            <LayoutDashboard className="size-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Getting Started</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: 1, title: "Discover Trends", desc: "Search viral topics by niche, country, and platform.", href: "/trends" },
              { step: 2, title: "Connect Accounts", desc: "Link your Facebook Page or Instagram to enable publishing.", href: "/accounts" },
              { step: 3, title: "Create & Publish", desc: "Draft a post from a saved trend and publish instantly.", href: "/posts/new" },
            ].map(({ step, title, desc, href }) => (
              <Link key={step} href={href} className="group block">
                <div className="p-5 rounded-xl border border-[#1E1E2D] bg-[#0A0A0F] space-y-2 hover:border-violet-500/30 transition-all">
                  <div className="size-7 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                    {step}
                  </div>
                  <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</h3>
                  <p className="text-sm text-slate-400">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
