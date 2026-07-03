"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LayoutDashboard, Search, Bookmark, FileText, Share2, User as UserIcon, LogOut, Loader2, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Close mobile menu on path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    <div className="flex h-screen bg-[#0A0A0F] text-slate-100 overflow-hidden relative">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#0A0A0F]/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-[#1E1E2D] bg-[#13131A] transition-transform duration-300 transform md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#1E1E2D]">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-violet-400" />
            <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ViralAI <span className="text-violet-400">Publisher</span>
            </span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="size-5" />
          </button>
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
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-[#1E1E2D] bg-[#13131A] shrink-0 transition-all duration-350 ${
        isSidebarCollapsed ? "w-20" : "w-64"
      }`}>
        <div className={`flex items-center h-16 border-b border-[#1E1E2D] px-6 ${
          isSidebarCollapsed ? "justify-center px-0" : "gap-2"
        }`}>
          <Sparkles className="size-5 text-violet-400 shrink-0" />
          {!isSidebarCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate">
              ViralAI <span className="text-violet-400">Publisher</span>
            </span>
          )}
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6 flex flex-col items-stretch">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-violet-600/20 text-violet-400 border-l-2 border-violet-500 pl-3"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                }`}
              >
                <item.icon className={`size-4 shrink-0 ${isActive ? "text-violet-400" : "text-slate-400"}`} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1E1E2D] flex items-center justify-between gap-2">
          {!isSidebarCollapsed ? (
            <>
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer flex-1"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Logout</span>
              </button>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-2.5 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-white cursor-pointer transition-all border border-transparent hover:border-white/5"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="size-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <button
                onClick={logout}
                className="p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="size-4 shrink-0" />
              </button>
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-2.5 rounded-lg hover:bg-slate-800/40 text-slate-400 hover:text-white cursor-pointer transition-all border border-transparent hover:border-white/5"
                title="Expand Sidebar"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-[#1E1E2D] bg-[#13131A]/50 backdrop-blur-md">
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-white/10 bg-white/[0.02] cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="flex items-center gap-1.5 ml-1">
              <Sparkles className="size-4.5 text-violet-400 animate-pulse" />
              <span className="font-bold text-base bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ViralAI
              </span>
            </div>
          </div>

          <div className="hidden md:block text-sm text-slate-400 font-medium">
            Workspace: <span className="text-violet-400">Personal</span>
          </div>

          {/* User profile link */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-200">
                {userProfile?.displayName || user.displayName || user.email?.split("@")[0]}
              </span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>

            <Link href="/profile" title="Go to Profile">
              {userProfile?.photoURL || user.photoURL ? (
                <img
                  src={userProfile?.photoURL || user.photoURL || ""}
                  alt="Profile"
                  className="size-9 rounded-full object-cover ring-2 ring-violet-500/30 ring-offset-1 ring-offset-[#13131A] hover:ring-violet-500/60 transition-all"
                />
              ) : (
                <div className="size-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center ring-2 ring-violet-500/30 ring-offset-1 ring-offset-[#13131A] hover:ring-violet-500/60 transition-all cursor-pointer">
                  <span className="text-xs font-bold text-white">
                    {((userProfile?.displayName || user.displayName || user.email || "U"))
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
            </Link>
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
