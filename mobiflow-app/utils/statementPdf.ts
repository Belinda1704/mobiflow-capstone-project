// Builds the HTML for the Statement of Account PDF (period, summary, and transaction list for lenders).
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from './transactionDate';
import { formatRWFWithSign } from './formatCurrency';

export type StatementPdfLabels = {
  statementTitle: string;
  statementPeriod: string;
  statementSummary: string;
  totalIncome: string;
  totalExpense: string;
  netPosition: string;
  date: string;
  description: string;
  category: string;
  amount: string;
  noTransactionsInPeriod: string;
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

function formatStatementDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function buildStatementHtml(
  transactions: Transaction[],
  periodLabel: string,
  labels: StatementPdfLabels
): string {
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );
  const net = totalIncome - totalExpense;

  const sorted = [...transactions].sort((a, b) => {
    const da = getTransactionDate(a)?.getTime() ?? 0;
    const db = getTransactionDate(b)?.getTime() ?? 0;
    return da - db;
  });

  const rows = sorted
    .map(
      (t) => `
      <tr>
        <td>${formatStatementDate(getTransactionDate(t) ?? new Date(0))}</td>
        <td>${escapeHtml(t.label || '—')}</td>
        <td>${escapeHtml(t.category?.trim() || 'Other')}</td>
        <td style="color:${t.amount >= 0 ? '#22C55E' : '#EF4444'};white-space:nowrap">${formatRWFWithSign(t.amount)}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(labels.statementTitle)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .period { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
    .summary { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .summary-card { flex: 1; min-width: 100px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
    .summary-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .summary-value { font-size: 14px; font-weight: 700; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { font-size: 12px; color: #6b7280; font-weight: 500; }
    td { font-size: 14px; }
    .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <h1>${escapeHtml(labels.statementTitle)}</h1>
  <p class="period">${escapeHtml(labels.statementPeriod)}: ${escapeHtml(periodLabel)}</p>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-label">${escapeHtml(labels.totalIncome)}</div>
      <div class="summary-value" style="color:#22C55E">${formatRWFWithSign(totalIncome)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">${escapeHtml(labels.totalExpense)}</div>
      <div class="summary-value" style="color:#EF4444">${formatRWFWithSign(-totalExpense)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">${escapeHtml(labels.netPosition)}</div>
      <div class="summary-value" style="color:${net >= 0 ? '#22C55E' : '#EF4444'}">${formatRWFWithSign(net)}</div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">${escapeHtml(labels.statementSummary)}</div>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(labels.date)}</th>
          <th>${escapeHtml(labels.description)}</th>
          <th>${escapeHtml(labels.category)}</th>
          <th>${escapeHtml(labels.amount)}</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="4">${escapeHtml(labels.noTransactionsInPeriod)}</td></tr>`}</tbody>
    </table>
  </div>

  <p class="footer">${escapeHtml(labels.generatedBy)} • ${new Date().toLocaleDateString()}</p>
</body>
</html>
`.trim();
}
