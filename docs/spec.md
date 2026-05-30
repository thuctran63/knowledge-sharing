# Knowledge Sharing Platform — Project Specification

## 1. Overview

A community-driven blogging platform where users write, share, and discover articles. Features a custom Medium-style block editor, real-time notifications, social interactions (likes, bookmarks, comments, follows), tag-based discovery, and RSS/SEO support.

- **Stack**: Next.js 15 (App Router) + PostgreSQL (Neon) + Cloudflare R2
- **Auth**: NextAuth.js v4 (JWT strategy, Google OAuth + Credentials)
- **Styling**: Tailwind CSS v3 + Radix UI primitives
- **ORM**: Prisma 5

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (React 19, App Router) |
| Language | TypeScript 5.7 |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 5 + Prisma Client |
| Auth | NextAuth.js 4 (JWT, Google OAuth, Credentials) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Styling | Tailwind CSS 3.4, `tailwindcss-animate`, `@tailwindcss/typography` |
| UI Library | Radix UI (Avatar, Dialog, DropdownMenu, Select, Tabs, Toast, Separator, ScrollArea, Tooltip, Popover, Slot) |
| Icons | Lucide React |
| Markdown | `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-slug` |
| Fonts | Be Vietnam Pro (body), Plus Jakarta Sans (headings), JetBrains Mono (code) — via `next/font` |
| Package Manager | npm |
| Linting | ESLint 9 + `eslint-config-next` |
| Formatting | Prettier + `prettier-plugin-tailwindcss` |

### Dependencies (runtime)

```
@auth/prisma-adapter, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner,
@prisma/client, @radix-ui/*, @tailwindcss/typography, bcryptjs,
class-variance-authority, clsx, lucide-react, next, next-auth, next-themes,
react, react-dom, react-markdown, rehype-highlight, rehype-slug,
remark-gfm, tailwind-merge, tailwindcss-animate
```

### Dependencies (dev)

```
@types/bcryptjs, @types/node, @types/react, @types/react-dom,
autoprefixer, eslint, eslint-config-next, postcss, prettier,
prettier-plugin-tailwindcss, prisma, tailwindcss, tsx, typescript
```

## 3. Architecture

### Route Group Layout

```
app/
├── (auth)/           # Login, Register — no header/footer
│   ├── layout.tsx    # AuthLayout (SessionProvider isolation)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (main)/           # Authenticated pages — MainShell wrapper
│   ├── layout.tsx    # MainLayout → <MainShell>
│   ├── loading.tsx   # Skeleton loading state
│   ├── page.tsx      # Homepage (ISR 60s)
│   ├── drafts/page.tsx
│   ├── saved/page.tsx
│   ├── post/[slug]/page.tsx    # Article detail (ISR 3600s)
│   ├── post/new/page.tsx
│   ├── edit/[slug]/page.tsx    # force-dynamic
│   ├── profile/[id]/page.tsx   # ISR 300s
│   ├── search/page.tsx
│   ├── tags/page.tsx
│   └── tag/[tag]/page.tsx
├── layout.tsx        # Root layout (fonts, providers, globals.css)
├── providers.tsx     # SessionProvider + ThemeProvider + LoadingProvider + Toaster
├── not-found.tsx     # Custom 404
├── sitemap.ts        # Dynamic sitemap
├── robots.ts         # Robots.txt rules
├── feed.xml/route.ts # RSS feed
└── globals.css       # Tailwind directives, CSS variables, animations
```

### Provider Hierarchy

```
<html>
  <body>
    <Skip-to-content link />
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LoadingProvider>
          {children}
          <Toaster />
        </LoadingProvider>
      </ThemeProvider>
    </SessionProvider>
  </body>
</html>
```

### Request Lifecycle

