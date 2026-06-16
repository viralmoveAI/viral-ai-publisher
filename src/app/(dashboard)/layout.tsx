"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LayoutDashboard, Search, Bookmark, FileText, Share2, User as UserIcon, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] text-slate-100">
        <Loader2 className="size-8 animate-spin text-violet-500 mb-4" />
        <p className="text-sm text-slate-400">Loading your space...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Trends", href: "/trends", icon: Search },
    { name: "Saved Topics", href: "/saved", icon: Bookmark },
    { name: "Content", href: "/posts", icon: FileText },
    { name: "Social Accounts", href: "/accounts", icon: Share2 },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0F] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#1E1E2D] bg-[#13131A] shrink-0">
        <div className="flex items-center gap-2 h-16 px-6 border-b border-[#1E1E2D]">
          <Sparkles className="size-5 text-violet-400" />
          <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ViralAI <span className="text-violet-400">Publisher</span>
          </span>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-violet-600/20 text-violet-400 border-l-2 border-violet-500 pl-3"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                }`}
              >
                <item.icon className={`size-4 ${isActive ? "text-violet-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1E1E2D]">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-[#1E1E2D] bg-[#13131A]/50 backdrop-blur-md">
          <div className="md:hidden flex items-center gap-2">
            <Sparkles className="size-5 text-violet-400" />
            <span className="font-bold text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ViralAI
            </span>
          </div>

          <div className="hidden md:block text-sm text-slate-400 font-medium">
            Workspace: <span className="text-violet-400">Personal</span>
          </div>

          {/* User profile dropdown / logout */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-200">
                {user.displayName || user.email?.split("@")[0]}
              </span>
              <span className="text-xs text-slate-500 capitalize">{user.email}</span>
            </div>
            
            <button
              onClick={logout}
              className="md:hidden p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
