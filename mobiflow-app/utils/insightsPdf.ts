// Builds the HTML for the Business Insights PDF (cash flow style for sharing with lenders).
import type { BusinessInsightsData } from '../services/financialInsightsService';
import { formatRWF, formatRWFWithSign } from './formatCurrency';

export type InsightsPdfLabels = {
  businessInsights: string;
  businessInsightsSubtitle: string;
  topSpendingCategories: string;
  category: string;
  share: string;
  incomeTrend30Days: string;
  incomeTrendFootnote: string;
  nextMonthForecast: string;
  income: string;
  expense: string;
  net: string;
  generatedBy: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildInsightsHtml(data: BusinessInsightsData, labels: InsightsPdfLabels): string {
  const categoryRows = data.topSpending
    .map(
      (s) =>
        `<tr>
          <td>${escapeHtml(s.name)}</td>
          <td>${s.percent}%</td>
        </tr>`
    )
    .join('');

  const trendRows = data.incomeTrend30Days
    .map(
      (i) =>
        `<tr>
          <td>${escapeHtml(i.label)}</td>
          <td>${formatRWF(i.amount)}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(labels.businessInsights)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { font-size: 12px; color: #6b7280; font-weight: 500; }
    td { font-size: 14px; }
    .forecast-row { margin-bottom: 8px; font-size: 14px; }
    .forecast-net { font-size: 16px; font-weight: 700; margin-top: 8px; }
    .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>${escapeHtml(labels.businessInsights)}</h1>
  <p class="subtitle">${escapeHtml(labels.businessInsightsSubtitle)}</p>

  <div class="card">
    <div class="card-title">${escapeHtml(labels.topSpendingCategories)}</div>
    <table>
      <thead>
        <tr><th>${escapeHtml(labels.category)}</th><th>${escapeHtml(labels.share)}</th></tr>
      </thead>
      <tbody>${categoryRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">${escapeHtml(labels.incomeTrend30Days)}</div>
    <table>
      <thead>
        <tr><th>Day</th><th>${escapeHtml(labels.income)}</th></tr>
      </thead>
      <tbody>${trendRows || '<tr><td colspan="2">No data</td></tr>'}</tbody>
    </table>
    <p style="margin-top:12px;font-size:12px;color:#6b7280">${escapeHtml(labels.incomeTrendFootnote)}</p>
  </div>

  <div class="card">
    <div class="card-title">${escapeHtml(labels.nextMonthForecast)}</div>
    <p class="forecast-row">${escapeHtml(labels.income)} ${formatRWF(data.forecast.income)}</p>
    <p class="forecast-row">${escapeHtml(labels.expense)} ${formatRWF(data.forecast.expense)}</p>
    <p class="forecast-net" style="color:${data.forecast.net >= 0 ? '#22C55E' : '#EF4444'}">${escapeHtml(labels.net)} ${formatRWFWithSign(data.forecast.net)}</p>
  </div>

  <p class="footer">${escapeHtml(labels.generatedBy)} • ${new Date().toLocaleDateString()}</p>
</body>
</html>
`.trim();
}
