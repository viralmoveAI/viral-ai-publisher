"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  writeBatch
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

  // Sync user profile workspace context
  const workspaceId = userProfile?.workspaceId || null;

  useEffect(() => {
    if (!user) {
      setSavedTopics([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Query saved_trends collection filtered by current user
    const q = query(
      collection(db, "saved_trends"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const topics: SavedTopic[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          topics.push({
            id: doc.id,
            userId: data.userId,
            workspaceId: data.workspaceId,
            trendId: data.trendId,
            trendSnapshot: data.trendSnapshot,
            savedAt: data.savedAt,
          });
        });
        // Sort topics by savedAt descending
        topics.sort((a, b) => {
          const t1 = a.savedAt?.seconds || 0;
          const t2 = b.savedAt?.seconds || 0;
          return t2 - t1;
        });
        setSavedTopics(topics);
        setLoading(false);
      },
      (err) => {
        console.error("useSavedTopics error:", err);
        setError("Failed to fetch saved topics.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const saveTopic = async (trend: Trend, searchNiche: string, searchCountry: string, searchPlatform: string) => {
    if (!user) throw new Error("Authentication required.");

    try {
      // Check if already saved to avoid duplicates
      const isExist = savedTopics.find(t => t.trendId === trend.id);
      if (isExist) return;

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
    } catch (err: any) {
      console.error("saveTopic error:", err);
      throw new Error(err.message || "Failed to save topic.");
    }
  };

  const removeTopic = async (trendId: string) => {
    if (!user) throw new Error("Authentication required.");

    try {
      // Find the saved topic document
      const topicDoc = savedTopics.find(t => t.trendId === trendId || t.id === trendId);
      if (!topicDoc) return;

      await deleteDoc(doc(db, "saved_trends", topicDoc.id));
    } catch (err: any) {
      console.error("removeTopic error:", err);
      throw new Error(err.message || "Failed to remove topic.");
    }
  };

  const isTopicSaved = (trendId: string) => {
    return savedTopics.some((t) => t.trendId === trendId);
  };

  return { savedTopics, loading, error, saveTopic, removeTopic, isTopicSaved };
}