1. **Static Generation** (ISR): Pages with `export const revalidate = N` — homepage (60s), post detail (3600s), profile (300s), tag page (300s)
2. **Dynamic Rendering**: Editor pages (`force-dynamic`), search, drafts, saved
3. **API Routes**: All under `/api/` — use `getCurrentUser()` for auth, return JSON
4. **File Uploads**: POST `/api/posts/[id]/images` → validate → upload to R2 → return `{ url, key }`
5. **View Tracking**: Server-side deduplication via `SHA256(IP + UA)` + `PostView` unique constraint

## 4. Data Model (Prisma Schema)

### Models

**User**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String? | |
| email | String? | `@unique` |
| emailVerified | DateTime? | Set on credential registration |
| image | String? | Avatar URL (R2 or Google) |
| bio | String? | Text |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |

Relations: accounts, sessions, posts, comments, likes, bookmarks, following (`Follow`[]), followers (`Follow`[]), notifications, notificationsActed

**Post**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| title | String | |
| slug | String | `@unique` |
| content | String (Text) | Markdown body |
| excerpt | String? (Text) | |
| published | Boolean | `@default(false)` |
| viewCount | Int | `@default(0)`, incremented on unique view |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| authorId | String | FK → User, Cascade |

Indexes: `[published, createdAt]`, `[published, viewCount]`, `[authorId, published]`

**Tag**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | `@unique` |

**PostTag** (join table)
| Field | Type | Notes |
|-------|------|-------|
| postId + tagId | Composite PK | |
| postId | String | FK → Post, Cascade |
| tagId | String | FK → Tag, Cascade |

**Comment**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| content | String (Text) | |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| authorId | String | FK → User, Cascade |
| postId | String | FK → Post, Cascade |
| parentId | String? | FK → Comment (self-referencing for replies), Cascade |

Indexes: `[postId, createdAt]`, `[parentId]`

**Like**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| createdAt | DateTime | `@default(now())` |
| userId | String | FK → User, Cascade |
| postId | String | FK → Post, Cascade |
| | | `@@unique([userId, postId])` |

**Bookmark**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| createdAt | DateTime | `@default(now())` |
| userId | String | FK → User, Cascade |
| postId | String | FK → Post, Cascade |
| | | `@@unique([userId, postId])` |

**Follow**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| followerId | String | FK → User ("Following") |
| followingId | String | FK → User ("Followers") |
| createdAt | DateTime | `@default(now())` |
| | | `@@unique([followerId, followingId])`, indexes on both fields |

**Notification**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User ("NotificationRecipient") |
| type | String | Enum: `COMMENT_REPLY`, `POST_LIKE`, `NEW_FOLLOWER`, `NEW_POST` |
| actorId | String? | FK → User ("NotificationActor"), SetNull |
| postId | String? | FK → Post, Cascade |
| commentId | String? | |
| read | Boolean | `@default(false)` |
| createdAt | DateTime | `@default(now())` |

Index: `[userId, read, createdAt]`

**PostView**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| postId | String | FK → Post, Cascade |
| viewerKey | String | `SHA256(IP + UA)` or `user:{userId}` |
| viewedAt | DateTime | `@default(now())` |
| | | `@@unique([postId, viewerKey])`, index `[postId, viewedAt]` |

**Account** (NextAuth), **Session** (NextAuth), **VerificationToken** (NextAuth): Standard Prisma Adapter models.

### Entity Relationships

```
User ──< Post       (author)
User ──< Comment    (author)
User ──< Like
User ──< Bookmark
User ──< Follow     (followerId → "Following")
User ──< Follow     (followingId → "Followers")
User ──< Notification (recipient)
User ──< Notification (actor)

Post ──< PostTag >── Tag
Post ──< Comment
Post ──< Like
Post ──< Bookmark
Post ──< PostView
Post ──< Notification

Comment ──< Comment (self: parentId → replies)
```

## 5. API Reference

All routes live under `src/app/api/`. Auth via `getCurrentUser()` from `@/lib/auth`.

### Authentication

