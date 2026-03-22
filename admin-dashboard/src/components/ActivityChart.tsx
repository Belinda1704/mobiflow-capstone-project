import { useCallback, useId, useMemo, useState } from 'react';

type ActivityPoint = {
  label: string;
  transactions: number;
};

function mapPoints(
  values: number[],
  plotHeight: number,
  plotWidth: number,
  offsetX: number,
  offsetY: number
) {
  const maxValue = Math.max(1, ...values);
  const stepX = values.length > 1 ? plotWidth / (values.length - 1) : plotWidth;

  return values.map((value, index) => ({
    x: offsetX + index * stepX,
    y: offsetY + plotHeight - (value / maxValue) * plotHeight,
  }));
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const tension = 0.35;
  const p = (i: number) => points[Math.max(0, Math.min(i, points.length - 1))];
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;
    path += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function buildAreaPath(
  points: Array<{ x: number; y: number }>,
  baselineY: number,
  startX: number,
  endX: number
) {
  if (!points.length) {
    return '';
  }

  return `${buildSmoothPath(points)} L ${endX} ${baselineY} L ${startX} ${baselineY} Z`;
}

const ACCENT_LINE = '#F5C518';

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const uid = useId().replace(/:/g, '');
  const gradFill = `activity-fill-${uid}`;
  const gradLine = `activity-line-${uid}`;
  const width = 760;
  const height = 320;
  const padding = { top: 20, right: 20, bottom: 48, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const transactionValues = data.map((item) => item.transactions);
  const maxValue = Math.max(1, ...transactionValues);

  const transactionPoints = useMemo(
    () => mapPoints(transactionValues, plotHeight, plotWidth, padding.left, padding.top),
    [plotHeight, plotWidth, transactionValues]
  );

  const transactionPath = useMemo(() => buildSmoothPath(transactionPoints), [transactionPoints]);
  const areaPath = useMemo(
    () =>
      buildAreaPath(
        transactionPoints,
        padding.top + plotHeight,
        padding.left,
        padding.left + plotWidth
      ),
    [transactionPoints, plotHeight, padding.left, padding.top, plotWidth]
  );

  const gridLevels = [1, 0.75, 0.5, 0.25, 0];

  const [hover, setHover] = useState<{ index: number; x: number; y: number } | null>(null);

  const handlePointer = useCallback(
    (clientX: number, svgRect: DOMRect) => {
      const x = clientX - svgRect.left;
      const scale = width / svgRect.width;
      const svgX = x * scale;
      if (data.length <= 1) {
        setHover({ index: 0, x: transactionPoints[0]?.x ?? 0, y: transactionPoints[0]?.y ?? 0 });
        return;
      }
      const rel = svgX - padding.left;
      const idx = Math.round((rel / plotWidth) * (data.length - 1));
      const i = Math.max(0, Math.min(data.length - 1, idx));
      setHover({ index: i, x: transactionPoints[i].x, y: transactionPoints[i].y });
    },
    [data.length, plotWidth, padding.left, transactionPoints]
  );

  const onLeave = useCallback(() => setHover(null), []);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-(--border-muted) bg-linear-to-b from-(--panel-bg) to-(--panel-soft) p-1 shadow-(--shadow-card)">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full touch-none select-none"
          style={{ height: 300 }}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handlePointer(e.clientX, rect);
          }}
          onMouseLeave={onLeave}
          onTouchStart={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handlePointer(e.touches[0].clientX, rect);
          }}>
          <defs>
            <linearGradient id={gradFill} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={ACCENT_LINE} stopOpacity="0.22" />
              <stop offset="55%" stopColor={ACCENT_LINE} stopOpacity="0.06" />
              <stop offset="100%" stopColor={ACCENT_LINE} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={gradLine} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor={ACCENT_LINE} />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {gridLevels.map((level, index) => {
            const y = padding.top + plotHeight * (1 - level);
            const label = Math.round(maxValue * level);

            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  x2={padding.left + plotWidth}
                  y1={y}
                  y2={y}
                  stroke="var(--border-muted)"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                  strokeDasharray="4 10"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-soft)"
                  fontSize="11"
                  fontWeight="500"
                  opacity="0.95">
                  {label}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill={`url(#${gradFill})`} />
          <path
            fill="none"
            d={transactionPath}
            stroke={`url(#${gradLine})`}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hover ? (
            <g>
              <line
                x1={hover.x}
                x2={hover.x}
                y1={padding.top}
                y2={padding.top + plotHeight}
                stroke="var(--border-strong)"
                strokeOpacity="0.5"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <circle cx={hover.x} cy={hover.y} r="5" fill="var(--panel-bg)" stroke={ACCENT_LINE} strokeWidth="2.5" />
            </g>
          ) : null}

          {(() => {
            const maxLabels = 8;
            const indicesToShow = new Set<number>([0, data.length - 1]);
            if (data.length > maxLabels) {
              for (let i = 1; i < maxLabels - 1; i++) {
                indicesToShow.add(Math.round((i / (maxLabels - 1)) * (data.length - 1)));
              }
            } else {
              for (let i = 1; i < data.length - 1; i++) indicesToShow.add(i);
            }
            return data.map((item, index) => {
              const x =
                data.length > 1
                  ? padding.left + (plotWidth / (data.length - 1)) * index
                  : padding.left + plotWidth / 2;
              const show = indicesToShow.has(index);
              return (
                <text
                  key={`${item.label}-${index}`}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fill="var(--text-soft)"
                  fontSize="10"
                  fontWeight="500"
                  opacity={show ? 0.95 : 0}>
                  {show ? item.label : ''}
                </text>
              );
            });
          })()}
        </svg>
      </div>

      <div className="mt-3 flex min-h-[44px] flex-wrap items-center justify-between gap-2 rounded-xl border border-(--border-muted) bg-(--panel-soft) px-4 py-2.5 text-sm">
        {hover && data[hover.index] ? (
          <>
            <span className="font-semibold text-(--text-main)">{data[hover.index].label}</span>
            <span className="tabular-nums text-(--text-muted)">
              {data[hover.index].transactions.toLocaleString()} <span className="text-(--text-soft)">transactions</span>
            </span>
          </>
        ) : (
          <span className="text-(--text-soft)">Move the pointer over the chart to see values for each day.</span>
        )}
      </div>
    </div>
  );
}
