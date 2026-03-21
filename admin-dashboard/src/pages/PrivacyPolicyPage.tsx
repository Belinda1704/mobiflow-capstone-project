import { Link } from 'react-router-dom';

import { ui } from '../styles/ui';

export function PrivacyPolicyPage() {
  const effectiveDate = '21 March 2026';
  const lastUpdated = '21 March 2026';
  const version = 'v1.0';
  const contactEmail = 'privacy@mobiflow.com';

  return (
    <div className="min-h-screen bg-(--page-bg) px-6 py-10 sm:py-12">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className={`${ui.panel} p-6 sm:p-8`}>
          <p className={ui.sectionEyebrow}>MobiFlow Admin Console</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-(--border-muted) bg-(--panel-soft) px-2.5 py-1 text-xs font-semibold text-(--text-main)">
              {version}
            </span>
            <span className="rounded-full border border-(--border-muted) bg-(--panel-soft) px-2.5 py-1 text-xs text-(--text-muted)">
              Last updated: {lastUpdated}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-(--text-main)">Privacy Policy</h1>
          <p className="mt-2 text-sm text-(--text-soft)">Effective date: {effectiveDate}</p>
          <p className="mt-4 text-sm leading-6 text-(--text-muted)">
            This policy explains how data is handled in the MobiFlow Admin Console. The dashboard is designed for
            privacy-first reporting with aggregated indicators, while personal transaction identity details remain
            outside admin-facing analytics views.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">What admins can view</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-(--text-muted)">
              <li>Platform-level counts, trends, and activity summaries.</li>
              <li>Support-related records required for account help workflows.</li>
              <li>Aggregated insights used for operations and reporting.</li>
            </ul>
          </article>
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">What admins must not do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-(--text-muted)">
              <li>Do not attempt to identify individual users from aggregate data.</li>
              <li>Do not share exported data with unauthorised parties.</li>
              <li>Do not use dashboard data for unrelated personal or commercial purposes.</li>
            </ul>
          </article>
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">Data security</h2>
            <p className="mt-3 text-sm leading-6 text-(--text-muted)">
              Access is controlled through approved admin accounts and role checks. Admins must keep credentials secure
              and report any suspected misuse or exposure immediately.
            </p>
          </article>
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">Policy updates</h2>
            <p className="mt-3 text-sm leading-6 text-(--text-muted)">
              This policy may be revised to reflect product updates, compliance guidance, or research governance
              changes. The current version is always published on this page.
            </p>
          </article>
        </section>

        <section className={`${ui.panel} space-y-3 p-5`}>
          <p className="text-sm text-(--text-main)">Privacy contact</p>
          <div className="rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-(--text-soft)">Privacy and data concerns</p>
            <a
              href={`mailto:${contactEmail}`}
              className="mt-1 inline-block text-sm font-medium text-(--text-main) underline underline-offset-2 hover:text-(--text-muted)">
              {contactEmail}
            </a>
          </div>
          <div className="flex justify-end">
          <Link to="/login" className={ui.primaryButton}>
            Back to login
          </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
