# Product Roadmap — Knowledge Sharing Platform

> Cập nhật: 2026-05-29  
> Mục tiêu: đưa platform từ MVP blog/forum lên mức **knowledge community** (discovery, engagement, writer retention) mà không over-engineer infra.

---

## 1. Hiện trạng

### Đã có

| Nhóm | Tính năng |
|------|-----------|
| **Auth** | Email/password, Google OAuth, session NextAuth |
| **Content** | Markdown editor (block + ảnh R2), preview, autosave draft, publish/draft toggle, xóa bài |
| **Discovery** | Home (latest + trending), `/search`, `/tags`, `/tag/[tag]` |
| **Social** | Like, bookmark (API), comment (reply, edit, delete) |
| **Profile** | Avatar R2, bio, danh sách bài |
| **UX** | Dark mode, mobile menu, reading time, view count, font VI/EN |

### Chưa có / chưa hoàn chỉnh

- Trang **Saved** (bookmark list UI)
- **Pagination / infinite scroll** trên feed
- **Like/bookmark state** đúng trên homepage (hiện hardcode `false`)
- **Related posts**, **Share**, **TOC** khi đọc bài
- **Follow author**, **Notifications**
- **Trending** thông minh (decay theo thời gian)
- **View dedup** (mỗi lần mở page +1 view)
- **SEO:** sitemap, RSS, JSON-LD per post, OG per bài
- **Author dashboard**, **Series**, **Scheduled publish**, **Revision history**
- **Full-text search**, **Rate limit**, **Moderation**

---

## 2. Nguyên tắc chọn công nghệ

```
Quy mô: community nhỏ → vừa (hàng trăm–vài nghìn bài)
Content: markdown dài, tiếng Việt + English
Infra hiện có: PostgreSQL, R2, Next.js — chưa có Redis/queue
```

**Ưu tiên:** Postgres + Next.js native trước → thêm service bên ngoài khi có metric rõ (latency, scale, cost).

| Nhu cầu | Công nghệ đề xuất | Khi nào *không* dùng |
|---------|-------------------|----------------------|
| Search tốt hơn | Postgres `tsvector` + GIN index | Meilisearch/Typesense chỉ khi >50k bài hoặc cần typo tolerance mạnh |
| Trending | SQL score trong Postgres + `unstable_cache` | Redis ranking — overkill giai đoạn đầu |
| Cache | Next.js `revalidateTag` / `unstable_cache` | Redis cache layer — chưa cần |
| Notifications MVP | Bảng `Notification` + poll hoặc SSE | Pusher/Ably — khi >500 DAU concurrent |
| Email | Resend + React Email | SMTP self-host — tốn ops |
| Rate limit | Upstash Redis + `@upstash/ratelimit` | In-memory — fail trên serverless multi-instance |
| View analytics | Bảng `PostView` + aggregate | GA/Plausible — optional song song, không thay thế author metrics |
| Infinite scroll | Intersection Observer hoặc SWR Infinite | React Query — nếu chỉ 2–3 chỗ dùng |
| OG image động | `@vercel/og` (Satori) | Canvas server — nếu không deploy Vercel thì dùng template tĩnh |
| Cron jobs | Vercel Cron + `CRON_SECRET` | BullMQ — cần Redis always-on |

---

## 3. Kiến trúc data (dự kiến theo sprint)

### Schema hiện tại (`prisma/schema.prisma`)

`User`, `Post`, `Tag`, `PostTag`, `Comment`, `Like`, `Bookmark`, NextAuth models.

### Models thêm theo phase

| Sprint | Models / columns |
|--------|------------------|
| 3 | `Follow`, `Notification`, `PostView`, `CommentLike` |
| 4 | (query trending — có thể không cần model mới) |
| 5 | `Series`, `SeriesPost`, `PostRevision`, `Post.scheduledAt` |
| 6 | `Report`, `User.role`, `Post.search_vector` (column) |

Chi tiết Prisma từng sprint: xem file sprint tương ứng.

---

## 4. Routes & API dự kiến

### Pages mới

| Route | Sprint | Mô tả |
|-------|--------|--------|
| `/saved` | 1 | Danh sách bài đã bookmark |
| `/feed.xml` | 2 | RSS 20 bài mới |
| `/sitemap.xml` | 2 | Next.js `sitemap.ts` |
| `/dashboard` | 4 | Author analytics (owner) |
| `/series/[slug]` | 5 | Trang series + danh sách parts |

### API mới

| Endpoint | Sprint | Method |
|----------|--------|--------|
| `/api/users/[id]/follow` | 3 | POST, DELETE |
| `/api/notifications` | 3 | GET, PATCH |
| `/api/notifications/stream` | 3 | GET (SSE, optional) |
| `/api/cron/publish-scheduled` | 5 | POST (cron secret) |
| `/api/reports` | 6 | POST |

### API chỉnh sửa

| Endpoint | Sprint | Thay đổi |
|----------|--------|----------|
| `GET /api/posts` | 1, 4 | Wire UI pagination; trending score |
| `GET /api/search` | 2, 4, 6 | Sort, filter tag; sau đó full-text |
| Homepage server component | 1 | Hydrate like/bookmark theo session |

---

## 5. Packages dự kiến (theo sprint)

| Package | Sprint | Mục đích |
|---------|--------|----------|
| *(none)* | 1 | Chỉ wire API/UI có sẵn |
| *(none)* | 2 | RSS/sitemap = Next.js built-in |
| `swr` (optional) | 1–3 | Infinite feed, notification poll |
| `resend`, `@react-email/components` | 3b | Email digest / reply notify |
| `@upstash/ratelimit`, `@upstash/redis` | 6 | Rate limit production |
| `@vercel/og` | 2 | Dynamic OG (nếu deploy Vercel) |
| `recharts` (optional) | 4 | Author dashboard charts |

**Không cần giai đoạn đầu:** Elasticsearch, Kafka, Socket.io, tRPC.

---

## 6. Ma trận ưu tiên

```
Impact cao ◄────────────────────────────────────────► Effort cao
     │ Sprint 1: Saved, pagination, social state
     │ Sprint 2: Related, Share, TOC, SEO
     │ Sprint 3: Follow, Notifications, view dedup
     │ Sprint 4: Trending, search, dashboard
     │ Sprint 5: Series, schedule, revisions
     └ Sprint 6: Full-text, moderation, rate limit
```

---

## 7. Liên kết với Performance Plan

Một số task trùng hoặc bổ sung cho nhau:

| Product sprint | Performance plan |
|----------------|------------------|
| Sprint 1 pagination | 2.5 Optimistic updates (like/bookmark) |
| Sprint 2 SEO | ISR đã có (`revalidate` trên pages) |
| Sprint 3 view dedup | Thay logic `recordPostView` increment thuần |
| Sprint 4 search | Thay ILIKE — khác 2.3 Cache-Control API |
| Sprint 6 rate limit | 4.1 Server-side validation |

Luôn check [performance-plan.md](./performance-plan.md) trước khi implement task perf liên quan.

---

## 8. Definition of Done (chung)

Mỗi sprint được coi là xong khi:

- [ ] Code merge, build pass (`npm run build`)
- [ ] Prisma migrate/push nếu có schema change
- [ ] Manual test theo acceptance criteria trong file sprint
- [ ] Không regression: auth, editor autosave, publish, comment
- [ ] Mobile smoke test (menu, editor sticky bar, post read)
