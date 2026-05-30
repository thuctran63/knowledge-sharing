import { prisma } from "@/lib/db";
import { formatPostListItem, postListInclude } from "@/lib/post-queries";
import type { SearchQuery } from "@/lib/validations/search";
import type { Prisma } from "@prisma/client";

export async function searchPosts(query: SearchQuery, currentUserId?: string | null) {
  const { q, page, limit, sort, tag } = query;

  if (!q.trim()) {
    return { data: [], total: 0, page: 1, totalPages: 0 };
  }

  const searchTerm = q.trim();
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {
    published: true,
    OR: [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { excerpt: { contains: searchTerm, mode: "insensitive" } },
      { content: { contains: searchTerm, mode: "insensitive" } },
      { author: { name: { contains: searchTerm, mode: "insensitive" } } },
      {
        tags: {
          some: {
            tag: { name: { contains: searchTerm, mode: "insensitive" } },
          },
        },
      },
    ],
  };

  if (tag) {
    where.tags = { some: { tag: { name: tag } } };
  }

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    sort === "trending"
      ? [{ viewCount: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: postListInclude(currentUserId),
    }),
    prisma.post.count({ where }),
  ]);

  let formattedPosts = posts.map(formatPostListItem);

  if (sort === "latest") {
    const lowerQ = searchTerm.toLowerCase();
    formattedPosts = [...formattedPosts].sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(lowerQ) ? 0 : 1;
      const bTitle = b.title.toLowerCase().includes(lowerQ) ? 0 : 1;
      if (aTitle !== bTitle) return aTitle - bTitle;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }

  return {
    data: formattedPosts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
