import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@rokdajob/shared';
import { Flag, MessageSquare, ShieldCheck } from 'lucide-react';
import { ContactForm } from '@/components/marketing/contact-form';
import { routes } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Get in touch with the rokdajob team about hiring, finding work, reporting a job or account, or a partnership.',
  alternates: { canonical: '/contact' },
};

const CHANNELS = [
  {
    icon: MessageSquare,
    title: 'Hiring or product questions',
    body: 'Tell us the trade, the area and how many workers you need. We reply within one working day.',
  },
  {
    icon: Flag,
    title: 'Reporting a job or account',
    body: 'Choose "report" in the form. Reports go to a moderation queue, not a general inbox.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety concerns',
    body: 'If someone has asked you for money to get a job, tell us. That is grounds for immediate suspension.',
  },
];

export default function ContactPage() {
  return (
    <>
      <header className="bg-muted/40 border-b">
        <div className="container-marketing py-12">
          <h1 className="text-3xl font-bold md:text-4xl">Contact {BRAND.name}</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
            Whether you are hiring, looking for work, or something has gone wrong — this reaches a
            person, not a ticket queue.
          </p>
        </div>
      </header>

      <div className="container-marketing grid gap-10 py-12 lg:grid-cols-[1fr_340px]">
        <ContactForm />

        <aside className="space-y-4">
          {CHANNELS.map((channel) => (
            <div key={channel.title} className="bg-card rounded-lg border p-5">
              <span className="bg-navy-50 text-navy-700 flex size-9 items-center justify-center rounded-md">
                <channel.icon className="size-4" aria-hidden />
              </span>
              <h2 className="mt-3 font-semibold">{channel.title}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{channel.body}</p>
            </div>
          ))}

          <div className="bg-card rounded-lg border p-5">
            <h2 className="font-semibold">Before you write</h2>
            <ul className="text-muted-foreground mt-2 space-y-2 text-sm">
              <li>
                <Link href={routes.pricing} className="hover:text-foreground underline">
                  Pricing questions
                </Link>{' '}
                are answered on the pricing page.
              </li>
              <li>
                <Link href={routes.trustSafety} className="hover:text-foreground underline">
                  Trust and safety
                </Link>{' '}
                explains what each verification badge means.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
