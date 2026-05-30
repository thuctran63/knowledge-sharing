# Optimization Plan — Knowledge Sharing Platform

> **Stack:** Next.js 15 · PostgreSQL (Neon) · Cloudflare R2 · Prisma 5 · NextAuth.js v4  
> **Mục tiêu:** Cải thiện UI/UX, performance và khả năng maintain mà không thay đổi tech stack

---

## Mục lục

1. [UI/UX Improvements](#1-uiux-improvements)
2. [Performance](#2-performance)
3. [Code Organization](#3-code-organization)
4. [Thứ tự triển khai](#4-thứ-tự-triển-khai)

---

## 1. UI/UX Improvements

### 1.1 Reading Progress Bar + Read Time

**Vấn đề:** `readingTime()` đã có trong `utils.ts` nhưng chưa được hiển thị tốt. Không có progress indicator khi đọc bài dài.

**Giải pháp:**

Tạo component `ReadingProgress` dùng `IntersectionObserver` + `scroll` event:

```tsx
// src/components/post/reading-progress.tsx
"use client";
import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const total = scrollHeight - clientHeight;
      setProgress(total > 0 ? (scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 z-50 h-[2px] bg-primary transition-all duration-75"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  );
}
```

Thêm vào `post/[slug]/page.tsx` và hiển thị read time gần title:

```tsx
<div className="flex items-center gap-3 text-sm text-muted-foreground">
  <span>{readingTime(post.content)} phút đọc</span>
  <span>·</span>
  <span>{formatDate(post.createdAt)}</span>
</div>
```

---

### 1.2 Empty States có CTA rõ ràng

**Vấn đề:** `/drafts`, `/saved`, và "Following" feed khi trống hiển thị blank page — trải nghiệm tệ cho user mới.

**Giải pháp:** Tạo component `EmptyState` tái sử dụng:

```tsx
// src/components/ui/empty-state.tsx
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          {description}
        </p>
      </div>
      {action && (
        <Button asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
```

Sử dụng cho từng page:

```tsx
// drafts/page.tsx — khi không có draft nào
<EmptyState
  icon={FileText}
  title="Chưa có bài nháp"
  description="Bắt đầu viết bài đầu tiên của bạn ngay hôm nay."
  action={{ label: 'Viết bài mới', href: '/post/new' }}
/>

// saved/page.tsx
<EmptyState
  icon={Bookmark}
  title="Chưa lưu bài nào"
  description="Bookmark những bài hay để đọc lại sau."
  action={{ label: 'Khám phá bài viết', href: '/' }}
/>

// HomeFeedTabs — Following tab khi chưa follow ai
<EmptyState
  icon={Users}
  title="Chưa theo dõi ai"
  description="Theo dõi các tác giả bạn yêu thích để xem bài viết mới của họ tại đây."
  action={{ label: 'Khám phá tác giả', href: '/tags' }}
/>
```

---

### 1.3 Optimistic Update cho Comment

**Vấn đề:** Like/bookmark đã có optimistic update, nhưng submit comment vẫn phải chờ server response mới hiển thị — tạo cảm giác chậm.

**Giải pháp:** Dùng pattern tương tự như `LikeButton` cho `CommentList`:

```tsx
// src/components/comment/comment-list.tsx — thêm optimistic submit
const [optimisticComments, setOptimisticComments] = useState(comments);

async function handleSubmit(content: string) {
  // Thêm comment tạm thời ngay lập tức
  const tempComment: CommentWithAuthor = {
    id: `temp-${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
    author: currentUser,
    parentId: null,
    replies: [],
  };
  setOptimisticComments((prev) => [tempComment, ...prev]);

  try {
    const res = await fetch("/api/comments", {
      method: "POST",
      body: JSON.stringify({ content, postId, parentId }),
    });
    const real = await res.json();
    // Thay temp bằng real data từ server
    setOptimisticComments((prev) =>
      prev.map((c) => (c.id === tempComment.id ? real : c)),
    );
  } catch {
    // Rollback nếu lỗi
    setOptimisticComments((prev) =>
      prev.filter((c) => c.id !== tempComment.id),
    );
    toast({ title: "Gửi bình luận thất bại", variant: "destructive" });
  }
}
```

---

### 1.4 Search: Debounce + Highlight Keyword

**Vấn đề:** SearchBar có autocomplete nhưng kết quả không highlight keyword — khó scan nhanh.

**Giải pháp:**

```tsx
// src/components/search/highlight-text.tsx
export function HighlightText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-primary/20 text-foreground rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
```

Thêm debounce vào `SearchBar` (tăng từ không có lên 300ms):

```tsx
// src/components/search/search-bar.tsx
import { useDebouncedCallback } from "use-debounce"; // hoặc implement thủ công

const handleSearch = useDebouncedCallback((value: string) => {
  router.push(`/search?q=${encodeURIComponent(value)}`);
}, 300);
```

---

### 1.5 Mobile Editor Toolbar — Viewport-Aware

**Vấn đề:** Block editor trên mobile bị soft keyboard che toolbar.

**Giải pháp:** Dùng `visualViewport` API:

```tsx
// src/components/post/editor-toolbar.tsx — thêm hook
useEffect(() => {
  if (typeof window === "undefined" || !window.visualViewport) return;

  const viewport = window.visualViewport;
  const reposition = () => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    // Đặt toolbar ngay trên keyboard
    const offset = window.innerHeight - viewport.height - viewport.offsetTop;
    toolbar.style.bottom = `${offset}px`;
  };

  viewport.addEventListener("resize", reposition);
  viewport.addEventListener("scroll", reposition);
  return () => {
    viewport.removeEventListener("resize", reposition);
    viewport.removeEventListener("scroll", reposition);
  };
}, []);
```

---

## 2. Performance

### 2.1 Virtual List / Cursor Pagination cho PostList

**Vấn đề:** Load-more tích lũy DOM nodes không giới hạn. Sau 50+ posts, scroll performance giảm đáng kể, đặc biệt trên mobile.

**Giải pháp A — Cursor-based pagination (đơn giản, ưu tiên):**

Thay `page`-based bằng `cursor`-based ở API:

```ts
// src/app/api/posts/route.ts
const cursor = searchParams.get("cursor"); // id của post cuối cùng
const posts = await prisma.post.findMany({
  where: { published: true },
  take: LIMIT + 1, // lấy thêm 1 để check hasMore
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  orderBy: { createdAt: "desc" },
  include: postListInclude(userId),
});
const hasMore = posts.length > LIMIT;
const data = posts.slice(0, LIMIT);
return NextResponse.json({
  data,
  nextCursor: hasMore ? data[data.length - 1].id : null,
});
```

**Giải pháp B — Virtual list với `@tanstack/virtual` (nếu cần infinite scroll thực sự):**

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

const rowVirtualizer = useVirtualizer({
  count: posts.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 180, // ước tính chiều cao mỗi PostCard
  overscan: 5,
});
```

---

### 2.2 Thay `<img>` bằng `next/image`

**Vấn đề:** Remote pattern R2 đã cấu hình trong `next.config.js` nhưng spec vẫn dùng `<img loading="lazy">` — bỏ phí AVIF/WebP auto-optimization và blur placeholder.

**Giải pháp:** Thay thế có chọn lọc:

```tsx
// PostCard — cover image
import Image from 'next/image'

// Trước
<img src={post.coverImage} loading="lazy" className="..." />

// Sau
<Image
  src={post.coverImage}
  alt={post.title}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
  className="object-cover"
  placeholder="blur"
  blurDataURL="data:image/png;base64,..." // generate khi upload lên R2
/>
```

Thêm `blurDataURL` khi upload ảnh lên R2:

```ts
// src/lib/r2.ts — thêm hàm generate blur placeholder
import sharp from "sharp";

export async function generateBlurDataUrl(buffer: Buffer): Promise<string> {
  const blurred = await sharp(buffer)
    .resize(10, 10, { fit: "inside" })
    .toBuffer();
  return `data:image/png;base64,${blurred.toString("base64")}`;
}
```

---

### 2.3 Fix N+1 Query trong Notification

**Vấn đề:** `GET /api/notifications` không có `include` rõ ràng trong spec — dễ gây N+1 query cho actor và post trong mỗi notification.

**Giải pháp:** Đảm bảo Prisma query có đủ `include`:

```ts
// src/lib/notifications.ts
const notifications = await prisma.notification.findMany({
  where: { userId, ...(unread ? { read: false } : {}) },
  orderBy: { createdAt: "desc" },
  take: limit,
  include: {
    actor: {
      select: { id: true, name: true, image: true }, // chỉ lấy field cần thiết
    },
    post: {
      select: { id: true, title: true, slug: true },
    },
  },
});
```

---

### 2.4 Tăng Autosave Debounce lên 2.5s

**Vấn đề:** Debounce 1.5s gây nhiều write requests khi user gõ nhanh. `snapshotsEqual()` đã kiểm tra dirty state, chỉ cần tăng delay.

```ts
// src/components/post/post-editor.tsx
const AUTOSAVE_DELAY = 2500; // tăng từ 1500ms lên 2500ms
```

---

### 2.5 PostView Table — TTL Cleanup

**Vấn đề:** `PostView` records tích lũy vô hạn. Sau 6 tháng có thể hàng triệu rows làm chậm query.

**Giải pháp A — Prisma cron job (đơn giản):**

```ts
// src/app/api/cron/cleanup/route.ts
// Gọi mỗi ngày qua Vercel Cron / GitHub Actions
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.postView.deleteMany({
    where: { viewedAt: { lt: thirtyDaysAgo } },
  });

  return NextResponse.json({ deleted: count });
}
```

**Giải pháp B — DB-level TTL (tốt hơn, cần Neon support):**

Neon hỗ trợ `pg_cron` extension:

```sql
SELECT cron.schedule(
  'cleanup-post-views',
  '0 3 * * *', -- chạy 3am mỗi ngày
  $$DELETE FROM "PostView" WHERE "viewedAt" < NOW() - INTERVAL '30 days'$$
);
```

---

### 2.6 Optimize R2 Image Cleanup

**Vấn đề:** Khi update/delete post, orphan images trên R2 được cleanup nhưng nếu cleanup thất bại thì không có retry.

**Giải pháp:** Tạo queue đơn giản với DB:

```prisma
// Thêm vào schema.prisma
model PendingDeletion {
  id        String   @id @default(cuid())
  r2Key     String
  createdAt DateTime @default(now())
  attempts  Int      @default(0)
}
```

```ts
// Thay vì delete ngay, queue lại
await prisma.pendingDeletion.create({ data: { r2Key: key } });

// Cron job retry
const pending = await prisma.pendingDeletion.findMany({
  where: { attempts: { lt: 3 } },
});
for (const item of pending) {
  try {
    await deleteFromR2(item.r2Key);
    await prisma.pendingDeletion.delete({ where: { id: item.id } });
  } catch {
    await prisma.pendingDeletion.update({
      where: { id: item.id },
      data: { attempts: { increment: 1 } },
    });
  }
}
```

---

## 3. Code Organization

### 3.1 Thêm Service Layer

**Vấn đề:** Business logic nằm thẳng trong `route.ts` — khó test, khó tái sử dụng, và dễ duplicate.

**Cấu trúc đề xuất:**

```
src/
├── app/api/
│   └── posts/
│       └── route.ts          ← chỉ: parse request → call service → return response
├── services/
│   ├── post.service.ts       ← createPost, updatePost, publishPost, deletePost
│   ├── notification.service.ts ← createNotification, markRead, getUnreadCount
│   ├── follow.service.ts     ← follow, unfollow, getFollowerCount
│   └── upload.service.ts     ← uploadToR2, deleteFromR2, cleanupOrphanImages
```

**Ví dụ refactor:**

```ts
// BEFORE: src/app/api/posts/route.ts (hiện tại)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  // ... 50+ dòng business logic ...
}

// AFTER: src/app/api/posts/route.ts
import { createPost } from "@/services/post.service";
import { createPostSchema } from "@/lib/validations/post";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = createPostSchema.safeParse(await req.json());
  if (!body.success) return apiError("Invalid input", 400, body.error);

  const post = await createPost(user.id, body.data);
  return NextResponse.json(post, { status: 201 });
}

// src/services/post.service.ts
export async function createPost(authorId: string, data: CreatePostInput) {
  const { tags, ...postData } = data;
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: { ...postData, authorId, slug: generateSlug(postData.title) },
    });
    if (tags?.length) {
      await upsertPostTags(tx, post.id, tags);
    }
    if (post.published) {
      await notifyFollowers(authorId, post.id);
    }
    return post;
  });
}
```

---

### 3.2 Validation Schema với Zod (API Layer Only)

**Vấn đề:** Validation thủ công trong mỗi route — inconsistent, thiếu type safety, dễ bỏ sót case.

> **Lưu ý:** Không cần thêm lại Zod cho frontend. Chỉ dùng ở API layer.

**Cài đặt:**

```bash
npm install zod
```

**Tổ chức:**

```
src/lib/validations/
├── post.ts
├── comment.ts
├── user.ts
└── common.ts    ← shared schemas (pagination, id, etc.)
```

**Ví dụ:**

```ts
// src/lib/validations/post.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  content: z.string().min(1).max(100000),
  excerpt: z.string().max(500).optional(),
  published: z.boolean().optional().default(false),
  tags: z.array(z.string().min(1).max(50)).max(5).optional(),
});

export const updatePostSchema = createPostSchema.partial();
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// src/lib/validations/common.ts
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
```

---

### 3.3 Unified API Error Handler

**Vấn đề:** Mỗi route trả error theo format riêng — frontend phải đoán structure.

**Giải pháp:**

```ts
// src/lib/api-error.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function apiError(
  message: string,
  status: number,
  code?: ApiErrorCode,
  details?: unknown,
) {
  return NextResponse.json({ error: message, code, details }, { status });
}

// Helper cho Zod errors
export function validationError(error: ZodError) {
  return apiError(
    "Validation failed",
    400,
    "VALIDATION_ERROR",
    error.flatten(),
  );
}

// Helper cho try/catch trong route
export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) return validationError(error);
  console.error(error);
  return apiError("Internal server error", 500, "INTERNAL_ERROR");
}
```

---

### 3.4 Custom Hooks Tái Sử Dụng

**Vấn đề:** `LikeButton`, `BookmarkButton`, `FollowButton` có cùng pattern optimistic update nhưng duplicate code.

**Giải pháp:** Generic hook:

```ts
// src/hooks/use-optimistic-toggle.ts
"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UseOptimisticToggleOptions<T> {
  initial: T;
  onToggle: (current: T) => Promise<T>;
  onError?: (error: unknown) => void;
}

export function useOptimisticToggle<T>({
  initial,
  onToggle,
  onError,
}: UseOptimisticToggleOptions<T>) {
  const [state, setState] = useState(initial);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  async function toggle() {
    if (isPending) return;
    const previous = state;
    setIsPending(true);

    // Optimistic update
    const optimistic = await Promise.resolve(onToggle(state)).catch((err) => {
      setState(previous); // rollback
      onError?.(err);
      toast({ title: "Có lỗi xảy ra, thử lại sau.", variant: "destructive" });
      return previous;
    });

    setState(optimistic);
    setIsPending(false);
  }

  return { state, toggle, isPending };
}
```

**Sử dụng:**

```tsx
// src/components/like/like-button.tsx
const { state, toggle, isPending } = useOptimisticToggle({
  initial: { liked: isLiked, count: likeCount },
  onToggle: async (current) => {
    const method = current.liked ? "DELETE" : "POST";
    await fetch("/api/likes", { method, body: JSON.stringify({ postId }) });
    return {
      liked: !current.liked,
      count: current.count + (current.liked ? -1 : 1),
    };
  },
});
```

---

### 3.5 Barrel Exports cho Components

**Vấn đề:** Import paths dài và fragile, ví dụ `../../components/post/post-card`.

**Giải pháp:** Thêm `index.ts` cho mỗi component group:

```ts
// src/components/post/index.ts
export { PostCard } from "./post-card";
export { DraftCard } from "./draft-card";
export { SavedPostCard } from "./saved-post-card";
export { PostFeed } from "./post-feed";
export { PostList } from "./post-list";
export { TrendingItem } from "./trending-item";
export { ArticleWithToc } from "./article-with-toc";
export { RelatedPosts } from "./related-posts";
export { ShareButton } from "./share-button";
export { DeleteDraftButton } from "./delete-draft-button";

// src/components/ui/index.ts
export { Button } from "./button";
export { Card, CardContent, CardHeader } from "./card";
export { Input } from "./input";
export { Badge } from "./badge";
export { EmptyState } from "./empty-state";
// ...

// src/hooks/index.ts
export { useOptimisticToggle } from "./use-optimistic-toggle";
```

**Import gọn hơn:**

```tsx
// Trước
import { PostCard } from "../../components/post/post-card";
import { Button } from "../../components/ui/button";

// Sau
import { PostCard } from "@/components/post";
import { Button } from "@/components/ui";
```

---

### 3.6 Tổ chức Types tốt hơn

**Vấn đề:** Tất cả types gom vào `src/types/index.ts` — sẽ rất khó navigate khi project lớn.

**Giải pháp:** Tách theo domain:

```
src/types/
├── api.ts         ← PaginatedResponse, ApiError, ApiErrorCode
├── post.ts        ← PostWithAuthor, PostCardData, SearchResult, PostSnapshot
├── user.ts        ← SafeUser, UserWithStats
├── notification.ts ← SerializedNotification
└── index.ts       ← re-export tất cả (giữ backward compat)
```

---

## 4. Thứ tự triển khai

### Sprint 1 — Nền tảng (tuần 1–2)

Ưu tiên các thay đổi ảnh hưởng lớn, ít risk:

| #   | Việc cần làm                  | File(s) thay đổi                      | Effort |
| --- | ----------------------------- | ------------------------------------- | ------ |
| 1   | Zod validation cho API routes | `src/lib/validations/*`               | S      |
| 2   | Unified `apiError()` helper   | `src/lib/api-error.ts`                | S      |
| 3   | Fix N+1 query notification    | `src/lib/notifications.ts`            | S      |
| 4   | Tăng autosave debounce → 2.5s | `src/components/post/post-editor.tsx` | XS     |
| 5   | `EmptyState` component        | `src/components/ui/empty-state.tsx`   | S      |
| 6   | PostView cleanup cron         | `src/app/api/cron/cleanup/route.ts`   | S      |

### Sprint 2 — UI Polish (tuần 3–4)

| #   | Việc cần làm                  | File(s) thay đổi                           | Effort |
| --- | ----------------------------- | ------------------------------------------ | ------ |
| 7   | Reading progress bar          | `src/components/post/reading-progress.tsx` | S      |
| 8   | Optimistic comment submit     | `src/components/comment/comment-list.tsx`  | M      |
| 9   | Search keyword highlight      | `src/components/search/highlight-text.tsx` | S      |
| 10  | Mobile toolbar viewport-aware | `src/components/post/editor-toolbar.tsx`   | M      |
| 11  | Barrel exports                | `src/components/*/index.ts`                | S      |

### Sprint 3 — Refactor Core (tuần 5–6)

| #   | Việc cần làm                    | File(s) thay đổi                       | Effort |
| --- | ------------------------------- | -------------------------------------- | ------ |
| 12  | Service layer cho posts         | `src/services/post.service.ts`         | L      |
| 13  | Service layer cho notifications | `src/services/notification.service.ts` | M      |
| 14  | `useOptimisticToggle` hook      | `src/hooks/use-optimistic-toggle.ts`   | M      |
| 15  | Tách types theo domain          | `src/types/*`                          | S      |

### Sprint 4 — Performance Deep (tuần 7–8)

| #   | Việc cần làm                   | File(s) thay đổi                                          | Effort |
| --- | ------------------------------ | --------------------------------------------------------- | ------ |
| 16  | Cursor-based pagination API    | `src/app/api/posts/route.ts`                              | M      |
| 17  | Update PostList dùng cursor    | `src/components/post/post-list.tsx`                       | M      |
| 18  | Thay `<img>` bằng `next/image` | Nhiều components                                          | M      |
| 19  | R2 image deletion queue        | `schema.prisma`, `src/services/upload.service.ts`         | L      |
| 20  | `blurDataURL` khi upload       | `src/lib/r2.ts`, `src/app/api/posts/[id]/images/route.ts` | M      |

---

> **Effort scale:** XS < 1h · S 1–3h · M 3–8h · L 8–16h

---

## Checklist nhanh

### Trước khi merge mỗi sprint:

- [ ] Không có N+1 queries mới (kiểm tra với `prisma.$on('query', ...)` trong dev)
- [ ] Mọi API route mới dùng `apiError()` thay vì `NextResponse.json({ error })` thủ công
- [ ] Server components không có `'use client'` thừa
- [ ] Không có `console.log` trong production code
- [ ] ISR revalidate được set đúng cho content pages mới
- [ ] Empty state được handle cho mọi list/feed

### Câu hỏi để review:

1. Route này có cần auth không? → `getCurrentUser()` và check ngay đầu hàm
2. Query này có thể N+1 không? → Review `include` và `select` trong Prisma
3. Component này re-render khi nào? → Cân nhắc `React.memo` hoặc tách state
4. Page này có cần ISR không? → Content tĩnh hoặc ít thay đổi thì set `revalidate`