**`POST /api/auth/register`** — Create credential account
```json
// Request: { name, email, password }
// Response 201: { id, name, email }
// Validates: name+email+password required, password >= 8 chars, email unique
```

**`GET|POST /api/auth/[...nextauth]`** — NextAuth handler (Google OAuth + Credentials sign-in)

### Posts

**`GET /api/posts`** — List published posts
```
Query: page (default 1), limit (default 10), tag, sort (latest|trending),
       feed (following), userId (for like/bookmark status)
Response: { data: Post[], total, page, totalPages }
Cache: public, max-age=60 (when no userId)
```

**`POST /api/posts`** — Create post
```json
// Auth required
// Request: { title, slug, content, excerpt?, published?, tags?: string[] }
// Response 201: PostWithAuthor
// Side effects: upsert tags, notify followers if published
```

**`GET /api/posts/[id]`** — Get single post by ID
```
Response: PostWithAuthor (tags flattened, includes _count)
```

**`PATCH /api/posts/[id]`** — Update post (author only)
```json
// Auth required, author check
// Request: { title?, slug?, content?, excerpt?, published?, tags?: string[] }
// Side effects: notify followers on first publish, cleanup orphan R2 images
```

**`DELETE /api/posts/[id]`** — Delete post (author only)
```
Response: { success: true }
// Also deletes R2 images for the post
```

**`POST /api/posts/[id]/images`** — Upload post image (author only)
```
// FormData: file (image/jpeg|png|gif|webp, max 10MB)
// Response 201: { url, key }
```

**`POST /api/posts/[id]/discard`** — Discard draft changes
```json
// Auth required, author check
// Request: { urls?: string[], deletePost?: boolean }
// Deletes orphan R2 images. If deletePost=true, deletes post (only if unpublished)
```

### Likes

**`POST /api/likes`** — Like a post
```json
// Auth required
// Request: { postId }
// Creates notification (POST_LIKE) to post author
```

**`DELETE /api/likes`** — Unlike a post
```json
// Auth required
// Request: { postId }
```

### Bookmarks

**`GET /api/bookmarks`** — List current user's bookmarks
```
// Auth required
Response: PostWithAuthor[] (includes isBookmarked: true)
```

**`POST /api/bookmarks`** — Bookmark a post
```json
// Auth required
// Request: { postId }
```

**`DELETE /api/bookmarks`** — Remove bookmark
```json
// Auth required
// Request: { postId }
```

### Comments

**`POST /api/comments`** — Create comment
```json
// Auth required
// Request: { content, postId, parentId? }
// Creates notification (COMMENT_REPLY) to parent comment author
```

**`PATCH /api/comments`** — Update comment (author only)
```json
// Auth required
// Request: { id, content }
```

**`DELETE /api/comments`** — Delete comment (author only)
```json
// Auth required
// Request: { id }
```

### Users

**`GET /api/users/[id]`** — Get user profile with posts + stats
```
Response: { user: SafeUser, posts: PostWithAuthor[], stats: { totalPosts, totalLikes } }
```

**`PATCH /api/users/[id]`** — Update profile (self only)
```
// Auth required (user.id === id)
// FormData: avatar (File), bio (string)
// Cleans up old avatar from R2
```

### Follows

**`POST /api/users/[id]/follow`** — Follow user
```
Creates notification (NEW_FOLLOWER) to target user
Response: { following: true, followerCount }
```

**`DELETE /api/users/[id]/follow`** — Unfollow user
```
Response: { following: false, followerCount }
```

### Notifications

**`GET /api/notifications`** — List notifications
```
Query: unread (0|1), limit (default 20, max 50)
Response: { unreadCount, notifications: SerializedNotification[] }
```

**`PATCH /api/notifications`** — Mark as read
```json
// Request: { markAllRead: true } | { ids: string[] }
// Response: { success: true, unreadCount }
```

### Search

