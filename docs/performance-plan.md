# Performance & UI/UX Optimization Plan — Knowledge Sharing Platform

## Phase 0: Fix Broken Features (Critical — Phải Làm Ngay)

### P0.1 — Missing API route `/api/posts/[id]/images`
- **File cần tạo**: `src/app/api/posts/[id]/images/route.ts`
- **Nội dung**: POST handler nhận FormData file, validate, upload lên R2, return `{ url }`
- **Tham khảo**: `src/lib/r2.ts:uploadPostImage()`, pattern từ `src/app/api/users/[id]/route.ts`

### P0.2 — Missing API route `/api/posts/[id]/discard`
- **File cần tạo**: `src/app/api/posts/[id]/discard/route.ts`
- **Nội dung**: POST handler nhận `{ urls: string[], deletePost: boolean }`, xóa ảnh orphan trên R2, nếu `deletePost=true` thì xóa post khỏi DB
- **Tham khảo**: `src/lib/r2.ts:deleteFileByUrl()`

---

## Phase 1: JavaScript Bundle & Rendering (High Impact)

### 1.1 — `next/font` thay thế CSS `@import` Google Fonts
- **File**: `src/app/globals.css:5` → chuyển sang `src/app/layout.tsx`
- **Hiện tại**: `@import url(...)` — blocking render, external request, không font-display
- **Sửa**: Import Google Fonts qua `next/font/google`, tự host fonts, thêm `display: swap`
- **Tác động**: ✅ Giảm FCP, CLS, loại bỏ external request

### 1.2 — Dynamic import ReactMarkdown trong PostEditor
- **File**: `src/components/post/post-editor.tsx`
- **Hiện tại**: Import trực tiếp `ReactMarkdown`, `remark-gfm`, `rehype-highlight`, `rehype-slug` + `highlight.js CSS` vào client bundle (~50KB gzipped)
- **Sửa**: Dùng `next/dynamic` + `{ ssr: false }` cho MarkdownPreview, chỉ tải khi user bấm Preview
- **Tác động**: ✅ Giảm initial bundle size

### 1.3 — Dynamic import EditorBody
- **File**: `src/components/post/post-editor.tsx:52`
- **Hiện tại**: Import trực tiếp
- **Sửa**: `next/dynamic` — component này nặng (drag/drop, paste, nhiều handlers, image blocks)
- **Tác động**: ✅ Giảm initial bundle size

### 1.4 — Thêm `React.memo` cho components trong list
- **File**: `src/components/post/post-card.tsx`, `src/components/post/draft-card.tsx`, `src/components/comment/comment-list.tsx`
- **Hiện tại**: Mỗi lần parent re-render, toàn bộ list items re-render
- **Sửa**: Wrap components với `React.memo()`, callback props dùng `useCallback`
- **Tác động**: ✅ Giảm re-render không cần thiết

### 1.5 — `<img>` thêm `loading="lazy"`
- **File**: `src/components/post/editor-body.tsx:175`, `src/components/post/post-card.tsx`, `src/components/user/user-avatar.tsx`
- **Sửa**:
```tsx
<img src={displayUrl} alt={...} loading="lazy" ... />
```
- **Tác động**: ✅ Lazy load ảnh ngoài viewport

### 1.6 — Content-visibility cho list items
- **File**: `src/app/(main)/page.tsx`, `src/app/(main)/drafts/page.tsx`, `src/app/(main)/profile/[id]/page.tsx`
- **Thêm**: `content-visibility: auto` cho PostCard/DraftCard wrapper
- **Tác động**: ✅ Giảm render work cho items ngoài viewport

### 1.7 — Đồng bộ hóa `highlight.js` CSS import
- **File**: `src/app/(main)/post/[slug]/page.tsx:22` và `src/components/post/post-editor.tsx:57`
- **Hiện tại**: Import duplicate `highlight.js/styles/github-dark.css`
- **Sửa**: Import 1 lần trong root layout hoặc dynamic import trong editor
- **Tác động**: ✅ Tránh duplicate CSS

