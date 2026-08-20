export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-bg-alt ${className}`} />;
}

export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-border-subtle bg-white p-4 shadow-xs">
      <Skeleton className="h-24 w-24 flex-none" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-2 h-7 w-24 rounded-full" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 shadow-xs">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="aspect-[4/5] w-full rounded-xl" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
