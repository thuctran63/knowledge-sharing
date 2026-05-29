export default function MainLoading() {
  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-lg bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
          <div className="space-y-4 pt-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
