import Link from 'next/link';
import { BRAND } from '@rokdajob/shared';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import logo from "../layout/logos.png"


export function LogoMark({ className }: { className?: string }) {
  return (
 <Image
 src={logo}
 width={50}
 height={40}
 alt="logo"
 />
  );
}

export function Logo({
  className,
  href = '/',
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn('flex items-center gap-2 rounded-md font-bold tracking-tight', className)}
      aria-label={`${BRAND.name} home`}
    >

      {showWordmark ? <span className="text-lg">Kaamly</span> : null}
    </Link>
  );
}
