# ViralAI Publisher – Firebase Database Design

> **Version:** 1.0  
> **Created:** June 2026  
> **Database:** Firebase Firestore (NoSQL)  
> **Storage:** Firebase Cloud Storage

---

## Table of Contents

1. [Overview & Design Principles](#1-overview--design-principles)
2. [Collection Structure Map](#2-collection-structure-map)
3. [Collection Schemas](#3-collection-schemas)
   - [users](#31-users-collection)
   - [workspaces](#32-workspaces-collection)
   - [workspace_members](#33-workspace_members-collection)
   - [trends](#34-trends-collection)
   - [saved_trends](#35-saved_trends-collection)
   - [posts](#36-posts-collection)
   - [social_accounts](#37-social_accounts-collection)
   - [publishing_logs](#38-publishing_logs-collection)
   - [subscriptions](#39-subscriptions-collection)
   - [analytics](#310-analytics-collection)
   - [notifications](#311-notifications-collection)
   - [activity_logs](#312-activity_logs-collection)
4. [Security Rules](#4-firestore-security-rules)
5. [Indexes](#5-composite-indexes)
6. [Cloud Storage Structure](#6-cloud-storage-structure)
7. [MVP vs Full Schema](#7-mvp-vs-full-schema-comparison)
8. [Data Flow Diagrams](#8-data-flow-diagrams)

---

## 1. Overview & Design Principles

### Why Firestore?
- **Scalable** by default — no server management
- **Real-time updates** — listen to data changes live
- **Flexible schema** — add fields without migrations
- **Firebase Auth integration** — secure rules with `request.auth.uid`

### Firestore Design Principles Applied

| Principle | Application |
|---|---|
| **Denormalize for reads** | Store frequently accessed data together to reduce joins |
| **Subcollections for owned data** | Posts and members nested under workspaces |
| **Flat collections for shared data** | Trends stored at root level, referenced by ID |
| **Minimize document size** | Large content (media) stored in Cloud Storage |
| **Security first** | Every collection has explicit security rules |

---

## 2. Collection Structure Map

```
Firestore Root
│
├── users/                          # User accounts
│   └── {userId}/
│       ├── [user document]
│       └── notifications/          # Per-user notifications (subcollection)
│           └── {notificationId}/
│
├── workspaces/                     # Workspaces / brands / clients
│   └── {workspaceId}/
│       ├── [workspace document]
│       ├── members/                # Workspace team members (subcollection)
│       │   └── {userId}/
│       ├── posts/                  # Content posts (subcollection)
│       │   └── {postId}/
│       ├── social_accounts/        # Connected social accounts (subcollection)
│       │   └── {accountId}/
│       ├── publishing_logs/        # Publish attempt history (subcollection)
│       │   └── {logId}/
│       └── activity_logs/          # Team activity audit log (subcollection)
│           └── {logId}/
│
├── trends/                         # Cached trending data (root collection)
│   └── {trendId}/
│
├── saved_trends/                   # User-saved trends
│   └── {savedTrendId}/
│
├── subscriptions/                  # User subscription records
│   └── {subscriptionId}/
│
└── analytics/                      # Per-post analytics data
    └── {analyticsId}/
```

---

## 3. Collection Schemas

---

### 3.1 `users` Collection

**Document ID:** Firebase Auth UID (e.g., `abc123xyz`)

**Purpose:** Stores user account and profile information.

```typescript
// users/{userId}
{
  // Identity
  uid:              string,         // Firebase Auth UID (same as document ID)
  email:            string,         // User's email address
  displayName:      string,         // Full name
  photoURL:         string | null,  // Profile photo URL (Cloud Storage)
  
  // Account
  plan:             "free" | "creator" | "pro" | "agency",
  status:           "active" | "suspended" | "deleted",
  emailVerified:    boolean,
  
  // Limits (based on plan)
  limits: {
    trendSearchesPerMonth:    number,   // -1 = unlimited
    scheduledPostsPerMonth:   number,   // -1 = unlimited
    socialAccountsPerPlatform: number,
    workspacesAllowed:        number,
  },
  
  // Usage (reset monthly)
  usage: {
    trendSearchesThisMonth:   number,
    scheduledPostsThisMonth:  number,
    lastResetDate:            Timestamp,
  },
  
  // Preferences
  preferences: {
    timezone:           string,   // e.g., "America/New_York"
    defaultNiche:       string | null,
    defaultCountry:     string | null,
    emailNotifications: boolean,
  },
  
  // Metadata
  role:             "user" | "admin",   // Platform-level role
  createdAt:        Timestamp,
  updatedAt:        Timestamp,
  lastLoginAt:      Timestamp | null,
}
```

**Example Document:**
```json
{
  "uid": "uid_abc123",
  "email": "john@example.com",
  "displayName": "John Creator",
  "photoURL": "https://storage.googleapis.com/.../profile.jpg",
  "plan": "free",
  "status": "active",
  "emailVerified": true,
  "limits": {
    "trendSearchesPerMonth": 10,
    "scheduledPostsPerMonth": 10,
    "socialAccountsPerPlatform": 1,
    "workspacesAllowed": 1
  },
  "usage": {
    "trendSearchesThisMonth": 3,
    "scheduledPostsThisMonth": 0,
    "lastResetDate": "2026-06-01T00:00:00Z"
  },
  "preferences": {
    "timezone": "America/New_York",
    "defaultNiche": "fitness",
    "defaultCountry": "US",
    "emailNotifications": true
  },
  "role": "user",
  "createdAt": "2026-06-15T10:00:00Z",
  "updatedAt": "2026-06-16T08:00:00Z",
  "lastLoginAt": "2026-06-16T08:00:00Z"
}
```

---

### 3.2 `workspaces` Collection

**Document ID:** Auto-generated (e.g., `ws_abc123`)

**Purpose:** Represents a brand, client project, or content team workspace.

```typescript
// workspaces/{workspaceId}
{
  // Identity
  id:           string,      // Same as document ID
  name:         string,      // Workspace display name (e.g., "My Fitness Brand")
  slug:         string,      // URL-safe unique identifier
  description:  string | null,
  logoURL:      string | null,
  
  // Ownership
  ownerId:      string,      // userId of the workspace owner
  
  // Settings
  settings: {
    defaultPlatform:  string | null,   // Default publishing platform
    defaultTimezone:  string,
    contentLanguage:  string,          // e.g., "en", "es"
  },
  
  // Stats (denormalized for quick reads)
  stats: {
    totalPosts:       number,
    publishedPosts:   number,
    draftPosts:       number,
    memberCount:      number,
  },
  
  // Metadata
  plan:       "free" | "creator" | "pro" | "agency",  // Inherited from owner
  status:     "active" | "archived",
  createdAt:  Timestamp,
  updatedAt:  Timestamp,
}
```

**Subcollections:**
- `workspaces/{workspaceId}/members/`
- `workspaces/{workspaceId}/posts/`
- `workspaces/{workspaceId}/social_accounts/`
- `workspaces/{workspaceId}/publishing_logs/`
- `workspaces/{workspaceId}/activity_logs/`

---

### 3.3 `workspace_members` Subcollection

**Path:** `workspaces/{workspaceId}/members/{userId}`

**Document ID:** The member's Firebase Auth UID

**Purpose:** Defines team membership and role within a workspace.

```typescript
// workspaces/{workspaceId}/members/{userId}
{
  userId:       string,
  email:        string,        // Denormalized for display
  displayName:  string,        // Denormalized for display
  photoURL:     string | null,
  
  role:         "owner" | "admin" | "editor" | "content_creator" | "viewer",
  
  // Permissions override (optional, for granular control)
  permissions: {
    canPublish:         boolean,
    canSchedule:        boolean,
    canManageAccounts:  boolean,
    canViewAnalytics:   boolean,
    canManageMembers:   boolean,
  },
  
  status:     "active" | "invited" | "removed",
  invitedBy:  string | null,    // userId who sent the invite
  invitedAt:  Timestamp | null,
  joinedAt:   Timestamp | null,
  updatedAt:  Timestamp,
}
```

---

### 3.4 `trends` Collection

**Document ID:** Auto-generated or composite key (e.g., `fitness_us_tiktok_2026-06-16`)

**Purpose:** Caches trend data fetched from external APIs (Google Trends, Reddit, etc.). Data is refreshed periodically via Cloud Functions.

```typescript
// trends/{trendId}
{
  id:           string,
  
  // Topic
  keyword:      string,     // e.g., "5-Minute Morning Workout"
  niche:        string,     // e.g., "fitness"
  country:      string,     // ISO country code e.g., "US"
  language:     string,     // ISO language code e.g., "en"
  platform:     "tiktok" | "instagram" | "youtube" | "facebook" | "twitter" | "general",
  
  // Scores
  trendScore:           number,   // 0–100 overall trend score
  growthRate:           number,   // Percentage growth e.g., 320 = +320%
  searchVolume:         number,   // Relative search volume
  competitionLevel:     "low" | "medium" | "high",
  viralProbability:     "low" | "medium" | "high",
  audienceSentiment:    "positive" | "neutral" | "negative",
  
  // AI Analysis
  contentAngles:        string[],   // e.g., ["beginner guide", "common mistakes"]
  suggestedFormats:     string[],   // e.g., ["TikTok Reel", "YouTube Short"]
  suggestedTitles:      string[],   // Pre-generated title suggestions
  relatedKeywords:      string[],   // Related trending keywords
  
  // Source
  dataSource:           string[],   // e.g., ["google_trends", "reddit"]
  rawDataSnapshot:      object | null,  // Optional: raw API response snapshot
  
  // Metadata
  fetchedAt:    Timestamp,
  expiresAt:    Timestamp,    // When to re-fetch (TTL)
  isActive:     boolean,
}
```

**Caching Strategy:**
- Trends are fetched and cached for **24 hours** (configurable)
- Stale trends are refreshed by a scheduled Cloud Function
- Users query cached trends; a real-time fetch is triggered only on cache miss

---

### 3.5 `saved_trends` Collection

**Document ID:** Auto-generated

**Purpose:** Records which trends each user has saved for later reference.

```typescript
// saved_trends/{savedTrendId}
{
  id:           string,
  userId:       string,       // Reference to users collection
  workspaceId:  string | null, // Optional workspace context
  trendId:      string,       // Reference to trends collection
  
  // Denormalized trend data (for fast reads without joins)
  trendSnapshot: {
    keyword:        string,
    niche:          string,
    country:        string,
    platform:       string,
    trendScore:     number,
    growthRate:     number,
    viralProbability: string,
  },
  
  // Notes
  userNotes:    string | null,   // Optional personal note
  tags:         string[],        // User-defined tags
  
  // Metadata
  savedAt:      Timestamp,
  updatedAt:    Timestamp,
}
```

---

### 3.6 `posts` Subcollection

**Path:** `workspaces/{workspaceId}/posts/{postId}`

**Document ID:** Auto-generated

**Purpose:** Stores all content posts (drafts, scheduled, published, failed).

```typescript
// workspaces/{workspaceId}/posts/{postId}
{
  id:           string,
  workspaceId:  string,
  createdBy:    string,   // userId of the post creator
  
  // Content
  title:        string,
  caption:      string,
  hashtags:     string[],   // e.g., ["#fitness", "#workout"]
  
  // Media
  media: [
    {
      type:       "image" | "video",
      url:        string,     // Cloud Storage URL
      storagePath: string,    // e.g., "workspaces/{id}/posts/{id}/media/image1.jpg"
      size:       number,     // File size in bytes
      mimeType:   string,     // e.g., "image/jpeg"
      width:      number | null,
      height:     number | null,
      duration:   number | null,  // Video duration in seconds
    }
  ],
  
  // Source
  sourceTrendId:    string | null,   // If created from a saved trend
  
  // Publishing
  status:           "draft" | "scheduled" | "published" | "failed",
  targetPlatforms:  string[],        // e.g., ["facebook", "instagram"]
  scheduledAt:      Timestamp | null,
  publishedAt:      Timestamp | null,
  
  // Platform-specific settings
  platformSettings: {
    facebook?: {
      pageId:     string,
      postType:   "feed" | "reel" | "story",
    },
    instagram?: {
      accountId:  string,
      postType:   "feed" | "reel" | "story",
    },
    linkedin?: {
      pageId:     string | null,
      postType:   "personal" | "company",
    },
  },
  
  // Metadata
  version:      number,     // Incremented on each edit (for optimistic locking)
  createdAt:    Timestamp,
  updatedAt:    Timestamp,
}
```

---

### 3.7 `social_accounts` Subcollection

**Path:** `workspaces/{workspaceId}/social_accounts/{accountId}`

**Document ID:** Auto-generated

**Purpose:** Stores connected social media account credentials. **Tokens are stored server-side and never exposed to the frontend.**

```typescript
// workspaces/{workspaceId}/social_accounts/{accountId}
{
  id:               string,
  workspaceId:      string,
  connectedBy:      string,     // userId who connected the account
  
  // Platform
  platform:         "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok" | "youtube",
  
  // Account Info (from OAuth response)
  platformAccountId:    string,   // Platform's own user/page ID
  platformAccountName:  string,   // Display name from platform
  platformUsername:     string | null,
  avatarURL:            string | null,
  accountType:          "personal" | "page" | "business" | "creator",
  
  // Token Storage (SENSITIVE - restricted by security rules)
  // Tokens are NEVER sent to the frontend; Cloud Functions only
  accessToken:      string,     // Encrypted before storing
  refreshToken:     string | null,
  tokenExpiresAt:   Timestamp | null,
  scopes:           string[],   // OAuth scopes granted
  
  // Status
  status:           "active" | "expired" | "disconnected" | "error",
  lastValidatedAt:  Timestamp | null,
  errorMessage:     string | null,
  
  // Metadata
  connectedAt:      Timestamp,
  updatedAt:        Timestamp,
}
```

> ⚠️ **Security:** The `accessToken` and `refreshToken` fields must be **excluded** from all client-side security rule reads. Only Cloud Functions with Admin SDK access should read these fields.

---

### 3.8 `publishing_logs` Subcollection

**Path:** `workspaces/{workspaceId}/publishing_logs/{logId}`

**Document ID:** Auto-generated

**Purpose:** Records every publishing attempt with full response details.

```typescript
// workspaces/{workspaceId}/publishing_logs/{logId}
{
  id:               string,
  workspaceId:      string,
  postId:           string,
  triggeredBy:      string,   // userId
  
  // Target
  platform:         string,
  socialAccountId:  string,
  
  // Result
  status:           "success" | "failed" | "pending",
  platformPostId:   string | null,    // Post ID returned by the platform API
  platformPostUrl:  string | null,    // Direct URL to the published post
  
  // Error Details
  errorCode:        string | null,
  errorMessage:     string | null,
  errorDetails:     object | null,
  
  // Timing
  attemptedAt:      Timestamp,
  completedAt:      Timestamp | null,
  durationMs:       number | null,
}
```

---

### 3.9 `subscriptions` Collection

**Document ID:** Same as `userId`

**Purpose:** Tracks user subscription status, plan, and billing cycle.

```typescript
// subscriptions/{userId}
{
  userId:           string,
  
  // Plan
  plan:             "free" | "creator" | "pro" | "agency",
  status:           "active" | "trialing" | "canceled" | "past_due" | "paused",
  
  // Billing (Stripe Integration - Phase 2)
  stripeCustomerId:       string | null,
  stripeSubscriptionId:   string | null,
  stripePriceId:          string | null,
  
  // Dates
  currentPeriodStart:   Timestamp,
  currentPeriodEnd:     Timestamp,
  trialEndsAt:          Timestamp | null,
  canceledAt:           Timestamp | null,
  
  // History
  planHistory: [
    {
      plan:         string,
      changedAt:    Timestamp,
      reason:       string,
    }
  ],
  
  // Metadata
  createdAt:    Timestamp,
  updatedAt:    Timestamp,
}
```

---

### 3.10 `analytics` Collection

**Document ID:** Auto-generated

**Purpose:** Stores per-post performance metrics fetched from social media platform APIs.

```typescript
// analytics/{analyticsId}
{
  id:               string,
  postId:           string,
  workspaceId:      string,
  platform:         string,
  platformPostId:   string,   // Platform's post ID for API calls
  
  // Core Metrics
  impressions:      number,
  reach:            number,
  engagements:      number,
  clicks:           number,
  shares:           number,
  likes:            number,
  comments:         number,
  saves:            number,
  
  // Video Metrics (if applicable)
  views:            number | null,
  watchTimeSeconds: number | null,
  completionRate:   number | null,   // 0–1
  
  // Follower Impact
  followersGained:  number | null,
  followersLost:    number | null,
  
  // Calculated
  engagementRate:   number,   // (engagements / impressions) * 100
  
  // Metadata
  periodStart:      Timestamp,
  periodEnd:        Timestamp,
  fetchedAt:        Timestamp,
  isLatest:         boolean,   // True for the most recent snapshot
}
```

---

### 3.11 `notifications` Subcollection

**Path:** `users/{userId}/notifications/{notificationId}`

**Document ID:** Auto-generated

**Purpose:** In-app notification system for users.

```typescript
// users/{userId}/notifications/{notificationId}
{
  id:       string,
  userId:   string,
  
  type:     "publishing_success" | "publishing_failed" | "plan_upgraded" 
            | "member_invited" | "token_expired" | "system_alert",
  
  title:    string,
  message:  string,
  
  // Related entity (optional deep link)
  entityType:   "post" | "workspace" | "subscription" | null,
  entityId:     string | null,
  actionUrl:    string | null,
  
  // Status
  isRead:   boolean,
  
  // Metadata
  createdAt:  Timestamp,
  readAt:     Timestamp | null,
}
```

---

### 3.12 `activity_logs` Subcollection

**Path:** `workspaces/{workspaceId}/activity_logs/{logId}`

**Document ID:** Auto-generated

**Purpose:** Immutable audit trail of all significant actions within a workspace.

```typescript
// workspaces/{workspaceId}/activity_logs/{logId}
{
  id:           string,
  workspaceId:  string,
  
  // Actor
  userId:       string,
  userEmail:    string,     // Denormalized
  displayName:  string,     // Denormalized
  
  // Action
  action:       string,     // e.g., "post.created", "post.published", "member.invited"
  entityType:   string,     // e.g., "post", "member", "social_account"
  entityId:     string | null,
  
  // Details
  details:      object | null,   // Action-specific metadata
  
  // Metadata
  ipAddress:    string | null,
  userAgent:    string | null,
  createdAt:    Timestamp,
}
```

**Example Action Values:**
| Action | Description |
|---|---|
| `post.created` | New post was created |
| `post.edited` | Post content was modified |
| `post.deleted` | Post was deleted |
| `post.published` | Post was successfully published |
| `post.scheduled` | Post was scheduled for future publish |
| `member.invited` | Team member was invited |
| `member.removed` | Team member was removed |
| `member.role_changed` | Member's role was updated |
| `social_account.connected` | Social account was connected |
| `social_account.disconnected` | Social account was disconnected |

---

## 4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─────────────────────────────────────────
    // HELPER FUNCTIONS
    // ─────────────────────────────────────────
    
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isPlatformAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function getWorkspaceMember(workspaceId) {
      return get(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));
    }

    function isWorkspaceMember(workspaceId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));
    }

    function hasWorkspaceRole(workspaceId, roles) {
      return isWorkspaceMember(workspaceId) &&
        getWorkspaceMember(workspaceId).data.role in roles;
    }

    function isWorkspaceOwner(workspaceId) {
      return hasWorkspaceRole(workspaceId, ['owner']);
    }

    function canEditWorkspace(workspaceId) {
      return hasWorkspaceRole(workspaceId, ['owner', 'admin', 'editor', 'content_creator']);
    }

    function canPublishInWorkspace(workspaceId) {
      return hasWorkspaceRole(workspaceId, ['owner', 'admin', 'editor']);
    }

    // ─────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isPlatformAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId) &&
        // Prevent users from changing their own role or plan
        !('role' in request.resource.data.diff(resource.data).affectedKeys()) &&
        !('plan' in request.resource.data.diff(resource.data).affectedKeys());
      allow delete: if isPlatformAdmin();

      // Notifications subcollection
      match /notifications/{notificationId} {
        allow read, write: if isAuthenticated() && isOwner(userId);
      }
    }

    // ─────────────────────────────────────────
    // WORKSPACES
    // ─────────────────────────────────────────
    match /workspaces/{workspaceId} {
      allow read: if isAuthenticated() && 
        (isWorkspaceMember(workspaceId) || isPlatformAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        hasWorkspaceRole(workspaceId, ['owner', 'admin']);
      allow delete: if isAuthenticated() && isWorkspaceOwner(workspaceId);

      // Members subcollection
      match /members/{memberId} {
        allow read: if isAuthenticated() && isWorkspaceMember(workspaceId);
        allow write: if isAuthenticated() && 
          hasWorkspaceRole(workspaceId, ['owner', 'admin']);
      }

      // Posts subcollection
      match /posts/{postId} {
        allow read: if isAuthenticated() && isWorkspaceMember(workspaceId);
        allow create: if isAuthenticated() && canEditWorkspace(workspaceId);
        allow update: if isAuthenticated() && canEditWorkspace(workspaceId);
        allow delete: if isAuthenticated() && 
          hasWorkspaceRole(workspaceId, ['owner', 'admin', 'editor']);
      }

      // Social Accounts (SENSITIVE - tokens excluded via projection)
      match /social_accounts/{accountId} {
        // Frontend can read, but Cloud Functions control token fields
        allow read: if isAuthenticated() && isWorkspaceMember(workspaceId);
        allow create, update: if isAuthenticated() && 
          hasWorkspaceRole(workspaceId, ['owner', 'admin']);
        allow delete: if isAuthenticated() && 
          hasWorkspaceRole(workspaceId, ['owner', 'admin']);
      }

      // Publishing Logs
      match /publishing_logs/{logId} {
        allow read: if isAuthenticated() && isWorkspaceMember(workspaceId);
        allow create: if false; // Only Cloud Functions can create logs
        allow update, delete: if false;
      }

      // Activity Logs
      match /activity_logs/{logId} {
        allow read: if isAuthenticated() && 
          hasWorkspaceRole(workspaceId, ['owner', 'admin']);
        allow create: if false; // Only Cloud Functions can write activity logs
        allow update, delete: if false;
      }
    }

    // ─────────────────────────────────────────
    // TRENDS (Public Read, Admin/Function Write)
    // ─────────────────────────────────────────
    match /trends/{trendId} {
      allow read: if isAuthenticated();
      allow write: if isPlatformAdmin(); // Cloud Functions use Admin SDK
    }

    // ─────────────────────────────────────────
    // SAVED TRENDS
    // ─────────────────────────────────────────
    match /saved_trends/{savedTrendId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }

    // ─────────────────────────────────────────
    // SUBSCRIPTIONS
    // ─────────────────────────────────────────
    match /subscriptions/{userId} {
      allow read: if isAuthenticated() && 
        (isOwner(userId) || isPlatformAdmin());
      allow write: if isPlatformAdmin(); // Only Cloud Functions / Admin SDK
    }

    // ─────────────────────────────────────────
    // ANALYTICS
    // ─────────────────────────────────────────
    match /analytics/{analyticsId} {
      allow read: if isAuthenticated() && 
        isWorkspaceMember(resource.data.workspaceId);
      allow write: if false; // Only Cloud Functions can write analytics
    }
  }
}
```

---

## 5. Composite Indexes

These indexes must be created in Firebase Console or via `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "saved_trends",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "savedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "saved_trends",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "trendSnapshot.niche", "order": "ASCENDING" },
        { "fieldPath": "savedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "scheduledAt", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "trends",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "niche", "order": "ASCENDING" },
        { "fieldPath": "country", "order": "ASCENDING" },
        { "fieldPath": "platform", "order": "ASCENDING" },
        { "fieldPath": "trendScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "trends",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "publishing_logs",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "postId", "order": "ASCENDING" },
        { "fieldPath": "attemptedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "analytics",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workspaceId", "order": "ASCENDING" },
        { "fieldPath": "isLatest", "order": "ASCENDING" },
        { "fieldPath": "fetchedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 6. Cloud Storage Structure

```
Firebase Cloud Storage Bucket
│
├── users/
│   └── {userId}/
│       └── profile/
│           └── avatar.{ext}        # Profile photo
│
├── workspaces/
│   └── {workspaceId}/
│       ├── logo/
│       │   └── logo.{ext}          # Workspace logo
│       └── posts/
│           └── {postId}/
│               └── media/
│                   ├── image_1.jpg   # Post media files
│                   ├── image_2.png
│                   └── video_1.mp4
│
└── trends/
    └── thumbnails/
        └── {trendId}.jpg          # Optional trend topic thumbnail
```

### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // User profile photos
    match /users/{userId}/profile/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // 5MB max
        && request.resource.contentType.matches('image/.*');
    }

    // Workspace logos
    match /workspaces/{workspaceId}/logo/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    // Post media
    match /workspaces/{workspaceId}/posts/{postId}/media/{filename} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 100 * 1024 * 1024  // 100MB max
        && (
          request.resource.contentType.matches('image/.*') ||
          request.resource.contentType.matches('video/.*')
        );
    }
  }
}
```

---

## 7. MVP vs Full Schema Comparison

| Collection / Feature | MVP | Full Product |
|---|:---:|:---:|
| `users` (basic profile) | ✅ | ✅ |
| `users` (usage limits) | ✅ | ✅ |
| `workspaces` | Basic | Full |
| `workspace/members` | ❌ | ✅ |
| `trends` | ✅ | ✅ |
| `saved_trends` | ✅ | ✅ |
| `posts` (draft + publish) | ✅ | ✅ |
| `posts` (scheduling) | ❌ | ✅ |
| `social_accounts` (Facebook only) | ✅ | ✅ (all platforms) |
| `publishing_logs` | ✅ | ✅ |
| `subscriptions` | ❌ | ✅ |
| `analytics` | ❌ | ✅ |
| `notifications` | Basic | Full |
| `activity_logs` | ❌ | ✅ |

---

## 8. Data Flow Diagrams

### Trend Discovery Flow
```
User submits search (niche + country + platform)
  │
  ▼
Check Firestore trends collection
  ├─ CACHE HIT (fresh): Return cached results
  └─ CACHE MISS / EXPIRED:
       │
       ▼
       Cloud Function triggered
         ├─ Call Google Trends API
         ├─ Call Reddit API
         └─ Process + Score results (OpenAI)
              │
              ▼
              Store in Firestore trends/{trendId}
              Set expiresAt = now + 24 hours
              Return results to user
```

### Content Publishing Flow
```
User clicks "Publish Now" on a Draft post
  │
  ▼
Next.js calls Cloud Function: publishPost(postId, accountId)
  │
  ▼
Cloud Function:
  1. Fetch post from Firestore (posts/{postId})
  2. Fetch social account from Firestore (social_accounts/{accountId})
  3. Decrypt access token
  4. Upload media to platform CDN (if needed)
  5. Call Social Platform API (Facebook Graph API)
  │
  ├─ SUCCESS:
  │    ├─ Update post.status = "published"
  │    ├─ Update post.publishedAt = now
  │    ├─ Create publishing_logs entry (status: success)
  │    └─ Send notification to user
  │
  └─ FAILURE:
       ├─ Update post.status = "failed"
       ├─ Create publishing_logs entry (status: failed, errorMessage)
       └─ Send notification to user
```

### User Registration Flow
```
User submits registration form
  │
  ▼
Firebase Auth: createUserWithEmailAndPassword()
  │
  ▼
Cloud Function: onUserCreated trigger (auth.user().onCreate)
  │
  ├─ Create users/{uid} document with default values
  ├─ Create subscriptions/{uid} document (plan: "free")
  └─ Create default workspace for the user
       └─ Create workspaces/{wsId}/members/{uid} (role: "owner")
```

---

*Last Updated: June 2026*  
*Document Owner: ViralMove Projects Team*
