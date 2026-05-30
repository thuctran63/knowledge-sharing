import type { Metadata } from "next";
import { Suspense } from "react";
import { TagsContent } from "./tags-content";

export const metadata: Metadata = {
  title: "Browse tags",
  description: "Discover popular tags and find articles by topic.",
};

export default function TagsPage() {
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-heading font-semibold tracking-tight">
            Browse tags
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pick a tag on the left — articles for the top tag shown on the right.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="animate-shimmer h-8 w-8 rounded-full bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%]" />
            </div>
          }
        >
          <TagsContent />
        </Suspense>
      </div>
    </div>
  );
}
