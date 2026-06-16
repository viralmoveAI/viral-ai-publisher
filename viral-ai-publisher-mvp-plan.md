# ViralAI Publisher – MVP Project Plan

> **Version:** 1.0  
> **Created:** June 2026  
> **Status:** Active Development  
> **Target Duration:** 6–8 Weeks

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [MVP Goals & Validation Questions](#2-mvp-goals--validation-questions)
3. [Target Users](#3-target-users)
4. [User Journey](#4-user-journey)
5. [User Roles](#5-user-roles)
6. [Core Modules](#6-core-modules)
7. [Technology Stack](#7-technology-stack)
8. [Development Roadmap](#8-development-roadmap)
9. [Out of Scope](#9-out-of-scope-future-releases)
10. [Success Metrics](#10-success-metrics)

---

## 1. Project Overview

ViralAI Publisher is a SaaS platform that helps content creators discover trending content opportunities and publish content to social media platforms from a single dashboard.

The **initial MVP** focuses on validating the core business idea with minimal complexity:

| MVP Core Feature | Included |
|---|:---:|
| User registration & account management | ✅ |
| Discover trending topics within specific niches | ✅ |
| Manually create content (no AI generation) | ✅ |
| Publish content to one social media platform | ✅ |
| Save trending topics for future use | ✅ |
| AI content generation | ❌ |
| Scheduling / recurring posts | ❌ |
| Analytics dashboard | ❌ |
| Team collaboration | ❌ |
| Multi-platform publishing | ❌ |

> **Philosophy:** Ship fast, learn fast. The MVP is designed to answer critical business questions before investing in advanced features.

---

## 2. MVP Goals & Validation Questions

The MVP must answer the following key business questions:

| # | Validation Question | How We Measure |
|---|---|---|
| 1 | Are users interested in discovering viral content topics? | Trend search count per user |
| 2 | Which niches are searched most frequently? | Niche search analytics |
| 3 | Do users create content after discovering trends? | Post creation rate after trend save |
| 4 | Will users use a centralized publishing workflow? | Publishing success rate |
| 5 | Which platform should be integrated next? | User survey + request logs |
| 6 | Are users willing to pay for AI-powered features? | Upgrade request / waitlist sign-ups |

---

## 3. Target Users

### Individual Content Creators
- YouTubers looking for trending video ideas
- TikTok Creators seeking viral hooks
- Instagram Creators needing trending hashtags and topics
- Bloggers researching SEO-driven content
- Freelancers managing social media for clients

### Small Business Owners
- Personal brands building an online presence
- Local businesses wanting to grow on social media
- Coaches and consultants marketing their expertise

---

## 4. User Journey

```
Step 1: Register
  └─ User creates an account with email and password

Step 2: Discover Trending Topics
  └─ User selects: Niche + Country + Platform
  └─ System returns: Trending topics, Trend Score, Growth Score, Content Angles

Step 3: Save Topics
  └─ User saves interesting topics to their saved topics list

Step 4: Create Content
  └─ User manually creates a post:
       Title, Caption, Hashtags, Media Upload
  └─ User can save as Draft or proceed to publish

Step 5: Connect Social Account
  └─ User connects one Facebook Page (or LinkedIn)

Step 6: Publish Content
  └─ User publishes content immediately to connected account
  └─ System confirms success or shows error
```

---

## 5. User Roles

### User
Standard platform user with self-service access.

| Permission | Allowed |
|---|:---:|
| Manage own account and profile | ✅ |
| Search trending topics | ✅ |
| Save and remove topics | ✅ |
| Create, edit, delete content | ✅ |
| Upload media files | ✅ |
| Connect social media account | ✅ |
| Publish content | ✅ |
| Invite team members | ❌ |
| Manage other users | ❌ |

### System Admin
Internal platform administrator.

| Permission | Allowed |
|---|:---:|
| Manage user accounts | ✅ |
| View platform statistics | ✅ |
| Monitor publishing activities | ✅ |
| Manage trend data sources | ✅ |
| View all workspaces | ✅ |

---

## 6. Core Modules

---

### Module 1 – Authentication

**Purpose:** Provide secure, reliable user access to the platform.

#### Features
- ✅ User Registration (email + password)
- ✅ User Login
- ✅ Logout
- ✅ Forgot Password (email link)
- ✅ Reset Password
- ✅ Protected Routes (redirect unauthenticated users)

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| Visitor | Create an account | I can start using the platform |
| Visitor | Log in securely | I can access my data |
| User | Reset my password | I can regain access if I forget it |
| User | Log out | My account stays secure on shared devices |

#### Firebase Implementation
- Use **Firebase Authentication** (email/password provider)
- Email verification on registration
- Password reset via `sendPasswordResetEmail()`
- Auth state persisted across sessions

---

### Module 2 – User Profile

**Purpose:** Allow users to manage their personal account information.

#### Features
- ✅ View profile (name, email, join date)
- ✅ Update display name
- ✅ Upload/update profile photo
- ✅ Change password

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| User | Update my profile name | My account reflects my identity |
| User | Change my password | I can keep my account secure |
| User | Upload a profile photo | My profile looks professional |

---

### Module 3 – Trend Discovery

**Purpose:** Allow users to discover trending content topics based on their niche, country, and platform.

#### Features
- ✅ Search by niche (free text or dropdown)
- ✅ Filter by country
- ✅ Filter by platform
- ✅ Display trending topics list
- ✅ Display trend score (0–100)
- ✅ Display growth score (% change)
- ✅ Display suggested content angles

#### Input Parameters
| Parameter | Type | Example |
|---|---|---|
| Niche | Text / Dropdown | Fitness, Tech, Finance |
| Country | Dropdown | United States, UK, India |
| Platform | Dropdown | TikTok, Instagram, YouTube |

#### Example Output
```
Input: Niche: Fitness | Country: United States | Platform: TikTok

Results:
┌─────────────────────────────────┬────────┬────────┐
│ Topic                           │ Score  │ Growth │
├─────────────────────────────────┼────────┼────────┤
│ 5-Minute Morning Workout        │ 89/100 │ +240%  │
│ Walking for Weight Loss         │ 84/100 │ +180%  │
│ AI Fitness Coach                │ 91/100 │ +320%  │
│ Home Workout Challenge          │ 78/100 │ +150%  │
│ Fat Loss Mistakes               │ 82/100 │ +200%  │
└─────────────────────────────────┴────────┴────────┘
```

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| Creator | Search trends by niche | I find relevant topics for my content |
| Creator | Filter by country | I target the right audience |
| Creator | Filter by platform | I get platform-specific trends |
| Creator | See trend scores | I prioritize high-potential topics |

---

### Module 4 – Saved Topics

**Purpose:** Allow users to bookmark trending topics for future content creation.

#### Features
- ✅ Save a topic from search results
- ✅ View all saved topics
- ✅ Remove a saved topic
- ✅ Link saved topic to a new post (optional in MVP)

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| Creator | Save an interesting topic | I can revisit it later |
| Creator | View all saved topics | I have a personal idea library |
| Creator | Remove a saved topic | I keep my list clean and relevant |

---

### Module 5 – Content Management

**Purpose:** Allow users to create, manage, and organize content posts.

#### Features
- ✅ Create a new post
- ✅ Edit an existing post
- ✅ Delete a post
- ✅ Save post as Draft
- ✅ Upload media (images, videos)

#### Post Fields
| Field | Type | Required |
|---|---|:---:|
| Title | Text | ✅ |
| Caption | Rich Text | ✅ |
| Hashtags | Tag Input | ❌ |
| Media | File Upload (image/video) | ❌ |

#### Post Statuses
| Status | Description |
|---|---|
| `Draft` | Saved but not published |
| `Published` | Successfully published to social platform |
| `Failed` | Publishing attempt encountered an error |

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| Creator | Manually create content | I have full control over my posts |
| Creator | Upload media files | My posts include visual content |
| Creator | Save content as a draft | I can finish it later |
| Creator | Edit content before publishing | I can fix mistakes |
| Creator | Delete posts I no longer need | I keep my content library clean |

---

### Module 6 – Social Account Connection

**Purpose:** Allow users to connect their social media account for publishing.

#### MVP Primary Platform
> **Facebook Pages** (via Facebook Graph API)

#### Alternative Platform
> **LinkedIn** (personal or company page)

#### Features
- ✅ Connect a social account (OAuth flow)
- ✅ View connected account details
- ✅ Disconnect a social account

#### Connection Flow
```
User clicks "Connect Facebook Page"
  └─ Redirected to Facebook OAuth
  └─ User grants permissions
  └─ Access token stored securely in Firestore
  └─ Connected account displayed in dashboard
```

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| Creator | Connect my Facebook Page | I can publish content from the platform |
| Creator | See my connected account | I know which account is linked |
| Creator | Disconnect my account | I can revoke access when needed |

#### Security Notes
- Access tokens encrypted and stored in Firestore
- Tokens are never exposed to the frontend directly
- Cloud Functions handle all API calls using stored tokens

---

### Module 7 – Publishing

**Purpose:** Allow users to publish content immediately to their connected social account.

#### Features
- ✅ Publish Now (immediate publishing)
- ✅ Publishing status feedback (success / failed)
- ✅ Error message display on failure
- ✅ Publishing history log

> **Note:** Scheduling and recurring posts are out of scope for MVP.

#### Publishing Flow
```
User selects a Draft post
  └─ Clicks "Publish Now"
  └─ Cloud Function is triggered
  └─ API call made to Facebook Graph API
  └─ Response received
       ├─ Success → Post status updated to "Published"
       └─ Failure → Post status updated to "Failed" + Error shown
```

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| Creator | Publish content immediately | My posts go live without delay |
| Creator | See if publishing was successful | I know my content reached my audience |
| Creator | See failed publishing attempts | I can diagnose and retry |

---

### Module 8 – Dashboard

**Purpose:** Give users a quick overview of their activity and platform usage.

#### Dashboard Widgets
| Widget | Description |
|---|---|
| 🔍 Total Trend Searches | Number of trend searches performed |
| 📌 Saved Topics | Number of topics currently saved |
| 📝 Draft Posts | Number of posts in draft status |
| ✅ Published Posts | Number of successfully published posts |
| 🔗 Connected Accounts | Number and details of connected social accounts |

#### User Stories
| As a... | I want to... | So that... |
|---|---|---|
| User | See my activity overview | I understand how I'm using the platform |
| User | Quickly access important stats | I can make informed decisions |
| User | Navigate to key sections from the dashboard | I save time navigating |

---

## 7. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14+ | React framework with App Router |
| TypeScript | 5+ | Type safety across the codebase |
| Tailwind CSS | 3+ | Utility-first CSS styling |
| ShadCN UI | Latest | Pre-built accessible UI components |
| React Hook Form | 7+ | Form state management |
| Zod | 3+ | Runtime schema validation |

### Backend
| Technology | Purpose |
|---|---|
| Firebase Authentication | User login, registration, password reset |
| Firebase Firestore | All application data storage |
| Firebase Cloud Functions | Server-side logic, API calls, publishing |
| Firebase Cloud Storage | User media file storage |
| Firebase Hosting | Frontend deployment |

### External APIs (MVP)
| API | Purpose |
|---|---|
| Google Trends API | Trend discovery data |
| Facebook Graph API | Facebook Page publishing |
| OpenAI API (optional) | Basic trend scoring assistance |

---

## 8. Development Roadmap

```
Phase 1 – Authentication System          Week 1
  ├─ User Registration
  ├─ User Login / Logout
  ├─ Password Reset
  └─ Protected Route Guards

Phase 2 – Trend Discovery                Week 2
  ├─ Trend Search UI
  ├─ Google Trends API Integration
  ├─ Trend Results Listing
  └─ Trend Score Display

Phase 3 – Saved Topics                   Week 3
  ├─ Save Topic Feature
  ├─ Saved Topics List View
  └─ Remove Saved Topic

Phase 4 – Content Management            Week 3–4
  ├─ Create Post UI
  ├─ Draft Management
  ├─ Media Upload (Firebase Storage)
  └─ Post Edit / Delete

Phase 5 – Social Integration            Week 5
  ├─ Facebook OAuth Flow
  ├─ Store Access Token (Firestore)
  └─ Connected Account View

Phase 6 – Publishing                    Week 6
  ├─ Publish Now (Cloud Function)
  ├─ Facebook Graph API Call
  ├─ Success / Failure Handling
  └─ Publishing History

Phase 7 – Dashboard & Polish            Week 7–8
  ├─ Dashboard Widgets
  ├─ User Profile Page
  ├─ UI/UX Polish
  └─ Testing & Bug Fixes
```

---

## 9. Out of Scope (Future Releases)

The following features are **intentionally excluded** from the MVP to reduce complexity and accelerate market validation. These will be prioritized based on user feedback after MVP launch.

| Feature | Target Phase |
|---|---|
| AI Content Generation | Phase 2 |
| AI Caption / Hashtag Generation | Phase 2 |
| AI Script Writing | Phase 2 |
| Content Scheduling | Phase 2 |
| Recurring Posts | Phase 2 |
| Team Collaboration | Phase 2 |
| Organization / Client Workspaces | Phase 2 |
| LinkedIn Publishing | Phase 2 |
| X (Twitter) Publishing | Phase 2 |
| Subscription Billing (Stripe) | Phase 2 |
| Analytics Dashboard | Phase 2 |
| TikTok Publishing | Phase 3 |
| YouTube Publishing | Phase 3 |
| Multi-Platform Publishing | Phase 2+ |
| Agency Features | Phase 3 |
| Advanced Permissions System | Phase 2 |
| Viral Prediction Engine | Phase 3 |

---

## 10. Success Metrics

The MVP will be considered **successful** if, within the first 30 days of launch:

| Metric | Target |
|---|---|
| Registered users | 100+ |
| Trend searches performed | 500+ |
| Topics saved | 200+ |
| Posts created | 150+ |
| Posts published via platform | 50+ |
| User retention (Week 2) | > 30% |
| Net Promoter Score (NPS) | > 30 |

---

*Last Updated: June 2026*  
*Document Owner: ViralMove Projects Team*
