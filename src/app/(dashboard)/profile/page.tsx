"use client";

import React, { useState, useRef } from "react";
import {
  User,
  Mail,
  Shield,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
  LogOut,
  KeyRound,
  Briefcase,
  CalendarDays,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { useSocialAccounts } from "@/lib/hooks/useSocialAccounts";

// ─── Small utility components ─────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3.5 border-b border-[#1E1E2D] last:border-0">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-slate-200 text-right break-all">{value || "—"}</span>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1E1E2D] bg-[#13131A] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#1E1E2D] flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/10">
          <Icon className="size-4 text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Avatar component with photo-URL update ───────────────────────────────────

function ProfileAvatar({
  photoURL,
  displayName,
  onUpdate,
}: {
  photoURL: string | null;
  displayName: string;
  onUpdate: (url: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const initials = (displayName || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      await onUpdate(url.trim());
      setEditing(false);
      setUrl("");
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Failed to update photo. Check the URL is valid and publicly accessible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar ring */}
      <div className="relative group">
        <div className="size-24 rounded-full ring-2 ring-violet-500/30 ring-offset-2 ring-offset-[#0A0A0F] overflow-hidden">
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="size-full object-cover" />
          ) : (
            <div className="size-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-all cursor-pointer"
          title="Change photo"
        >
          <Camera className="size-3.5" />
        </button>
      </div>

      {/* URL input */}
      {editing && (
        <div className="w-full space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste image URL (https://…)"
            className="w-full px-3 py-2 rounded-xl border border-[#1E1E2D] bg-[#0C0C12] text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !url.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Save Photo
            </button>
            <button
              onClick={() => { setEditing(false); setUrl(""); }}
              className="px-3 py-2 rounded-xl border border-[#1E1E2D] text-slate-400 hover:text-white text-xs transition-all cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Editable display name field ──────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === value) { setEditing(false); return; }
    setLoading(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
      toast.success(`${label} updated.`);
    } catch {
      toast.error(`Failed to update ${label.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between py-3.5 border-b border-[#1E1E2D] last:border-0 gap-4">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider w-36 shrink-0 pt-2.5">
        {label}
      </span>

      {editing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            className="flex-1 px-3 py-1.5 rounded-lg border border-violet-500/40 bg-[#0C0C12] text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
            autoFocus
          />
          <button onClick={handleSave} disabled={loading} className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer disabled:opacity-50">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          </button>
          <button onClick={() => { setEditing(false); setDraft(value); }} className="p-1.5 rounded-lg border border-[#1E1E2D] text-slate-400 hover:text-white transition-all cursor-pointer">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm text-slate-200 text-right">{value || "—"}</span>
          <button onClick={() => { setDraft(value); setEditing(true); }} className="p-1.5 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all cursor-pointer">
            <Pencil className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Profile Page ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, userProfile, logout } = useAuth();
  const { accounts } = useSocialAccounts();
  const [passwordSent, setPasswordSent] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  // Fetch workspace name on mount
  React.useEffect(() => {
    if (userProfile?.workspaceId) {
      getDoc(doc(db, "workspaces", userProfile.workspaceId)).then((snap) => {
        if (snap.exists()) setWorkspaceName(snap.data().name);
      });
    }
  }, [userProfile?.workspaceId]);

  const joinedDate = userProfile?.createdAt?.seconds
    ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "—";

  // ── Update display name ──────────────────────────────────────────────────
  const handleUpdateDisplayName = async (name: string) => {
    if (!user) return;
    await updateProfile(user, { displayName: name });
    await updateDoc(doc(db, "users", user.uid), { displayName: name, updatedAt: serverTimestamp() });
    // Also update workspace member doc
    if (userProfile?.workspaceId) {
      await updateDoc(
        doc(db, "workspaces", userProfile.workspaceId, "members", user.uid),
        { displayName: name, updatedAt: serverTimestamp() }
      ).catch(() => {}); // non-fatal if member doc doesn't exist
    }
  };

  // ── Update photo URL ────────────────────────────────────────────────────
  const handleUpdatePhoto = async (photoURL: string) => {
    if (!user) return;
    await updateProfile(user, { photoURL });
    await updateDoc(doc(db, "users", user.uid), { photoURL, updatedAt: serverTimestamp() });
  };

  // ── Send password reset email ───────────────────────────────────────────
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setPasswordLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setPasswordSent(true);
      toast.success("Password reset email sent!", { description: `Check ${user.email} for the reset link.` });
    } catch (err: any) {
      toast.error("Failed to send reset email.", { description: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  const displayName = userProfile?.displayName || user.displayName || "";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <User className="size-6 text-violet-400" />
          Profile
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal details, password, and account preferences.
        </p>
      </div>

      {/* ── Top hero card: avatar + name + plan ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2D] bg-gradient-to-br from-[#13131A] to-[#1A1A2E] p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ProfileAvatar
            photoURL={userProfile?.photoURL || user.photoURL}
            displayName={displayName}
            onUpdate={handleUpdatePhoto}
          />

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">{displayName || user.email?.split("@")[0]}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
              {/* Plan badge */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400">
                <Sparkles className="size-3" />
                {(userProfile?.plan || "free").charAt(0).toUpperCase() + (userProfile?.plan || "free").slice(1)} Plan
              </span>

              {/* Role badge */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Shield className="size-3" />
                {(userProfile?.role || "user").charAt(0).toUpperCase() + (userProfile?.role || "user").slice(1)}
              </span>

              {/* Joined date */}
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 px-3 py-1 rounded-full border border-[#1E1E2D] bg-[#0C0C12]">
                <CalendarDays className="size-3" />
                Joined {joinedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Information ──────────────────────────────────────────── */}
      <SectionCard icon={User} title="Personal Information" description="Your name and account identity">
        <EditableField
          label="Display Name"
          value={displayName}
          onSave={handleUpdateDisplayName}
          placeholder="Enter your name"
        />
        <InfoRow label="Email" value={user.email || ""} />
        <InfoRow label="Member Since" value={joinedDate} />
      </SectionCard>

      {/* ── Workspace Info ─────────────────────────────────────────────────── */}
      <SectionCard icon={Briefcase} title="Workspace" description="Your default workspace details">
        <InfoRow label="Workspace" value={workspaceName || "Loading…"} />
        <InfoRow label="Plan" value={userProfile?.plan ? userProfile.plan.charAt(0).toUpperCase() + userProfile.plan.slice(1) : "Free"} />
        <InfoRow label="Role" value={userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : "User"} />
        <InfoRow label="Connected Accounts" value={String(accounts.length)} />
      </SectionCard>

      {/* ── Security ────────────────────────────────────────────────────────── */}
      <SectionCard icon={KeyRound} title="Security" description="Manage your login credentials">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Password</p>
            <p className="text-xs text-slate-500 mt-0.5">
              We'll send a secure reset link to <span className="text-slate-300">{user.email}</span>
            </p>
          </div>

          {passwordSent ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="size-4" />
              Email sent!
            </div>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1E1E2D] bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/30 text-slate-300 hover:text-white text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              {passwordLoading ? "Sending…" : "Send Reset Email"}
            </button>
          )}
        </div>
      </SectionCard>

      {/* ── Danger Zone ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] overflow-hidden">
        <div className="px-6 py-5 border-b border-red-500/10 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/10">
            <AlertTriangle className="size-4 text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Danger Zone</h2>
            <p className="text-xs text-slate-500 mt-0.5">Actions here cannot be undone</p>
          </div>
        </div>

        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Sign out of ViralAI</p>
            <p className="text-xs text-slate-500 mt-0.5">You will be redirected to the login page.</p>
          </div>

          {logoutConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Are you sure?</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Yes, sign out
              </button>
              <button
                onClick={() => setLogoutConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-[#1E1E2D] text-slate-400 hover:text-white text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLogoutConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm font-medium transition-all cursor-pointer"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
