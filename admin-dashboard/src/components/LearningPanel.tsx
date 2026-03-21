import { AppColors } from '../constants/colors';
import { ui } from '../styles/ui';

type TopLesson = {
  lessonId: string;
  label: string;
  count: number;
};

type LearningPanelProps = {
  totalLessonCompletions: number;
  uniqueLearners: number;
  periodLessonCompletions: number;
  periodLabel: string;
  topLessons: TopLesson[];
};

export function LearningPanel({
  totalLessonCompletions,
  uniqueLearners,
  periodLessonCompletions,
  periodLabel,
  topLessons,
}: LearningPanelProps) {
  const totalCompletions = Math.max(1, totalLessonCompletions);
  const topLessonLabel = topLessons[0]?.label ?? 'No data';

  return (
    <section className={`${ui.panel} flex h-full flex-col p-5`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={ui.sectionEyebrow}>Financial literacy</p>
          <h3 className={ui.sectionTitle}>Video engagement</h3>
          <p className="mt-2 text-sm text-(--text-muted)">Data source: Lesson completions in the app.</p>
        </div>
        <div className="min-w-22 rounded-xl bg-(--panel-soft) px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-[0.16em] text-(--text-soft)">Top Lesson</p>
          <p className="mt-1 truncate text-sm font-semibold text-(--text-main)">
            {topLessonLabel}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="min-w-0 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-3 py-3">
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-(--text-soft)">
            Complete
          </span>
          <strong className="mt-2 block text-2xl font-semibold text-(--text-main)">{totalLessonCompletions}</strong>
        </div>
        <div className="min-w-0 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-3 py-3">
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-(--text-soft)">Users</span>
          <strong className="mt-2 block text-2xl font-semibold text-(--text-main)">{uniqueLearners}</strong>
        </div>
        <div className="min-w-0 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-3 py-3">
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-(--text-soft)">In period</span>
          <strong className="mt-2 block text-2xl font-semibold text-(--text-main)">{periodLessonCompletions}</strong>
          <p className="mt-1 text-[11px] text-(--text-soft)">{periodLabel}</p>
        </div>
      </div>

      <div className="mt-auto space-y-4">
        {topLessons.length ? (
          <>
            {topLessons.map((lesson) => {
              const pct = totalCompletions > 0 ? (lesson.count / totalCompletions) * 100 : 0;
              const barWidth = Math.max(pct, lesson.count > 0 ? 8 : 0);
              return (
                <div key={lesson.lessonId} className="rounded-xl border border-(--border-muted) bg-(--panel-soft) p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-(--text-main)">{lesson.label}</span>
                    <span className="shrink-0 text-sm text-(--text-muted)">
                      {lesson.count} {lesson.count === 1 ? 'completion' : 'completions'}
                    </span>
                  </div>
                  <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-(--panel-bg)">
                    <div
                      className="h-full min-w-1.5 rounded-full transition-[width] duration-300"
                      style={{ width: `${barWidth}%`, backgroundColor: AppColors.accent }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-(--text-soft)">
                    {Math.round(pct)}% of all completions
                  </p>
                </div>
              );
            })}
            <p className="text-[10px] text-(--text-soft)">Source: app Lesson completions.</p>
          </>
        ) : (
          <p className="text-sm text-(--text-muted)">No Lesson data yet.</p>
        )}
      </div>
    </section>
  );
}
