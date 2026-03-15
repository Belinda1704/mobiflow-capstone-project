import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import { ui } from '../styles/ui';
import { useTheme } from '../theme/ThemeContext';
import { getAdminDateRangeLabel } from '../utils/adminDateRange';

export function SettingsPage() {
  const { theme } = useTheme();
  const { dateRange, startDate, endDate } = useAdminDateRange();
  const selectedPeriodLabel = getAdminDateRangeLabel(dateRange, startDate, endDate);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <section className={`${ui.panel} p-5`}>
        <p className={ui.sectionEyebrow}>Appearance</p>
        <h3 className={ui.sectionTitle}>Workspace settings</h3>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-4">
            <p className="text-sm text-(--text-muted)">Current theme</p>
            <p className="mt-2 text-lg font-semibold capitalize text-(--text-main)">{theme}</p>
          </div>
          <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-4">
            <p className="text-sm text-(--text-muted)">Current date scope</p>
            <p className="mt-2 text-lg font-semibold text-(--text-main)">{selectedPeriodLabel}</p>
          </div>
        </div>
      </section>

      <section className={`${ui.panel} p-5`}>
        <p className={ui.sectionEyebrow}>Access</p>
        <h3 className={ui.sectionTitle}>Admin rules</h3>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-4">
            <p className="text-sm text-(--text-muted)">Login policy</p>
            <p className="mt-2 text-lg font-semibold text-(--text-main)">Approved admins only</p>
          </div>
          <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-4">
            <p className="text-sm text-(--text-muted)">Password help workflow</p>
            <p className="mt-2 text-lg font-semibold text-(--text-main)">Enabled for mobile users</p>
          </div>
        </div>
      </section>

      <section className={`${ui.panel} p-5 xl:col-span-2`}>
        <p className={ui.sectionEyebrow}>Reference</p>
        <h3 className={ui.sectionTitle}>Data sources</h3>
        <p className="mt-2 text-sm text-(--text-muted)">
          Dashboard and Insights use live data from the platform: transactions and users from the app; lesson labels (e.g. Bank trust, Credit score) from <strong className="text-(--text-main)">lesson completions in the app</strong>; support counts from password-help requests. No external bank or credit data.
        </p>
      </section>
    </section>
  );
}
