import type { Metadata } from 'next';
import { CircleAlert, FileCheck2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCurrentWorker } from '@/lib/data/worker-area';

export const metadata: Metadata = {
  title: 'Documents and verification',
  robots: { index: false, follow: false },
};

const DOCUMENT_TYPES = [
  {
    id: 'AADHAAR',
    label: 'Aadhaar card',
    help: 'Used only to confirm your identity. Employers never see it.',
    status: 'APPROVED' as const,
  },
  {
    id: 'SKILL_CERTIFICATE',
    label: 'ITI or skill certificate',
    help: 'Adds a verified skill badge to your profile.',
    status: 'PENDING' as const,
  },
  {
    id: 'DRIVING_LICENSE',
    label: 'Driving licence',
    help: 'Required for driver and forklift operator jobs.',
    status: 'MISSING' as const,
  },
];

const STATUS_LABEL = {
  APPROVED: 'Verified',
  PENDING: 'Under review',
  REJECTED: 'Rejected',
  MISSING: 'Not uploaded',
} as const;

export default async function DocumentsPage() {
  const worker = await getCurrentWorker();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Documents and verification</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Verified workers get contacted more often. Only our review team sees these files — employers
        never do.
      </p>

      <div className="border-action/25 bg-action-subtle mt-5 flex gap-3 rounded-lg border p-4">
        <CircleAlert className="text-action-hover mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-sm leading-relaxed">
          Never give your original documents to an employer. A photo or photocopy is always enough,
          and no genuine employer will keep your original.
        </p>
      </div>

      <ul className="mt-5 space-y-3">
        {DOCUMENT_TYPES.map((document) => (
          <li key={document.id} className="bg-card rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="text-muted-foreground size-4" aria-hidden />
                  <p className="font-medium">{document.label}</p>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">{document.help}</p>
              </div>

              <Badge
                variant={
                  document.status === 'APPROVED'
                    ? 'success'
                    : document.status === 'PENDING'
                      ? 'action'
                      : 'muted'
                }
              >
                {STATUS_LABEL[document.status]}
              </Badge>
            </div>

            <Button variant="outline" size="sm" className="mt-3" disabled>
              <Upload aria-hidden />
              {document.status === 'MISSING' ? 'Upload' : 'Replace'}
            </Button>
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mt-4 text-xs">
        Uploads are disabled in this build — file storage is wired up with the API. Your current
        verification state: phone {worker.verification.phone ? 'verified' : 'not verified'}, profile{' '}
        {worker.verification.profile ? 'verified' : 'not verified'}, documents{' '}
        {worker.verification.documents ? 'verified' : 'not verified'}.
      </p>
    </div>
  );
}
