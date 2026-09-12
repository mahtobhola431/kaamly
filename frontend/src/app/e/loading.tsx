import { StatRowSkeleton, TableSkeleton } from '@/components/feedback/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function EmployerLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-5">
        <StatRowSkeleton />
      </div>
      <div className="mt-6">
        <TableSkeleton />
      </div>
      <span className="sr-only" role="status">
        Loading
      </span>
    </div>
  );
}
