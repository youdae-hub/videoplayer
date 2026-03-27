export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg bg-neutral-900">
          <div className="aspect-video animate-pulse bg-neutral-800" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="h-3 w-full animate-pulse rounded bg-neutral-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
