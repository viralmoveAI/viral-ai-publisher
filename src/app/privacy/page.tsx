import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Trash2, Eye } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="border-b border-[#1E1E2D] pb-6">
          <div className="size-12 rounded-2xl bg-violet-600/10 text-violet-400 flex items-center justify-center border border-violet-500/20 mb-4">
            <Shield className="size-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Privacy Policy & Data Deletion Instructions</h1>
          <p className="text-slate-400 text-sm mt-2">Last updated: June 22, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="size-4 text-violet-400" />
              1. Information We Collect
            </h2>
            <p>
              ViralAI Publisher integrates third-party APIs (Meta Graph API, TikTok Developers API, YouTube Data API v3) to manage your social accounts and publish content. We collect and store:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Profile information associated with your connected social accounts (account names, follower counts, and profile pictures).</li>
              <li>Authentication tokens (Page tokens and refresh tokens) to perform actions on your behalf.</li>
              <li>Publishing logs to track success rate and metrics of published items (likes, comments, shares, views).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. How We Use Data</h2>
            <p>
              The data retrieved from social APIs is used exclusively to facilitate automatic and manual content publishing and to display engagement metrics inside your personal dashboard. We do not sell or share your data with any third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="size-4 text-red-400" />
              3. Data Deletion & Removal Instructions
            </h2>
            <p>
              You can disconnect your social profiles and remove all stored authentication tokens and history from our database at any time.
            </p>
            <div className="bg-[#13131A] rounded-xl p-4 border border-[#1E1E2D] space-y-2">
              <p className="font-semibold text-white">To delete your account data and disconnect your Facebook/Instagram/TikTok/YouTube accounts:</p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-400">
                <li>Log into your ViralAI Publisher dashboard.</li>
                <li>Navigate to the <strong>Social Accounts</strong> page.</li>
                <li>Find the platform card you wish to remove and click <strong>Disconnect Account</strong>.</li>
                <li>Confirm the deletion. All access tokens, platform identifiers, and associated publishing logs will be permanently deleted from our database.</li>
              </ol>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Note: You can also revoke access directly from your platform settings:
              <br />
              - Facebook: Settings & Privacy &gt; Settings &gt; Business Integrations
              <br />
              - Google/YouTube: Google Account Permissions &gt; Apps with access to your account
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Security</h2>
            <p>
              Your OAuth tokens are stored securely in an encrypted database and are never exposed to the client-side application browser. All server communications with third-party APIs are encrypted via TLS (HTTPS).
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1E1E2D] pt-6 text-center text-xs text-slate-500">
          <p>&copy; 2026 ViralAI Publisher. All rights reserved.</p>
        </div>
        
      </div>
    </div>
  );
}
