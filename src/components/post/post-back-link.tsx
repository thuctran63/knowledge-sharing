"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPostBackTarget } from "@/lib/post-navigation";

interface PostBackLinkProps {
  published: boolean;
  isAuthor: boolean;
}

export function PostBackLink({ published, isAuthor }: PostBackLinkProps) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { href, label } = getPostBackTarget(from, { published, isAuthor });

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
    >
      <Link href={href}>
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        {label}
      </Link>
    </Button>
  );
}

function PostBackLinkFallback() {
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled
      className="gap-1.5 -ml-2 text-muted-foreground"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      Home
    </Button>
  );
}

export function PostBackLinkWithSuspense(props: PostBackLinkProps) {
  return (
    <Suspense fallback={<PostBackLinkFallback />}>
      <PostBackLink {...props} />
    </Suspense>
  );
}
