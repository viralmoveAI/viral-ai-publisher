"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { SocialAccount, SocialPlatformId } from "@/lib/types/social.types";

export function useSocialAccounts() {
  const { user, userProfile } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId: string | null = userProfile?.workspaceId || null;

  // ─── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !workspaceId) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const accountsRef = collection(db, "workspaces", workspaceId, "social_accounts");
    const q = query(accountsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: SocialAccount[] = [];
        snapshot.forEach((d) => {
          result.push({ id: d.id, ...(d.data() as Omit<SocialAccount, "id">) });
        });
        setAccounts(result);
        setLoading(false);
      },
      (err) => {
        console.error("useSocialAccounts error:", err);
        setError("Failed to load social accounts.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, workspaceId]);

  // ─── Disconnect ────────────────────────────────────────────────────────────
  const disconnectAccount = async (accountId: string): Promise<void> => {
    if (!user || !workspaceId) throw new Error("Authentication required.");
    await deleteDoc(doc(db, "workspaces", workspaceId, "social_accounts", accountId));
  };

  // ─── Connect Mock Account (for sandbox/testing without Meta App) ───────────
  const connectMockAccount = async (platform: "facebook" | "instagram"): Promise<SocialAccount> => {
    if (!user || !workspaceId) throw new Error("Authentication required.");

    const id = `${platform}_mock_${Math.random().toString(36).substring(2, 9)}`;
    const randomFollowers = Math.floor(Math.random() * 50000) + 1200;
    
    let accountName = "";
    let profilePictureURL = "";

    if (platform === "facebook") {
      accountName = `${user.displayName || "User"}'s Facebook Page`;
      profilePictureURL = `https://api.dicebear.com/7.x/identicon/svg?seed=${id}`;
    } else {
      accountName = `@${(user.displayName || "user").toLowerCase().replace(/\s+/g, "_")}_business`;
      profilePictureURL = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${id}`;
    }

    const newAccount: Omit<SocialAccount, "id"> = {
      workspaceId,
      platform,
      accountName,
      accountId: `platform_id_${Math.random().toString(36).substring(2, 9)}`,
      accessToken: `mock_long_lived_token_${Math.random().toString(36).substring(2, 15)}`,
      tokenExpiresAt: null, // Non-expiring mock token
      profilePictureURL,
      followerCount: randomFollowers,
      connectedAt: new Date(),
    };

    const docRef = doc(db, "workspaces", workspaceId, "social_accounts", id);
    await setDoc(docRef, {
      ...newAccount,
      connectedAt: serverTimestamp(),
    });

    return {
      id,
      ...newAccount,
    };
  };

  return {
    accounts,
    loading,
    error,
    disconnectAccount,
    connectMockAccount,
    workspaceId,
  };
}
