# Performance Optimization Plan — Knowledge Sharing Platform

## Phase 0: Fix Broken Features (Critical)

### P0.1 — Missing API route `/api/posts/[id]/images`
- **File cần tạo**: `src/app/api/posts/[id]/images/route.ts`
- **Nội dung**: POST handler nhận FormData file, validate, upload lên R2, return `{ url }`
- **Tham khảo**: `src/lib/r2.ts:uploadPostImage()`, pattern từ `src/app/api/users/[id]/route.ts`

### P0.2 — Missing API route `/api/posts/[id]/discard`
- **File cần tạo**: `src/app/api/posts/[id]/discard/route.ts`
- **Nội dung**: POST handler nhận `{ urls: string[], deletePost: boolean }`, xóa ảnh orphan trên R2, nếu `deletePost=true` thì xóa post khỏi DB
- **Tham khảo**: `src/lib/r2.ts:deleteFileByUrl()`

---

## Phase 1: JavaScript Bundle & Rendering (High Impact / Low Effort)

### 1.1 — Dynamic import ReactMarkdown trong PostEditor
- **File**: `src/components/post/post-editor.tsx`
- **Hiện tại**: Dòng 5-8 import trực tiếp `ReactMarkdown`, `remark-gfm`, `rehype-highlight`, `rehype-slug` — bundle ~40KB gzipped
- **Sửa thành**:
```tsx
import dynamic from "next/dynamic";
const MarkdownPreview = dynamic(
  () => import("./markdown-preview"),
  { loading: () => <div className="animate-pulse h-48 rounded-xl bg-muted" /> }
);
```
- **Tách component mới**: `src/components/post/markdown-preview.tsx` chứa `MarkdownPreview`
- **Import động**: Chỉ tải khi user bấm "Preview" tab

### 1.2 — Dynamic import EditorBody
- **File**: `src/components/post/post-editor.tsx`
- **Hiện tại**: Import trực tiếp `EditorBody` dòng 52
- **Sửa thành**: `next/dynamic` import `EditorBody` — component này nặng do xử lý drag/drop, paste, nhiều handlers

### 1.3 — `<img>` thêm `loading="lazy"`
- **File**: `src/components/post/editor-body.tsx:175`
```tsx
<img src={displayUrl} alt={...} loading="lazy" ... />
```
- **File**: `src/lib/markdown.ts` (nếu có) và `src/components/post/post-card.tsx` (ảnh author avatar)
- **Avatar**: Thêm `loading="lazy"` trên `<img>` trong `UserAvatar`

### 1.4 — Content-visibility cho list items
- **File**: `src/app/(main)/page.tsx`, `src/app/(main)/drafts/page.tsx`, `src/app/(main)/profile/[id]/page.tsx`
- **Thêm class**: `content-visibility-auto` (via Tailwind hoặc style inline) cho mỗi PostCard/DraftCard wrapper
- Chỉ hoạt động khi list > 10 items

---

## Phase 2: Data Fetching & Caching (High Impact / Medium Effort)

### 2.1 — ISR cho Profile page
- **File**: `src/app/(main)/profile/[id]/page.tsx`
- **Hiện tại**: `export const dynamic = "force-dynamic"` ở dòng 1
- **Thay bằng**:
```tsx
export const revalidate = 300; // 5 phút
```
- Profile data (bio, stats, posts list) thay đổi không thường xuyên

### 2.2 — Drafts page bỏ `content` field khỏi select
- **File**: `src/app/(main)/drafts/page.tsx`
- **Hiện tại**: Select `content` trong Prisma query (dòng 38) — field TEXT có thể rất lớn
- **Sửa**: Bỏ `content` khỏi `select`. Nếu cần preview text, dùng `excerpt` hoặc substring từ content
- **Thay đổi**: Xóa `readingTime()` vì không có content. Hoặc tính reading time từ excerpt độ dài tương đương
```ts
select: {
  id: true, title: true, slug: true,
  excerpt: true, updatedAt: true,
}
```

### 2.3 — Thêm `Cache-Control` headers cho API GET endpoints
- **File**: `src/app/api/posts/route.ts`, `src/app/api/tags/route.ts`
- **Hiện tại**: Không set cache headers
- **Thêm** (cho GET không yêu cầu auth):
```ts
const headers = { "Cache-Control": "public, max-age=60, s-maxage=120" };
return NextResponse.json({ ... }, { headers });
```

### 2.4 — Thêm database indexes
- **File**: `prisma/schema.prisma`
- **Thêm index cho Post**:
```prisma
@@index([published, createdAt])
@@index([published, viewCount])
@@index([authorId, published])
```
- **Thêm index cho Comment**:
```prisma
@@index([postId, createdAt])
@@index([parentId])
```

---

## Phase 3: Ứng dụng Editor Post (Medium Impact / Medium Effort)

