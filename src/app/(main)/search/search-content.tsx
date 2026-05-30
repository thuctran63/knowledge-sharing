"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PostCard } from "@/components/post/post-card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostCardData } from "@/types";

type SortOption = "latest" | "trending";

export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialSort = (searchParams.get("sort") as SortOption) || "latest";
  const initialTag = searchParams.get("tag") || "";

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortOption>(
    initialSort === "trending" ? "trending" : "latest"
  );
  const [tagFilter] = useState(initialTag);
  const [results, setResults] = useState<PostCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);

  const buildSearchUrl = useCallback(
    (q: string, sortValue: SortOption) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (sortValue !== "latest") params.set("sort", sortValue);
      if (tagFilter) params.set("tag", tagFilter);
      const qs = params.toString();
      return qs ? `/search?${qs}` : "/search";
    },
    [tagFilter]
  );

  const doSearch = useCallback(
    async (q: string, sortValue: SortOption = sort) => {
      if (!q.trim()) {
        setResults([]);
        setTotal(0);
        setSearched(false);
        return;
      }

      setLoading(true);
      setSearched(true);

      try {
        const params = new URLSearchParams({
          q: q.trim(),
          sort: sortValue,
        });
        if (tagFilter) params.set("tag", tagFilter);

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        setResults(data.data || []);
        setTotal(data.total ?? (data.data?.length || 0));
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [sort, tagFilter]
  );

  useEffect(() => {
    if (initialQuery) {
      void doSearch(initialQuery, initialSort === "trending" ? "trending" : "latest");
    }
  }, [initialQuery, initialSort, doSearch]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const nextSort = (searchParams.get("sort") as SortOption) || "latest";
    const normalizedSort = nextSort === "trending" ? "trending" : "latest";

    if (q !== query) setQuery(q);
    if (normalizedSort !== sort) setSort(normalizedSort);

    if (q.trim()) {
      void doSearch(q, normalizedSort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void doSearch(query, sort);
    window.history.replaceState(null, "", buildSearchUrl(query, sort));
  };

  const handleSortChange = (next: SortOption) => {
    setSort(next);
    if (query.trim()) {
      void doSearch(query, next);
      window.history.replaceState(null, "", buildSearchUrl(query, next));
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mb-6 animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-13 pl-12 pr-4 text-base rounded-xl"
          />
        </div>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-2 animate-fade-in">
        <span className="text-xs text-muted-foreground mr-1">Sort by</span>
        {(
          [
            ["latest", "Latest"],
            ["trending", "Trending"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => handleSortChange(value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              sort === value
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        {tagFilter ? (
          <span className="ml-auto text-xs text-muted-foreground">
            Tag: <strong className="text-foreground">#{tagFilter}</strong>
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : searched ? (
        results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Found {total} result{total !== 1 ? "s" : ""}
            </p>
            {results.map((post, i) => (
              <div
                key={post.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <PostCard post={post} highlightQuery={query.trim()} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search
                className="h-8 w-8 text-muted-foreground"
                strokeWidth={1}
              />
            </div>
            <h3 className="text-lg font-heading font-semibold mb-1">
              No results found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try adjusting your search terms or{" "}
              <Link
                href="/search?tab=tags"
                className="text-primary hover:underline"
              >
                browse tags
              </Link>
              .
            </p>
          </div>
        )
      ) : (
        <p className="text-center text-muted-foreground py-20">
          Start typing to search articles.
        </p>
      )}
    </>
  );
}
