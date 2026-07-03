"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck, Zap, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-slate-100 overflow-hidden flex flex-col font-sans">
      {/* Background glow elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-violet-600/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-50 max-w-6xl mx-auto w-full flex items-center justify-between px-6 py-6 border-b border-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <Sparkles className="size-5 text-violet-400" />
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ViralAI <span className="text-violet-400">Publisher</span>
          </span>
        </div>
        
        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] cursor-pointer"
          >
            Get started
          </Link>
        </div>

        {/* Hamburger Toggler (Mobile Only) */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg border border-white/10 bg-white/[0.02] text-slate-305 hover:text-white transition-all cursor-pointer"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* Mobile Dropdown Panel */}
        {isMenuOpen && (
          <div className="absolute top-[88px] left-6 right-6 bg-[#0E0E16]/95 border border-white/[0.05] p-5 rounded-2xl flex flex-col gap-3 z-50 md:hidden backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Nav items can be appended here in future phases */}
            <Link 
              href="/login" 
              onClick={() => setIsMenuOpen(false)}
              className="w-full text-center text-sm font-medium text-slate-300 hover:text-white transition-colors border border-white/10 py-2.5 rounded-xl bg-white/[0.01]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMenuOpen(false)}
              className="w-full text-center text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(124,58,237,0.25)]"
            >
              Get started
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 flex-1 flex flex-col items-center justify-center text-center py-20 space-y-8">
        {/* Glow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-600/10 text-violet-300 text-xs font-semibold tracking-wide backdrop-blur-md animate-pulse">
          <Sparkles className="size-3.5" />
          AI-Powered Trend Intelligence
        </div>
        
        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent max-w-3xl">
          Discover Viral Trends & Publish Instantly
        </h1>
        
        {/* Subheading */}
        <p className="text-slate-400 max-w-xl text-base sm:text-lg leading-relaxed">
          ViralAI Publisher is an all-in-one SaaS tailored for content creators. Track viral topics, plan social content, and execute posts on multiple social platforms with ease.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)] cursor-pointer group"
          >
            Start Free Trial
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-200 font-semibold py-3 px-8 rounded-xl transition-all cursor-pointer"
          >
            Learn More
          </Link>
        </div>

        {/* Features Preview */}
        <div className="grid gap-6 sm:grid-cols-3 w-full pt-16 text-left">
          <div className="p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01] hover:border-violet-500/20 transition-all duration-300">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 w-fit mb-4 text-violet-400">
              <TrendingUp className="size-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 mb-2">Trend Discovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Find viral opportunities across platforms customized for your niche, language, and country.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01] hover:border-violet-500/20 transition-all duration-300">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 w-fit mb-4 text-violet-400">
              <Zap className="size-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 mb-2">Instant Publishing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Post your drafts directly to social media accounts without leaving the editor.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/[0.03] bg-white/[0.01] hover:border-violet-500/20 transition-all duration-300">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 w-fit mb-4 text-violet-400">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-100 mb-2">Safe & Secure</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Official APIs and standard Firebase authentication keep your pages and tokens completely safe.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-6 py-8 border-t border-white/[0.03] text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} ViralAI Publisher. All rights reserved.
      </footer>
    </div>
  );
}
