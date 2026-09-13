'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { UserMenu, UserMenuMobile } from '@/components/layout/user-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/workers', label: 'Find workers' },
  { href: '/jobs', label: 'Find work' },
  { href: '/categories', label: 'Categories' },
  { href: '/locations', label: 'Locations' },
  { href: '/for-employers', label: 'For employers' },
];

export function SiteHeader({
  className,
  href = '/',
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container-marketing flex h-16 items-center gap-6">
  <Link
      href={href}
      className={cn('flex items-center gap-2 rounded-md font-bold tracking-tight', className)}
      aria-label={` home`}
    >

      {showWordmark ? <span className="text-lg">Kaamly</span> : null}
    </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" className="md:hidden" aria-label="Open menu">
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm">
              <SheetHeader className="flex-row items-center justify-between">
                <SheetTitle asChild>
                  <span>
                    <Logo />
                  </span>
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X aria-hidden />
                </Button>
              </SheetHeader>

              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-md px-3 py-3 text-base font-medium',
                      isActive(item.href) ? 'bg-accent text-primary' : 'hover:bg-accent/60',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/for-workers"
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent/60 rounded-md px-3 py-3 text-base font-medium"
                >
                  For workers
                </Link>
              </nav>

              <div className="mt-4 flex flex-col gap-2 px-4">
                <UserMenuMobile onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