### 1.8 — Xóa unused dependencies
- **File**: `package.json:24,48,55` — `@hookform/resolvers`, `react-hook-form`, `zod`
- **Hiện tại**: Không được dùng trong codebase, vẫn nằm trong dependencies
- **Sửa**: `npm uninstall @hookform/resolvers react-hook-form zod`
- **Tác động**: ✅ Giảm bundle ~30KB+

### 1.9 — Xóa unused imports (`lucide-react`)
- **File**: `src/components/comment/comment-list.tsx:11` — `ChevronDown`, `ChevronRight`
- **Sửa**: Xóa import không dùng
- **Tác động**: ✅ Clean code

---

## Phase 2: Data Fetching & Caching (High Impact)

### 2.1 — ISR thay thế `force-dynamic` cho content pages
- **File**: `src/app/(main)/page.tsx:1`, `post/[slug]/page.tsx:1`, `tag/[tag]/page.tsx:1`, `profile/[id]/page.tsx:1`
- **Hiện tại**: `force-dynamic` — mỗi request query DB, không cache
- **Sửa**: Dùng `revalidate` cho content pages. Giữ `force-dynamic` cho drafts, edit
```tsx
export const revalidate = 60; // 1 phút cho homepage
export const revalidate = 300; // 5 phút cho profile, tag page
export const revalidate = 3600; // 1 giờ cho post detail
```
- **Tác động**: ✅ Giảm 90% database load

### 2.2 — Drafts page bỏ `content` field khỏi Prisma select
- **File**: `src/app/(main)/drafts/page.tsx:31-42`
- **Hiện tại**: Select cả `content` (TEXT field có thể >100KB) chỉ để tính `readingTime`
- **Sửa**: Bỏ `content` khỏi select, bỏ `readingTime()` hoặc tính từ độ dài excerpt
```ts
select: { id: true, title: true, slug: true, excerpt: true, updatedAt: true }
```
- **Tác động**: ✅ Giảm response size, tăng tốc query

### 2.3 — Thêm `Cache-Control` headers cho API GET endpoints
- **File**: `src/app/api/posts/route.ts`, `src/app/api/tags/route.ts`, `src/app/api/search/route.ts`
- **Thêm**: `Cache-Control: public, max-age=60, s-maxage=120`
- **Tác động**: ✅ CDN/proxy caching

### 2.4 — Thêm database indexes
- **File**: `prisma/schema.prisma`
- **Thêm**:
```prisma
model Post {
  @@index([published, createdAt])
  @@index([published, viewCount])
  @@index([authorId, published])
}
model Comment {
  @@index([postId, createdAt])
  @@index([parentId])
}
```
- **Tác động**: ✅ Tăng tốc query 10-100x trên dataset lớn

### 2.5 — `router.refresh()` → optimistic updates
- **File**: `src/components/like/like-button.tsx`, `bookmark/bookmark-button.tsx`, `comment/comment-list.tsx`
- **Hiện tại**: Mỗi mutation gọi `router.refresh()` — full page refetch
- **Sửa**: Optimistic update + chỉ gọi refresh khi thất bại
- **Tác động**: ✅ UX mượt hơn, giảm server load

---

## Phase 3: Post Editor Optimization (Medium Impact)

### 3.1 — Tối ưu `snapshotsEqual`
- **File**: `src/lib/post-editor-utils.ts:29-31`
- **Hiện tại**: `JSON.stringify(a) === JSON.stringify(b)` — O(n) mỗi lần check dirty
- **Sửa**: Deep compare với early exit
```ts
export function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot) {
  if (a.title !== b.title || a.content.length !== b.content.length) return false;
  if (a.content !== b.content || a.excerpt !== b.excerpt) return false;
  if (a.published !== b.published || a.tags.length !== b.tags.length) return false;
  return a.tags.every((t, i) => t === b.tags[i]);
}
```

### 3.2 — Giảm `useCallback` dependency explosion
- **File**: `src/components/post/post-editor.tsx`
- **Vấn đề**: `persistToServer` phụ thuộc `[title, blocks, excerpt, published, tags, post, router, toast, hasContent]` — dependency explosion
- **Sửa**: Dùng `useRef` cho state values trong persist, tách logic

