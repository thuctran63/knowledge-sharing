import { prisma } from "@/lib/db";

export async function listTags(q: string, limit: number) {
  const tags = await prisma.tag.findMany({
    where: {
      posts: {
        some: {
          post: { published: true },
        },
      },
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      _count: {
        select: {
          posts: {
            where: { post: { published: true } },
          },
        },
      },
    },
    orderBy: {
      posts: { _count: "desc" },
    },
    take: limit,
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    count: tag._count.posts,
  }));
}
