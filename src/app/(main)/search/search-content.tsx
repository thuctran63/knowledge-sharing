"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PostCard } from "@/components/post/post-card";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import type { PostCardData } from "@/types";

export function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "latest";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
    window.history.replaceState(
      null,
      "",
      `/search?q=${encodeURIComponent(query.trim())}`
    );
  };

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== query) {
      setQuery(q);
      if (q.trim()) doSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mb-8 animate-fade-in"
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : searched ? (
        results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Found {results.length} result
              {results.length !== 1 ? "s" : ""}
            </p>
            {results.map((post, i) => (
              <div
                key={post.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <PostCard post={post} />
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
              <Link href="/tags" className="text-primary hover:underline">
                browse tags
              </Link>
              .
            </p>
          </div>
        )
      ) : initialSort === "latest" ? (
        <p className="text-center text-muted-foreground py-20">
          Start typing to search articles.
        </p>
      ) : null}
    </>
  );
}
