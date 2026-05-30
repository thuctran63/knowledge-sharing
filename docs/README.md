# Documentation — Knowledge Sharing

Tài liệu kế hoạch phát triển và tối ưu cho platform.

| File | Mô tả |
|------|--------|
| [product-roadmap.md](./product-roadmap.md) | Bức tranh tổng thể, nguyên tắc chọn tech, schema & routes dự kiến |
| [sprints/README.md](./sprints/README.md) | Ma trận sprint, thứ tự thực hiện, dependency |
| [sprints/sprint-01.md](./sprints/sprint-01.md) | Quick wins — Saved, pagination, social state |
| [sprints/sprint-02.md](./sprints/sprint-02.md) | Reader UX — Related, Share, TOC, SEO |
| [sprints/sprint-03.md](./sprints/sprint-03.md) | Engagement — Follow, Notifications, View dedup |
| [sprints/sprint-04.md](./sprints/sprint-04.md) | Discovery — Trending v2, Search, Dashboard |
| [sprints/sprint-05.md](./sprints/sprint-05.md) | Writer tools — Series, Schedule, Revisions |
| [sprints/sprint-06.md](./sprints/sprint-06.md) | Scale & trust — Full-text search, Rate limit, Moderation |
| [performance-plan.md](./performance-plan.md) | Kế hoạch performance, bundle, caching, a11y (đã có) |

## Stack hiện tại

- **Frontend:** Next.js 15 App Router, React 19, Tailwind, Radix UI
- **Backend:** Next.js Route Handlers, Prisma, PostgreSQL
- **Auth:** NextAuth (Google + Credentials)
- **Storage:** Cloudflare R2 (ảnh bài viết, avatar)

## Cách dùng tài liệu sprint

1. Đọc [product-roadmap.md](./product-roadmap.md) để nắm context và quyết định tech.
2. Làm tuần tự [Sprint 1 → 6](./sprints/README.md) trừ khi có dependency rõ ràng.
3. Mỗi task trong sprint có: **mục tiêu**, **file cần sửa/tạo**, **API/schema**, **acceptance criteria**.
4. Cross-reference [performance-plan.md](./performance-plan.md) khi task trùng (ISR, optimistic updates, v.v.).
