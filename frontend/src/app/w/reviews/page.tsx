import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import { RatingStars } from '@/components/domain/rating-stars';
import { UserAvatar } from '@/components/domain/user-avatar';
import { EmptyState } from '@/components/feedback/empty-state';
import { demoAgo } from '@/data/time';
import { getCurrentWorker, getMyReviews } from '@/lib/data/worker-area';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Reviews about you',
  robots: { index: false, follow: false },
};

export default async function WorkerReviewsPage() {
  const [worker, reviews] = await Promise.all([getCurrentWorker(), getMyReviews()]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Reviews about you</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Employers rate you after a job finishes. One review per job, so scores cannot be inflated.
      </p>

      <div className="bg-card mt-5 flex items-center gap-5 rounded-lg border p-5">
        <div className="text-center">
          <p className="text-3xl font-bold" data-numeric>
            {worker.ratingAvg.toFixed(1)}
          </p>
          <RatingStars rating={worker.ratingAvg} size="sm" showValue={false} />
          <p className="text-muted-foreground mt-1 text-xs" data-numeric>
            {worker.ratingCount} reviews
          </p>
        </div>
        <div className="text-muted-foreground flex-1 text-sm">
          <p>
            <span className="text-foreground font-medium">{worker.completedJobs}</span> jobs
            completed through rokdajob.
          </p>
          <p className="mt-1">
            A high rating moves you up in employer search results for your trade and area.
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={Star}
          title="No reviews yet"
          description="Finish a job through rokdajob and the employer can rate your work here."
          actions={[{ label: 'Find work near you', href: routes.w.jobs, variant: 'action' }]}
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="bg-card rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserAvatar user={review.author} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{review.author.name}</p>
                    <p className="text-muted-foreground text-xs">{review.job.title}</p>
                  </div>
                </div>
                <RatingStars rating={review.rating} size="sm" showValue={false} />
              </div>
              <p className="mt-3 text-sm leading-relaxed">{review.comment}</p>
              <p className="text-muted-foreground mt-2 text-xs">{demoAgo(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
