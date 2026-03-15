import { MetricCard } from '../components/MetricCard';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

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

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading support requests...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load support requests</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const supportRequests = overview.supportRequests || [];
  const openRequests = supportRequests.filter((item) => item.status === 'open').length;

  return (
    <section className="space-y-5">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open requests" value={formatNumber(openRequests)} note={selectedPeriodLabel} />
        <MetricCard label="Visible requests" value={formatNumber(supportRequests.length)} note={selectedPeriodLabel} />
        <MetricCard label="Source" value="Mobile app" />
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
                className="flex items-start justify-between gap-4 rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-(--text-main)">{item.phone}</p>
                  <p className="mt-1 text-sm text-(--text-muted)">{item.source}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusAccent(
                      item.status
                    )}`}>
                    {item.status}
                  </span>
                  <p className="mt-2 text-xs text-(--text-soft)">{formatDateTime(item.createdAt)}</p>
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
