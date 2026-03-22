import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';

type MetricCardProps = {
  label: string;
  value: string;
  note?: string;
  // Daily values for sparkline
  trend?: number[];
  // Change vs previous period
  trendPercent?: number | null;
  accent?: string;
  icon?: LucideIcon;
};

function mapSparklinePoints(values: number[], width: number, height: number) {
  if (!values.length) {
    return [];
  }

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const flat = maxValue === minValue;
  const range = flat ? 1 : Math.max(1e-9, maxValue - minValue);
  const horizontalPadding = 8;
  const verticalPadding = 6;
  const usableWidth = width - horizontalPadding * 2;
  const usableHeight = height - verticalPadding * 2;
  const stepX = values.length > 1 ? usableWidth / (values.length - 1) : usableWidth;

  return values.map((value, index) => {
    const y = flat
      ? verticalPadding + usableHeight / 2
      : verticalPadding + usableHeight - ((value - minValue) / range) * usableHeight;
    return {
      x: horizontalPadding + index * stepX,
      y,
    };
  });
}

function buildSparklinePath(points: Array<{ x: number; y: number }>) {
  if (!points.length) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function buildSparklineArea(points: Array<{ x: number; y: number }>, width: number, height: number) {
  if (!points.length) {
    return '';
  }

  return `${buildSparklinePath(points)} L ${width - 8} ${height} L 8 ${height} Z`;
}

export function MetricCard({
  label,
  value,
  note,
  trend = [],
  trendPercent = null,
  accent = '#F5C518',
  icon: Icon,
}: MetricCardProps) {
  const chartWidth = 232;
  const chartHeight = 44;
  const gradientId = `spark-${useId().replace(/:/g, '')}`;
  const points = mapSparklinePoints(trend, chartWidth, chartHeight);
  const sparklinePath = buildSparklinePath(points);
  const sparklineArea = buildSparklineArea(points, chartWidth, chartHeight);
  const hasTrendPercent = trendPercent != null && !Number.isNaN(trendPercent);

  return (
    <article className="flex min-h-39 flex-col overflow-hidden rounded-2xl border border-(--border-muted) bg-(--panel-bg) shadow-(--shadow-card) ring-1 ring-neutral-950/4 dark:ring-white/6">
      <div className="flex flex-1 flex-col px-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-(--text-muted)">{label}</p>
            <h3 className="mt-2 text-3xl font-semibold leading-tight text-(--text-main)">{value}</h3>
            {hasTrendPercent ? (
              <p className={`mt-1.5 flex items-center gap-1 text-sm font-medium ${trendPercent >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {trendPercent >= 0 ? <span aria-hidden>↑</span> : <span aria-hidden>↓</span>}
                <span>{trendPercent >= 0 ? '+' : ''}{trendPercent.toFixed(1)}% vs last period</span>
              </p>
            ) : null}
            {note ? <p className="mt-1 text-xs text-(--text-soft)">{note}</p> : null}
          </div>
          {Icon ? (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accent}18`, color: accent }}>
              <Icon size={18} />
            </span>
          ) : null}
        </div>

      </div>

      {sparklinePath ? (
        <div className="mt-auto border-t border-(--border-muted) bg-(--panel-soft) px-3 pt-2">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-12 w-full" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                <stop offset="55%" stopColor={accent} stopOpacity="0.12" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparklineArea} fill={`url(#${gradientId})`} />
            <path
              d={sparklinePath}
              fill="none"
              stroke={accent}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </article>
  );
}
