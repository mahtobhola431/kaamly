'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Activity,
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  KanbanSquare,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  UsersRound,
} from 'lucide-react';
import { LogoMark } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getMyEmployerProfile } from '@/lib/data/company';
import { useUnreadMessages } from '@/lib/data/use-unread-messages';
import { cn } from '@/lib/utils';

const SECTIONS: {
  title?: string;
  items: { href: string; label: string; icon: typeof Briefcase; exact?: boolean }[];
}[] = [
  {
    items: [
      { href: '/e', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/e/jobs', label: 'Jobs', icon: Briefcase },
      { href: '/e/applicants', label: 'Applicants', icon: KanbanSquare },
    ],
  },
  {
    title: 'Workforce',
    items: [
      { href: '/e/workers', label: 'Workers', icon: UsersRound },
      { href: '/e/teams', label: 'Teams', icon: Building2 },
    ],
  },
  {
    title: 'Manage',
    items: [
      { href: '/e/messages', label: 'Messages', icon: MessageSquare },
      { href: '/e/activity', label: 'Activity', icon: Activity },
      { href: '/e/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/e/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const unreadMessages = useUnreadMessages();

  return (
    <nav aria-label="Employer navigation" className="flex-1 space-y-6 px-3">
      {SECTIONS.map((section, index) => (
        <div key={section.title ?? index}>
          {section.title ? (
            <p className="text-sidebar-muted mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider">
              {section.title}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                    {item.href === '/e/messages' && unreadMessages > 0 ? (
                      <span
                        className="bg-action text-action-foreground ml-auto rounded-full px-1.5 text-xs font-bold"
                        data-numeric
                      >
                        {unreadMessages}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** The contractor's real company, from `/employer/me`. */
function CompanyCard() {
  const { data } = useQuery({ queryKey: ['my-employer-profile'], queryFn: getMyEmployerProfile });
  const company = data?.company;

  return (
    <Link
      href="/e/company"
      className="hover:bg-sidebar-accent/60 mx-3 flex items-center gap-3 rounded-md px-3 py-3 transition-colors"
    >
      {company?.logoUrl ? (
        // Already resized on upload and served from a CDN — next/image would only proxy it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.logoUrl}
          alt=""
          className="size-9 shrink-0 rounded-md bg-white object-contain"
        />
      ) : (
        <div className="bg-sidebar-accent flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white">
          {company ? company.name.slice(0, 2).toUpperCase() : '—'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {company?.name ?? 'Your company'}
        </p>
        <p className="text-sidebar-muted truncate text-xs">
          {data?.designation ?? (company ? 'View profile' : 'Loading…')}
        </p>
      </div>
      <ChevronRight className="text-sidebar-muted size-4 shrink-0" aria-hidden />
    </Link>
  );
}

export function EmployerSidebar() {
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="px-6">
        <Link href="/e" className="flex items-center gap-2 rounded-md">
          <LogoMark />
          <span className="text-base font-bold text-white">rokdajob</span>
          <span className="bg-sidebar-accent text-sidebar-muted rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            CRM
          </span>
        </Link>
      </div>

      <NavList onNavigate={() => setOpen(false)} />

      <div className="border-sidebar-border border-t pt-3">
        <CompanyCard />
      </div>
    </div>
  );

  return (
    <>
      <aside className="bg-sidebar hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-svh overflow-y-auto">{content}</div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon-sm" className="lg:hidden" aria-label="Open menu">
            <Menu aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-sidebar w-72 border-r-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Employer navigation</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
