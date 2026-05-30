"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bookmark, FileText } from "lucide-react";

type LibraryTab = "articles" | "saved";

export function LibraryTabs({ active }: { active: LibraryTab }) {
  const tabs: { id: LibraryTab; label: string; href: string; icon: typeof FileText }[] =
    [
      { id: "articles", label: "My articles", href: "/drafts", icon: FileText },
      {
        id: "saved",
        label: "Saved",
        href: "/drafts?tab=saved",
        icon: Bookmark,
      },
    ];

  return (
    <div className="mb-8 inline-flex w-full max-w-md items-center gap-1 rounded-lg bg-muted/50 p-1 sm:w-auto">
      {tabs.map(({ id, label, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-initial",
            active === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          {label}
        </Link>
      ))}
    </div>
  );
}
