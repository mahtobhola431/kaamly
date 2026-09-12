'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Building2,
  KanbanSquare,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

const ACTIONS = [
  { href: '/e/jobs/new', label: 'Post a new job', icon: Plus, shortcut: 'N' },
  { href: '/e/workers', label: 'Search workers', icon: Search },
  { href: '/e/applicants', label: 'Open applicant pipeline', icon: KanbanSquare },
];

const NAVIGATION = [
  { href: '/e', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/e/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/e/workers', label: 'Workers', icon: UsersRound },
  { href: '/e/teams', label: 'Teams', icon: Building2 },
  { href: '/e/messages', label: 'Messages', icon: MessageSquare },
];

/** ⌘K / Ctrl-K palette for the employer CRM, where power users live. */
export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function go(href: string): void {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hidden w-56 justify-start font-normal md:inline-flex"
      >
        <Search aria-hidden />
        Search or jump to…
        <CommandShortcut className="ml-auto">⌘K</CommandShortcut>
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Search"
      >
        <Search aria-hidden />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command menu"
        description="Search jobs, workers and pages"
      >
        <CommandInput placeholder="Search jobs, workers, pages…" />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>

          <CommandGroup heading="Actions">
            {ACTIONS.map((action) => (
              <CommandItem key={action.href} onSelect={() => go(action.href)}>
                <action.icon aria-hidden />
                {action.label}
                {action.shortcut ? <CommandShortcut>{action.shortcut}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Go to">
            {NAVIGATION.map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon aria-hidden />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
