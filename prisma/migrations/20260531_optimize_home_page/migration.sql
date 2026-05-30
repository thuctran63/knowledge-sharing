-- Index for getFollowingPosts query optimization
CREATE INDEX IF NOT EXISTS "Post_published_authorId_createdAt_idx" 
ON "Post"("published", "authorId", "createdAt" DESC);

-- Index for getLatestPosts query optimization  
CREATE INDEX IF NOT EXISTS "Post_published_createdAt_idx"
ON "Post"("published", "createdAt" DESC);

-- Index for getTrendingPosts query optimization
CREATE INDEX IF NOT EXISTS "Post_published_viewCount_idx"
ON "Post"("published", "viewCount" DESC);
