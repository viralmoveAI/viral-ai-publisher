"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Share2, AlertCircle, Loader2, HelpCircle, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

import { useSocialAccounts } from "@/lib/hooks/useSocialAccounts";
import SocialAccountCard from "@/components/accounts/SocialAccountCard";
import { PLATFORM_META } from "@/lib/types/social.types";
import { PlatformIcon } from "@/components/accounts/PlatformIcons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function AccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accounts, loading, error, disconnectAccount, workspaceId } = useSocialAccounts();

  // Search parameters detection
  const selectPlatform = searchParams.get("select_platform");
  const errCode = searchParams.get("error");
  const errDetails = searchParams.get("details");
  const isConnectedParam = searchParams.get("connected");

  // State for OAuth candidate selection
  const [candidates, setCandidates] = useState<any[]>([]);
  const [fetchingSession, setFetchingSession] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Handle errors or success from redirects
  useEffect(() => {
    if (isConnectedParam === "true") {
      toast.success("Account connected successfully!");
      router.replace("/accounts");
    }

    if (errCode) {
      if (errCode === "missing_credentials") {
        toast.error("Meta credentials missing", {
          description: "Please check your .env.local configuration.",
        });
      } else {
        toast.error("OAuth Connection Failed", {
          description: errDetails || "An error occurred during authentication.",
        });
      }
    }
  }, [errCode, errDetails, isConnectedParam, router]);

  // Fetch candidate pages when callback redirects with select_platform
  useEffect(() => {
    if (selectPlatform) {
      const fetchCandidates = async () => {
        setFetchingSession(true);
        try {
          const endpoint = selectPlatform === "youtube" 
            ? "/api/auth/youtube/session"
            : selectPlatform === "tiktok"
              ? "/api/auth/tiktok/session"
              : "/api/auth/facebook/session";
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            const loaded = (selectPlatform === "youtube" || selectPlatform === "tiktok")
              ? (data.account ? [data.account] : [])
              : (data.accounts || []);
            setCandidates(loaded);
            setShowSelectModal(true);
          } else {
            toast.error("OAuth session expired. Please try again.");
            router.replace("/accounts");
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load OAuth session.");
          router.replace("/accounts");
        } finally {
          setFetchingSession(false);
        }
      };
      fetchCandidates();
    }
  }, [selectPlatform, router]);

  // Connect selected candidate to Firestore
  const handleConnectCandidate = async (candidate: any) => {
    if (!workspaceId) return;
    setConnectingId(candidate.accountId);
    try {
      const docRef = doc(db, "workspaces", workspaceId, "social_accounts", candidate.accountId);
      
      const payload: any = {
        id: candidate.accountId,
        workspaceId,
        platform: candidate.platform,
        accountName: candidate.accountName,
        accountId: candidate.accountId,
        accessToken: candidate.accessToken,
        profilePictureURL: candidate.profilePictureURL,
        followerCount: candidate.followerCount,
        connectedAt: serverTimestamp(),
      };

      if (candidate.platform === "youtube" || candidate.platform === "tiktok") {
        payload.refreshToken = candidate.refreshToken || null;
        payload.scopes = candidate.scopes || [];
        if (candidate.expiresIn) {
          const expiryDate = new Date();
          expiryDate.setSeconds(expiryDate.getSeconds() + candidate.expiresIn);
          payload.tokenExpiresAt = expiryDate;
        } else {
          payload.tokenExpiresAt = null;
        }
      } else {
        payload.tokenExpiresAt = null; // Non-expiring Meta page tokens
      }

      await setDoc(docRef, payload);
      toast.success(`Successfully connected ${candidate.accountName}!`);
      
      // Close modal and clean URL
      setShowSelectModal(false);
      router.replace("/accounts");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save connection.");
    } finally {
      setConnectingId(null);
    }
  };

  // Trigger real OAuth flow
  const handleRealConnect = (platformId: string, oauthPath: string | null) => {
    if (!workspaceId || !oauthPath) return;
    router.push(`${oauthPath}?workspaceId=${workspaceId}&platform=${platformId}`);
  };

  // Group accounts by platform for status
  const connectedPlatforms = accounts.map((a) => a.platform);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Share2 className="size-6 text-violet-400" />
          Social Accounts
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Connect and manage your publishing destinations for Facebook, Instagram, TikTok, and YouTube.
        </p>
      </div>

      {/* Error alert with .env instructions if missing credentials */}
      {errCode === "missing_credentials" && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-600/5 p-5 text-sm text-slate-300 space-y-4 max-w-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-white">Meta Developer App Credentials Required</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                To connect real Facebook and Instagram accounts, you must register a Meta App and add its credentials to your local configuration.
              </p>
            </div>
          </div>
          
          <div className="bg-[#0A0A0F]/80 rounded-xl p-3 border border-[#1E1E2D] font-mono text-[11px] text-slate-400 space-y-1 overflow-x-auto">
            <p># Add these to your d:\ViralMove_Projects\viral-ai-publisher\.env.local</p>
            <p>FACEBOOK_APP_ID=your_facebook_app_id</p>
            <p>FACEBOOK_APP_SECRET=your_facebook_app_secret</p>
            <p>NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id</p>
            <p>NEXT_PUBLIC_APP_URL=http://localhost:3000</p>
          </div>
        </div>
      )}

      {/* Main Connection Panel */}
      <div className="max-w-2xl">
        {/* Platform Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Available Platforms</h3>
          
          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORM_META.map((platform) => {
              const isConnected = connectedPlatforms.includes(platform.id);
              
              return (
                <div
                  key={platform.id}
                  className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between min-h-[120px] ${
                    platform.available
                      ? "border-[#1E1E2D] bg-[#13131A] hover:border-white/[0.06] hover:bg-[#161622]"
                      : "border-white/[0.02] bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${platform.color}15`,
                          color: platform.color,
                        }}
                      >
                        <PlatformIcon platform={platform.id} className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{platform.label}</h4>
                        <span className="text-[10px] text-slate-500">
                          {platform.available ? (isConnected ? "Connected" : "Not connected") : "Coming Soon"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end w-full">
                    {platform.available ? (
                      <button
                        onClick={() => handleRealConnect(platform.id, platform.oauthPath)}
                        disabled={fetchingSession}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer w-full sm:w-auto ${
                          isConnected
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-violet-600 hover:bg-violet-500 text-white"
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <ShieldCheck className="size-3.5" />
                            <span>Connect Another</span>
                          </>
                        ) : (
                          <>
                            <span>Connect</span>
                            <ArrowRight className="size-3" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[10px] bg-white/[0.03] text-slate-500 px-2 py-1 rounded-md border border-white/[0.03] w-full sm:w-auto text-center">
                        Soon
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connected Accounts Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          Connected accounts
          {accounts.length > 0 && (
            <span className="text-xs bg-[#13131A] text-slate-500 px-2 py-0.5 rounded-md border border-[#1E1E2D]">
              {accounts.length}
            </span>
          )}
        </h3>

        {/* Loader */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-7 animate-spin text-violet-500 mb-3" />
            <p className="text-xs text-slate-500">Retrieving connections...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Connected grid */}
        {!loading && !error && accounts.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => (
              <SocialAccountCard
                key={acc.id}
                account={acc}
                onDisconnect={disconnectAccount}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && accounts.length === 0 && (
          <div className="text-center py-14 border border-[#1E1E2D] bg-[#13131A]/10 rounded-2xl p-6">
            <Share2 className="size-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No connected accounts yet</p>
            <p className="text-slate-500 text-xs mt-1">
              Select one of the connection options above to link a publishing destination.
            </p>
          </div>
        )}
      </div>

      {/* OAuth Page Selection Modal */}
      <Dialog open={showSelectModal} onOpenChange={(o) => {
        if (!o) {
          setShowSelectModal(false);
          router.replace("/accounts");
        }
      }}>
        <DialogContent className="bg-[#13131A] border border-[#1E1E2D] text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-400" />
              Select account to Link
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              The following {selectPlatform} profiles were found linked to your Meta Developer application. Choose which one you want to add to this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 max-h-60 overflow-y-auto divide-y divide-[#1E1E2D] border border-[#1E1E2D] rounded-xl bg-[#0C0C12]">
            {candidates.map((cand) => (
              <div key={cand.accountId} className="flex items-center justify-between p-3.5 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {cand.profilePictureURL ? (
                    <img src={cand.profilePictureURL} alt={cand.accountName} className="size-9 rounded-lg object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="size-9 rounded-lg bg-violet-600/10 text-violet-400 flex items-center justify-center ring-1 ring-white/10">
                      <PlatformIcon platform={cand.platform} className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{cand.accountName}</p>
                    <p className="text-[10px] text-slate-500 truncate">ID: {cand.accountId} • {cand.followerCount?.toLocaleString() || 0} followers</p>
                  </div>
                </div>

                <button
                  onClick={() => handleConnectCandidate(cand)}
                  disabled={connectingId !== null}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer shrink-0 ml-4"
                >
                  {connectingId === cand.accountId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="size-3.5" />
                      <span>Link</span>
                    </>
                  )}
                </button>
              </div>
            ))}

            {candidates.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No accounts available in session.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0F]">
          <Loader2 className="size-8 animate-spin text-violet-500 mb-4" />
          <p className="text-sm text-slate-400">Loading accounts...</p>
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  );
}