### 3.3 — Cleanup ObjectURL để tránh memory leak
- **File**: `src/components/post/post-editor.tsx`
- **Kiểm tra**: `URL.revokeObjectURL()` đã được gọi đúng chỗ chưa (dòng 467)
- **Tác động**: ✅ Tránh memory leak

---

## Phase 4: API & Backend Optimization (Medium Impact)

### 4.1 — Server-side validation cho input size
- **Files**: `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`, `src/app/api/comments/route.ts`
- **Thêm**: Validation title ≤ 200, content ≤ 100000, tags ≤ 5, comment ≤ 5000
- **Tác động**: ✅ Bảo vệ DB khỏi input quá lớn

### 4.2 — Wrap tag operations trong Prisma transaction
- **File**: `src/app/api/posts/[id]/route.ts:86-99`
- **Hiện tại**: `deleteMany` + `createMany` không transaction — mất tags nếu crash
- **Sửa**: `prisma.$transaction()`

### 4.3 — Type check `formData.get("bio")`
- **File**: `src/app/api/users/[id]/route.ts:76`
- **Sửa**: Kiểm tra `typeof bio === "string"` trước khi gán

---

## Phase 5: Code Quality & Tooling (Low Impact)

### 5.1 — Thêm `@next/bundle-analyzer`
- **Cài đặt**: `npm install -D @next/bundle-analyzer`
- **Cấu hình** `next.config.js`:
```js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
module.exports = withBundleAnalyzer(nextConfig);
```
- **Dùng**: `ANALYZE=true npm run build`

### 5.2 — Cleanup unused imports
- **Kiểm tra toàn bộ**: `lucide-react` icons, các import khác

### 5.3 — Bỏ deprecated `experimental.serverActions`
- **File**: `next.config.js:19-23`
- **Next.js 15**: Server actions đã stable, config này không còn tác dụng

---

## Phase 6: UI/UX Improvements (Medium Impact)

### 6.1 — Thêm Skip-to-Content link cho keyboard users
- **File**: `src/app/layout.tsx`
- **Thêm**:
```tsx
<body>
  <a href="#main-content" className="sr-only focus:not-sr-only ...">
    Skip to content
  </a>
  ...
</body>
```
- **Severity**: 🔴 HIGH — Accessibility

### 6.2 — Thêm `loading.tsx` cho route segments
- **File cần tạo**: `src/app/(main)/loading.tsx`, `src/app/(auth)/loading.tsx`
- **Nội dung**: Skeleton/spinner cho page transitions
- **Severity**: 🔴 HIGH — User Experience

### 6.3 — Fix empty comment section cho unauthenticated users
- **File**: `src/components/comment/comment-list.tsx:252-254`
- **Hiện tại**: Trả về `null` nếu không có comments + chưa login → user thấy nothing
- **Sửa**: Luôn show heading + "Sign in to leave a comment"
- **Severity**: 🔴 HIGH

### 6.4 — Thay `confirm()` bằng custom Dialog
- **File**: `src/components/comment/comment-list.tsx:100`
- **Hiện tại**: Dùng `confirm("Delete this comment?")` — unstylable, có thể bị chặn
- **Sửa**: Dùng Radix UI `AlertDialog`
- **Severity**: 🟡 MEDIUM

### 6.5 — Escape key + focus trap cho mobile menu
- **File**: `src/components/layout/header.tsx`
- **Hiện tại**: Không đóng được bằng Escape, không focus trap
- **Sửa**: Thêm `onKeyDown={e => e.key === 'Escape' && setMobileMenuOpen(false)}`
- **Severity**: 🟡 MEDIUM

### 6.6 — `aria-label` cho tag remove button
- **File**: `src/components/post/post-editor.tsx:791-797`
- **Sửa**: `<button aria-label={"Remove " + tag}>`
- **Severity**: 🟡 MEDIUM