### 3.1 — Tối ưu `snapshotsEqual`
- **File**: `src/lib/post-editor-utils.ts`
- **Hiện tại**: `JSON.stringify(a) === JSON.stringify(b)` — O(n) với content lớn
- **Thay bằng**: deep compare với key ordering guarantee + early exit
```ts
export function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot) {
  if (a.title !== b.title) return false;
  if (a.content.length !== b.content.length) return false;
  if (a.content !== b.content) return false;
  if (a.excerpt !== b.excerpt) return false;
  if (a.published !== b.published) return false;
  if (a.tags.length !== b.tags.length) return false;
  return a.tags.every((t, i) => t === b.tags[i]);
}
```

### 3.2 — Giảm `useCallback` dependency explosion
- **File**: `src/components/post/post-editor.tsx`
- **Vấn đề**: `persistToServer` phụ thuộc quá nhiều state, khiến autosave effect re-run thường xuyên
- **Giải pháp**: Dùng `useRef` cho các giá trị cần thiết trong persist, chỉ trigger persist từ effect khi thực sự dirty
```tsx
const titleRef = useRef(title);
const blocksRef = useRef(blocks);
// sync trong useEffect riêng
useEffect(() => { titleRef.current = title; }, [title]);
```
- `persistToServer` chỉ phụ thuộc vào `[post, router, toast]`

### 3.3 — Debounce input cho title/excerpt
- **File**: `src/components/post/post-editor.tsx`
- **Hiện tại**: Mỗi lần gõ chữ đều update state → re-render toàn bộ tree
- **Thêm**: Chỉ debounce autosave trigger, không debounce state update (vẫn cần responsive UI)
- **Đã có**: `autosaveTimerRef` với 2000ms delay — OK. Chỉ cần check lại dependency flow

---

## Phase 4: Frontend UX Optimization (Medium Impact / Low Effort)

### 4.1 — CommentList optimistic updates
- **File**: `src/components/comment/comment-list.tsx`
- **Hiện tại**: `router.refresh()` sau POST/EDIT/DELETE — refetch toàn bộ server component
- **Sửa**: Dùng `useOptimistic` hook (React 19 built-in):
```tsx
const [optimisticComments, addOptimistic] = useOptimistic(
  comments,
  (state, newComment) => [...state, newComment]
);
```
- Chỉ gọi `router.refresh()` khi thất bại

### 4.2 — Google Fonts opt-in
- **File**: `src/app/globals.css`
- **Hiện tại**: `@import url(...)` ở dòng 5 — blocking render
- **Thay bằng**: `next/font` trong `src/app/layout.tsx`:
```tsx
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
```
- Xóa `@import` khỏi CSS

---

## Phase 5: Code Quality & Bundle Monitoring (Low Impact / Low Effort)

### 5.1 — Thêm `@next/bundle-analyzer`
- **Cài đặt**: `npm install -D @next/bundle-analyzer`
- **Cấu hình**: `next.config.js`
```js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
module.exports = withBundleAnalyzer(nextConfig);
```
- **Dùng**: `ANALYZE=true npm run build`

### 5.2 — Xóa unused imports
- **File**: `src/components/layout/header.tsx` — `FilePen` đã thêm nhưng cần kiểm tra unused icons
- **File**: `src/components/post/post-editor.tsx` — kiểm tra unused imports từ `lucide-react`

---

## Summary Table

| ID | Item | File(s) | Loại | Effort | Priority |
|----|------|---------|------|--------|----------|
| P0.1 | Missing `/images` route | `api/posts/[id]/images/route.ts` | Bug | 30min | 🔴 Critical |
| P0.2 | Missing `/discard` route | `api/posts/[id]/discard/route.ts` | Bug | 30min | 🔴 Critical |
| 1.1 | Dynamic import Markdown | `post-editor.tsx` | Bundle | 30min | 🔴 High |
| 1.2 | Dynamic import EditorBody | `post-editor.tsx` | Bundle | 15min | 🔴 High |
| 2.2 | Drafts bỏ content field | `drafts/page.tsx` | Query | 5min | 🟡 High |
| 1.3 | `loading="lazy"` ảnh | `editor-body.tsx`, `post-card.tsx` | Render | 5min | 🟡 High |
| 2.1 | ISR profile page | `profile/[id]/page.tsx` | Cache | 15min | 🟡 Medium |
| 2.4 | DB indexes | `schema.prisma` | DB | 15min | 🟡 Medium |
| 3.1 | Tối ưu snapshotsEqual | `post-editor-utils.ts` | Render | 15min | 🟡 Medium |
| 3.2 | Fix dependency explosion | `post-editor.tsx` | Render | 30min | 🟡 Medium |
| 4.1 | Optimistic comments | `comment-list.tsx` | UX | 1-2h | 🟢 Low |
| 2.3 | Cache-Control headers | API routes | Network | 15min | 🟢 Low |
| 4.2 | next/font | `layout.tsx`, `globals.css` | Font | 20min | 🟢 Low |
| 1.4 | content-visibility | Page listings | Render | 10min | 🟢 Low |
| 5.1 | Bundle analyzer | Config | Tool | 15min | 🟢 Low |
