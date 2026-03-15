import { MetricCard } from '../components/MetricCard';
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
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load users</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const activePhones = Array.from(new Set(overview.recentActivity.map((item) => item.phone))).slice(0, 6);
  const period = overview.period || {
    label: selectedPeriodLabel,
    activeUsers: overview.activeUsersLast7Days,
    newUsers: overview.dailyActivity.reduce((sum, item) => sum + item.newUsers, 0),
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
          label="Recent users"
          value={formatNumber(activePhones.length)}
          note={selectedPeriodLabel}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
        <section className={`${ui.panel} p-5`}>
          <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
          <h3 className={ui.sectionTitle}>User activity</h3>
          <div className="mt-5">
            <ActivityChart data={overview.dailyActivity} />
          </div>
        </section>

        <section className={`${ui.panel} p-5`}>
          <p className={ui.sectionEyebrow}>Recent users</p>
          <h3 className={ui.sectionTitle}>Latest activity list</h3>
          <div className="mt-5 space-y-3">
            {activePhones.length ? (
              activePhones.map((phone) => (
                <div
                  key={phone}
                  className="rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3">
                  <p className="text-sm font-medium text-(--text-main)">{phone}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-(--text-muted)">No recent user activity found.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