**`GET /api/search`** — Full-text search across posts
```
Query: q (required), page, limit, sort (latest|trending), tag
Searches: title, excerpt, content, author name, tag name
Case-insensitive contains matching
Response: { data: PostCardData[], total, page, totalPages }
Cache: public, max-age=60 (when not authenticated)
```

### Tags

**`GET /api/tags`** — List tags with published post counts
```
Query: q (filter), limit (default 10, max 100)
Response: { id, name, count }[]
Cache: public, max-age=60
```

### Upload

**`POST /api/upload`** — **Disabled** (returns 410 Gone). Use post-specific endpoints.

## 6. Component Tree

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| `MainShell` | `layout/main-shell.tsx` | Wraps main pages with Header + Footer + Skip-to-content |
| `Header` | `layout/header.tsx` | Site nav + SearchBar + NotificationBell + ThemeToggle + user menu |
| `Footer` | `layout/footer.tsx` | Simple site footer |
| `LoadingProvider` | `providers/loading-provider.tsx` | Global loading state management |

### Page Components

| Page | Component | Key Sub-components |
|------|-----------|-------------------|
| Home | `HomePage` (server) | `HomeFeedTabs`, `TrendingItem` |
| Post Detail | `PostDetailPage` (server) | `ArticleWithToc`, `LikeButton`, `BookmarkButton`, `ShareButton`, `CommentList`, `RelatedPosts`, `FollowButton`, `DeleteDraftButton` |
| Profile | `ProfilePage` (server) | `AvatarUpload`, `PostCard`, `DraftCard`, `FollowButton` |
| Editor (New) | `PostEditor` (client) | `EditorBody`, `EditorToolbar`, `EditorSaveStatus`, `EditorImageGallery`, `MarkdownPreview` (dynamic) |
| Editor (Edit) | `PostEditor` | Same as new |
| Search | `SearchContent` (client) | `SearchBar`, `PostCard` |
| Tags | `TagsContent` (client) | Tag list + post list |
| Drafts | `DraftsPage` (server) | `DraftCard` |
| Saved | `SavedPage` (server) | `SavedPostCard` |

### Shared Components

| Component | File | Notes |
|-----------|------|-------|
| `PostCard` | `post/post-card.tsx` | Published article card (React.memo) |
| `DraftCard` | `post/draft-card.tsx` | Draft summary card (React.memo) |
| `SavedPostCard` | `post/saved-post-card.tsx` | Bookmarked post card |
| `TrendingItem` | `post/trending-item.tsx` | Trending sidebar item |
| `PostCardSkeleton` | `post/post-card-skeleton.tsx` | Loading placeholder |
| `PublishedArticleCard` | `post/published-article-card.tsx` | Inline article card |
| `PostList` | `post/post-list.tsx` | Post list with load-more |
| `PostFeed` | `post/post-feed.tsx` | Client-side feed (infinite scroll or tabs) |
| `LikeButton` | `like/like-button.tsx` | Optimistic like/unlike |
| `BookmarkButton` | `bookmark/bookmark-button.tsx` | Optimistic bookmark toggle |
| `ShareButton` | `post/share-button.tsx` | Copy link or native share |
| `FollowButton` | `user/follow-button.tsx` | Follow/unfollow toggle |
| `UserAvatar` | `user/user-avatar.tsx` | Avatar with fallback initials |
| `AvatarUpload` | `profile/avatar-upload.tsx` | Avatar with click-to-upload |
| `CommentList` | `comment/comment-list.tsx` | Nested comments (replies thread) |
| `RelatedPosts` | `post/related-posts.tsx` | Tag-ranked related articles |
| `ArticleWithToc` | `post/article-with-toc.tsx` | Article body + sticky TOC sidebar |
| `HomeFeedTabs` | `home/home-feed-tabs.tsx` | "Latest" / "Following" tabs on homepage |
| `SearchBar` | `search/search-bar.tsx` | Autocomplete search input |
| `LibraryTabs` | `library/library-tabs.tsx` | Tabs for saved/drafts |
| `DeleteDraftButton` | `post/delete-draft-button.tsx` | Confirm + delete draft/published |
| `EditorBody` | `post/editor-body.tsx` | Block-based text editor |
| `EditorToolbar` | `post/editor-toolbar.tsx` | Formatting toolbar |
| `EditorSaveStatus` | `post/editor-save-status.tsx` | "Saved" / "Unsaved" indicator |
| `EditorImageGallery` | `post/editor-image-gallery.tsx` | Inserted images in editor |
| `MarkdownPreview` | `post/markdown-preview.tsx` | Rendered Markdown (dynamic import) |
| `NotificationBell` | `notifications/notification-bell.tsx` | Bell icon with unread count |
| `ThemeToggle` | `theme/theme-toggle.tsx` | Dark/light mode toggle |
| `LoadingOverlay` | `ui/loading-overlay.tsx` | Full-screen loading overlay |
| `MainPageSkeleton` | `layout/main-page-skeleton.tsx` | Skeleton for main content area |

