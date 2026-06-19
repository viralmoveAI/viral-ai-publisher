"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import { PublishingLog } from "@/lib/types/publishing.types";

interface DataPoint {
  label: string;   // e.g. "Jun 10"
  value: number;
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  gradient: [string, string]; // [start, end] for SVG gradient
  data: DataPoint[];
  total: number;
  change: number; // % change vs prior period
}

// Calculate real engagement metrics based on published log history
function buildMetrics(logs: PublishingLog[]): MetricConfig[] {
  // Group logs by day (last 14 days)
  const now = Date.now();
  const DAY_MS = 86400000;
  const labels: string[] = [];
  const successByDay: number[] = [];
  const reachByDay: number[] = [];       // Sum of views/plays
  const engagementByDay: number[] = [];  // Sum of likes + comments + shares

  for (let i = 13; i >= 0; i--) {
    const dayStart = now - i * DAY_MS;
    const date = new Date(dayStart);
    labels.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

    const dayLogs = logs.filter((l) => {
      const ts = l.attemptedAt?.seconds
        ? l.attemptedAt.seconds * 1000
        : l.attemptedAt instanceof Date
        ? l.attemptedAt.getTime()
        : 0;
      return ts >= dayStart && ts < dayStart + DAY_MS;
    });

    successByDay.push(dayLogs.filter((l) => l.status === "success").length);

    // Sum up real views/plays for reach
    const dayViews = dayLogs.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
    reachByDay.push(dayViews);

    // Sum up likes, comments, and shares for engagement
    const dayEngagements = dayLogs.reduce((acc, curr) => {
      const engagements = (curr.likeCount || 0) + (curr.commentCount || 0) + (curr.shareCount || 0);
      return acc + engagements;
    }, 0);
    engagementByDay.push(dayEngagements);
  }

  const reachData: DataPoint[] = labels.map((label, i) => ({
    label,
    value: reachByDay[i],
  }));

  const engagementData: DataPoint[] = labels.map((label, i) => ({
    label,
    value: engagementByDay[i],
  }));

  const publishData: DataPoint[] = labels.map((label, i) => ({
    label,
    value: successByDay[i],
  }));

  const sumHalf = (data: DataPoint[], half: "first" | "second") => {
    const slice = half === "first" ? data.slice(0, 7) : data.slice(7);
    return slice.reduce((a, c) => a + c.value, 0);
  };

  const pctChange = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  return [
    {
      key: "reach",
      label: "Reach / Views",
      color: "#8b5cf6",
      gradient: ["#8b5cf640", "#8b5cf600"],
      data: reachData,
      total: reachData.reduce((a, c) => a + c.value, 0),
      change: pctChange(sumHalf(reachData, "second"), sumHalf(reachData, "first")),
    },
    {
      key: "engagement",
      label: "Engagements (Likes/Comments)",
      color: "#06b6d4",
      gradient: ["#06b6d440", "#06b6d400"],
      total: engagementData.reduce((a, c) => a + c.value, 0),
      change: pctChange(sumHalf(engagementData, "second"), sumHalf(engagementData, "first")),
      data: engagementData,
    },
    {
      key: "published",
      label: "Posts Published",
      color: "#10b981",
      gradient: ["#10b98140", "#10b98100"],
      total: publishData.reduce((a, c) => a + c.value, 0),
      change: pctChange(sumHalf(publishData, "second"), sumHalf(publishData, "first")),
      data: publishData,
    },
  ];
}

// Pure SVG sparkline/area chart (no external dependencies)
function AreaChart({ data, color, gradientId }: { data: DataPoint[]; color: string; gradientId: string }) {
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = 0;
  const W = 500;
  const H = 80;
  const PAD = 4;

  const points = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
    return [x, y] as [number, number];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${points[points.length - 1][0].toFixed(1)} ${H} L ${PAD} ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 72 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill={color} opacity="0.7" />
      ))}
    </svg>
  );
}

interface AnalyticsChartsProps {
  logs: PublishingLog[];
}

export default function AnalyticsCharts({ logs }: AnalyticsChartsProps) {
  const [activeMetric, setActiveMetric] = useState("reach");
  const metrics = useMemo(() => buildMetrics(logs), [logs]);
  const active = metrics.find((m) => m.key === activeMetric) || metrics[0];

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="rounded-2xl border border-[#1E1E2D] bg-[#13131A] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="size-5 text-violet-400" />
          <h3 className="font-semibold text-white">Performance Overview</h3>
        </div>
        <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md font-semibold tracking-wide">
          LAST 14 DAYS
        </span>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0C0C12] border border-[#1E1E2D] w-fit">
        {metrics.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeMetric === m.key
                ? "text-white font-semibold"
                : "text-slate-500 hover:text-slate-300"
            }`}
            style={activeMetric === m.key ? { backgroundColor: `${m.color}20`, color: m.color } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Active Metric Value */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatNumber(active.total)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{active.label} over 14 days</div>
        </div>

        {/* Change indicator */}
        <div
          className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg border ${
            active.change >= 0
              ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
              : "text-red-400 bg-red-500/5 border-red-500/20"
          }`}
        >
          {active.change >= 0 ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          <span>{active.change >= 0 ? "+" : ""}{active.change}%</span>
        </div>
      </div>

      {/* SVG Area Chart */}
      <div className="rounded-xl overflow-hidden border border-[#1E1E2D] bg-[#0C0C12] p-3">
        <AreaChart
          data={active.data}
          color={active.color}
          gradientId={`grad_${active.key}`}
        />
        {/* X-axis labels — show first, middle, last only */}
        <div className="flex justify-between mt-1 px-1">
          {[active.data[0], active.data[6], active.data[13]].map((d, i) => (
            <span key={i} className="text-[9px] text-slate-600">{d?.label}</span>
          ))}
        </div>
      </div>

      {/* Mini metric cards row */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeMetric === m.key
                ? "border-[#1E1E2D] bg-[#1E1E2D]"
                : "border-[#1E1E2D]/50 bg-[#0C0C12] hover:bg-[#1E1E2D]/50"
            }`}
          >
            <div className="text-sm font-bold" style={{ color: m.color }}>
              {formatNumber(m.total)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{m.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
