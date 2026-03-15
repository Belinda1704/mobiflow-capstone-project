import { MetricCard } from '../components/MetricCard';
import { useAdminOverview } from '../hooks/useAdminOverview';
import { ui } from '../styles/ui';

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatDateTime(value: string | null): string {
  if (!value) return 'No recent sign-in';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No recent sign-in';
  return date.toLocaleString();
}

export function AdminAccountsPage() {
  const { overview, loading, error, refresh } = useAdminOverview();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={ui.spinner} />
          <p className="text-sm text-neutral-600">Loading admin accounts...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <section className={`${ui.panel} p-6`}>
        <h3 className="text-xl font-semibold text-neutral-950">Could not load admin accounts</h3>
        <p className="mt-2 text-sm text-neutral-600">{error || 'No data was returned.'}</p>
        <button type="button" className={`${ui.primaryButton} mt-4`} onClick={() => void refresh()}>
          Try again
        </button>
      </section>
    );
  }

  const adminAccounts = overview.adminAccounts || [];
  const activeAccounts = adminAccounts.filter((item) => !item.disabled).length;

  return (
    <section className="space-y-5">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Admin accounts" value={formatNumber(adminAccounts.length)} />
        <MetricCard label="Active admins" value={formatNumber(activeAccounts)} />
        <MetricCard label="Disabled" value={formatNumber(adminAccounts.length - activeAccounts)} />
        <MetricCard label="Current admin" value="1" note="Signed-in account" />
      </div>

      <section className={`${ui.panel} p-5`}>
        <p className={ui.sectionEyebrow}>Workspace access</p>
        <h3 className={ui.sectionTitle}>Admin accounts</h3>
        <div className="mt-5 space-y-3">
          {adminAccounts.length ? (
            adminAccounts.map((item) => (
              <div
                key={item.uid}
                className="flex items-start justify-between gap-4 rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-(--text-main)">
                    {item.email || item.phone || item.uid}
                  </p>
                  <p className="mt-1 truncate text-sm text-(--text-muted)">
                    {item.phone || item.uid}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-(--text-main)">
                    {item.disabled ? 'Disabled' : 'Active'}
                  </p>
                  <p className="mt-1 text-xs text-(--text-soft)">{formatDateTime(item.lastSignInTime)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-(--text-muted)">No admin accounts were found.</p>
          )}
        </div>
      </section>
    </section>
  );
}
