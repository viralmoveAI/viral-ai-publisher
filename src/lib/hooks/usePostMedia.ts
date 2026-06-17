"use client";

import { useState, useCallback } from "react";
import { MediaType } from "@/lib/types/post.types";

// Known image and video extensions / patterns
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|webm|mkv|m4v|ogv)(\?.*)?$/i;

// Well-known video platform domains
const VIDEO_DOMAINS = [
  "youtube.com", "youtu.be",
  "tiktok.com",
  "vimeo.com",
  "instagram.com",
  "facebook.com", "fb.watch",
  "twitter.com", "x.com",
];

export interface MediaValidationResult {
  valid: boolean;
  mediaType: MediaType;
  error: string | null;
}

function detectMediaType(url: string): MediaType {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");

    if (VIDEO_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
      return "video";
    }
    if (VIDEO_EXTENSIONS.test(pathname)) return "video";
    if (IMAGE_EXTENSIONS.test(pathname)) return "image";
  } catch {
    // not a valid URL — handled below
  }
  return null;
}

export function validateMediaURL(url: string): MediaValidationResult {
  if (!url.trim()) {
    return { valid: false, mediaType: null, error: null }; // empty is OK (optional field)
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { valid: false, mediaType: null, error: "Please enter a valid URL (must start with https://)." };
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    return { valid: false, mediaType: null, error: "URL must use https:// or http://." };
  }

  const mediaType = detectMediaType(url);

  return { valid: true, mediaType, error: null };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePostMedia(initialURL: string | null = null) {
  const [mediaURL, setMediaURL] = useState<string>(initialURL ?? "");
  const [validation, setValidation] = useState<MediaValidationResult>(() =>
    initialURL ? validateMediaURL(initialURL) : { valid: true, mediaType: null, error: null }
  );

  const handleChange = useCallback((url: string) => {
    setMediaURL(url);
    setValidation(validateMediaURL(url));
  }, []);

  const clear = useCallback(() => {
    setMediaURL("");
    setValidation({ valid: false, mediaType: null, error: null });
  }, []);

  return {
    mediaURL,
    mediaType: validation.mediaType,
    urlError: validation.error,
    isValid: validation.valid,
    handleChange,
    clear,
  };
}
