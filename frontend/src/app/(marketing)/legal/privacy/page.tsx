import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What data rokdajob collects, why, who can see it, and how to get it deleted.',
  alternates: { canonical: '/legal/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p>
        This explains what we collect, why we collect it, and what control you have. It is written
        to be readable rather than exhaustive.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — your name, mobile number, and email address if you give
          one.
        </li>
        <li>
          <strong>Worker profile</strong> — your trade and skills, years of experience, area and
          travel radius, expected wage, availability, languages, and optionally your photo and
          documents.
        </li>
        <li>
          <strong>Employer profile</strong> — your business name, type, location, and the details
          you enter on job posts.
        </li>
        <li>
          <strong>Activity</strong> — jobs you post, applications you make, messages you send
          through the platform, and reviews you write.
        </li>
        <li>
          <strong>Location</strong> — the city, locality or pincode you select. We use approximate
          coordinates for that place to calculate distance. We do not track your live location.
        </li>
      </ul>

      <h2>Who can see your phone number</h2>
      <p>
        A worker&apos;s phone number is <strong>never shown on a public profile</strong>. It is
        revealed to an employer only after a contact relationship exists — that is, after the worker
        has applied to that employer&apos;s job or replied to their message. Every reveal is
        rate-limited and recorded in an audit log.
      </p>

      <h2>What is public</h2>
      <p>
        Worker profiles are visible to signed-in employers and are indexable by search engines
        without contact details. That visibility is the point of the product — it is how work finds
        you. You can set your availability to &ldquo;not looking&rdquo; at any time, which removes
        you from search results.
      </p>

      <h2>Documents you upload</h2>
      <p>
        Identity and skill documents are used only for verification. They are reviewed by our team,
        stored with restricted access, never shown to employers, and deleted on request. Do not
        upload a document we have not asked for.
      </p>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your data.</li>
        <li>We do not share your contact details with recruiters or advertisers.</li>
        <li>We do not run credit checks, background checks or police verification.</li>
        <li>We do not put personal data in URLs.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Account data is kept while your account is active. When you delete your account we remove
        your profile from the platform and retain only what we must for dispute resolution and legal
        obligations, for a limited period.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit or remove any part of your profile at any time.</li>
        <li>Hide yourself from search by setting availability to &ldquo;not looking&rdquo;.</li>
        <li>Request a copy of your data, or ask us to delete your account.</li>
        <li>Turn off non-essential notifications.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Passwords are stored hashed and never in readable form. Sessions use short-lived tokens with
        a rotating refresh token. Access to verification documents is restricted to reviewers and
        logged.
      </p>

      <h2>Contact</h2>
      <p>
        For any request about your data, use the contact form and choose &ldquo;something
        else&rdquo;. This document reflects the current build and has not yet been reviewed by
        counsel.
      </p>
    </>
  );
}
