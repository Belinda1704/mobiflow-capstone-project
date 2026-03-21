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

// Smooth line path
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
  const maxValue = Math.max(1, ...transactionValues);
  const transactionPoints = mapPoints(
    transactionValues,
    plotHeight,
    plotWidth,
    padding.left,
    padding.top
  );
  const transactionPath = buildSmoothPath(transactionPoints);
  const areaPath = buildAreaPath(
    transactionPoints,
    padding.top + plotHeight,
    padding.left,
    padding.left + plotWidth
  );
  const gridLevels = [1, 0.66, 0.33, 0];

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-(--border-muted) border-opacity-60 bg-(--panel-bg) p-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height: 270 }}
          preserveAspectRatio="xMidYMid meet">
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
                  strokeOpacity="0.35"
                  strokeWidth="1"
                  strokeDasharray="2 8"
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
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
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
    </div>
  );
}
