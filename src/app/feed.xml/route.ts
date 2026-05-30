import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function loadFeedPosts() {
  return prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });
}

export async function GET() {
  const base = getSiteUrl();

  let posts: Awaited<ReturnType<typeof loadFeedPosts>> = [];
  try {
    posts = await loadFeedPosts();
  } catch {
    // DB unavailable at build or misconfigured DATABASE_URL
  }

  const items = posts

    .map((post) => {
      const link = `${base}/post/${post.slug}`;
      const description =
        post.excerpt?.trim() ||
        post.content.replace(/[#>*`[\]()!-]/g, "").slice(0, 280).trim();

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${post.createdAt.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      <author>${escapeXml(post.author.name || "Unknown")}</author>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Knowledge — Share ideas that matter</title>
    <link>${escapeXml(base)}</link>
    <description>A community-driven platform for sharing knowledge and insights.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
