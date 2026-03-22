// Builds the HTML for the Credit Readiness PDF that the user can download or share.
import type { CreditReadinessData } from '../services/financialInsightsService';
import { formatRWF } from './formatCurrency';

export type CreditReadinessPdfLabels = {
  creditReadiness: string;
  creditSummaryForBanks: string;
  creditSummary: string;
  cashFlowStability: string;
  scoreGood: string;
  needsImprovement: string;
  avgMonthlyIncome: string;
  avgMonthlyExpense: string;
  savingsRate: string;
  transactionFrequency: string;
  perMonthSuffix: string;
  verificationStatus: string;
  incomeVerification: string;
  businessStability: string;
  last6Months: string;
  monthsActive: string;
  cashFlowStatement: string;
  period: string;
  date: string;
  cashIn: string;
  cashOut: string;
  net: string;
  month: string;
};

export function buildCreditReadinessHtml(
  data: CreditReadinessData,
  labels: CreditReadinessPdfLabels
): string {
  const incomePeriod =
    data.incomeVerification.period === 'Last 6 months' ? labels.last6Months : data.incomeVerification.period;
  const bizPeriod =
    data.businessStability.period === '12 months active' ? labels.monthsActive : data.businessStability.period;
  const cashFlowLabel =
    data.cashFlowStability === 'Good' ? labels.scoreGood : labels.needsImprovement;
  const cashFlowColor = data.cashFlowStability === 'Good' ? '#22C55E' : '#EF4444';

  const cashFlowRows =
    data.cashFlowByDay?.length > 0
      ? data.cashFlowByDay
          .map(
            (r) =>
              `<tr>
                <td class="table-cell">${escapeHtml(r.dateLabel)}</td>
                <td class="table-cell num">${formatRWF(r.income)}</td>
                <td class="table-cell num">${formatRWF(r.expense)}</td>
                <td class="table-cell num ${r.net >= 0 ? 'positive' : 'negative'}">${formatRWF(r.net)}</td>
              </tr>`
          )
          .join('')
      : '';

  const cashFlowTable =
    cashFlowRows === ''
      ? ''
      : `
  <div class="card">
    <div class="card-title">${labels.cashFlowStatement}</div>
    <p class="period-note">${labels.period}: ${escapeHtml(data.reportPeriodLabel || 'Last 6 months')}</p>
    <table class="statement-table">
      <thead>
        <tr>
          <th class="table-header">${labels.date || 'Date'}</th>
          <th class="table-header num">${labels.cashIn}</th>
          <th class="table-header num">${labels.cashOut}</th>
          <th class="table-header num">${labels.net}</th>
        </tr>
      </thead>
      <tbody>${cashFlowRows}</tbody>
    </table>
  </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${labels.creditReadiness}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    .period-note { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .row:last-child { border-bottom: none; }
    .label { font-size: 14px; color: #6b7280; }
    .value { font-size: 14px; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: 500; }
    .badge-good { background: #dcfce7; color: #166534; }
    .badge-warn { background: #fee2e2; color: #991b1b; }
    .verify-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .verify-row:last-child { border-bottom: none; }
    .check { color: #22C55E; font-size: 18px; }
    .statement-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .table-header { text-align: left; padding: 10px 8px; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; }
    .table-header.num { text-align: right; }
    .table-cell { padding: 8px; border-bottom: 1px solid #e5e7eb; }
    .table-cell.num { text-align: right; }
    .table-cell.positive { color: #166534; font-weight: 600; }
    .table-cell.negative { color: #991b1b; font-weight: 600; }
    .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>${labels.creditReadiness}</h1>
  <p class="subtitle">${labels.creditSummaryForBanks}</p>

  <div class="card">
    <div style="font-size: 18px; font-weight: 700;">${escapeHtml(data.businessName || 'My Business')}</div>
  </div>
  ${cashFlowTable}

  <div class="card">
    <div class="card-title">${labels.creditSummary}</div>
    <div class="row">
      <span class="label">${labels.cashFlowStability}</span>
      <span class="badge ${data.cashFlowStability === 'Good' ? 'badge-good' : 'badge-warn'}" style="color: ${cashFlowColor};">${escapeHtml(cashFlowLabel)}</span>
    </div>
    <div class="row">
      <span class="label">${labels.avgMonthlyIncome}</span>
      <span class="value">${formatRWF(data.avgMonthlyIncome)}</span>
    </div>
    <div class="row">
      <span class="label">${labels.avgMonthlyExpense}</span>
      <span class="value">${formatRWF(data.avgMonthlyExpense)}</span>
    </div>
    <div class="row">
      <span class="label">${labels.savingsRate}</span>
      <span class="value">${data.savingsRate}%</span>
    </div>
    <div class="row">
      <span class="label">${labels.transactionFrequency}</span>
      <span class="value">${data.transactionFrequency}${labels.perMonthSuffix}</span>
    </div>
  </div>

  <div class="card">
    <div class="card-title">${labels.verificationStatus}</div>
    <div class="verify-row">
      <span class="check">✓</span>
      <span>${labels.incomeVerification}: ${escapeHtml(incomePeriod)}</span>
    </div>
    <div class="verify-row">
      <span class="check">✓</span>
      <span>${labels.businessStability}: ${escapeHtml(bizPeriod)}</span>
    </div>
  </div>

  <p class="footer">Generated by MobiFlow • ${new Date().toLocaleDateString()}</p>
</body>
</html>
`.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
