import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

const HEADER_OFFSET =
  "scroll-mt-[var(--site-header-offset,5.25rem)]";

function mergeClass(existing: unknown, extra: string): string {
  const base =
    typeof existing === "string"
      ? existing
      : Array.isArray(existing)
        ? existing.join(" ")
        : "";
  return base ? `${base} ${extra}` : extra;
}

function setClass(node: Element, className: string) {
  node.properties.className = mergeClass(node.properties.className, className);
}

/** Match editor: markdown # title renders as h2 visually */
export function rehypeDemoteH1() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "h1") {
        node.tagName = "h2";
      }
    });
  };
}

export function rehypeApplyMarkdownClasses() {
  return (tree: Root) => {
    visit(tree, "element", (node, _index, parent) => {
      if (node.tagName === "code") {
        const inPre =
          parent?.type === "element" && (parent as Element).tagName === "pre";
        if (!inPre) {
          setClass(
            node,
            "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.88em] text-foreground"
          );
        }
        return;
      }

      switch (node.tagName) {
        case "h2":
          setClass(
            node,
            `${HEADER_OFFSET} mt-9 mb-3 text-xl sm:text-2xl font-heading font-semibold tracking-tight text-foreground first:mt-0`
          );
          break;
        case "h3":
          setClass(
            node,
            `${HEADER_OFFSET} mt-7 mb-2 text-lg sm:text-xl font-heading font-semibold tracking-tight text-foreground`
          );
          break;
        case "p":
          setClass(
            node,
            "my-4 text-[15px] sm:text-base leading-[1.75] text-foreground/90"
          );
          break;
        case "ul":
          setClass(
            node,
            "my-4 ml-1 list-disc space-y-2 pl-5 text-[15px] sm:text-base leading-relaxed"
          );
          break;
        case "ol":
          setClass(
            node,
            "my-4 ml-1 list-decimal space-y-2 pl-5 text-[15px] sm:text-base leading-relaxed"
          );
          break;
        case "li":
          setClass(node, "pl-1 marker:text-primary/70");
          break;
        case "blockquote":
          setClass(
            node,
            "my-6 border-l-4 border-primary/45 bg-muted/35 py-3 px-5 rounded-r-lg text-[15px] sm:text-base leading-relaxed text-foreground/90 not-italic"
          );
          break;
        case "a":
          setClass(
            node,
            "font-medium text-primary underline-offset-2 hover:underline"
          );
          break;
        case "strong":
          setClass(node, "font-semibold text-foreground");
          break;
        case "pre":
          setClass(
            node,
            "not-prose my-6 overflow-x-auto rounded-xl border border-border/20 bg-[#0f0f0f] p-4 text-[13px] leading-relaxed shadow-sm dark:bg-[#121212] [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[13px]"
          );
          break;
        case "img":
          setClass(
            node,
            "my-6 h-auto w-full max-w-full rounded-xl border border-border/40"
          );
          node.properties.loading = "lazy";
          node.properties.decoding = "async";
          break;
        case "th":
          setClass(
            node,
            "px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap"
          );
          break;
        case "td":
          setClass(
            node,
            "px-4 py-3 align-top text-foreground/85 leading-relaxed"
          );
          break;
        case "thead":
          setClass(node, "border-b border-border/60 bg-muted/40");
          break;
        case "tr":
          setClass(node, "border-b border-border/30 last:border-0");
          break;
        case "hr":
          setClass(node, "my-10 border-0 border-t border-border/60");
          break;
        default:
          break;
      }
    });
  };
}

export function rehypeWrapTables() {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (
        node.tagName !== "table" ||
        !parent ||
        parent.type !== "element" ||
        typeof index !== "number"
      ) {
        return;
      }

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: {
          className:
            "my-6 overflow-x-auto rounded-xl border border-border/60 bg-card/50",
        },
        children: [node],
      };

      setClass(
        node,
        "w-full min-w-[280px] border-collapse text-sm text-foreground/90"
      );

      (parent as Element).children[index] = wrapper;
    });
  };
}
