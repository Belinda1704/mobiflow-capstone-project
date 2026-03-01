// Top customers from income: phone from label (SMS or manual), sum by person.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';

export type CustomerScore = {
  phone: string;
  totalAmount: number;
  transactionCount: number;
  lastTransactionDate: Date | null;
  displayPhone: string;
};

// Match from/to 078... in label
const PHONE_IN_LABEL = /(?:from|to)\s+(\+?250?)\s*(\d{9})|(?:from|to)\s+(\d{9,10})/i;
// Or Rwanda number anywhere (07x or in parens)
const RWANDA_PHONE_IN_LABEL = /\b(0?7\d{8})\b|\(\s*0?7\d{8}\s*\)|2507\d{8}/;

function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('250') && p.length > 9) p = p.slice(3);
  if (p.startsWith('0')) p = p;
  return p.length >= 9 ? p : '';
}

function extractPhoneFromLabel(label: string): string | null {
  if (!label || typeof label !== 'string') return null;
  const m = label.match(PHONE_IN_LABEL);
  if (m) {
    const g3 = m[3];
    if (g3) return normalizePhone(g3);
    const prefix = m[1] || '';
    const rest = m[2] || '';
    const combined = prefix.replace(/\D/g, '') + rest;
    return normalizePhone(combined);
  }
  // No from/to: look for number in label
  const rw = label.match(RWANDA_PHONE_IN_LABEL);
  if (rw) {
    const raw = (rw[1] || rw[0]).replace(/\D/g, '');
    const normalized = normalizePhone(raw);
    return normalized || null;
  }
  return null;
}

// Format for UI (078 123 4567)
function formatDisplayPhone(phone: string): string {
  const p = phone.replace(/\D/g, '');
  if (p.length === 9 && p.startsWith('0')) return p;
  if (p.length === 9) return `0${p}`;
  return phone;
}

// Group by phone, sort by total.
export function computeTopCustomers(
  transactions: Transaction[],
  limit = 10
): CustomerScore[] {
  const byPhone: Record<
    string,
    { totalAmount: number; count: number; lastDate: Date | null }
  > = {};

  for (const t of transactions) {
    if (t.type !== 'income' || t.amount <= 0) continue;
    if (t.paymentMethod !== 'mobile_money') continue;
    const phone = extractPhoneFromLabel(t.label);
    if (!phone) continue;

    const amt = Math.abs(t.amount);
    const date = getTransactionDate(t);

    if (!byPhone[phone]) {
      byPhone[phone] = { totalAmount: 0, count: 0, lastDate: null };
    }
    byPhone[phone].totalAmount += amt;
    byPhone[phone].count += 1;
    if (date && (!byPhone[phone].lastDate || date > byPhone[phone].lastDate!)) {
      byPhone[phone].lastDate = date;
    }
  }

  return Object.entries(byPhone)
    .map(([phone, data]) => ({
      phone,
      totalAmount: data.totalAmount,
      transactionCount: data.count,
      lastTransactionDate: data.lastDate,
      displayPhone: formatDisplayPhone(phone),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}
