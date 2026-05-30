# Sprint 2 — Reader UX & SEO

**Theme:** Giữ chân người đọc sau khi mở 1 bài; tăng organic traffic.  
**Effort:** ~4–6 ngày  
**Status:** `planned`  
**Dependency:** Không bắt buộc Sprint 1 (nên xong Sprint 1 trước để feed ổn định)

---

## Mục tiêu

1. Gợi ý bài liên quan cuối post.
2. Chia sẻ bài (copy link + Web Share API).
3. Mục lục (TOC) cho bài dài.
4. SEO: sitemap, RSS, JSON-LD, metadata per post.

---

## Task 2.1 — Related posts

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/lib/related-posts.ts` | Query bài cùng tag, exclude current |
| `src/components/post/related-posts.tsx` | Grid 3–4 `PostCard` compact |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/post/[slug]/page.tsx` | Render `RelatedPosts` trước comment section |

### Logic query

```
1. Lấy tag IDs của bài hiện tại
2. Tìm published posts có ≥1 tag chung, id != current
3. ORDER BY số tag trùng DESC, createdAt DESC
4. LIMIT 4
```

### Tech

- Prisma: 2-step query (đủ scale nhỏ) hoặc `$queryRaw`.
- Cache: `unstable_cache` tag `related-{postId}`, `revalidate: 3600`.

### Acceptance criteria

- [ ] Bài có tag → hiện 1–4 bài liên quan
- [ ] Bài không tag / không match → section ẩn hoặc fallback "More from author"
- [ ] Không include bài hiện tại

---

## Task 2.2 — Share button

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/components/post/share-button.tsx` | Copy URL + Web Share API |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/post/[slug]/page.tsx` | Thêm Share cạnh Like/Bookmark |

### Tech

```ts
if (navigator.share) await navigator.share({ title, url })
else await navigator.clipboard.writeText(url)
```

Toast "Link copied" fallback.

### Acceptance criteria

- [ ] Desktop: copy link + toast
- [ ] Mobile hỗ trợ share sheet native
- [ ] URL canonical đúng slug

---

## Task 2.3 — TOC khi đọc bài

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/components/post/article-with-toc.tsx` | Layout 2 cột + sticky TOC |
| `src/lib/scroll-to-heading.ts` | Scroll với offset header (nếu chưa có) |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/post/[slug]/page.tsx` | Wrap markdown trong `ArticleWithToc` |

### Tech

- Headings đã có id qua `rehype-slug`.
- Scan DOM hoặc parse markdown AST server-side để build TOC list.
- Mobile: collapsible "On this page" (Radix Collapsible hoặc details/summary).
- `@radix-ui/react-scroll-area` — đã có trong deps.

### Acceptance criteria

- [ ] Bài có ≥2 heading h2/h3 → hiện TOC
- [ ] Click TOC item scroll đúng vị trí (trừ sticky header)
- [ ] Mobile usable

---

## Task 2.4 — Search: sort & filter

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/search/search-content.tsx` | UI sort Latest/Trending; gửi `?sort=` lên API |
| `src/app/api/search/route.ts` | Hỗ trợ `sort=latest|trending`, optional `tag` |

### Acceptance criteria

- [ ] Sort trending thay đổi thứ tự kết quả
- [ ] URL reflect state (`?q=&sort=`)

---

## Task 2.5 — SEO foundation

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/sitemap.ts` | Dynamic sitemap — all published slugs |
| `src/app/robots.ts` | Allow/disallow rules |
| `src/app/feed.xml/route.ts` | RSS 20 bài mới + metadata |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/post/[slug]/page.tsx` | `generateMetadata` đầy đủ + JSON-LD `Article` |

### JSON-LD fields

```json
{
  "@type": "Article",
  "headline", "datePublished", "dateModified",
  "author", "description", "image", "url"
}
```

### Tech

- 100% Next.js App Router — không thêm service.
- Invalidate sitemap: `revalidateTag('sitemap')` khi publish (Sprint 4+).

### Acceptance criteria

- [ ] `/sitemap.xml` list published posts
- [ ] `/feed.xml` valid RSS (validate feed reader)
- [ ] View source post page có JSON-LD
- [ ] OG tags per post (title, description, url)

---

## Task 2.6 — (Optional) Dynamic OG image

### Tech

- `@vercel/og` — Route Handler `src/app/api/og/route.tsx`
- `generateMetadata` → `openGraph.images: [/api/og?title=...]`

Chỉ làm nếu deploy **Vercel**. Self-host → bỏ qua hoặc template PNG tĩnh.

---

## Checklist trước khi đóng sprint

- [ ] Lighthouse SEO score post page ≥ baseline
- [ ] RSS validate
- [ ] Related + TOC test bài tutorial dài (nhiều `#`)
- [ ] Cập nhật sprint status

## Commit gợi ý

```
feat(post): related articles and share button
feat(post): table of contents for long articles
feat(seo): sitemap, RSS feed, and Article JSON-LD
fix(search): wire sort param to search API
```
