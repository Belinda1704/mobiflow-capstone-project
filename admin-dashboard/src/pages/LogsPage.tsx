import { BookOpen, LifeBuoy, ReceiptText, UserPlus } from 'lucide-react';

import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

function formatDateTime(value: string | null): string {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

type LogType = 'transaction' | 'lesson' | 'user' | 'support';

function getTypeStyle(type: LogType): { badge: string; border: string; label: string; Icon: typeof ReceiptText } {
  const styles = {
    transaction: {
      badge: 'bg-[#64748B]/12 text-[#64748B]',
      border: 'border-l-[#64748B]',
      label: 'Transaction',
      Icon: ReceiptText,
    },
    lesson: {
      badge: 'bg-[#F5C518]/15 text-[#B28704]',
      border: 'border-l-[#F5C518]',
      label: 'Lesson',
      Icon: BookOpen,
    },
    user: {
      badge: 'bg-[#22C55E]/12 text-[#22C55E]',
      border: 'border-l-[#22C55E]',
      label: 'User',
      Icon: UserPlus,
    },
    support: {
      badge: 'bg-[#EF4444]/12 text-[#EF4444]',
      border: 'border-l-[#EF4444]',
      label: 'Support',
      Icon: LifeBuoy,
    },
  };
  return styles[type];
}

export function LogsPage() {
  const { overview, loading, error, refresh } = useAdminOverview();
  const { dateRange, startDate, endDate } = useAdminDateRange();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load logs</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);
  const activityFeed = overview.activityFeed || [];

  return (
    <section className="space-y-5">
      <section className={`${ui.panel} p-5`}>
        <p className={ui.sectionEyebrow}>{selectedPeriodLabel}</p>
        <h3 className={ui.sectionTitle}>Logs</h3>
        <p className="mt-2 text-sm text-(--text-muted)">
          Transaction = payment in/out. Lesson = video completion. User = new sign-up. Support = password help request.
        </p>
        <div className="mt-5 space-y-3">
          {activityFeed.length ? (
            activityFeed.map((item) => {
              const { badge, border, label, Icon } = getTypeStyle(item.type);
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 rounded-r-2xl border border-(--border-muted) border-l-4 bg-[var(--panel-soft)] pl-4 pr-4 py-4 ${border}`}>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${badge}`}>
                    <Icon size={12} className="shrink-0" />
                    {label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-(--text-main)">{item.title}</p>
                    <p className="mt-1 text-sm text-(--text-muted)">{item.detail}</p>
                    <p className="mt-2 text-xs text-(--text-soft)">{formatDateTime(item.createdAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-(--text-muted)">No logs found for this period.</p>
          )}
        </div>
      </section>
    </section>
  );
}
