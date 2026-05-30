"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { scrollToHeading } from "@/lib/scroll-to-heading";
import { ListTree } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function MobileToc({
  headings,
  activeId,
  onNavigate,
}: {
  headings: TocHeading[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const inlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setOpen(false);
  };

  const activeHeading = headings.find((h) => h.id === activeId);

  const tocDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          "fixed inset-x-0 bottom-0 top-auto max-h-[min(75dvh,560px)] w-full max-w-full translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl border-b-0",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100",
          "data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-left-0"
        )}
      >
        <DialogHeader className="border-b border-border/60 px-4 py-3 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ListTree className="h-4 w-4 text-primary" strokeWidth={1.5} />
            On this page
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto overscroll-contain px-2 py-3">
          <TocNav
            headings={headings}
            activeId={activeId}
            onNavigate={handleNavigate}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <div ref={inlineRef}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-6 flex w-full items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 lg:hidden"
        >
          <ListTree className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">On this page</span>
            {activeHeading && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {activeHeading.text}
              </span>
            )}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {headings.length}
          </span>
        </button>
      </div>

      {showFab && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="On this page"
          className={cn(
            "fixed z-40 flex h-11 w-11 items-center justify-center rounded-full lg:hidden",
            "bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4",
            "border border-border/60 bg-background/95 text-primary shadow-lg backdrop-blur",
            "transition-all duration-200 supports-[backdrop-filter]:bg-background/80",
            "hover:bg-muted active:scale-95"
          )}
        >
          <ListTree className="h-5 w-5" strokeWidth={1.5} />
        </button>
      )}

      {tocDialog}
    </>
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
          <MobileToc
            headings={headings}
            activeId={activeId}
            onNavigate={handleNavigate}
          />
        )}

        <div ref={contentRef} className="prose-custom max-w-none">
          {children}
        </div>

        {footer ? <div className="min-w-0">{footer}</div> : null}
      </div>
    </div>
  );
}
