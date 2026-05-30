# Sprint 5 — Writer Tools

**Theme:** Giữ chân người viết — series, lịch đăng, lịch sử chỉnh sửa.  
**Effort:** ~10–14 ngày  
**Status:** `planned`  
**Dependency:** Độc lập — có thể song song Sprint 3–4

---

## Mục tiêu

1. Gom bài thành **Series** (tutorial nhiều phần).
2. **Scheduled publish** — hẹn giờ đăng.
3. **Revision history** — xem/khôi phục bản cũ.

---

## Task 5.1 — Schema: Series

### Prisma

```prisma
model Series {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?  @db.Text
  authorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  author      User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  posts       SeriesPost[]
  @@index([authorId])
}

model SeriesPost {
  seriesId String
  postId   String
  order    Int
  series   Series @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  post     Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@id([seriesId, postId])
  @@index([seriesId, order])
}
```

Thêm optional `seriesId` hoặc chỉ quan hệ qua `SeriesPost`.

---

## Task 5.2 — Series UI

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/(main)/series/[slug]/page.tsx` | Trang series — list parts |
| `src/app/api/series/route.ts` | CRUD series |
| `src/app/api/series/[id]/posts/route.ts` | Add/remove/reorder posts |
| `src/components/series/series-picker.tsx` | Chọn series khi publish |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/(main)/post/[slug]/page.tsx` | Banner "Part X of Y" + prev/next nav |
| `src/components/post/post-editor.tsx` | Assign to series (optional) |

### Acceptance criteria

- [ ] Tạo series, thêm ≥2 bài, set thứ tự
- [ ] Post page hiện nav prev/next trong series
- [ ] Series page list tất cả parts

---

## Task 5.3 — Scheduled publish

### Schema

```prisma
model Post {
  // existing fields...
  scheduledAt DateTime?
}
```

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/app/api/cron/publish-scheduled/route.ts` | Publish posts where `scheduledAt <= now()` |
| `vercel.json` hoặc Vercel Cron config | `*/5 * * * *` |

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/components/post/post-editor.tsx` | Datetime picker khi publish |
| Publish flow | `published=false` + `scheduledAt` set → cron flip `published=true` |

### Tech

- **Vercel Cron** + header `Authorization: Bearer ${CRON_SECRET}`
- Self-host: node-cron hoặc system cron curl endpoint

### Env

```
CRON_SECRET=random-long-string
```

### Acceptance criteria

- [ ] Schedule bài 5 phút sau → tự publish
- [ ] Trước giờ: bài không public, author preview được
- [ ] Cron endpoint reject không có secret

---

## Task 5.4 — Revision history

### Schema

```prisma
model PostRevision {
  id        String   @id @default(cuid())
  postId    String
  title     String
  content   String   @db.Text
  excerpt   String?  @db.Text
  createdAt DateTime @default(now())
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([postId, createdAt])
}
```

### Logic lưu revision

| Trigger | Hành vi |
|---------|---------|
| Trước mỗi publish | Snapshot title, content, excerpt |
| Autosave (optional) | Mỗi 10 lần autosave hoặc mỗi 30 phút max 1 revision |

### Bổ sung

| File | Mô tả |
|------|--------|
| `src/components/post/revision-history.tsx` | Dialog list revisions |
| `src/app/api/posts/[id]/revisions/route.ts` | GET list, POST restore |

### Cleanup

- Giữ tối đa **20 revisions/post** — cron xóa cũ hơn.

### Acceptance criteria

- [ ] Publish lần 2 → có ≥2 revisions
- [ ] Preview revision diff (optional) hoặc view raw
- [ ] Restore → editor load nội dung revision, autosave không mất ngay

---

## Task 5.5 — (Optional) Editor improvements

Cross-ref editor UX đã làm (sticky publish bar, Ctrl+A, markdown preview).

Có thể thêm sprint 5:
- Keyboard shortcuts help (`?` dialog)
- Word count / char count
- Cover image field trên Post (OG + card thumbnail)

---

## Checklist trước khi đóng sprint

- [ ] Series E2E: 3-part tutorial flow
- [ ] Scheduled publish tested với cron manual trigger
- [ ] Revision restore không corrupt slug/tags
- [ ] Migration + seed optional series demo

## Commit gợi ý

```
feat(series): multi-part article series with navigation
feat(publish): scheduled publish via cron job
feat(editor): post revision history and restore
```
