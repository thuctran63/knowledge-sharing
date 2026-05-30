# Sprint 3 — Engagement Loop

**Theme:** Người dùng quay lại — follow, thông báo, view count chính xác.  
**Effort:** ~8–12 ngày  
**Status:** `planned`  
**Dependency:** Sprint 1 khuyến nghị (Saved/social state)

---

## Mục tiêu

1. Follow tác giả + tab feed Following.
2. In-app notifications (reply, like, follow, bài mới từ người follow).
3. View count deduplicated.
4. (Optional) Like comment.

---

## Task 3.1 — Schema: Follow, Notification, PostView

### Prisma migration

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  follower    User @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following   User @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // COMMENT_REPLY | POST_LIKE | NEW_FOLLOWER | NEW_POST
  actorId   String?
  postId    String?
  commentId String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, read, createdAt])
}

model PostView {
  id        String   @id @default(cuid())
  postId    String
  viewerKey String
  viewedAt  DateTime @default(now())
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@unique([postId, viewerKey])
  @@index([postId, viewedAt])
}
```

Cập nhật `User`, `Post` relations tương ứng.

### Chạy

```bash
npm run db:migrate
```

---

## Task 3.2 — Follow author

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/api/users/[id]/follow/route.ts` | POST follow, DELETE unfollow |
| `src/components/user/follow-button.tsx` | Toggle + count |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/profile/[id]/page.tsx` | Follow button + follower count |
| `src/app/(main)/post/[slug]/page.tsx` | Follow trên author card |
| `src/app/(main)/page.tsx` | Tab **Latest** \| **Following** |

### Feed Following query

```ts
where: {
  published: true,
  authorId: { in: followingIds }
}
orderBy: { createdAt: 'desc' }
```

### Tech

- Không cần Redis.
- Tạo `Notification` type `NEW_FOLLOWER` khi follow.

### Acceptance criteria

- [ ] Follow/unfollow toggle, không follow chính mình
- [ ] Tab Following chỉ hiện bài từ người đã follow
- [ ] Guest click Follow → login CTA

---

## Task 3.3 — Notifications

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/api/notifications/route.ts` | GET list, PATCH mark read |
| `src/lib/notifications.ts` | Helper `createNotification(...)` |
| `src/components/notifications/notification-bell.tsx` | Dropdown + unread badge |

### Trigger tạo notification

| Event | File trigger | Type |
|-------|--------------|------|
| Reply comment | `api/comments/route.ts` | `COMMENT_REPLY` |
| Like post | `api/likes/route.ts` | `POST_LIKE` |
| New follower | follow API | `NEW_FOLLOWER` |
| Author publish | `api/posts/[id]/route.ts` PATCH published | `NEW_POST` → followers |

### Tech — delivery

| Phase | Cách | Ghi chú |
|-------|------|---------|
| MVP | Poll `GET /api/notifications?unread=1` mỗi 60s khi tab active | Đơn giản |
| v2 | SSE `/api/notifications/stream` | Realtime nhẹ, không cần WebSocket |

**Không dùng** Pusher/Ably cho giai đoạn này.

### Acceptance criteria

- [ ] Bell hiện unread count
- [ ] Click notification → navigate đúng post/comment/profile
- [ ] Mark all read
- [ ] Không notify chính mình (like own post, etc.)

---

## Task 3.4 — View count dedup

### Vấn đề hiện tại

`src/lib/post-views.ts` — mỗi page load `viewCount++`.

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/lib/post-views.ts` | Upsert `PostView`; increment `Post.viewCount` chỉ khi insert mới |
| `viewerKey` | `userId` nếu login, else `hash(ip + user-agent)` từ `headers()` |

### Tech

- Postgres `@@unique([postId, viewerKey])` — dedup miễn phí.
- Giữ check `isPrefetchRequest()`.

### Acceptance criteria

- [ ] Refresh cùng bài trong session không tăng view
- [ ] User khác / session khác vẫn +1
- [ ] Draft không count view

---

## Task 3.5 — (Optional) Comment like

### Schema

```prisma
model CommentLike {
  userId    String
  commentId String
  user      User @relation(...)
  comment   Comment @relation(...)
  @@unique([userId, commentId])
}
```

### Bổ sung

- `POST/DELETE /api/comments/[id]/like`
- Heart icon trên comment

---

## Task 3.6 — (Optional) Email notifications

### Tech

- **Resend** + **React Email**
- User setting `emailNotifications: boolean` trên User (column mới)
- Gửi khi `COMMENT_REPLY` (instant), weekly digest (Cron)

### Env

```
RESEND_API_KEY=
EMAIL_FROM=notifications@yourdomain.com
```

---

## Checklist trước khi đóng sprint

- [ ] Migration applied trên dev DB
- [ ] Test follow → publish → follower nhận notification
- [ ] Test view dedup refresh 5 lần
- [ ] Index performance OK (`EXPLAIN` notification query)

## Commit gợi ý

```
feat(follow): follow authors and following feed tab
feat(notifications): in-app notifications with bell dropdown
fix(views): deduplicate post views per viewer session
```
