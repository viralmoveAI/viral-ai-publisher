export type PostStatus = "Draft" | "Published" | "Failed";

export type SocialPlatform =
  | "TikTok"
  | "Instagram"
  | "YouTube"
  | "LinkedIn"
  | "Facebook"
  | null;

export type MediaType = "image" | "video" | null;

export interface Post {
  id: string;            // Firestore document ID
  workspaceId: string;
  userId: string;        // author UID
  title: string;
  caption: string;
  hashtags: string[];    // e.g. ["#fitness", "#gym"]
  platform: SocialPlatform;
  mediaURL: string | null;
  mediaType: MediaType;
  status: PostStatus;
  publishedAt: any | null;
  createdAt: any;
  updatedAt: any;
}

export type PostFormData = Omit<Post, "id" | "workspaceId" | "userId" | "status" | "publishedAt" | "createdAt" | "updatedAt">;

