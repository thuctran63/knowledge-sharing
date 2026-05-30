# Sprint 2 — Reader UX & SEO

**Theme:** Giữ chân người đọc sau khi mở 1 bài; tăng organic traffic.  
**Effort:** ~4–6 ngày  
**Status:** `done` ✅  
**Dependency:** Không bắt buộc Sprint 1 (nên xong Sprint 1 trước để feed ổn định)

---

## Mục tiêu

1. Gợi ý bài liên quan cuối post.
2. Chia sẻ bài (copy link + Web Share API).
3. Mục lục (TOC) cho bài dài.
4. SEO: sitemap, RSS, JSON-LD, metadata per post.

---

## Task 2.1 — Related posts

### Acceptance criteria

- [x] Bài có tag → hiện 1–4 bài liên quan
- [x] Bài không tag / không match → fallback "More from this author"
- [x] Không include bài hiện tại

**Implemented:** `src/lib/related-posts.ts`, `src/components/post/related-posts.tsx`

---

## Task 2.2 — Share button

### Acceptance criteria

- [x] Desktop: copy link + toast
- [x] Mobile hỗ trợ share sheet native
- [x] URL canonical đúng slug

**Implemented:** `src/components/post/share-button.tsx`, `src/lib/site-url.ts`

---

## Task 2.3 — TOC khi đọc bài

### Acceptance criteria

- [x] Bài có ≥2 heading h2/h3 → hiện TOC
- [x] Click TOC item scroll đúng vị trí (trừ sticky header)
- [x] Mobile usable

**Implemented:** `src/components/post/article-with-toc.tsx`, `src/lib/scroll-to-heading.ts`

---

## Task 2.4 — Search: sort & filter

### Acceptance criteria

- [x] Sort trending thay đổi thứ tự kết quả
- [x] URL reflect state (`?q=&sort=`)
- [x] API hỗ trợ `tag` filter (query param)

**Implemented:** `search-content.tsx`, `api/search/route.ts`

---

## Task 2.5 — SEO foundation

### Acceptance criteria

- [x] `/sitemap.xml` list published posts
- [x] `/feed.xml` RSS 20 bài mới
- [x] View source post page có JSON-LD
- [x] OG tags per post (title, description, url)

**Implemented:** `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/feed.xml/route.ts`, `generateMetadata` + JSON-LD on post page

---

## Task 2.6 — Dynamic OG image

**Skipped** — optional, cần `@vercel/og` + deploy Vercel.

---

## Checklist trước khi đóng sprint

- [x] `npm run build` pass
- [x] Related + TOC wired on post page
- [x] Sprint status updated

## Files added/changed (summary)

| New | Modified |
|-----|----------|
| `src/lib/site-url.ts` | `src/app/(main)/post/[slug]/page.tsx` |
| `src/lib/related-posts.ts` | `src/app/api/search/route.ts` |
| `src/lib/scroll-to-heading.ts` | `src/app/(main)/search/search-content.tsx` |
| `src/components/post/share-button.tsx` | |
| `src/components/post/related-posts.tsx` | |
| `src/components/post/article-with-toc.tsx` | |
| `src/app/sitemap.ts` | |
| `src/app/robots.ts` | |
| `src/app/feed.xml/route.ts` | |

## Env (optional)

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Dùng cho canonical URL, sitemap, RSS, share link. Fallback: `VERCEL_URL` hoặc `localhost:3000`.

## Commit gợi ý

```
feat(post): related articles and share button
feat(post): table of contents for long articles
feat(seo): sitemap, RSS feed, and Article JSON-LD
fix(search): wire sort param to search API
```
