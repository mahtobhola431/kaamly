import type { Metadata } from 'next';
import { ApplicantsBoard } from '@/components/domain/applicants-board';

export const metadata: Metadata = {
  title: 'Applicants',
  robots: { index: false, follow: false },
};

/** The pipeline board. Client-rendered — it reads and writes the contractor's own records. */
export default function ApplicantsPage() {
  return <ApplicantsBoard />;
}
