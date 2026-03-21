type RecentActivityItem = {
  id: string;
  phone?: string;
  label?: string;
  category?: string;
  amount: number;
  createdAt: string | null;
};

function formatAmount(amount: number): string {
  return `${amount >= 0 ? '+' : '-'}${Math.abs(Math.round(amount)).toLocaleString('en-US')} RWF`;
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
}

export function RecentActivityTable({
  activity,
}: {
  activity: RecentActivityItem[];
}) {
  if (!activity.length) {
    return <p className="text-sm text-(--text-muted)">No recent transaction activity found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-(--border-muted) px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-(--text-soft)">
              Label
            </th>
            <th className="border-b border-(--border-muted) px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-(--text-soft)">
              Phone
            </th>
            <th className="border-b border-(--border-muted) px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-(--text-soft)">
              Category
            </th>
            <th className="border-b border-(--border-muted) px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-(--text-soft)">
              Amount
            </th>
            <th className="border-b border-(--border-muted) px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-(--text-soft)">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {activity.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-(--panel-soft)">
              <td className="border-b border-(--border-muted) px-3 py-3 text-left text-sm text-(--text-main)">
                {item.label || 'Transaction'}
              </td>
              <td className="border-b border-(--border-muted) px-3 py-3 text-left text-sm text-(--text-muted)">{item.phone}</td>
              <td className="border-b border-(--border-muted) px-3 py-3 text-left text-sm text-(--text-muted)">
                {item.category || 'Uncategorized'}
              </td>
              <td
                className={`border-b border-(--border-muted) px-3 py-3 text-right text-sm font-semibold tabular-nums ${
                  item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                {formatAmount(item.amount)}
              </td>
              <td className="border-b border-(--border-muted) px-3 py-3 text-right text-sm tabular-nums text-(--text-muted)">
                {formatDateTime(item.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
