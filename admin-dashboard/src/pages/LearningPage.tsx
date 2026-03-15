import { LearningPanel } from '../components/LearningPanel';
import { MetricCard } from '../components/MetricCard';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function LearningPage() {
  const { overview, loading, error, refresh } = useAdminOverview();
  const { dateRange, startDate, endDate } = useAdminDateRange();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading learning data...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load learning data</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const period = overview.period || {
    label: selectedPeriodLabel,
    lessonCompletions: overview.learning.lessonCompletionsLast30Days,
  };

  return (
    <section className="space-y-5">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Completions" value={formatNumber(overview.learning.totalLessonCompletions)} />
        <MetricCard label="Users reached" value={formatNumber(overview.learning.uniqueLearners)} />
        <MetricCard label="In period" value={formatNumber(period.lessonCompletions)} note={selectedPeriodLabel} />
      </div>

      <LearningPanel
        totalLessonCompletions={overview.learning.totalLessonCompletions}
        uniqueLearners={overview.learning.uniqueLearners}
        periodLessonCompletions={overview.learning.lessonCompletionsLast30Days}
        periodLabel={selectedPeriodLabel}
        topLessons={overview.learning.topLessons}
      />
    </section>
  );
}
