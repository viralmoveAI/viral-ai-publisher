import React, { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export const metadata = {
  title: "Reset Password - ViralAI Publisher",
  description: "Request a password reset link to recover your account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-[#0A0A0F]">
      {/* Decorative background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Brand Header */}
      <div className="flex flex-col items-center gap-2 mb-8 z-10">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white group">
          <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 group-hover:border-violet-500/50 transition-colors shadow-[0_0_15px_rgba(124,58,237,0.2)]">
            <Sparkles className="size-6 text-violet-400 group-hover:text-violet-300 transition-colors" />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ViralAI <span className="text-violet-400 font-extrabold">Publisher</span>
          </span>
        </Link>
      </div>

      {/* Auth Card wrapper */}
      <div className="w-full max-w-md z-10 animate-fade-in-up">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-8 bg-[#13131A] rounded-xl border border-[#1E1E2D]">
            <LoadingSpinner />
            <p className="text-sm text-slate-400 mt-4">Loading reset form...</p>
          </div>
        }>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
