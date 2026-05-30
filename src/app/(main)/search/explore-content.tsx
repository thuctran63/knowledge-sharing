"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchContent } from "./search-content";
import { TagsContent } from "../tags/tags-content";
import { cn } from "@/lib/utils";

type ExploreTab = "articles" | "tags";

const TABS: { id: ExploreTab; label: string }[] = [
  { id: "articles", label: "Articles" },
  { id: "tags", label: "Tags" },
];

export function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: ExploreTab =
    searchParams.get("tab") === "tags" ? "tags" : "articles";

  const setTab = useCallback(
    (next: ExploreTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "articles") {
        params.delete("tab");
      } else {
        params.set("tab", "tags");
      }
      const qs = params.toString();
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <>
      <div
        className="mb-8 flex gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 animate-fade-in"
        role="tablist"
        aria-label="Explore"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tags" ? <TagsContent /> : <SearchContent />}
    </>
  );
}
