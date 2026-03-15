import { ActivityChart } from '../components/ActivityChart';
import { MetricCard } from '../components/MetricCard';
import { RecentActivityTable } from '../components/RecentActivityTable';
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
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load transactions</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const incomeCount = overview.recentActivity.filter((item) => item.amount >= 0).length;
  const expenseCount = overview.recentActivity.filter((item) => item.amount < 0).length;
  const period = overview.period || {
    label: selectedPeriodLabel,
    transactions: overview.transactionsLast7Days,
  };
  const displayedTransactionCount = dateRange === 'all' ? overview.totalTransactions : period.transactions;

  return (
    <section className="space-y-5">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total transactions" value={formatNumber(overview.totalTransactions)} />
        <MetricCard label="In period" value={formatNumber(displayedTransactionCount)} note={selectedPeriodLabel} />
        <MetricCard label="Income entries" value={formatNumber(incomeCount)} />
        <MetricCard label="Expense entries" value={formatNumber(expenseCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(280px,0.8fr)]">
        <section className={`${ui.panel} p-5`}>
          <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
          <h3 className={ui.sectionTitle}>Transaction trend</h3>
          <div className="mt-5">
            <ActivityChart data={overview.dailyActivity} />
          </div>
        </section>

        <section className={`${ui.panel} space-y-4 p-5`}>
          <div className="border-b border-(--border-muted) pb-4">
            <span className={ui.sectionEyebrow}>Recent records</span>
            <strong className="mt-2 block text-3xl font-semibold text-(--text-main)">
              {overview.recentActivity.length}
            </strong>
          </div>
          <div className="border-b border-(--border-muted) pb-4">
            <span className={ui.sectionEyebrow}>Income entries</span>
            <strong className="mt-2 block text-2xl font-semibold text-emerald-600">{incomeCount}</strong>
          </div>
          <div>
            <span className={ui.sectionEyebrow}>Expense entries</span>
            <strong className="mt-2 block text-2xl font-semibold text-rose-600">{expenseCount}</strong>
          </div>
        </section>
      </div>

      <section className={`${ui.panel} p-5`}>
        <p className={ui.sectionEyebrow}>Latest 10 records</p>
        <h3 className={ui.sectionTitle}>Recent transactions</h3>
        <div className="mt-5">
          <RecentActivityTable activity={overview.recentActivity} />
        </div>
      </section>
    </section>
  );
}
