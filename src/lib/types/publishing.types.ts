import { SocialPlatformId } from "./social.types";

// ─── Publishing Log ────────────────────────────────────────────────────────
export interface PublishingLog {
  id: string;
  workspaceId: string;
  postId: string;
  postTitle: string;          // Denormalized for display
  triggeredBy: string;        // userId
  platform: SocialPlatformId;
  socialAccountId: string;
  accountName: string;        // Denormalized for display
  status: "success" | "failed" | "pending";
  publishStatus?: "success" | "failed" | "processing"; // Detailed status (e.g. for TikTok async processing)
  platformPostId: string | null;   // ID assigned by the social platform
  platformPostUrl: string | null;  // Direct link to the live post
  errorCode: string | null;
  errorMessage: string | null;
  attemptedAt: any;            // Firestore Timestamp
  completedAt: any | null;     // Firestore Timestamp
  durationMs: number | null;
  isMock: boolean;             // True when published via simulation mode
  likeCount?: number;          // Likes count
  commentCount?: number;       // Comments count
  viewCount?: number;          // Views/Plays count
  shareCount?: number;         // Shares count
  lastSyncedAt?: any;          // Firestore Timestamp of last stats update
}

// ─── Workspace Stats (aggregated for dashboard) ───────────────────────────
export interface WorkspaceStats {
  savedTopicsCount: number;
  draftCount: number;
  publishedCount: number;
  failedCount: number;
  connectedAccountsCount: number;
  recentLogs: PublishingLog[];
}

// ─── Publish Request / Response ───────────────────────────────────────────
export interface PublishRequest {
  postId: string;
  socialAccountId: string;
}

export interface PublishResponse {
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}
