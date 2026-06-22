export type SocialPlatformId = "facebook" | "instagram" | "tiktok" | "youtube";

export interface SocialAccount {
  id: string;                      // Firestore doc ID (= platform account/page ID)
  workspaceId: string;
  platform: SocialPlatformId;
  accountName: string;             // Page name / channel name / username
  accountId: string;               // Platform-specific account ID
  accessToken: string;             // Long-lived access token
  refreshToken?: string;           // Optional refresh token (used by YouTube/TikTok)
  scopes?: string[];               // Optional array of authorized scopes
  tokenExpiresAt: any | null;      // Firestore Timestamp (null = non-expiring)
  profilePictureURL: string | null;
  followerCount: number | null;
  connectedAt: any;                // Firestore Timestamp
}

export interface PlatformMeta {
  id: SocialPlatformId;
  label: string;
  color: string;
  available: boolean;              // false = Coming Soon
  oauthPath: string | null;        // Next.js route to initiate OAuth (null if unavailable)
}

export const PLATFORM_META: PlatformMeta[] = [
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    available: true,
    oauthPath: "/api/auth/facebook",
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    available: true,
    oauthPath: "/api/auth/facebook", // Instagram uses the same Meta OAuth flow
  },
  {
    id: "tiktok",
    label: "TikTok",
    color: "#000000",
    available: false,
    oauthPath: null,
  },
  {
    id: "youtube",
    label: "YouTube",
    color: "#FF0000",
    available: true,
    oauthPath: "/api/auth/youtube",
  },
];
