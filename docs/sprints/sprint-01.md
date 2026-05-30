# Sprint 1 — Quick Wins

**Theme:** Đóng gap UX rõ nhất, tận dụng API đã có, không schema mới.  
**Effort:** ~3–5 ngày  
**Status:** `planned`

---

## Mục tiêu

1. Người dùng xem lại bài đã bookmark.
2. Feed home/tag load thêm bài (pagination).
3. Like/bookmark hiển thị đúng khi đã đăng nhập trên listing pages.

---

## Task 1.1 — Trang Saved (`/saved`)

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/(main)/saved/page.tsx` | Server hoặc client page list bookmark |
| `src/app/(main)/saved/loading.tsx` | Skeleton (optional) |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/components/layout/header.tsx` | Link "Saved" trong user dropdown (cạnh Drafts) |
| Mobile menu | Thêm mục Saved |

### API

- Dùng sẵn `GET /api/bookmarks` (cần auth session).
- Redirect `/login` nếu chưa đăng nhập.

### Tech

- Server Component: `getCurrentUser()` + fetch bookmarks qua Prisma trực tiếp (tránh double fetch) **hoặc** client fetch API.
- **Đề xuất:** Server Component + Prisma trong page (nhanh hơn, SEO không quan trọng vì private).

### Acceptance criteria

- [ ] User đã login thấy danh sách bài bookmark, sort mới nhất
- [ ] Click card → mở bài
- [ ] Unbookmark từ card hoặc trong bài → biến mất khỏi list sau refresh/update
- [ ] User chưa login → redirect login hoặc empty state + CTA

---

## Task 1.2 — Pagination / Load more — Home

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/components/post/post-feed.tsx` | Client component: load more / infinite scroll |
| `src/hooks/use-post-feed.ts` (optional) | Fetch `/api/posts?page=&sort=&userId=` |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/page.tsx` | SSR 10 bài đầu; phần còn lại qua `PostFeed` |
| `src/app/(main)/tags/tags-content.tsx` | Tương tự nếu list bài theo tag đang chọn |

### API

- `GET /api/posts?page=1&limit=10&sort=latest|trending&userId={id}` — **đã có**.

### Tech

| Option | Khi dùng |
|--------|----------|
| Nút **Load more** | MVP nhanh, ít bug |
| **Intersection Observer** | UX mượt, 0 dependency |
| **SWR Infinite** | Nếu muốn cache client tái sử dụng nhiều feed |

**Đề xuất sprint 1:** Load more button → nâng infinite scroll sprint sau.

### Acceptance criteria

- [ ] Home hiển thị 10 bài, bấm "Load more" thêm 10 bài
- [ ] Hết bài → ẩn nút hoặc hiện "No more articles"
- [ ] Loading state khi fetch
- [ ] Không duplicate bài khi load trang 2

---

## Task 1.3 — Pagination — Tag page

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/tag/[tag]/page.tsx` | Initial SSR + `PostFeed` với `tag` param |
| `src/app/(main)/tags/tags-content.tsx` | Feed bên phải khi chọn tag |

### API

- `GET /api/posts?tag={name}&page=&limit=`

### Acceptance criteria

- [ ] Tag page load thêm bài giống home
- [ ] Đổi tag trên `/tags` reset pagination

---

## Task 1.4 — Fix like/bookmark state trên Home

### Vấn đề

`src/app/(main)/page.tsx` map hardcode:

```ts
isLiked: false, isBookmarked: false
```

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/page.tsx` | `getCurrentUser()`, include likes/bookmarks filter theo userId trong Prisma query |
| `src/app/(main)/tag/[tag]/page.tsx` | Tương tự |
| `src/components/post/post-card.tsx` | Hiển thị icon filled nếu liked/bookmarked (optional UI) |

### Tech

- Pattern giống `GET /api/posts` với `userId` query param.
- Server-side join nhẹ hơn client gọi API riêng.

### Acceptance criteria

- [ ] User login: bài đã like/bookmark hiển thị state đúng trên home & tag
- [ ] Guest: state false, click → toast sign in

---

## Task 1.5 — (Optional) Optimistic like/bookmark

> Cross-ref [performance-plan.md](../performance-plan.md) §2.5

### Chỉnh sửa

- `src/components/like/like-button.tsx`
- `src/components/bookmark/bookmark-button.tsx`

Bỏ `router.refresh()` sau mỗi click; dùng optimistic UI + rollback on error.

### Acceptance criteria

- [ ] Click like/bookmark phản hồi tức thì, không flash cả page

---

## Checklist trước khi đóng sprint

- [ ] `npm run build` pass
- [ ] Test mobile: Saved trong menu, Load more home
- [ ] Test guest vs logged-in trên home cards
- [ ] Cập nhật [README.md](./README.md) status → `done`

## Commit gợi ý

```
feat(saved): add saved articles page and header link
feat(feed): pagination load more on home and tag pages
fix(home): hydrate like and bookmark state for logged-in users
```
