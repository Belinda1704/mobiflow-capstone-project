import { ActivityChart } from '../components/ActivityChart';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { MetricCard } from '../components/MetricCard';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function TransactionsPage() {
  const { overview, loading, error, refresh } = useAdminOverview();
  const { dateRange, startDate, endDate } = useAdminDateRange();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-(--text-main)">Could not load analytics</h3>
        <p className="mt-2 text-sm text-(--text-muted)">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const periodTransactions = dateRange === 'all' ? overview.totalTransactions : overview.period.transactions;
  const openRequests = overview.period.openSupportRequests ?? 0;

  return (
    <section className="space-y-5">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="All-time count" value={formatNumber(overview.totalTransactions)} />
        <MetricCard label="In selected period" value={formatNumber(periodTransactions)} note={selectedPeriodLabel} />
        <MetricCard label="Active users" value={formatNumber(overview.period.activeUsers)} note={selectedPeriodLabel} />
        <MetricCard label="Open support requests" value={formatNumber(openRequests)} note={selectedPeriodLabel} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(280px,0.8fr)]">
        <section className={`${ui.panel} p-5`}>
          <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
          <h3 className={ui.sectionTitle}>Daily volume trend</h3>
          <p className="mt-1 text-xs text-(--text-soft)">Daily transaction counts (aggregated).</p>
          <div className="mt-5">
            <ActivityChart data={overview.dailyActivity} />
          </div>
        </section>

        <section className={`${ui.panel} space-y-4 p-5`}>
          <div className="border-b border-(--border-muted) pb-4">
            <span className={ui.sectionEyebrow}>Period total</span>
            <strong className="mt-2 block text-3xl font-semibold text-(--text-main)">
              {formatNumber(periodTransactions)}
            </strong>
          </div>
          <div className="border-b border-(--border-muted) pb-4">
            <span className={ui.sectionEyebrow}>Lesson completions</span>
            <strong className="mt-2 block text-2xl font-semibold text-[#B28704]">
              {formatNumber(overview.period.lessonCompletions)}
            </strong>
          </div>
          <div>
            <span className={ui.sectionEyebrow}>Daily activity</span>
            <strong className="mt-2 block text-lg font-semibold text-(--text-main)">
              {overview.dailyActivity.length} days
            </strong>
          </div>
        </section>
      </div>
    </section>
  );
}
