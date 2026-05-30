import { prisma } from "@/lib/db";
import {
  formatPostListItem,
  postListInclude,
  POSTS_PAGE_SIZE,
} from "@/lib/post-queries";
import { notifyFollowersOfNewPost } from "@/lib/notifications";
import { queueR2Deletion } from "@/services/upload.service";
import { deletePostImages, postImagesPrefix } from "@/lib/r2";
import type { CreatePostInput, ListPostsQuery, UpdatePostInput } from "@/lib/validations/post";
import { ServiceError } from "@/lib/service-error";
import type { Prisma } from "@prisma/client";

async function upsertPostTags(
  tx: Prisma.TransactionClient,
  postId: string,
  tagNames: string[]
) {
  const tagData = await Promise.all(
    tagNames.map(async (name) => {
      const tag = await tx.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      return { postId, tagId: tag.id };
    })
  );

  await tx.postTag.deleteMany({ where: { postId } });
  if (tagData.length > 0) {
    await tx.postTag.createMany({ data: tagData });
  }
}

const postDetailInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  },
  tags: { include: { tag: true } },
  _count: {
    select: { comments: true, likes: true, bookmarks: true },
  },
} as const;

function formatPostDetail<T extends { tags: { tag: { id: string; name: string } }[] }>(
  post: T
) {
  return {
    ...post,
    tags: post.tags.map((pt) => pt.tag),
  };
}

export async function listPosts(query: ListPostsQuery) {
  const { limit, tag, sort, feed, userId: currentUserId } = query;
  const cursor = query.cursor;
  const page = query.page;
  const useCursor = page === undefined;

  const where: Prisma.PostWhereInput = { published: true };

  if (feed === "following") {
    if (!currentUserId) {
      return useCursor
        ? { data: [], nextCursor: null as string | null }
        : { data: [], total: 0, page: page ?? 1, totalPages: 0 };
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);
    where.authorId = followingIds.length
      ? { in: followingIds }
      : { in: ["__none__"] };
  }

  if (tag) {
    where.tags = { some: { tag: { name: tag } } };
  }

  const orderBy: Prisma.PostOrderByWithRelationInput =
    sort === "trending" ? { viewCount: "desc" } : { createdAt: "desc" };

  const include = postListInclude(currentUserId);

  if (useCursor) {
    const posts = await prisma.post.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include,
    });

    const hasMore = posts.length > limit;
    const data = posts.slice(0, limit).map(formatPostListItem);

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null,
    };
  }

  const skip = ((page ?? 1) - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    data: posts.map(formatPostListItem),
    total,
    page: page ?? 1,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: postDetailInclude,
  });

  if (!post) return null;
  return formatPostDetail(post);
}

export async function createPost(authorId: string, data: CreatePostInput) {
  const { tags, ...postData } = data;

  const existingSlug = await prisma.post.findUnique({
    where: { slug: postData.slug },
  });
  if (existingSlug) {
    throw new ServiceError("A post with this slug already exists", 409, "CONFLICT");
  }

  const post = await prisma.post.create({
    data: {
      title: postData.title,
      slug: postData.slug,
      content: postData.content,
      excerpt: postData.excerpt ?? undefined,
      published: postData.published ?? false,
      authorId,
      ...(tags?.length
        ? {
            tags: {
              create: await Promise.all(
                tags.map(async (name) => {
                  const tag = await prisma.tag.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                  });
                  return { tagId: tag.id };
                })
              ),
            },
          }
        : {}),
    },
    include: {
      author: postDetailInclude.author,
      tags: { include: { tag: true } },
    },
  });

  if (post.published) {
    await notifyFollowersOfNewPost(authorId, post.id);
  }

  return formatPostDetail(post);
}

export async function updatePost(
  postId: string,
  authorId: string,
  data: UpdatePostInput
) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ServiceError("Post not found", 404, "NOT_FOUND");
  if (post.authorId !== authorId) throw new ServiceError("Forbidden", 403, "FORBIDDEN");

  const { tags, ...fields } = data;

  if (fields.slug && fields.slug !== post.slug) {
    const existingSlug = await prisma.post.findUnique({
      where: { slug: fields.slug },
    });
    if (existingSlug) {
      throw new ServiceError("A post with this slug already exists", 409, "CONFLICT");
    }
  }

  if (tags !== undefined) {
    await prisma.$transaction(async (tx) => {
      await upsertPostTags(tx, postId, tags);
    });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(fields.title !== undefined ? { title: fields.title } : {}),
      ...(fields.slug !== undefined ? { slug: fields.slug } : {}),
      ...(fields.content !== undefined ? { content: fields.content } : {}),
      ...(fields.excerpt !== undefined ? { excerpt: fields.excerpt } : {}),
      ...(fields.published !== undefined ? { published: fields.published } : {}),
    },
    include: {
      author: postDetailInclude.author,
      tags: { include: { tag: true } },
    },
  });

  if (fields.published === true && !post.published) {
    await notifyFollowersOfNewPost(authorId, postId);
  }

  if (fields.content !== undefined && fields.content !== post.content) {
    const { cleanupOrphanPostImages } = await import("@/lib/r2");
    await cleanupOrphanPostImages(postId, fields.content, post.content);
  }

  return formatPostDetail(updated);
}

export async function deletePost(postId: string, authorId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ServiceError("Post not found", 404, "NOT_FOUND");
  if (post.authorId !== authorId) throw new ServiceError("Forbidden", 403, "FORBIDDEN");

  await prisma.post.delete({ where: { id: postId } });

  try {
    await deletePostImages(postId);
  } catch {
    await queueR2Deletion(postImagesPrefix(postId));
  }
}

export { POSTS_PAGE_SIZE };