### UI Primitives (Radix-based)

All under `src/components/ui/`: `button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `badge.tsx`, `avatar.tsx`, `skeleton.tsx`, `separator.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `toast.tsx`, `toaster.tsx`, `use-toast.ts`

## 7. Routing Map

| Path | Type | Auth | ISR | Description |
|------|------|------|-----|-------------|
| `/` | SSR | No | 60s | Homepage (latest/trending/following) |
| `/login` | Static | No | — | Sign in |
| `/register` | Static | No | — | Sign up |
| `/post/[slug]` | SSR | No | 3600s | Article detail |
| `/post/new` | Dynamic | Yes | — | New post editor |
| `/edit/[slug]` | Dynamic | Yes | — | Edit post (force-dynamic) |
| `/profile/[id]` | SSR | No | 300s | User profile |
| `/search` | Client | No | — | Search page |
| `/tags` | Client | No | — | Browse tags |
| `/tag/[tag]` | SSR | No | 300s | Posts by tag |
| `/drafts` | SSR | Yes | — | Draft list |
| `/saved` | SSR | Yes | — | Bookmarked posts |
| `/sitemap.xml` | Dynamic | No | — | SEO sitemap |
| `/robots.txt` | Static | No | — | Robots rules |
| `/feed.xml` | Dynamic | No | — | RSS feed |

## 8. Performance Optimizations Applied

| ID | Item | Status | Impact |
|----|------|--------|--------|
| 1.1 | `next/font` replaces CSS `@import` Google Fonts | ✅ | Reduces FCP, CLS; self-hosts fonts, adds `display:swap` |
| 1.2 | Dynamic import `MarkdownPreview` in editor via `next/dynamic` | ✅ | Cuts ~50KB from initial editor bundle |
| 1.3 | Dynamic import `EditorBody` via `next/dynamic` | ✅ | Deferred editor heavy component |
| 1.4 | `React.memo` on `PostCard`, `DraftCard`, `CommentItem` | ✅ | Prevents unnecessary re-renders in lists |
| 1.5 | `loading="lazy"` on `<img>` elements | ✅ | Defers offscreen image loading |
| 1.6 | `content-visibility: auto` on list items | ✅ | Reduces render work for items outside viewport |
| 1.7 | Deduplicated `highlight.js` CSS to root layout | ✅ | Single CSS import, removed from editor |
| 1.8 | Removed unused deps (`react-hook-form`, `zod`, `@hookform/resolvers`) | ✅ | Saves ~30KB bundle |
| 1.9 | Removed unused imports | ✅ | Cleaner code |
| 2.1 | ISR with `revalidate` on content pages | ✅ | Reduces DB load ~90% for cached pages |
| 2.2 | Drafts page excludes `content` from Prisma select | ✅ | Avoids fetching large TEXT field |
| 2.3 | `Cache-Control` headers on GET API endpoints | ✅ | Enables CDN/proxy caching for anonymous requests |
| 2.4 | Database indexes on `Post` (published+createdAt, published+viewCount, authorId+published), `Comment` (postId+createdAt, parentId) | ✅ | Faster queries on large datasets |
| 2.5 | Optimistic updates for like/bookmark | ✅ | Instant UI feedback, fallback to refresh |
| 3.1 | `snapshotsEqual` deep compare with early exit | ✅ | Faster dirty-check in editor autosave |
| 4.1 | Server-side input size validation | ✅ | Prevents oversized content in DB |
| 4.2 | Prisma `$transaction` for tag operations | ✅ | Atomic tag updates |
| 6.1 | Skip-to-content link for keyboard users | ✅ | Accessibility |
| 6.2 | `loading.tsx` for route segments (main, saved, post detail) | ✅ | Skeleton loading UX |
| 6.3 | Empty comment section prompt for unauthenticated users | ✅ | Better UX |
| 7.5 | `generateMetadata` checks tag existence | ✅ | Prevents crashes |
| 7.6 | R2 remote pattern in `next.config.js` | ✅ | Allows next/image optimization for R2 images |

