import { BookOpen, ReceiptText, UserCheck, UserPlus } from 'lucide-react';

import { AppColors } from '../constants/colors';
import { CategoryDonutChart } from '../components/CategoryDonutChart';
import { ActivityChart } from '../components/ActivityChart';
import { LearningPanel } from '../components/LearningPanel';
import { MetricCard } from '../components/MetricCard';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';
import { formatAdminLabel, getAdminInitials } from '../utils/phone';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

// Compare first half vs second half of series
function trendPercentFromDaily(series: number[]): number | null {
  if (series.length < 4) return null;
  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, half).reduce((a, b) => a + b, 0);
  const curr = series.slice(half).reduce((a, b) => a + b, 0);
  if (prev === 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}

function getFeedAccent(type: 'transaction' | 'lesson' | 'user' | 'support'): string {
  if (type === 'lesson') return 'bg-[#F5C518]/15 text-[#B28704]';
  if (type === 'user') return 'bg-[#22C55E]/12 text-[#22C55E]';
  if (type === 'support') return 'bg-[#EF4444]/12 text-[#EF4444]';
  return 'bg-[#64748B]/12 text-[#64748B]';
}

function getSupportStatusAccent(status: string): string {
  return status === 'open' ? 'bg-[#EF4444]/12 text-[#EF4444]' : 'bg-[#22C55E]/12 text-[#22C55E]';
}

