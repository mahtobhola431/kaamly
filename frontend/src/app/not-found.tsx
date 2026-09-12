import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="container-marketing py-6">
        <Logo />
      </div>

      <main
        id="main"
        className="container-marketing flex flex-1 flex-col items-center justify-center py-16 text-center"
      >
        <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
          <Compass className="size-6" aria-hidden />
        </span>

        <h1 className="mt-5 text-2xl font-bold">This page does not exist</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          The job may have been closed, or the link may be wrong. Here is where most people were
          heading.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild variant="action">
            <Link href={routes.jobs}>Find work</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={routes.workers}>Find workers</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={routes.home}>Go home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
