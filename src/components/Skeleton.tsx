export function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-xl bg-zadel-surface" />
      <div className="mt-4 space-y-2">
        <div className="h-2 w-16 rounded bg-zadel-surface" />
        <div className="h-4 w-3/4 rounded bg-zadel-surface" />
        <div className="h-3 w-24 rounded bg-zadel-surface" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
