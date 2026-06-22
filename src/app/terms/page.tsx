import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
            <Scale className="size-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Terms of Service</h1>
          <p className="text-slate-400 text-sm mt-2">Last updated: June 22, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using ViralAI Publisher, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. Third-Party Platform Policies</h2>
            <p>
              Our tool interacts with third-party social media networks (Facebook, Instagram, TikTok, and YouTube). By using this platform, you acknowledge and agree that your actions are also subject to the respective terms and conditions of these platforms:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>YouTube: You agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">YouTube Terms of Service</a>.</li>
              <li>Meta/Facebook/Instagram: You agree to be bound by the Meta Terms of Service.</li>
              <li>TikTok: You agree to be bound by the TikTok Terms of Service.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. User Responsibility</h2>
            <p>
              You are responsible for all content published through your connected social channels using ViralAI Publisher. You must ensure that you own the rights to all uploaded media and that it complies with the community guidelines of each target social network.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Account Disconnection & Data Removal</h2>
            <p>
              You can revoke permissions and delete all stored connection credentials from our app at any time through the **Social Accounts** screen. Stored data is handled in accordance with our <Link href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Service Limitations</h2>
            <p>
              ViralAI Publisher is provided &quot;as is&quot; without warranties of any kind. We are not responsible for account bans, publication delays, or statistics syncing issues caused by third-party API availability.
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
