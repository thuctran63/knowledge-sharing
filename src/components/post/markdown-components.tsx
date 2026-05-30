import Image from "next/image";
import type { Components } from "react-markdown";

export const markdownComponents: Components = {
  h1: ({ children, id, ...props }) => (
    <h2
      id={id}
      className="scroll-mt-[var(--site-header-offset,5.25rem)] mt-10 mb-4 pb-2 text-2xl sm:text-[1.65rem] font-heading font-semibold tracking-tight text-foreground border-b border-border/50 first:mt-0"
      {...props}
    >
      {children}
    </h2>
  ),
  h2: ({ children, id, ...props }) => (
    <h2
      id={id}
      className="scroll-mt-[var(--site-header-offset,5.25rem)] mt-9 mb-3 text-xl sm:text-2xl font-heading font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, id, ...props }) => (
    <h3
      id={id}
      className="scroll-mt-[var(--site-header-offset,5.25rem)] mt-7 mb-2 text-lg sm:text-xl font-heading font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-4 text-[15px] sm:text-base leading-[1.75] text-foreground/90" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-4 ml-1 list-disc space-y-2 pl-5 text-[15px] sm:text-base leading-relaxed" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-4 ml-1 list-decimal space-y-2 pl-5 text-[15px] sm:text-base leading-relaxed" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="pl-1 marker:text-primary/70" {...props}>
      {children}
    </li>
  ),
  hr: () => <hr className="my-10 border-0 border-t border-border/60" />,
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 border-l-4 border-primary/45 bg-muted/35 py-3 px-5 rounded-r-lg text-[15px] sm:text-base leading-relaxed text-foreground/90 not-italic [&>p]:my-0 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border/60 bg-card/50">
      <table className="w-full min-w-[280px] text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="border-b border-border/60 bg-muted/40" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border/30 last:border-0" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 align-top text-foreground/85 leading-relaxed" {...props}>
      {children}
    </td>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="not-prose my-6 overflow-x-auto rounded-xl border border-border/20 bg-[#0f0f0f] p-4 text-[13px] leading-relaxed shadow-sm dark:bg-[#121212] [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[13px]"
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.88em] text-foreground before:content-none after:content-none"
        {...props}
      >
        {children}
      </code>
    );
  },
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="font-medium text-primary underline-offset-2 hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  img: ({ src, alt }) => {
    const url = typeof src === "string" ? src : "";
    if (!url.trim()) return null;
    return (
      <span className="relative my-6 block w-full overflow-hidden rounded-xl border border-border/40">
        <Image
          src={url}
          alt={alt ?? ""}
          width={1200}
          height={675}
          sizes="(max-width: 768px) 100vw, 800px"
          className="h-auto w-full object-cover"
        />
      </span>
    );
  },
};