### 6.7 — Toast notifications ARIA live region
- **File**: `src/components/ui/toast.tsx`
- **Sửa**: Thêm `role="alert"` (destructive) / `role="status"` (success)
- **Severity**: 🟡 MEDIUM

### 6.8 — Focus ring cho avatar upload
- **File**: `src/components/profile/avatar-upload.tsx:117-133`
- **Sửa**: Thêm `focus-visible:ring-2`
- **Severity**: 🟡 MEDIUM

### 6.9 — Search page listen URL changes
- **File**: `src/app/(main)/search/search-content.tsx`
- **Hiện tại**: Không re-fire search khi browser back/forward
- **Sửa**: Thêm effect listen `searchParams` thay đổi
- **Severity**: 🟡 MEDIUM

### 6.10 — Kiểm tra WCAG contrast cho `muted-foreground`
- **File**: `src/app/globals.css:23,46`
- **Kiểm tra**: `--muted-foreground` light mode (45%) và dark mode (55%) có thể dưới 4.5:1
- **Sửa**: Adjust lightness values
- **Severity**: 🟡 MEDIUM

### 6.11 — Thêm `maxLength` cho inputs
- **Files**: `post-editor.tsx` (title + excerpt), `comment-list.tsx` (content)
- **Thêm**: title ≤ 200, excerpt ≤ 300, comment ≤ 2000
- **Severity**: 🟢 LOW

### 6.12 — Fix hydration mismatch từ `new Date().getFullYear()` trong Footer
- **File**: `src/components/layout/footer.tsx`
- **Sửa**: Dùng `useEffect` client-side hoặc hardcode năm
- **Severity**: 🟢 LOW

### 6.13 — Image upload error → thêm Retry button
- **File**: `src/components/post/post-editor.tsx` (image block error state)
- **Severity**: 🟢 LOW

---

## Phase 7: Bug Fixes (Medium Impact)

### 7.1 — Loading overlay không đóng khi navigate
- **File**: `src/components/providers/loading-provider.tsx`
- **Fix**: Cleanup overlay state trên unmount

### 7.2 — Race condition like/bookmark rapid clicks
- **File**: `src/components/like/like-button.tsx`, `src/components/bookmark/bookmark-button.tsx`
- **Fix**: Dùng ref chặn click khi đang pending

### 7.3 — Cascade delete comment không warning replies
- **File**: `src/components/comment/comment-list.tsx:100`
- **Fix**: Warning "This will also delete all replies"

### 7.4 — Slug collision risk
- **File**: `src/lib/utils.ts:18-21`, `src/lib/post-editor-utils.ts:71-72`
- **Fix**: Dùng `crypto.randomUUID()` thay `Math.random()`

### 7.5 — `generateMetadata` không check tag existence
- **File**: `src/app/(main)/tag/[tag]/page.tsx`
- **Fix**: Check tag tồn tại trước khi return metadata

### 7.6 — Thêm R2 remote pattern cho `next/image`
- **File**: `next.config.js`
- **Fix**: Thêm R2 hostname vào `images.remotePatterns`

---

## Summary Table

