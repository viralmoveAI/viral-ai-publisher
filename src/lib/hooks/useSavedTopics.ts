"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  startAt,
  getDocs,
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Trend } from "../types/trend.types";

export interface SavedTopic {
  id: string;
  userId: string;
  workspaceId: string | null;
  trendId: string;
  trendSnapshot: {
    keyword: string;
    niche: string;
    country: string;
    platform: string;
    trendScore: number;
    growthRate: string;
    viralProbability: string;
    contentAngles: string[];
  };
  savedAt: any;
}

export function useSavedTopics() {
  const { user, userProfile } = useAuth();
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [firstVisibleDoc, setFirstVisibleDoc] = useState<any>(null);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [pageHistory, setPageHistory] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Sync user profile workspace context
  const workspaceId = userProfile?.workspaceId || null;

  // Helper to build queries dynamically based on platform and niche prefix
  const buildQuery = (
    userId: string,
    niche: string,
    platform: string,
    cursorOption?: { method: "startAfter" | "startAt"; doc: any }
  ) => {
    const trendsRef = collection(db, "saved_trends");
    let constraints: any[] = [where("userId", "==", userId)];

    if (platform && platform !== "All") {
      constraints.push(where("trendSnapshot.platform", "==", platform));
    }

    if (niche.trim()) {
      // Format to capitalize first letter of each word to help match standard categories (e.g. "fitness" -> "Fitness")
      const formattedNiche = niche.split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      constraints.push(where("trendSnapshot.niche", ">=", formattedNiche));
      constraints.push(where("trendSnapshot.niche", "<=", formattedNiche + "\uf8ff"));
      constraints.push(orderBy("trendSnapshot.niche", "asc"));
    }

    constraints.push(orderBy("savedAt", "desc"));

    if (cursorOption) {
      if (cursorOption.method === "startAfter") {
        constraints.push(startAfter(cursorOption.doc));
      } else if (cursorOption.method === "startAt") {
        constraints.push(startAt(cursorOption.doc));
      }
    }

    constraints.push(limit(10));
    return query(trendsRef, ...constraints);
  };

  // Helper to check if a next page exists
  const checkHasMore = async (userId: string, niche: string, platform: string, lastDoc: any) => {
    if (!lastDoc) return false;
    const nextQuery = buildQuery(userId, niche, platform, { method: "startAfter", doc: lastDoc });
    const nextSnap = await getDocs(query(nextQuery, limit(1)));
    return nextSnap.docs.length > 0;
  };

  // Fetch initial topics (Page 1)
  const fetchInitialTopics = async (niche: string = "", platform: string = "All") => {
    if (!user) {
      setSavedTopics([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPageHistory([]);

    try {
      const q = buildQuery(user.uid, niche, platform);
      const snapshot = await getDocs(q);
      const fetched: SavedTopic[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          userId: data.userId,
          workspaceId: data.workspaceId,
          trendId: data.trendId,
          trendSnapshot: data.trendSnapshot,
          savedAt: data.savedAt,
        });
      });

      setSavedTopics(fetched);

      if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0];
        const last = snapshot.docs[snapshot.docs.length - 1];
        setFirstVisibleDoc(first);
        setLastVisibleDoc(last);

        const more = await checkHasMore(user.uid, niche, platform, last);
        setHasMore(more);
      } else {
        setFirstVisibleDoc(null);
        setLastVisibleDoc(null);
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("fetchInitialTopics error:", err);
      setError("Failed to load saved topics.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Next Page
  const fetchNextPage = async (niche: string = "", platform: string = "All") => {
    if (!user || !lastVisibleDoc || !hasMore || isFetching) return;
    setIsFetching(true);
    setError(null);

    try {
      const q = buildQuery(user.uid, niche, platform, { method: "startAfter", doc: lastVisibleDoc });
      const snapshot = await getDocs(q);
      const fetched: SavedTopic[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          userId: data.userId,
          workspaceId: data.workspaceId,
          trendId: data.trendId,
          trendSnapshot: data.trendSnapshot,
          savedAt: data.savedAt,
        });
      });

      setPageHistory((prev) => [...prev, firstVisibleDoc]);
      setSavedTopics(fetched);

      if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0];
        const last = snapshot.docs[snapshot.docs.length - 1];
        setFirstVisibleDoc(first);
        setLastVisibleDoc(last);

        const more = await checkHasMore(user.uid, niche, platform, last);
        setHasMore(more);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("fetchNextPage error:", err);
      setError("Failed to load next page.");
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch Previous Page
  const fetchPrevPage = async (niche: string = "", platform: string = "All") => {
    if (!user || pageHistory.length === 0 || isFetching) return;
    setIsFetching(true);
    setError(null);

    try {
      const prevPageStartDoc = pageHistory[pageHistory.length - 1];
      const q = buildQuery(user.uid, niche, platform, { method: "startAt", doc: prevPageStartDoc });
      const snapshot = await getDocs(q);
      const fetched: SavedTopic[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          userId: data.userId,
          workspaceId: data.workspaceId,
          trendId: data.trendId,
          trendSnapshot: data.trendSnapshot,
          savedAt: data.savedAt,
        });
      });

      setPageHistory((prev) => prev.slice(0, -1));
      setSavedTopics(fetched);

      if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0];
        const last = snapshot.docs[snapshot.docs.length - 1];
        setFirstVisibleDoc(first);
        setLastVisibleDoc(last);
        setHasMore(true);
      }
    } catch (err: any) {
      console.error("fetchPrevPage error:", err);
      setError("Failed to load previous page.");
    } finally {
      setIsFetching(false);
    }
  };

  // Reset topics on user logout
  useEffect(() => {
    if (!user) {
      setSavedTopics([]);
      setLoading(false);
    }
  }, [user]);

  const saveTopic = async (trend: Trend, searchNiche: string, searchCountry: string, searchPlatform: string) => {
    if (!user) throw new Error("Authentication required.");

    try {
      // Direct query check to prevent duplicates
      const trendsRef = collection(db, "saved_trends");
      const q = query(trendsRef, where("userId", "==", user.uid), where("trendId", "==", trend.id));
      const snap = await getDocs(q);
      if (!snap.empty) return;

      const newSave = {
        userId: user.uid,
        workspaceId: workspaceId,
        trendId: trend.id,
        trendSnapshot: {
          keyword: trend.topic,
          niche: searchNiche,
          country: searchCountry,
          platform: searchPlatform,
          trendScore: trend.trendScore,
          growthRate: trend.growthRate,
          viralProbability: trend.viralProbability,
          contentAngles: trend.contentAngles,
        },
        userNotes: null,
        tags: [],
        savedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "saved_trends"), newSave);
      // Refresh list to show newly saved item
      fetchInitialTopics("", "All");
    } catch (err: any) {
      console.error("saveTopic error:", err);
      throw new Error(err.message || "Failed to save topic.");
    }
  };

  const removeTopic = async (trendId: string) => {
    if (!user) throw new Error("Authentication required.");

    try {
      const topicDoc = savedTopics.find(t => t.trendId === trendId || t.id === trendId);
      if (!topicDoc) return;

      await deleteDoc(doc(db, "saved_trends", topicDoc.id));
      
      // Refresh list
      fetchInitialTopics("", "All");
    } catch (err: any) {
      console.error("removeTopic error:", err);
      throw new Error(err.message || "Failed to remove topic.");
    }
  };

  const isTopicSaved = (trendId: string) => {
    return savedTopics.some((t) => t.trendId === trendId);
  };

  return { 
    savedTopics, 
    loading, 
    error, 
    saveTopic, 
    removeTopic, 
    isTopicSaved,
    pageHistory,
    hasMore,
    isFetching,
    fetchInitialTopics,
    fetchNextPage,
    fetchPrevPage
  };
}
