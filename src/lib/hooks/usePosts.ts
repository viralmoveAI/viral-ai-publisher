"use client";

import { useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  startAfter,
  startAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Post, PostFormData, PostStatus } from "@/lib/types/post.types";

export function usePosts() {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [firstVisibleDoc, setFirstVisibleDoc] = useState<any>(null);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [pageHistory, setPageHistory] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const workspaceId: string | null = userProfile?.workspaceId || null;

  // Helper to build queries based on selected status filter
  const buildQuery = (status: string, cursorOption?: { method: "startAfter" | "startAt"; doc: any }) => {
    if (!workspaceId) return null;
    const postsRef = collection(db, "workspaces", workspaceId, "posts");
    
    let constraints: any[] = [orderBy("createdAt", "desc")];
    if (status !== "All") {
      constraints.push(where("status", "==", status));
    }

    if (cursorOption) {
      if (cursorOption.method === "startAfter") {
        constraints.push(startAfter(cursorOption.doc));
      } else if (cursorOption.method === "startAt") {
        constraints.push(startAt(cursorOption.doc));
      }
    }

    constraints.push(limit(8));
    return query(postsRef, ...constraints);
  };

  // Helper to check if a next page exists (fetches 1 document after the current lastVisibleDoc)
  const checkHasMore = async (status: string, lastDoc: any) => {
    if (!lastDoc) return false;
    const nextQuery = buildQuery(status, { method: "startAfter", doc: lastDoc });
    if (!nextQuery) return false;
    const nextSnap = await getDocs(query(nextQuery, limit(1)));
    return nextSnap.docs.length > 0;
  };

  // Fetch initial posts (Page 1)
  const fetchInitialPosts = async (status: string) => {
    if (!user || !workspaceId) return;
    setLoading(true);
    setError(null);
    setPageHistory([]);
    try {
      const q = buildQuery(status);
      if (!q) return;

      const snapshot = await getDocs(q);
      const fetched: Post[] = [];
      snapshot.forEach((d) => {
        fetched.push({ id: d.id, ...(d.data() as Omit<Post, "id">) });
      });

      setPosts(fetched);
      if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0];
        const last = snapshot.docs[snapshot.docs.length - 1];
        setFirstVisibleDoc(first);
        setLastVisibleDoc(last);
        
        // Check if there is a next page
        const more = await checkHasMore(status, last);
        setHasMore(more);
      } else {
        setFirstVisibleDoc(null);
        setLastVisibleDoc(null);
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("fetchInitialPosts error:", err);
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Next Page
  const fetchNextPage = async (status: string) => {
    if (!user || !workspaceId || !lastVisibleDoc || !hasMore || isFetching) return;
    setIsFetching(true);
    setError(null);
    try {
      const q = buildQuery(status, { method: "startAfter", doc: lastVisibleDoc });
      if (!q) return;

      const snapshot = await getDocs(q);
      const fetched: Post[] = [];
      snapshot.forEach((d) => {
        fetched.push({ id: d.id, ...(d.data() as Omit<Post, "id">) });
      });

      // Record firstVisibleDoc of current page into page history stack before advancing
      setPageHistory((prev) => [...prev, firstVisibleDoc]);
      setPosts(fetched);

      if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0];
        const last = snapshot.docs[snapshot.docs.length - 1];
        setFirstVisibleDoc(first);
        setLastVisibleDoc(last);

        const more = await checkHasMore(status, last);
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
  const fetchPrevPage = async (status: string) => {
    if (!user || !workspaceId || pageHistory.length === 0 || isFetching) return;
    setIsFetching(true);
    setError(null);
    try {
      const prevPageStartDoc = pageHistory[pageHistory.length - 1];
      const q = buildQuery(status, { method: "startAt", doc: prevPageStartDoc });
      if (!q) return;

      const snapshot = await getDocs(q);
      const fetched: Post[] = [];
      snapshot.forEach((d) => {
        fetched.push({ id: d.id, ...(d.data() as Omit<Post, "id">) });
      });

      // Pop the last page start from history
      setPageHistory((prev) => prev.slice(0, -1));
      setPosts(fetched);

      if (snapshot.docs.length > 0) {
        const first = snapshot.docs[0];
        const last = snapshot.docs[snapshot.docs.length - 1];
        setFirstVisibleDoc(first);
        setLastVisibleDoc(last);
        setHasMore(true); // Since we went back, there's definitely a next page
      }
    } catch (err: any) {
      console.error("fetchPrevPage error:", err);
      setError("Failed to load previous page.");
    } finally {
      setIsFetching(false);
    }
  };

  // ─── Create ───────────────────────────────────────────────────────────────
  const createPost = async (data: PostFormData): Promise<Post> => {
    if (!user || !workspaceId) throw new Error("Authentication required.");

    const docRef = await addDoc(
      collection(db, "workspaces", workspaceId, "posts"),
      {
        ...data,
        workspaceId,
        userId: user.uid,
        status: "Draft" as PostStatus,
        publishedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return {
      id: docRef.id,
      ...data,
      workspaceId,
      userId: user.uid,
      status: "Draft",
      publishedAt: null,
      createdAt: null,
      updatedAt: null,
    };
  };

  // ─── Update ───────────────────────────────────────────────────────────────
  const updatePost = async (
    postId: string,
    data: Partial<PostFormData & { status: PostStatus }>
  ): Promise<void> => {
    if (!user || !workspaceId) throw new Error("Authentication required.");
    const postRef = doc(db, "workspaces", workspaceId, "posts", postId);
    await updateDoc(postRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deletePost = async (postId: string): Promise<void> => {
    if (!user || !workspaceId) throw new Error("Authentication required.");
    await deleteDoc(doc(db, "workspaces", workspaceId, "posts", postId));
  };

  // ─── Get single post ──────────────────────────────────────────────────────
  const getPost = async (postId: string): Promise<Post | null> => {
    if (!workspaceId) return null;
    const snap = await getDoc(
      doc(db, "workspaces", workspaceId, "posts", postId)
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Post, "id">) };
  };

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    getPost,
    workspaceId,
    pageHistory,
    hasMore,
    isFetching,
    fetchInitialPosts,
    fetchNextPage,
    fetchPrevPage,
  };
}
