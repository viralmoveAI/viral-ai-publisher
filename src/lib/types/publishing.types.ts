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
  platformPostId: string | null;   // ID assigned by the social platform
  platformPostUrl: string | null;  // Direct link to the live post
  errorCode: string | null;
  errorMessage: string | null;
  attemptedAt: any;            // Firestore Timestamp
  completedAt: any | null;     // Firestore Timestamp
  durationMs: number | null;
  isMock: boolean;             // True when published via simulation mode
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