## 9. UI/UX Patterns

### Design System
- **Color scheme**: Warm amber tone (HSL 22 55% 52% primary), light/dark mode via CSS variables + `next-themes`
- **Typography**: Be Vietnam Pro (body, 400-700), Plus Jakarta Sans (headings, 500-800), JetBrains Mono (code)
- **Border radius**: `0.625rem` base
- **Container**: Max 1120px, centered, 1.5rem padding

### Animations
- Fade-in + translateY on page load (staggered via `animation-delay`)
- Shimmer loading placeholders
- Scale-in for modals
- Float animation for decorative elements
- `prefers-reduced-motion` disables all animations

### Post Editor (Medium-style)
- Block-based paragraph editing with inline image blocks
- Image paste from clipboard (handles Windows screenshots, mobile)
- Drag-and-drop image upload
- Autosave with snapshot diffing (`unsaved` / `saving` / `saved` / `error`)
- Slug auto-generation from title with random suffix
- Empty draft detection (ignores "Untitled" + no content)
- Debounced server persistence (1.5s)
- Markdown preview via dynamic import (click to toggle)
- Image gallery panel with delete + retry
- Orphan image cleanup on discard

### Article Display
- Sticky Table of Contents sidebar (auto-generated from h1-h3)
- Article-level JSON-LD structured data
- Open Graph + Twitter Card meta tags
- Canonical URLs, RSS feed, sitemap
- Related posts by tag overlap (fallback: more from author)
- View counter with duplicate detection (IP + UA hash, skips prefetch)

### Notifications
- 4 types: `COMMENT_REPLY`, `POST_LIKE`, `NEW_FOLLOWER`, `NEW_POST`
- In-app bell icon with unread count
- Click navigates to relevant post/profile
- "Mark all read" capability
- Fetch notifications paginated (30 per page)

### Social Features
- Like: optimistic UI, creates notification to post author
- Bookmark: optimistic toggle, listed in `/saved`
- Comment: threaded replies, notification to parent commenter
- Follow: creates notification, powers "Following" feed tab

### Accessibility
- Skip-to-content link (visible on focus)
- Focus rings on interactive elements (`focus-visible:ring-2`)
- ARIA labels on icon buttons (tag remove, etc.)
- Toast notifications with `role="alert"` / `role="status"`
- Escape key closes mobile menu
- Custom dialog replaces `confirm()` for destructive actions
- Semantic heading hierarchy in article

## 10. Deployment & Environment

### Environment Variables

