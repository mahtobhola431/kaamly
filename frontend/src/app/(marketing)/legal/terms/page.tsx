import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The rules for using rokdajob as a worker or as an employer.',
  alternates: { canonical: '/legal/terms' },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <h1>Terms of use</h1>
      <p>
        These terms cover your use of rokdajob. By creating an account, posting a job or applying
        for work, you agree to them.
      </p>

      <h2>1. What rokdajob is</h2>
      <p>
        rokdajob is a platform that helps employers find workers and helps workers find work near
        them. We are <strong>not</strong> an employer, a labour contractor, or a staffing agency. We
        do not employ any worker listed on the platform, and we are not a party to any agreement
        made between an employer and a worker.
      </p>

      <h2>2. Who can use it</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>You must give accurate information about yourself or your business.</li>
        <li>
          One person may hold one worker account. Employers may hold one account per business.
        </li>
      </ul>

      <h2>3. Wages and payment</h2>
      <p>
        Wages, working hours and duration are agreed directly between the employer and the worker.
        rokdajob does not handle, hold or guarantee any payment, and does not take a share of wages.
        Any dispute about payment is between the two parties.
      </p>

      <h2>4. No fees from workers</h2>
      <p>
        Workers never pay rokdajob, and no employer on this platform may charge a worker a fee,
        deposit or commission of any kind in connection with a job. Doing so is grounds for
        immediate and permanent suspension.
      </p>

      <h2>5. What you may not post</h2>
      <ul>
        <li>
          Jobs that do not exist, or that are advertised on behalf of an undisclosed third party.
        </li>
        <li>
          Work that is unlawful, unsafe, or that requires a licence the worker will not be given.
        </li>
        <li>Requirements that unlawfully discriminate against a person.</li>
        <li>Requests for money, original identity documents, or personal data you do not need.</li>
        <li>Contact details in place of using the platform to make contact.</li>
      </ul>

      <h2>6. Verification badges</h2>
      <p>
        A verification badge indicates a specific check we carried out — for example, that a phone
        number was confirmed by one-time password, or that a profile was reviewed by our team. It is{' '}
        <strong>not</strong> a background check, a police verification, or a government identity
        verification, and must not be relied on as one.
      </p>

      <h2>7. Ratings and reviews</h2>
      <p>
        Reviews may be left once per job by each side. Reviews must describe your own experience of
        the work. We remove reviews that are abusive, contain personal data, or are traded for
        payment.
      </p>

      <h2>8. Suspension</h2>
      <p>
        We may suspend or remove an account that breaks these terms, is the subject of credible
        reports, or puts other users at risk. Where we can, we tell you why.
      </p>

      <h2>9. Liability</h2>
      <p>
        rokdajob provides the platform as it is. We are not liable for the conduct of any employer
        or worker, for work performed or not performed, for wages unpaid, or for any injury or loss
        arising at a worksite. You are responsible for satisfying yourself about the person you hire
        or the job you accept.
      </p>

      <h2>10. Changes</h2>
      <p>
        We will update these terms as the product develops. If a change materially affects you, we
        will tell you before it takes effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms can be sent through the contact form. This document was last
        revised alongside the current product build and has not yet been reviewed by counsel.
      </p>
    </>
  );
}
