// Bar and line chart config – yellow bars, theme colours for labels/background.
import type { ThemeColors } from '../contexts/ThemeContext';

const YELLOW = '#F5C518';

// Base bar config; pass theme colours so labels/background match the app.
export function getBarChartConfig(colors: ThemeColors) {
  return {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    backgroundGradientToOpacity: 1,
    decimalPlaces: 0,
    color: () => YELLOW,
    labelColor: () => colors.textSecondary,
    barPercentage: 0.6,
    barRadius: 8,
    fillShadowGradient: YELLOW,
    fillShadowGradientOpacity: 1,
    fillShadowGradientFrom: YELLOW,
    fillShadowGradientFromOpacity: 1,
    fillShadowGradientTo: YELLOW,
    fillShadowGradientToOpacity: 1,
    propsForLabels: { fontSize: 11 },
    propsForBackgroundLines: {
      strokeDasharray: '4,4',
      stroke: colors.border,
      strokeWidth: 0.5,
    },
    formatYLabel: (v: string) => {
      const n = Number(v);
      if (isNaN(n)) return v;
      const thousands = Math.round(n);
      if (thousands >= 1000) return `${(thousands / 1000).toFixed(0)}K`;
      if (thousands > 0) return `${thousands}K`;
      return '0';
    },
  };
}

// Static fallback (no theme); use getBarChartConfig(colors) when you have theme.
export const BAR_CHART_CONFIG = {
  backgroundColor: '#F8FAFC',
  backgroundGradientFrom: '#F8FAFC',
  backgroundGradientTo: '#F8FAFC',
  backgroundGradientToOpacity: 1,
  decimalPlaces: 0,
  color: () => YELLOW,
  labelColor: () => '#64748B',
  barPercentage: 0.6,
  barRadius: 8,
  fillShadowGradient: YELLOW,
  fillShadowGradientOpacity: 1,
  fillShadowGradientFrom: YELLOW,
  fillShadowGradientFromOpacity: 1,
  fillShadowGradientTo: YELLOW,
  fillShadowGradientToOpacity: 1,
  propsForLabels: { fontSize: 11 },
  propsForBackgroundLines: {
    strokeDasharray: '4,4',
    stroke: '#E2E8F0',
    strokeWidth: 0.5,
  },
  formatYLabel: (v: string) => {
    const n = Number(v);
    if (isNaN(n)) return v;
    const thousands = Math.round(n);
    if (thousands >= 1000) return `${(thousands / 1000).toFixed(0)}K`;
    if (thousands > 0) return `${thousands}K`;
    return '0';
  },
} as const;

// Dashboard: Y-axis shows full RWF amounts.
export function getDashboardChartConfig(colors: ThemeColors) {
  return {
    ...getBarChartConfig(colors),
    formatYLabel: (v: string) => {
      const n = Number(v);
      if (isNaN(n)) return v;
      const fullAmount = Math.round(n * 1000);
      return fullAmount >= 1000
        ? `${fullAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} RWF`
        : `${fullAmount} RWF`;
    },
  };
}

// Business health: no Y labels, value on top of bar in RWF.
export function getBusinessHealthChartConfig(colors: ThemeColors) {
  const base = getBarChartConfig(colors);
  return {
    ...base,
    formatYLabel: () => '',
    formatTopBarValue: (value: number) => `${Math.round(value).toLocaleString()} RWF`,
  };
}

// Static business health (no theme).
export const BUSINESS_HEALTH_CHART_CONFIG = {
  ...BAR_CHART_CONFIG,
  formatYLabel: () => '',
  formatTopBarValue: (value: number) => `${Math.round(value).toLocaleString()} RWF`,
} as const;

// Business insights bar chart, theme-aware.
export function getBusinessInsightsChartConfig(colors: ThemeColors) {
  const base = getBarChartConfig(colors);
  return { ...base, formatYLabel: () => '' };
}

// Static insights config, no Y labels.
export const BUSINESS_INSIGHTS_CHART_CONFIG = {
  ...BAR_CHART_CONFIG,
  formatYLabel: () => '',
} as const;

// Reports: Y-axis like "2 000" (RWF style).
export function getReportsChartConfig(colors: ThemeColors) {
  const base = getBarChartConfig(colors);
  return {
    ...base,
    formatYLabel: (v: string) => {
      const n = Number(v);
      if (isNaN(n)) return v;
      const rwf = Math.round(n * 1000);
      if (rwf >= 1000) {
        const k = Math.floor(rwf / 1000);
        const rest = rwf % 1000;
        return rest === 0 ? `${k} 000` : `${k} ${String(rest).padStart(3, '0')}`;
      }
      return String(rwf);
    },
  };
}

// Reports line chart – no fill (income/expense colours come from the chart data).
export function getReportsLineChartConfig(colors: ThemeColors) {
  const base = getReportsChartConfig(colors);
  return {
    ...base,
    fillShadowGradientOpacity: 0,
    fillShadowGradientFromOpacity: 0,
    fillShadowGradientToOpacity: 0,
  };
}

// Dashboard 7-day: yellow bars, RWF on Y-axis.
export const DASHBOARD_CHART_CONFIG = {
  ...BAR_CHART_CONFIG,
  formatYLabel: (v: string) => {
    const n = Number(v);
    if (isNaN(n)) return v;
    const fullAmount = Math.round(n * 1000);
    return fullAmount >= 1000
      ? `${fullAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} RWF`
      : `${fullAmount} RWF`;
  },
} as const;