| ID | Item | File(s) | Loại | Effort | Priority |
|----|------|---------|------|--------|----------|
| P0.1 | Missing `/images` route | `api/posts/[id]/images/route.ts` | Bug | 30min | 🔴 Critical |
| P0.2 | Missing `/discard` route | `api/posts/[id]/discard/route.ts` | Bug | 30min | 🔴 Critical |
| 1.1 | next/font thay @import | `globals.css`, `layout.tsx` | Perf | 20min | 🔴 High |
| 1.2 | Dynamic import Markdown | `post-editor.tsx` | Perf | 30min | 🔴 High |
| 1.3 | Dynamic import EditorBody | `post-editor.tsx` | Perf | 15min | 🔴 High |
| 1.4 | React.memo cho list items | `post-card.tsx`, `draft-card.tsx` | Perf | 15min | 🔴 High |
| 2.1 | ISR thay force-dynamic | pages content | Perf | 20min | 🔴 High |
| 2.2 | Drafts bỏ content field | `drafts/page.tsx` | Perf | 5min | 🔴 High |
| 6.1 | Skip-to-content link | `layout.tsx` | A11y | 10min | 🔴 High |
| 6.2 | loading.tsx cho routes | `(main)/loading.tsx` | UX | 15min | 🔴 High |
| 6.3 | Fix empty comment section | `comment-list.tsx` | UX | 10min | 🔴 High |
| 1.5 | loading="lazy" cho ảnh | `editor-body.tsx`, `post-card.tsx` | Perf | 5min | 🟡 High |
| 2.5 | Optimistic updates | like/bookmark/comment | Perf | 2h | 🟡 High |
| 4.1 | Server-side validation | API routes | Security | 20min | 🟡 High |
| 1.6 | content-visibility | Page listings | Perf | 10min | 🟡 Medium |
| 1.7 | Dedupe highlight.js CSS | layout + editor | Perf | 5min | 🟡 Medium |
| 1.8 | Xóa unused dependencies | `package.json` | Bundle | 5min | 🟡 Medium |
| 2.3 | Cache-Control headers | API routes | Cache | 15min | 🟡 Medium |
| 2.4 | DB indexes | `schema.prisma` | DB | 15min | 🟡 Medium |
| 3.1 | Tối ưu snapshotsEqual | `post-editor-utils.ts` | Perf | 15min | 🟡 Medium |
| 3.2 | Fix dependency explosion | `post-editor.tsx` | Perf | 30min | 🟡 Medium |
| 4.2 | Transaction cho tags | `posts/[id]/route.ts` | Bug | 10min | 🟡 Medium |
| 4.3 | Type check bio | `users/[id]/route.ts` | Bug | 5min | 🟡 Medium |
| 6.4 | Dialog thay confirm() | `comment-list.tsx` | UX | 30min | 🟡 Medium |
| 6.5 | Escape key mobile menu | `header.tsx` | UX | 10min | 🟡 Medium |
| 6.6 | aria-label tag button | `post-editor.tsx` | A11y | 5min | 🟡 Medium |
| 6.7 | Toast role alert | `toast.tsx` | A11y | 10min | 🟡 Medium |
| 6.8 | Focus ring avatar upload | `avatar-upload.tsx` | A11y | 5min | 🟡 Medium |
| 6.9 | Search listen URL changes | `search-content.tsx` | UX | 15min | 🟡 Medium |
| 6.10 | WCAG contrast muted-foreground | `globals.css` | A11y | 10min | 🟡 Medium |
| 7.1 | Loading overlay navigate bug | `loading-provider.tsx` | Bug | 20min | 🟡 Medium |
| 7.2 | Race condition like/bookmark | like+bookmark button | Bug | 15min | 🟡 Medium |
| 7.3 | Cascade delete warning | `comment-list.tsx` | Bug | 10min | 🟡 Medium |
| 1.9 | Xóa unused imports | `comment-list.tsx` | Clean | 5min | 🟢 Low |
| 3.3 | Cleanup ObjectURL | `post-editor.tsx` | Perf | 5min | 🟢 Low |
| 5.1 | Bundle analyzer | Config | Tool | 15min | 🟢 Low |
| 5.2 | Cleanup imports tổng thể | Toàn bộ | Clean | 10min | 🟢 Low |
| 5.3 | Bỏ experimental.serverActions | `next.config.js` | Clean | 2min | 🟢 Low |
| 6.11 | maxLength inputs | `post-editor.tsx`, `comment-list.tsx` | UX | 10min | 🟢 Low |
| 6.12 | Fix hydration year | `footer.tsx` | Bug | 5min | 🟢 Low |
| 6.13 | Retry button upload error | `post-editor.tsx` | UX | 15min | 🟢 Low |
| 7.4 | Slug collision | `utils.ts`, `post-editor-utils.ts` | Bug | 5min | 🟢 Low |
| 7.5 | generateMetadata tag check | `tag/[tag]/page.tsx` | Bug | 5min | 🟢 Low |
| 7.6 | Thêm R2 remote pattern | `next.config.js` | Config | 5min | 🟢 Low |
