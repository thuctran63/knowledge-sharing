export type PostBackFrom = "home" | "library";

export function postHref(slug: string, from?: PostBackFrom) {
  const path = `/post/${slug}`;
  if (!from) return path;
  return `${path}?from=${from}`;
}

export function getPostBackTarget(
  from: string | null,
  options: { published: boolean; isAuthor: boolean }
) {
  if (from === "library") {
    return { href: "/drafts", label: "Library" as const };
  }

  if (from === "home") {
    return { href: "/", label: "Home" as const };
  }

  if (!options.published && options.isAuthor) {
    return { href: "/drafts", label: "Library" as const };
  }

  return { href: "/", label: "Home" as const };
}
