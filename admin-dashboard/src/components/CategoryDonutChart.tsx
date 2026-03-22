type CategoryDonutChartProps = {
  items: Array<{
    label: string;
    value: number;
    /** Optional fixed color (same as progress bars when some categories are hidden). */
    color?: string;
  }>;
};

// Default colors for donut slices (repeat if more slices than entries).
export const SEGMENT_COLORS = ['#F5C518', '#22C55E', '#0EA5E9', '#8B5CF6', '#F59E0B', '#64748B'];

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
  const size = 168;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Small gap between arc chunks (viewBox units)
  const gapPerJoint = Math.min(5, circumference * 0.012);
  const numGaps = items.length;
  const totalGapSpace = gapPerJoint * numGaps;
  const usableLength = Math.max(0, circumference - totalGapSpace);

  const segmentColors = items.map((item, index) => item.color ?? SEGMENT_COLORS[index % SEGMENT_COLORS.length]);

  let offset = 0;

  if (!items.length || total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-(--border-muted) bg-(--panel-soft) px-4 py-8 text-center">
        <p className="text-sm text-(--text-muted)">No category data for this period.</p>
      </div>
    );
  }

  return (
    <div className="@container w-full min-w-0">
      {/* Small width: stack; wide: donut left, legend right */}
      <div className="grid w-full min-w-0 grid-cols-1 items-center gap-6 @min-[24rem]:grid-cols-[minmax(140px,180px)_minmax(0,1fr)] @min-[24rem]:gap-8">
      <div className="relative mx-auto aspect-square w-44 max-w-full shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-muted)"
            strokeOpacity="0.4"
            strokeWidth={strokeWidth}
          />

          {items.map((item, index) => {
            const proportion = item.value / total;
            const segmentLength = proportion * usableLength;
            const dashArray = `${segmentLength} ${circumference - segmentLength}`;
            const dashOffset = -offset;
            offset += segmentLength + gapPerJoint;
            const color = segmentColors[index];

            return (
              <circle
                key={`seg-${index}-${item.label}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                className="transition-[stroke-opacity] duration-200 hover:stroke-opacity-90"
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tabular-nums tracking-tight text-(--text-main)">
            {total.toLocaleString()}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-(--text-soft)">
            Records
          </span>
        </div>
      </div>

      <div className="min-w-0 space-y-2">
        {items.map((item, index) => {
          const percentage = pcts[index] ?? 0;
          const color = segmentColors[index];

          return (
            <div
              key={`row-${index}-${item.label}`}
              className="flex items-start justify-between gap-2 border-b border-(--border-muted) border-opacity-60 py-2.5 last:border-b-0 sm:gap-3">
              <span className="inline-flex min-w-0 flex-1 items-start gap-2 text-sm sm:gap-3">
                <span
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ring-(--panel-bg)"
                  style={{ backgroundColor: color }}
                />
                <span className="break-words font-medium leading-snug text-(--text-main)">{item.label}</span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="block text-sm font-semibold text-(--text-main)">{percentage}%</span>
                <span className="text-[11px] text-(--text-soft)">{item.value.toLocaleString()} items</span>
              </span>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
