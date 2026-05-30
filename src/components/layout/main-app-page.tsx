import { cn } from "@/lib/utils";

/**
 * Same horizontal bounds as the site header (`container`: logo → avatar).
 * Use for Home, Library, Notifications so width stays aligned when navigating.
 */
interface MainAppPageProps {
  children: React.ReactNode;
  className?: string;
}

export function MainAppPage({ children, className }: MainAppPageProps) {
  return (
    <div className={cn("container py-8 md:py-12", className)}>{children}</div>
  );
}
