import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-8">
      <div className="flex flex-col gap-10 lg:flex-row">
        <Skeleton className="aspect-square w-full lg:w-1/2" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-24 w-full" />
          <Skeleton className="mt-4 h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
