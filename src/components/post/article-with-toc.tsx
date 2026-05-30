"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { scrollToHeading } from "@/lib/scroll-to-heading";
import { ListTree } from "lucide-react";

type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

const STICKY_TOP = "top-[var(--site-header-offset,5.25rem)]";

function TocNav({
  headings,
  activeId,
  onNavigate,
}: {
  headings: TocHeading[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  return (
    <ul className="space-y-1 text-xs leading-snug">
      {headings.map((heading) => (
        <li key={heading.id}>
          <button
            type="button"
            onClick={() => onNavigate(heading.id)}
            className={cn(
              "block w-full break-words text-left rounded-md px-1.5 py-1 transition-colors",
              heading.level === 3 && "pl-3 text-[11px]",
              activeId === heading.id
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {heading.text}
          </button>
        </li>
      ))}
    </ul>
  );
}

function TocPanel({
  headings,
  activeId,
  onNavigate,
  className,
}: {
  headings: TocHeading[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "rounded-xl border border-border/60 bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
      aria-label="Table of contents"
    >
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <ListTree className="h-3 w-3" strokeWidth={1.5} />
        On this page
      </p>
      <TocNav headings={headings} activeId={activeId} onNavigate={onNavigate} />
    </nav>
  );
}

interface ArticleWithTocProps {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ArticleWithToc({
  header,
  children,
  footer,
}: ArticleWithTocProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const nodes = root.querySelectorAll("h2, h3");
    const items: TocHeading[] = [];

    nodes.forEach((node) => {
      if (!node.id) return;
      items.push({
        id: node.id,
        text: node.textContent?.trim() || node.id,
        level: node.tagName === "H3" ? 3 : 2,
      });
    });

    setHeadings(items);
    setActiveId(items[0]?.id ?? null);
  }, [children]);

  useEffect(() => {
    if (headings.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleNavigate = (id: string) => {
    setActiveId(id);
    scrollToHeading(id);
  };

  const showToc = headings.length >= 2;

  return (
    <div
      className={cn(
        showToc &&
          "lg:grid lg:grid-cols-[minmax(12rem,240px)_minmax(0,1fr)] lg:gap-x-8 xl:gap-x-10 lg:items-start"
      )}
    >
      {showToc && (
        <aside
          className={cn(
            "hidden lg:block sticky z-10 self-start",
            STICKY_TOP,
            "max-h-[calc(100dvh-var(--site-header-offset,5.25rem)-1rem)] overflow-y-auto overscroll-contain"
          )}
        >
          <TocPanel
            headings={headings}
            activeId={activeId}
            onNavigate={handleNavigate}
          />
        </aside>
      )}

      <div className="min-w-0">
        {header}

        {showToc && (
          <div
            className={cn(
              "lg:hidden sticky z-20 mb-6",
              STICKY_TOP,
              "-mx-4 border-b border-border/40 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80",
              "sm:mx-0 sm:mb-8 sm:rounded-xl sm:border sm:px-0 sm:py-0"
            )}
          >
            <details className="sm:rounded-xl">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <ListTree className="h-4 w-4 text-primary" strokeWidth={1.5} />
                On this page
              </summary>
              <div className="max-h-[40vh] overflow-y-auto border-t border-border/50 px-3 py-3 sm:rounded-b-xl">
                <TocNav
                  headings={headings}
                  activeId={activeId}
                  onNavigate={handleNavigate}
                />
              </div>
            </details>
          </div>
        )}

        <div ref={contentRef} className="prose-custom max-w-none">
          {children}
        </div>

        {footer ? <div className="min-w-0">{footer}</div> : null}
      </div>
    </div>
  );
}
