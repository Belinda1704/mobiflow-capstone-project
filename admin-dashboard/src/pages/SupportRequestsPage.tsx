import { useState } from 'react';

import { MetricCard } from '../components/MetricCard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { resolveSupportRequest } from '../services/adminService';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';
import { formatSupportSource } from '../utils/supportDisplay';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

function getStatusAccent(status: string): string {
  return status === 'open'
    ? 'bg-rose-500/12 text-rose-600'
    : 'bg-emerald-500/12 text-emerald-600';
}

export function SupportRequestsPage() {
  const { overview, loading, error, refresh } = useAdminOverview();
  const { dateRange, startDate, endDate } = useAdminDateRange();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-(--text-main)">Could not load support requests</h3>
        <p className="mt-2 text-sm text-(--text-muted)">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const supportRequests = overview.supportRequests || [];
  const openRequests = supportRequests.filter((item) => item.status === 'open').length;

  async function handleMarkResolved(id: string) {
    setResolvingId(id);
    try {
      await resolveSupportRequest(id);
      await refresh();
    } catch {
      window.alert('Could not mark as resolved. Check your connection and try again.');
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div
        className={`${ui.panel} space-y-3 p-4 text-sm text-(--text-muted)`}
        role="region"
        aria-label="How to help users">
        <p className="font-medium text-(--text-main)">How to help (password reset requests)</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            Call or SMS the <strong className="text-(--text-main)">phone number</strong> on the request.
          </li>
          <li>
            In Firebase Authentication, users who signed in with phone often show an identifier like{' '}
            <code className="rounded bg-(--panel-soft) px-1 text-xs">2507…@mobiflow.phone</code> — that is
            normal for phone auth, not a real email. Use <strong>Reset password</strong> only if the account
            also has email; otherwise help them sign in with <strong>phone OTP</strong> from the app or use
            Firebase tools appropriate for phone-only accounts.
          </li>
          <li>When you are done, tap <strong className="text-(--text-main)">Mark resolved</strong> below.</li>
        </ul>
      </div>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open requests" value={formatNumber(openRequests)} note={selectedPeriodLabel} />
        <MetricCard label="Visible requests" value={formatNumber(supportRequests.length)} note={selectedPeriodLabel} />
        <MetricCard label="Source" value="MobiFlow" />
        <MetricCard label="Filter" value={selectedPeriodLabel} />
      </div>

      <section className={`${ui.panel} p-5`}>
        <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
        <h3 className={ui.sectionTitle}>Password help requests</h3>
        <div className="mt-5 space-y-3">
          {supportRequests.length ? (
            supportRequests.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-(--text-main)">{item.phone}</p>
                  <p className="mt-1 text-sm text-(--text-muted)">{formatSupportSource(item.source)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusAccent(
                        item.status
                      )}`}>
                      {item.status}
                    </span>
                    <p className="mt-2 text-xs text-(--text-soft)">{formatDateTime(item.createdAt)}</p>
                  </div>
                  {item.status === 'open' ? (
                    <button
                      type="button"
                      disabled={resolvingId === item.id}
                      className={`${ui.primaryButton} w-full text-sm sm:w-auto`}
                      onClick={() => void handleMarkResolved(item.id)}>
                      {resolvingId === item.id ? 'Saving…' : 'Mark resolved'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-(--text-muted)">No support requests in this period.</p>
          )}
        </div>
      </section>
    </section>
  );
}
