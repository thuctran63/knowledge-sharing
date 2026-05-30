"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PostFeed } from "@/components/post/post-feed";
import { Input } from "@/components/ui/input";
import { Hash, Loader2, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostCardData } from "@/types";

type TagItem = { id: string; name: string; count: number };

export function TagsContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [topTags, setTopTags] = useState<TagItem[]>([]);
  const [searchResults, setSearchResults] = useState<TagItem[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery.trim());
  const lastAutoSelectKey = useRef("");

  const visibleTags = searched && query.trim() ? searchResults : topTags;

  const fetchTopTags = useCallback(async () => {
    setLoadingTop(true);
    try {
      const res = await fetch("/api/tags?limit=10");
      if (!res.ok) throw new Error("Failed to load tags");
      setTopTags(await res.json());
    } catch {
      setTopTags([]);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  const searchTags = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    setLoadingSearch(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/tags?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Failed to search tags");
      setSearchResults(await res.json());
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  const fetchPostsForTag = useCallback(
    async (tagName: string) => {
      setLoadingPosts(true);
      try {
        const params = new URLSearchParams({
          tag: tagName,
          limit: "10",
          page: "1",
        });
        if (session?.user?.id) {
          params.set("userId", session.user.id);
        }
        const res = await fetch(`/api/posts?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load posts");
        const data = await res.json();
        setPosts(data.data || []);
        setPostsTotalPages(data.totalPages ?? 1);
      } catch {
        setPosts([]);
        setPostsTotalPages(1);
      } finally {
        setLoadingPosts(false);
      }
    },
    [session?.user?.id]
  );

  useEffect(() => {
    void fetchTopTags();
  }, [fetchTopTags]);

  useEffect(() => {
    if (initialQuery.trim()) {
      void searchTags(initialQuery);
    }
  }, [initialQuery, searchTags]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void searchTags(query);
      const trimmed = query.trim();
      const url = trimmed ? `/tags?q=${encodeURIComponent(trimmed)}` : "/tags";
      window.history.replaceState(null, "", url);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchTags]);

  useEffect(() => {
    const key =
      searched && query.trim()
        ? `search:${query}:${searchResults.map((t) => t.id).join(",")}`
        : `top:${topTags.map((t) => t.id).join(",")}`;

    if (!key.endsWith(":") && lastAutoSelectKey.current === key) return;
    lastAutoSelectKey.current = key;

    if (searched && query.trim()) {
      setSelectedTag(searchResults[0]?.name ?? null);
    } else {
      setSelectedTag(topTags[0]?.name ?? null);
    }
  }, [searched, query, topTags, searchResults]);

  useEffect(() => {
    if (selectedTag) {
      void fetchPostsForTag(selectedTag);
    } else {
      setPosts([]);
    }
  }, [selectedTag, fetchPostsForTag]);

  const tagsLoading = searched && query.trim() ? loadingSearch : loadingTop;
  const selectedMeta = visibleTags.find((t) => t.name === selectedTag);

  return (
    <>
      <div
        className="mb-8 animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-13 pl-12 pr-4 text-base rounded-xl"
            aria-label="Search tags"
          />
        </div>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-[minmax(11rem,16rem)_1fr] gap-8 md:gap-10 animate-fade-in"
        style={{ animationDelay: "150ms" }}
      >
        <aside className="md:pr-2 md:border-r md:border-border/50">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {searched && query.trim() ? "Matching tags" : "Top tags"}
          </h2>

          {tagsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : visibleTags.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 px-4 text-center">
              <Hash
                className="h-7 w-7 text-muted-foreground/40 mb-2 mx-auto"
                strokeWidth={1.5}
              />
              <p className="text-sm text-muted-foreground">
                {searched && query.trim()
                  ? "No tags match your search."
                  : "No tags yet."}
              </p>
            </div>
          ) : (
            <nav className="space-y-1" aria-label="Tags">
              {visibleTags.map((tag) => {
                const active = selectedTag === tag.name;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedTag(tag.name)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors min-h-[44px]",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="truncate">{tag.name}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        active ? "text-primary/80" : "text-muted-foreground"
                      )}
                    >
                      {tag.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        <section className="min-w-0">
          {selectedTag ? (
            <>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-heading font-semibold tracking-tight flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary shrink-0" strokeWidth={1.5} />
                    {selectedTag}
                  </h2>
                  {selectedMeta && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedMeta.count} published article
                      {selectedMeta.count !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <Link
                  href={`/tag/${encodeURIComponent(selectedTag)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loadingPosts ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-20 text-center text-sm text-muted-foreground">
                  No published articles for this tag yet.
                </div>
              ) : (
                <PostFeed
                  key={selectedTag}
                  initialPosts={posts}
                  initialPage={1}
                  initialTotalPages={postsTotalPages}
                  tag={selectedTag}
                  userId={session?.user?.id ?? null}
                  emptyMessage="No published articles for this tag yet."
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              Select a tag to view articles.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
