import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-20 text-center">
      <h1 className="text-6xl font-heading font-bold text-muted-foreground/20">
        404
      </h1>
      <h2 className="text-2xl font-heading font-semibold mt-4 mb-2">
        Page not found
      </h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  );
}
