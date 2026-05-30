# Sprint 4 — Discovery & Author Insights

**Theme:** Feed thông minh hơn, search usable, tác giả thấy metrics cơ bản.  
**Effort:** ~6–10 ngày  
**Status:** `planned`  
**Dependency:** Sprint 3 (PostView table cho dashboard)

---

## Mục tiêu

1. Trending algorithm có time decay.
2. Search filter/sort hoàn chỉnh (vẫn ILIKE — FTS ở Sprint 6).
3. Author dashboard (views, top posts).
4. Cache invalidation khi publish.

---

## Task 4.1 — Trending algorithm v2

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/lib/trending.ts` | Score function + helper |

### Công thức đề xuất

```
hours = max((now - createdAt) / 3600000, 0)
score = (viewCount + likes×3 + comments×5) / pow(hours + 2, 1.3)
```

Chỉ tính `published: true`, optional window 30 ngày.

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/api/posts/route.ts` | `sort=trending` dùng score |
| `src/app/(main)/page.tsx` | Trending sidebar dùng cùng logic |

### Tech

```ts
// Option A: Prisma $queryRaw — sort in SQL
// Option B: fetch top N by viewCount recent, sort in JS — OK nếu N < 200
```

Cache:

```ts
unstable_cache(fetchTrending, ['trending-posts'], { revalidate: 900 }) // 15 phút
```

### Acceptance criteria

- [ ] Bài mới nhiều engagement lên trending nhanh hơn bài cũ view cao
- [ ] Home trending khớp API `sort=trending`
- [ ] Không query full table mỗi request (cache hoặc limit window)

---

## Task 4.2 — Search improvements (pre full-text)

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/api/search/route.ts` | Pagination `page`, `limit`; sort; filter `tag` |
| `src/app/(main)/search/search-content.tsx` | Pagination UI; tag filter chip |

### Ranking tạm (ILIKE era)

```
ORDER BY
  CASE WHEN title ILIKE %q% THEN 0 ELSE 1 END,
  createdAt DESC
```

### Acceptance criteria

- [ ] Search "postgres" ưu tiên title match
- [ ] Pagination 10 kết quả/trang
- [ ] Filter theo tag hoạt động

---

## Task 4.3 — Author dashboard

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/(main)/dashboard/page.tsx` | Owner-only analytics |
| `src/lib/analytics.ts` | Aggregate queries |

### Metrics hiển thị

| Metric | Nguồn |
|--------|--------|
| Views 7 / 30 ngày | `PostView.viewedAt` group by day |
| Top 5 bài by views | `Post.viewCount` hoặc count PostView |
| Total likes, comments | `_count` aggregate |
| Bài published / draft | count posts |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/components/layout/header.tsx` | Link Dashboard (author menu) |

### Tech

- Prisma `groupBy` trên `PostView`.
- Chart: CSS bars hoặc **recharts** (optional dep).
- Middleware: redirect nếu `session.user.id` không match — page chỉ cho chính author xem stats của mình.

### Acceptance criteria

- [ ] Chỉ author login thấy dashboard của mình
- [ ] Chart/table views 7 ngày chính xác sau Sprint 3 dedup
- [ ] Link top bài → edit/post page

---

## Task 4.4 — Revalidation tags on publish

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/api/posts/[id]/route.ts` | Sau publish: `revalidateTag('posts')`, `revalidateTag('post-{slug}')`, `revalidateTag('sitemap')` |
| `src/app/api/posts/route.ts` | POST create published |

### Tech

Next.js 15:

```ts
import { revalidateTag } from 'next/cache'
```

Gắn tags vào `unstable_cache` / fetch trong home, post, sitemap.

### Acceptance criteria

- [ ] Publish bài → home hiện bài mới trong ≤ revalidate window (hoặc ngay nếu on-demand)

---

## Task 4.5 — Explore page (optional)

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/(main)/explore/page.tsx` | Latest + Trending + Top tags |

Gom discovery một chỗ — có thể defer nếu `/tags` đủ dùng.

---

## Checklist trước khi đóng sprint

- [ ] Trending manual test: bài mới vs bài cũ
- [ ] Dashboard data khớp post page view count
- [ ] Search pagination không timeout trên DB lớn (add limit cap)

## Commit gợi ý

```
feat(trending): time-decay score for trending feed
feat(dashboard): author analytics page with view charts
feat(search): pagination, tag filter, and title ranking
perf(cache): revalidate tags on publish
```