export function DashboardPage() {
  const { user } = useAdminAuth();
  const { overview, loading, error, refresh } = useAdminOverview();
  const { dateRange, startDate, endDate } = useAdminDateRange();
  const adminName = formatAdminLabel(user?.email);
  const welcomeLabel = adminName?.includes('@') ? getAdminInitials(adminName) : adminName;

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load dashboard</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No overview data was returned.'}</p>
        <button
          type="button"
          className={`${ui.primaryButton} mt-4`}
          onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const activityFeed = overview.activityFeed || [];
  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const period = overview.period || {
    key: '30d',
    label: selectedPeriodLabel,
    days: overview.dailyActivity.length || 30,
    newUsers: overview.dailyActivity.reduce((sum, item) => sum + item.newUsers, 0),
    transactions: overview.transactionsLast7Days,
    activeUsers: overview.activeUsersLast7Days,
    lessonCompletions: overview.learning.lessonCompletionsLast30Days,
    openSupportRequests: 0,
  };
  const newUserTrend = overview.dailyActivity.map((item) => item.newUsers);
  const lessonCompletionTrend = overview.dailyActivity.map((item) => item.lessonCompletions ?? 0);
  const supportRequests = overview.supportRequests || [];
  const rawCategoryBreakdown = overview.categoryBreakdown || [];
  const categoryBreakdown = (() => {
    if (rawCategoryBreakdown.length <= 4) return rawCategoryBreakdown;
    const topThree = rawCategoryBreakdown.slice(0, 3);
    const othersTotal = rawCategoryBreakdown
      .slice(3)
      .reduce((sum, item) => sum + item.value, 0);
    return [...topThree, { label: 'Others', value: othersTotal }];
  })();
  const transactionTrend = overview.dailyActivity.map((item) => item.transactions);
  const activityTrend = overview.dailyActivity.map((item) => item.transactions + item.newUsers);
  const topCategory = categoryBreakdown[0];
  const displayedTransactionCount = dateRange === 'all' ? overview.totalTransactions : period.transactions;
  const newUserTrendPct = trendPercentFromDaily(newUserTrend);
  const transactionTrendPct = trendPercentFromDaily(transactionTrend);
  const lessonTrendPct = trendPercentFromDaily(lessonCompletionTrend);
  const activeTrendPct = trendPercentFromDaily(activityTrend);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-(--text-muted)">
            Welcome back, {welcomeLabel}. Here’s what’s happening with your platform today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-(--text-muted)">
            Updated {formatDateTime(overview.generatedAt)}
          </p>
          <button
            type="button"
            className={ui.primaryButton}
            onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="New users"
          value={formatNumber(period.newUsers)}
          note={selectedPeriodLabel}
          trend={newUserTrend}
          trendPercent={newUserTrendPct}
          accent={AppColors.success}
          icon={UserPlus}
        />
        <MetricCard
          label="Transactions"
          value={formatNumber(displayedTransactionCount)}
          note={selectedPeriodLabel}
          trend={transactionTrend}
          trendPercent={transactionTrendPct}
          accent={AppColors.accent}
          icon={ReceiptText}
        />
        <MetricCard
          label="Lesson completions"
          value={formatNumber(period.lessonCompletions)}
          note={selectedPeriodLabel}
          trend={lessonCompletionTrend}
          trendPercent={lessonTrendPct}
          accent={AppColors.progress}
          icon={BookOpen}
        />
        <MetricCard
          label="Active users"
          value={formatNumber(period.activeUsers)}
          note={selectedPeriodLabel}
          trend={activityTrend}
          trendPercent={activeTrendPct}
          accent={AppColors.lessonTint}
          icon={UserCheck}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(420px,480px)] xl:items-stretch">
        <section className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-(--border-muted) bg-(--panel-bg) p-5 shadow-(--shadow-card) xl:h-140">
          <div className="mb-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-(--border-muted) bg-(--panel-soft) px-2.5 py-1 text-(--text-soft)">
                {selectedPeriodLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-(--border-muted) bg-(--panel-soft) px-2.5 py-1 text-(--text-soft)">
                <svg width="14" height="4" className="shrink-0" aria-hidden>
                  <line x1="0" y1="2" x2="14" y2="2" stroke="#F5C518" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Transactions
              </span>
            </div>
            <h3 className="text-lg font-semibold text-(--text-main)">Overview</h3>
            <p className="mt-2 text-sm text-(--text-muted)">Daily transaction counts are shown without per-person transaction details.</p>
          </div>

          <div className="min-h-0 flex-1">
            <ActivityChart data={overview.dailyActivity} />
          </div>
        </section>

        <section className="flex min-w-0 flex-col rounded-2xl border border-(--border-muted) bg-(--panel-bg) p-6 shadow-(--shadow-card) xl:h-140">
          <div className="shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-(--text-soft)">Breakdown</p>
            <h3 className="mt-1 text-lg font-semibold text-(--text-main)">Transaction categories</h3>
            <p className="mt-1 text-xs text-(--text-soft)">Top categories are shown directly; smaller groups are merged under Others.</p>
          </div>
          <div className="min-w-0 shrink-0 pt-4">
            <CategoryDonutChart items={categoryBreakdown} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pt-4 pr-1">
            <div className="grid gap-4">
            <div className="rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-(--text-soft)">Leading category</p>
              <p className="mt-2 text-base font-semibold text-(--text-main)">
                {topCategory ? topCategory.label : 'No data'}
              </p>
              <p className="mt-1 text-sm text-(--text-muted)">
                {topCategory ? `${topCategory.value} records` : 'No data available.'}
              </p>
            </div>
            <div className="rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-(--text-soft)">Last update</p>
              <p className="mt-1.5 text-sm font-semibold text-(--text-main)">
                {formatDateTime(overview.generatedAt)}
              </p>
            </div>
            <LearningPanel
              totalLessonCompletions={overview.learning.totalLessonCompletions}
              uniqueLearners={overview.learning.uniqueLearners}
              periodLessonCompletions={overview.learning.lessonCompletionsLast30Days}
              periodLabel={selectedPeriodLabel}
              topLessons={overview.learning.topLessons}
            />
            <div className="rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-(--text-soft)">Support requests</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-(--border-muted) bg-(--panel-bg) px-3 py-3">
                  <p className="text-2xl font-semibold text-(--text-main)">
                    {formatNumber(period.openSupportRequests || 0)}
                  </p>
                  <p className="mt-1 text-sm text-(--text-muted)">Open password help requests</p>
                </div>
                {supportRequests.length ? (
                  supportRequests.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-(--text-main)">{item.phone}</p>
                        <p className="truncate text-(--text-muted)">{item.source}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getSupportStatusAccent(
                            item.status
                          )}`}>
                          {item.status}
                        </span>
                        <p className="mt-1 text-xs text-(--text-soft)">
                          {item.createdAt ? formatDateTime(item.createdAt) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-(--text-muted)">No support requests yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-(--text-soft)">Activity feed</p>
              <p className="mt-1 text-[10px] text-(--text-soft)">Data source: Lessons = completions in app.</p>
              <div className="mt-3 space-y-3">
                {activityFeed.length ? (
                  activityFeed.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-0.5 inline-flex shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getFeedAccent(
                          item.type
                        )}`}>
                        {item.type}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-(--text-main)">{item.title}</p>
                        <p className="truncate text-(--text-muted)">{item.detail}</p>
                        <p className="mt-1 text-xs text-(--text-soft)">
                          {item.createdAt ? formatDateTime(item.createdAt) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-(--text-muted)">No recent activity yet.</p>
                )}
              </div>
            </div>
          </div>
          </div>
        </section>
      </div>
    </section>
  );
}
