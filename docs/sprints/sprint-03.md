# Sprint 3 — Engagement Loop

**Theme:** Người dùng quay lại — follow, thông báo, view count chính xác.  
**Effort:** ~8–12 ngày  
**Status:** `done` ✅  
**Dependency:** Sprint 1 khuyến nghị (Saved/social state)

---

## Mục tiêu

1. Follow tác giả + tab feed Following.
2. In-app notifications (reply, like, follow, bài mới từ người follow).
3. View count deduplicated.
4. (Optional) Like comment — skipped.

---

## Task 3.1 — Schema: Follow, Notification, PostView

### Acceptance criteria

- [x] Prisma models `Follow`, `Notification`, `PostView`
- [x] Relations on `User`, `Post`
- [x] `npm run db:push` applied

**Implemented:** `prisma/schema.prisma`

---

## Task 3.2 — Follow author

### Acceptance criteria

- [x] Follow/unfollow toggle, không follow chính mình
- [x] Tab Following chỉ hiện bài từ người đã follow
- [x] Guest click Follow → login CTA

**Implemented:**

| File | Mô tả |
|------|--------|
| `src/app/api/users/[id]/follow/route.ts` | POST follow, DELETE unfollow |
| `src/components/user/follow-button.tsx` | Toggle + optimistic count |
| `src/components/home/home-feed-tabs.tsx` | Latest \| Following tabs |
| `src/app/(main)/page.tsx` | `?feed=following` + following query |
| `src/app/api/posts/route.ts` | `feed=following` filter |
| `src/app/(main)/profile/[id]/page.tsx` | Follow button + follower count |
| `src/app/(main)/post/[slug]/page.tsx` | Follow on author row |

---

## Task 3.3 — Notifications

### Acceptance criteria

- [x] Bell hiện unread count
- [x] Click notification → navigate đúng post/comment/profile
- [x] Mark all read
- [x] Không notify chính mình
- [x] Poll 60s khi tab active

**Implemented:**

| File | Mô tả |
|------|--------|
| `src/lib/notifications.ts` | `createNotification`, helpers |
| `src/app/api/notifications/route.ts` | GET list, PATCH mark read |
| `src/components/notifications/notification-bell.tsx` | Dropdown + badge |
| `src/components/layout/header.tsx` | Bell in header |

**Triggers:** `api/likes`, `api/comments`, `api/users/[id]/follow`, `api/posts` (publish), `api/posts/[id]` (publish)

---

## Task 3.4 — View count dedup

### Acceptance criteria

- [x] Refresh cùng bài trong session không tăng view
- [x] User khác / session khác vẫn +1
- [x] Draft không count view

**Implemented:** `src/lib/post-views.ts` — upsert `PostView` with `viewerKey` (`user:id` or hashed anon)

---

## Task 3.5 — (Optional) Comment like

**Skipped** — optional scope.

---

## Task 3.6 — (Optional) Email notifications

**Skipped** — requires Resend + user email settings.

---

## Checklist trước khi đóng sprint

- [x] Migration applied trên dev DB (`db:push`)
- [x] Follow + Following tab wired
- [x] Notification bell + triggers
- [x] View dedup
- [x] `npm run build` pass

## Files added/changed (summary)

| New | Modified |
|-----|----------|
| `src/lib/notifications.ts` | `prisma/schema.prisma` |
| `src/lib/post-views.ts` (rewrite) | `src/app/(main)/page.tsx` |
| `src/app/api/users/[id]/follow/route.ts` | `src/app/(main)/profile/[id]/page.tsx` |
| `src/app/api/notifications/route.ts` | `src/app/(main)/post/[slug]/page.tsx` |
| `src/components/user/follow-button.tsx` | `src/app/api/posts/route.ts` |
| `src/components/notifications/notification-bell.tsx` | `src/app/api/posts/[id]/route.ts` |
| `src/components/home/home-feed-tabs.tsx` | `src/app/api/likes/route.ts` |
| | `src/app/api/comments/route.ts` |
| | `src/components/layout/header.tsx` |
| | `src/components/post/post-feed.tsx` |
| | `src/components/comment/comment-list.tsx` |

## Commit gợi ý

```
feat(follow): follow authors and following feed tab
feat(notifications): in-app notifications with bell dropdown
fix(views): deduplicate post views per viewer session
```
