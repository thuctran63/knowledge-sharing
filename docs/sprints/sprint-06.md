# Sprint 6 — Scale & Trust

**Theme:** Search scale, bảo vệ platform trước khi public rộng.  
**Effort:** ~8–12 ngày  
**Status:** `planned`  
**Dependency:** Sprint 4 search baseline; nên có traffic/real content để validate FTS

---

## Mục tiêu

1. Postgres **full-text search** thay ILIKE.
2. **Rate limiting** API nhạy cảm.
3. **Moderation** cơ bản — report, admin role.
4. **Email verification** thật (optional nhưng khuyến nghị trước public).

---

## Task 6.1 — Full-text search (Postgres tsvector)

### Migration SQL

```sql
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, excerpt, content ON "Post"
  FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

CREATE INDEX post_search_idx ON "Post" USING GIN(search_vector);

-- Backfill existing rows
UPDATE "Post" SET search_vector = ...;
```

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/api/search/route.ts` | `WHERE search_vector @@ plainto_tsquery('simple', $q)` + `ts_rank` |
| `prisma/schema.prisma` | Document column (Prisma unsupported → raw query hoặc `@db.Unsupported`) |

### Tiếng Việt

- Config `simple` — OK cho mixed VI/EN, không stemming.
- Nâng cao: extension **`unaccent`**, custom config — nếu search VI là pain point chính.

### Khi nào chuyển Meilisearch

- \>50k bài **và** cần typo tolerance / instant search <50ms p95.
- Team sẵn sàng ops thêm 1 service.

### Acceptance criteria

- [ ] Search "postgresql database" rank title match cao hơn body-only
- [ ] Performance: `EXPLAIN ANALYZE` dùng GIN index
- [ ] Backfill không timeout production (batch update)

---

## Task 6.2 — Rate limiting

### Tech

**Upstash Redis** + `@upstash/ratelimit`:

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})
```

### Áp dụng

| Route | Limit gợi ý |
|-------|-------------|
| `POST /api/comments` | 10/min/user |
| `POST /api/auth/register` | 3/hour/IP |
| `POST /api/likes` | 30/min/user |
| `POST /api/posts` | 20/hour/user |

### Fallback không Redis

Postgres table `RateLimitBucket` — sliding window — chậm hơn nhưng 0 infra mới.

### Env

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Acceptance criteria

- [ ] Spam 11 comments/phút → 429 Too Many Requests
- [ ] Response header `Retry-After` (optional)

---

## Task 6.3 — Moderation

### Schema

```prisma
enum UserRole {
  USER
  MOD
  ADMIN
}

model Report {
  id          String   @id @default(cuid())
  reporterId  String
  reason      String
  details     String?  @db.Text
  postId      String?
  commentId   String?
  status      String   @default("OPEN") // OPEN | REVIEWED | DISMISSED
  createdAt   DateTime @default(now())
  @@index([status, createdAt])
}

model User {
  role UserRole @default(USER)
}
```

### Bổ sung

| File | Mô tả |
|------|--------|
| `POST /api/reports` | User report post/comment |
| `src/app/(main)/admin/reports/page.tsx` | MOD/ADMIN queue |
| `src/lib/auth-guards.ts` | `requireRole('MOD')` |

### Actions admin

- Dismiss report
- Unpublish post
- Delete comment
- Ban user (soft — `User.bannedAt` optional)

### Acceptance criteria

- [ ] User report → hiện trong admin queue
- [ ] Non-admin không access `/admin/*`
- [ ] MOD không thể promote role (chỉ ADMIN)

---

## Task 6.4 — Email verification

### Vấn đề

Register hiện set `emailVerified: new Date()` ngay — không verify email thật.

### Chỉnh sửa

| File | Thay đổi |
|------|----------|
| `src/app/api/auth/register/route.ts` | `emailVerified: null`, gửi verification email |
| `src/lib/auth.ts` | Credentials login reject nếu chưa verify |
| `src/app/api/auth/verify/route.ts` | Token verify link |

### Tech

- **Resend** transactional email
- Token: `VerificationToken` model (NextAuth đã có)

### Acceptance criteria

- [ ] Register → email verify link
- [ ] Login blocked until verified (credentials)
- [ ] Google OAuth auto-verified

---

## Task 6.5 — Security hardening checklist

Cross-ref [performance-plan.md](../performance-plan.md):

| Item | File |
|------|------|
| Input size validation | All POST API routes |
| Tag transaction | `posts/[id]/route.ts` |
| CSP headers | `next.config.js` headers |
| Sanitize markdown XSS | review `react-markdown` allowed elements |

---

## Task 6.6 — (Optional) Public analytics

- Plausible / Umami self-hosted — privacy-friendly site analytics
- **Không thay** author dashboard nội bộ (Sprint 4)

---

## Checklist trước khi đóng sprint

- [ ] FTS migration tested staging
- [ ] Rate limit không block normal usage
- [ ] Admin role tested với 2 accounts
- [ ] Security review report flow

## Commit gợi ý

```
feat(search): postgres full-text search with tsvector
feat(security): rate limiting on comment and auth endpoints
feat(moderation): report queue and admin roles
fix(auth): require email verification for credential signup
```

---

## Sau Sprint 6 — Backlog dài hạn

Không nằm trong 6 sprint hiện tại; ghi nhận khi cần:

- PWA / offline read
- Multi-language UI (i18n)
- API public REST/GraphQL cho mobile app
- Meilisearch migration
- Real-time collaborative editing
- AI writing assist (summarize, tag suggest)
