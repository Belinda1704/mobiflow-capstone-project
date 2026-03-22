import { MetricCard } from '../components/MetricCard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { ActivityChart } from '../components/ActivityChart';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function UsersPage() {
  const { overview, loading, error, refresh } = useAdminOverview();
  const { dateRange, startDate, endDate } = useAdminDateRange();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-(--text-main)">Could not load users</h3>
        <p className="mt-2 text-sm text-(--text-muted)">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const period = overview.period || {
    label: selectedPeriodLabel,
    activeUsers: overview.activeUsersLast7Days,
    newUsers: overview.dailyActivity.reduce((sum, item) => sum + item.newUsers, 0),
    transactions: overview.transactionsLast7Days,
    lessonCompletions: overview.learning.lessonCompletionsLast30Days,
  };

  return (
    <section className="space-y-5">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={formatNumber(overview.totalUsers)} />
        <MetricCard
          label="Active users"
          value={formatNumber(period.activeUsers)}
          note={selectedPeriodLabel}
        />
        <MetricCard
          label="New users"
          value={formatNumber(period.newUsers)}
          note={selectedPeriodLabel}
        />
        <MetricCard
          label="Transactions captured"
          value={formatNumber(period.transactions)}
          note={selectedPeriodLabel}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-1">
        <section className={`${ui.panel} p-5`}>
          <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
          <h3 className={ui.sectionTitle}>User activity</h3>
          <div className="mt-5">
            <ActivityChart data={overview.dailyActivity} />
          </div>
        </section>
      </div>
    </section>
  );
}
