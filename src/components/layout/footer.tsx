import Link from "next/link";
import { BookOpen } from "lucide-react";

const linkClass =
  "text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container py-5 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group mb-4 md:hidden"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-heading font-semibold tracking-tight">
            Knowledge<span className="text-primary">.</span>
          </span>
        </Link>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-4 md:gap-8">
          <div className="hidden md:block md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <span className="text-base font-heading font-semibold tracking-tight">
                Knowledge<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A community-driven platform for sharing knowledge, insights, and
              ideas that matter.
            </p>
          </div>

          <div>
            <h4 className="text-xs md:text-sm font-semibold mb-1.5 md:mb-3">
              Explore
            </h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link href="/" className={linkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className={linkClass}>
                  Trending
                </Link>
              </li>
              <li>
                <Link href="/search" className={linkClass}>
                  Latest
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs md:text-sm font-semibold mb-1.5 md:mb-3">
              Support
            </h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link href="#" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass}>
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs md:text-sm font-semibold mb-1.5 md:mb-3">
              Community
            </h4>
            <ul className="space-y-1 md:space-y-2">
              <li>
                <Link href="#" className={linkClass}>
                  Guidelines
                </Link>
              </li>
              <li>
                <Link href="#" className={linkClass}>
                  Contribute
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-4 md:mt-10 md:pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-4">
          <p className="text-[11px] md:text-xs text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} Knowledge. All rights reserved.
          </p>
          <p className="hidden sm:block text-xs text-muted-foreground">
            Built with care for the curious.
          </p>
        </div>
      </div>
    </footer>
  );
}
