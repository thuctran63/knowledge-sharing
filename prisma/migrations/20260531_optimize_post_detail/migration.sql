-- CreateIndex for faster comment queries (top-level comments only)
CREATE INDEX IF NOT EXISTS "Comment_postId_parentId_createdAt_idx" 
ON "Comment"("postId", "parentId", "createdAt" DESC);

-- CreateIndex for faster follow count queries
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" 
ON "Follow"("followingId");

-- CreateIndex for faster view record upsert
CREATE INDEX IF NOT EXISTS "PostView_postId_viewerKey_idx" 
ON "PostView"("postId", "viewerKey");
