import { ProductCardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden w-[240px] flex-none lg:block" />
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
