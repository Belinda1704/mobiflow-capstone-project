type CategoryDonutChartProps = {
  items: Array<{
    label: string;
    value: number;
  }>;
};

// App palette only: accent, success, muted, progress, warning
export const SEGMENT_COLORS = ['#F5C518', '#22C55E', '#64748B', '#E5B015', '#F59E0B'];

function normalizedPercentages(values: number[], total: number): number[] {
  if (total === 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floor = raw.map((p) => Math.floor(p));
  let remainder = 100 - floor.reduce((s, n) => s + n, 0);
  const decimals = raw.map((p, i) => ({ i, frac: p - floor[i] }));
  decimals.sort((a, b) => b.frac - a.frac);
  const out = [...floor];
  for (let j = 0; j < remainder; j++) out[decimals[j].i] += 1;
  return out;
}

export function CategoryDonutChart({ items }: CategoryDonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const pcts = normalizedPercentages(items.map((i) => i.value), total);
  const size = 132;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  if (!items.length || total === 0) {
    return (
      <div className="rounded-2xl border border-(--border-muted) bg-(--panel-soft) px-4 py-5">
        <p className="text-sm text-(--text-muted)">No category data yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[150px_minmax(0,1fr)] lg:items-center">
      <div className="relative mx-auto h-33 w-33">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-muted)"
            strokeWidth={strokeWidth}
          />

          {items.map((item, index) => {
            const segmentLength = (item.value / total) * circumference;
            const dashArray = `${segmentLength} ${circumference - segmentLength}`;
            const dashOffset = -currentOffset;
            currentOffset += segmentLength;

            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold text-(--text-main)">{total}</span>
          <span className="text-[11px] uppercase tracking-[0.16em] text-(--text-muted)">
            Records
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const percentage = pcts[index] ?? 0;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-3 py-2.5 text-sm">
              <span className="inline-flex items-center gap-2 text-(--text-muted)">
                <i
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                />
                {item.label}
              </span>
              <span className="text-right">
                <strong className="block font-semibold text-(--text-main)">{percentage}%</strong>
                <span className="text-xs text-(--text-soft)">{item.value} items</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
