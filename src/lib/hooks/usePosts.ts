"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Post, PostFormData, PostStatus } from "@/lib/types/post.types";

export function usePosts() {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId: string | null = userProfile?.workspaceId || null;

  // ─── Real-time listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !workspaceId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const postsRef = collection(db, "workspaces", workspaceId, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const result: Post[] = [];
        snapshot.forEach((d) => {
          result.push({ id: d.id, ...(d.data() as Omit<Post, "id">) });
        });
        setPosts(result);
        setLoading(false);
      },
      (err) => {
        console.error("usePosts error:", err);
        setError("Failed to load posts.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, workspaceId]);

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

  return { posts, loading, error, createPost, updatePost, deletePost, getPost, workspaceId };
}
