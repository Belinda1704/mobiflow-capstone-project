// Builds a CSV file from the transaction list so the user can export it.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from './transactionDate';

export function buildTransactionsCsv(transactions: Transaction[]): string {
  const headers = ['Date', 'Label', 'Type', 'Category', 'Amount (RWF)', 'Notes'];
  const rows = transactions
    .map((t) => {
      const date = getTransactionDate(t);
      const dateStr = date ? date.toISOString().slice(0, 10) : '';
      const type = t.type ?? (t.amount >= 0 ? 'income' : 'expense');
      const amount = Math.abs(t.amount);
      const notes = (t.notes ?? '').replace(/"/g, '""');
      return [dateStr, escapeCsv(t.label), type, escapeCsv(t.category ?? ''), String(amount), escapeCsv(notes)];
    });
  const allRows = [headers, ...rows];
  return allRows.map((row) => row.join(',')).join('\n');
}

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
