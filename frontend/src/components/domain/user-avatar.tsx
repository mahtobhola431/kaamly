import { initialsOf } from '@rokdajob/shared';
import type { PublicUser } from '@rokdajob/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const SIZE = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-20 text-2xl',
} as const;

/** Deterministic tint from the name, so the same person always gets the same colour. */
const TINTS = [
  'bg-navy-100 text-navy-700',
  'bg-action-subtle text-action-hover',
  'bg-success-subtle text-success',
  'bg-navy-50 text-navy-600',
  'bg-muted text-foreground',
] as const;

function tintFor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }
  return TINTS[hash % TINTS.length] as string;
}

export function UserAvatar({
  user,
  size = 'md',
  className,
}: {
  user: Pick<PublicUser, 'name' | 'avatarUrl'>;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <Avatar className={cn(SIZE[size], className)}>
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
      <AvatarFallback className={cn('font-semibold', tintFor(user.name))}>
        {initialsOf(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