```
DATABASE_URL           — PostgreSQL connection string (Neon)
NEXTAUTH_URL           — App origin (e.g., http://localhost:3000)
NEXTAUTH_SECRET        — NextAuth encryption key
GOOGLE_CLIENT_ID       — Google OAuth client ID
GOOGLE_CLIENT_SECRET   — Google OAuth client secret
R2_ACCOUNT_ID          — Cloudflare R2 account ID
R2_ACCESS_KEY_ID       — R2 S3 API access key
R2_SECRET_ACCESS_KEY   — R2 S3 API secret key
R2_BUCKET_NAME         — R2 bucket name (default: knowledge-sharing)
R2_PUBLIC_URL          — R2 public URL (optional, for custom domain)
```

### Build & Run

```bash
npm run dev           # Next.js dev server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint check
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to DB (dev)
npx prisma migrate dev  # Create migration
npx prisma studio     # DB GUI
npx prisma db seed    # Run seed script
```

### Build Configuration
- `next.config.js`: Image remote patterns (GitHub, Google, Unsplash, R2), `serverExternalPackages: ["@aws-sdk/client-s3"]`
- Image optimization allowed: GitHub avatars, Google avatars, Unsplash, any R2 subdomain

## 11. File Index

### Source Files Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (fonts, providers, CSS)
│   ├── providers.tsx               # Session + Theme + Loading providers
│   ├── not-found.tsx               # 404 page
│   ├── globals.css                 # Tailwind + CSS variables + animations
│   ├── sitemap.ts                  # Dynamic sitemap generation
│   ├── robots.ts                   # Robots.txt rules
│   ├── (auth)/
│   │   ├── layout.tsx              # Auth layout (no shell)
│   │   ├── login/page.tsx          # Sign-in page
│   │   └── register/page.tsx       # Registration page
│   ├── (main)/
│   │   ├── layout.tsx              # → MainShell
│   │   ├── loading.tsx             # Skeleton loading
│   │   ├── page.tsx                # Homepage (ISR 60s)
│   │   ├── drafts/page.tsx         # Draft list
│   │   ├── saved/page.tsx          # Bookmarked posts
│   │   ├── saved/loading.tsx       # Skeleton
│   │   ├── post/[slug]/page.tsx    # Article detail (ISR 3600s)
│   │   ├── post/[slug]/loading.tsx # Loading state
│   │   ├── post/new/page.tsx       # New post editor
│   │   ├── edit/[slug]/page.tsx    # Edit post (force-dynamic)
│   │   ├── profile/[id]/page.tsx   # Profile (ISR 300s)
│   │   ├── search/page.tsx         # Search page
│   │   ├── search/search-content.tsx  # Client search logic
│   │   ├── tags/page.tsx           # Tags browser
│   │   ├── tags/tags-content.tsx   # Client tags logic
│   │   └── tag/[tag]/page.tsx      # Posts by tag (ISR 300s)
│   ├── feed.xml/route.ts           # RSS feed
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts   # NextAuth handler
│       │   └── register/route.ts        # Credential registration
│       ├── posts/
│       │   ├── route.ts                 # List + create posts
│       │   ├── [id]/route.ts            # Get/update/delete post
│       │   ├── [id]/images/route.ts     # Upload post image
│       │   └── [id]/discard/route.ts    # Discard draft
│       ├── likes/route.ts               # Like/unlike post
│       ├── bookmarks/route.ts           # List/create/delete bookmarks
│       ├── comments/route.ts            # Create/update/delete comments
│       ├── notifications/route.ts       # List/mark-read notifications
│       ├── search/route.ts              # Full-text search
│       ├── tags/route.ts                # List tags with counts
│       ├── upload/route.ts              # Disabled (410)
│       └── users/
│           ├── [id]/route.ts            # Get/update user profile
│           └── [id]/follow/route.ts     # Follow/unfollow
├── components/
│   ├── bookmark/bookmark-button.tsx
│   ├── comment/comment-list.tsx
│   ├── home/home-feed-tabs.tsx
│   ├── layout/
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   ├── main-page-skeleton.tsx
│   │   └── main-shell.tsx
│   ├── library/library-tabs.tsx
│   ├── like/like-button.tsx
│   ├── notifications/notification-bell.tsx
│   ├── post/
│   │   ├── article-with-toc.tsx
│   │   ├── delete-draft-button.tsx
│   │   ├── draft-card.tsx
│   │   ├── editor-body.tsx
│   │   ├── editor-image-gallery.tsx
│   │   ├── editor-save-status.tsx
│   │   ├── editor-toolbar.tsx
│   │   ├── markdown-components.tsx   # Standalone markdown render components
│   │   ├── markdown-preview.tsx      # Dynamic imported preview
│   │   ├── post-card.tsx
│   │   ├── post-card-skeleton.tsx
│   │   ├── post-editor.tsx
│   │   ├── post-feed.tsx
│   │   ├── post-list.tsx
│   │   ├── published-article-card.tsx
│   │   ├── related-posts.tsx
│   │   ├── saved-post-card.tsx
│   │   ├── share-button.tsx
│   │   └── trending-item.tsx
│   ├── profile/avatar-upload.tsx
│   ├── providers/loading-provider.tsx
│   ├── search/search-bar.tsx
│   ├── theme/theme-toggle.tsx
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── loading-overlay.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── use-toast.ts
│   └── user/
│       ├── follow-button.tsx
│       └── user-avatar.tsx
├── lib/
│   ├── auth.ts              # NextAuth config, getCurrentUser, getSession
│   ├── db.ts                # Prisma client singleton
│   ├── image-upload.ts      # Image validation, normalization (handles mobile, paste)
│   ├── markdown-blocks.ts   # Block editor logic (paragraphs ↔ markdown, image blocks)
│   ├── markdown.ts          # ReactMarkdown render helper
│   ├── notifications.ts     # CRUD + helpers for notifications
│   ├── post-editor-utils.ts # Editor snapshot diff, URL parsing, draft helpers
│   ├── post-queries.ts      # Shared Prisma includes + formatting
│   ├── post-views.ts        # View recording with dedup (IP+UA hash, skip prefetch)
│   ├── r2.ts                # Cloudflare R2 S3 client (upload, delete, cleanup, signed URLs)
│   ├── related-posts.ts     # Tag-overlap ranking with unstable_cache
│   ├── scroll-to-heading.ts # Smooth scroll helper with offset
│   ├── site-url.ts          # Canonical URL resolver
│   └── utils.ts             # cn(), slugify(), formatDate(), timeAgo(), readingTime()
└── types/index.ts           # PostWithAuthor, CommentWithAuthor, PostCardData, SearchResult, PaginatedResponse
```

### Config Files

- `next.config.js` — Image remote patterns, server external packages
- `tailwind.config.ts` — Theme extensions, animations, container
- `postcss.config.js` — Tailwind + autoprefixer
- `tsconfig.json` — Path alias `@/ → ./src/*`
- `.env.example` — Environment variable template
- `prisma/schema.prisma` — Data model
- `package.json` — Scripts + dependencies

## 12. Development Workflow

### Adding a Feature

1. Add Prisma model/migration (`prisma/schema.prisma` → `npx prisma migrate dev`)
2. Create API route in `src/app/api/` (if needed)
3. Create server component or client component in `src/components/`
4. Add page route in `src/app/`
5. Export types from `src/types/` as needed
6. Add necessary indexes for query performance
7. Add `revalidate` export for ISR on content pages

### Code Conventions

- Server components by default; add `"use client"` only when interactivity needed
- API routes use `getCurrentUser()` for auth checks
- Prisma queries use `postListInclude(userId?)` + `formatPostListItem()` for consistent post formatting
- Tailwind classes via `cn()` utility from `clsx` + `tailwind-merge`
- Font variables via CSS custom properties set by `next/font`
- Avoid `JSON.stringify` comparison; use `snapshotsEqual()` from `post-editor-utils`
- Use `React.memo` on list item components
- Use `next/dynamic` with `{ssr: false}` for heavy editor-only components
- Use `unstable_cache` from `next/cache` for expensive data (related posts)
