import { Activity, BookOpen, ReceiptText, UserPlus } from 'lucide-react';

import { AppColors } from '../constants/colors';
import { ActivityChart } from '../components/ActivityChart';
import { CategoryDonutChart, SEGMENT_COLORS } from '../components/CategoryDonutChart';
import { MetricCard } from '../components/MetricCard';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

// Percentages that sum to 100% (largest-remainder)
function normalizePercentages(values: number[], total: number): number[] {
  if (total === 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floor = raw.map((p) => Math.floor(p));
  let remainder = 100 - floor.reduce((s, n) => s + n, 0);
  const decimals = raw.map((p, i) => ({ i, frac: p - floor[i] }));
  decimals.sort((a, b) => b.frac - a.frac);
  const out = [...floor];
  for (let j = 0; j < remainder; j++) {
    out[decimals[j].i] += 1;
  }
  return out;
}

export function ActivityPage() {
  const { overview, loading, error, refresh } = useAdminOverview();
  const { dateRange, startDate, endDate } = useAdminDateRange();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load activity</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const activityFeed = overview.activityFeed || [];
  const transactionCount = activityFeed.filter((item) => item.type === 'transaction').length;
  const lessonCount = activityFeed.filter((item) => item.type === 'lesson').length;
  const supportCount = activityFeed.filter((item) => item.type === 'support').length;
  const userCount = activityFeed.filter((item) => item.type === 'user').length;
  const totalCount = Math.max(1, activityFeed.length);
  const categoryBreakdown = [
    { label: 'Transactions', value: transactionCount },
    { label: 'Users', value: userCount },
    { label: 'Lessons', value: lessonCount },
    { label: 'Support', value: supportCount },
  ].filter((item) => item.value > 0);
  const eventCounts = [transactionCount, userCount, lessonCount, supportCount];
  const eventPcts = normalizePercentages(eventCounts, totalCount);
  const analyticsRows = [
    { label: 'Transactions', value: transactionCount, pct: eventPcts[0], color: SEGMENT_COLORS[0] },
    { label: 'Users', value: userCount, pct: eventPcts[1], color: SEGMENT_COLORS[1] },
    { label: 'Lessons', value: lessonCount, pct: eventPcts[2], color: SEGMENT_COLORS[2] },
    { label: 'Support', value: supportCount, pct: eventPcts[3], color: SEGMENT_COLORS[3] },
  ];

  const daily = overview.dailyActivity || [];
  const transactionTrend = daily.map((d) => d.transactions);
  const lessonTrend = daily.map((d) => d.lessonCompletions ?? 0);
  const userTrend = daily.map((d) => d.newUsers);
  const activityTrend = daily.map((d) => d.transactions + d.newUsers + (d.lessonCompletions ?? 0));

  return (
    <section className="space-y-5">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Activity items"
          value={formatNumber(activityFeed.length)}
          note={selectedPeriodLabel}
          trend={activityTrend}
          accent={AppColors.muted}
          icon={Activity}
        />
        <MetricCard
          label="Transactions"
          value={formatNumber(transactionCount)}
          note={selectedPeriodLabel}
          trend={transactionTrend}
          accent={AppColors.accent}
          icon={ReceiptText}
        />
        <MetricCard
          label="Lesson events"
          value={formatNumber(lessonCount)}
          note={selectedPeriodLabel}
          trend={lessonTrend}
          accent={AppColors.progress}
          icon={BookOpen}
        />
        <MetricCard
          label="User events"
          value={formatNumber(userCount)}
          note={selectedPeriodLabel}
          trend={userTrend}
          accent={AppColors.success}
          icon={UserPlus}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <section className={`${ui.panel} p-5`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
              <h3 className={ui.sectionTitle}>Activity trend</h3>
              <p className="mt-2 text-sm text-(--text-muted)">Transactions and new users over time.</p>
            </div>
          </div>
          <ActivityChart data={overview.dailyActivity} />
        </section>

        <section className={`${ui.panel} p-5`}>
          <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
          <h3 className={ui.sectionTitle}>Event mix</h3>
          <p className="mt-1 text-xs text-(--text-soft)">Data source: platform activity (transactions, users, app lesson completions, support).</p>
          <div className="mt-5">
            <CategoryDonutChart items={categoryBreakdown} />
          </div>
          <div className="mt-5 space-y-4">
            {analyticsRows.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-(--text-main)">{item.label}</span>
                  <span className="text-(--text-muted)">
                    {item.value} · {item.pct}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-(--border-muted)">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${(item.value / totalCount) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${ui.panel} p-5`}>
          <p className={ui.sectionEyebrow}>Highlights</p>
          <h3 className={ui.sectionTitle}>Current totals</h3>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-soft)">Transactions</p>
              <p className="mt-2 text-2xl font-semibold text-(--text-main)">
                {formatNumber(dateRange === 'all' ? overview.totalTransactions : overview.period.transactions)}
              </p>
            </div>
            <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-soft)">Active users</p>
              <p className="mt-2 text-2xl font-semibold text-(--text-main)">
                {formatNumber(overview.period.activeUsers)}
              </p>
            </div>
            <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-(--text-soft)">Open support</p>
              <p className="mt-2 text-2xl font-semibold text-(--text-main)">
                {formatNumber(overview.period.openSupportRequests || 0)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
