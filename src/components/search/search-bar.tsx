"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const navigateSearch = useDebouncedCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }, 300);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateSearch.cancel();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      inputRef.current?.blur();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative transition-all duration-200",
        focused && "scale-[1.02]"
      )}
    >
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          if (value.trim()) navigateSearch(value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="h-9 w-full rounded-full border-border/60 bg-muted/50 pl-8 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background focus-visible:border-primary/30"
      />
    </form>
  );
}
