type ActivityPoint = {
  label: string;
  transactions: number;
  newUsers: number;
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

// Monotone-style cubic Bezier for smooth, non-jagged lines (tension 0.4)
function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const tension = 0.4;
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

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const width = 760;
  const height = 300;
  const padding = { top: 14, right: 18, bottom: 42, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const transactionValues = data.map((item) => item.transactions);
  const userValues = data.map((item) => item.newUsers);
  const maxValue = Math.max(1, ...transactionValues, ...userValues);
  const transactionPoints = mapPoints(
    transactionValues,
    plotHeight,
    plotWidth,
    padding.left,
    padding.top
  );
  const userPoints = mapPoints(userValues, plotHeight, plotWidth, padding.left, padding.top);
  const transactionPath = buildSmoothPath(transactionPoints);
  const userPath = buildSmoothPath(userPoints);
  const areaPath = buildAreaPath(
    transactionPoints,
    padding.top + plotHeight,
    padding.left,
    padding.left + plotWidth
  );
  const totalTransactions = transactionValues.reduce((sum, value) => sum + value, 0);
  const totalNewUsers = userValues.reduce((sum, value) => sum + value, 0);
  const gridLevels = [1, 0.66, 0.33, 0];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[color:var(--border-muted)] border-opacity-60 bg-[var(--panel-bg)] p-5">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[290px] w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="activityChartTransactionFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F5C518" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#F5C518" stopOpacity="0" />
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
                  strokeOpacity="0.5"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-soft)"
                  fontSize="11"
                  opacity="0.9">
                  {label}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#activityChartTransactionFill)" />
          <path
            fill="none"
            d={transactionPath}
            stroke="#F5C518"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            fill="none"
            d={userPath}
            stroke="#22C55E"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 5"
          />

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
                  y={height - 8}
                  textAnchor="middle"
                  fill="var(--text-soft)"
                  fontSize="10"
                  opacity={show ? 0.9 : 0}>
                  {show ? item.label : ''}
                </text>
              );
            });
          })()}
        </svg>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[color:var(--border-muted)] bg-[var(--panel-bg)] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <div className="rounded-xl bg-[var(--panel-soft)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-soft)]">Transactions</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">{totalTransactions}</p>
        </div>
        <div className="rounded-xl bg-[var(--panel-soft)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-soft)]">New users</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">{totalNewUsers}</p>
        </div>
        <div className="flex flex-wrap gap-5 px-2 text-sm text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-2">
            <svg width="16" height="4" className="shrink-0" aria-hidden>
              <line x1="0" y1="2" x2="16" y2="2" stroke="#F5C518" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>Transactions</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <svg width="16" height="4" className="shrink-0" aria-hidden>
              <line x1="0" y1="2" x2="16" y2="2" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" />
            </svg>
            <span>New users</span>
          </span>
        </div>
      </div>
    </div>
  );
}
