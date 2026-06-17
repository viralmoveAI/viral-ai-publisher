"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, getDocs, serverTimestamp, writeBatch, collection, query, where, updateDoc, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userProfile: any | null; // Can type this later
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Set session cookie
          const token = await currentUser.getIdToken();
          document.cookie = `session=${token}; path=/; max-age=36000; SameSite=Lax; Secure`;

          // Fetch or create user profile in Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const existingProfile = userDoc.data();

            // ── Backfill workspaceId for users registered before this field was added ──
            if (!existingProfile.workspaceId) {
              const wsQuery = query(
                collection(db, "workspaces"),
                where("ownerId", "==", currentUser.uid),
                limit(1)
              );
              const wsSnap = await getDocs(wsQuery);
              if (!wsSnap.empty) {
                const foundId = wsSnap.docs[0].id;
                await updateDoc(userDocRef, { workspaceId: foundId });
                existingProfile.workspaceId = foundId;
              }
            }

            setUserProfile(existingProfile);
          } else {
            // Scaffold user profile, default workspace, and workspace membership atomically client-side
            const batch = writeBatch(db);

            // 2. Default workspace — declared FIRST so newProfile can reference it
            const workspaceId = `ws_${Math.random().toString(36).substring(2, 11)}`;

            // 1. User profile
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || null,
              plan: "free",
              role: "user",
              workspaceId,          // now safe — declared above
              createdAt: serverTimestamp(),
            };
            batch.set(userDocRef, newProfile);

            // 2. Default workspace (already declared above)
            const workspaceDocRef = doc(db, "workspaces", workspaceId);
            const namePrefix = currentUser.displayName || currentUser.email?.split("@")[0] || "My";
            const slug = `${namePrefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-workspace`;

            const workspaceData = {
              id: workspaceId,
              name: `${namePrefix}'s Workspace`,
              slug,
              description: "My default workspace",
              logoURL: null,
              ownerId: currentUser.uid,
              settings: {
                defaultPlatform: null,
                defaultTimezone: "UTC",
                contentLanguage: "en",
              },
              stats: {
                totalPosts: 0,
                publishedPosts: 0,
                draftPosts: 0,
                memberCount: 1,
              },
              plan: "free",
              status: "active",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            batch.set(workspaceDocRef, workspaceData);

            // 3. Workspace member entry
            const memberDocRef = doc(db, `workspaces/${workspaceId}/members`, currentUser.uid);
            const memberData = {
              userId: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "",
              photoURL: currentUser.photoURL || null,
              role: "owner",
              permissions: {
                canPublish: true,
                canSchedule: true,
                canManageAccounts: true,
                canViewAnalytics: true,
                canManageMembers: true,
              },
              status: "active",
              invitedBy: null,
              invitedAt: null,
              joinedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            batch.set(memberDocRef, memberData);

            // Commit batch writes
            await batch.commit();

            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        // Clear session cookie
        document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure";
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
