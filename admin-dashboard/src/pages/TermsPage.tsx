import { Link } from 'react-router-dom';

import { ui } from '../styles/ui';

export function TermsPage() {
  const effectiveDate = '21 March 2026';
  const lastUpdated = '21 March 2026';
  const version = 'v1.0';
  const contactEmail = 'admin@mobiflow.com';

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
          <h1 className="mt-2 text-3xl font-semibold text-(--text-main)">Terms of Use</h1>
          <p className="mt-2 text-sm text-(--text-soft)">Effective date: {effectiveDate}</p>
          <p className="mt-4 text-sm leading-6 text-(--text-muted)">
            These terms govern access to the MobiFlow Admin Console. By using this dashboard, you confirm that you are
            an approved administrator and that you will use the system only for authorised project operations.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">Access and account use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-(--text-muted)">
              <li>Access is restricted to approved admin accounts.</li>
              <li>Credentials must remain private and must not be shared.</li>
              <li>Admins are responsible for activity performed from their account.</li>
            </ul>
          </article>
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">Permitted use</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-(--text-muted)">
              <li>Use the dashboard for monitoring, support, and reporting only.</li>
              <li>Do not attempt to re-identify individual users from aggregated data.</li>
              <li>Do not copy or export data beyond approved project scope.</li>
            </ul>
          </article>
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">Security and enforcement</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-(--text-muted)">
              <li>Account misuse may lead to immediate access suspension.</li>
              <li>Security incidents must be reported to the system owner quickly.</li>
              <li>Administrative actions may be logged for operational audit purposes.</li>
            </ul>
          </article>
          <article className={`${ui.panel} p-5`}>
            <h2 className="text-base font-semibold text-(--text-main)">Changes to terms</h2>
            <p className="mt-3 text-sm leading-6 text-(--text-muted)">
              These terms can be updated when system policy or compliance requirements change. The latest version on
              this page is the one that applies.
            </p>
          </article>
        </section>

        <section className={`${ui.panel} space-y-3 p-5`}>
          <p className="text-sm text-(--text-main)">Contact</p>
          <div className="rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-(--text-soft)">Legal and account support</p>
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
