import { CardGridSkeleton } from '@/components/feedback/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkerLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6">
        <CardGridSkeleton count={4} variant="job" className="sm:grid-cols-2 xl:grid-cols-3" />
      </div>
      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  );
}
