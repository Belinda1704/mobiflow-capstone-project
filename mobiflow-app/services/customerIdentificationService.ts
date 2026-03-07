// Top customers from income: phone from label (SMS or manual), sum by person.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';

export type CustomerScore = {
  phone: string;
  totalAmount: number;
  transactionCount: number;
  lastTransactionDate: Date | null;
  displayPhone: string;
  displayName?: string;
};

// Match from/to 078... in label
const PHONE_IN_LABEL = /(?:from|to)\s+(\+?250?)\s*(\d{9})|(?:from|to)\s+(\d{9,10})/i;
// Or Rwanda number anywhere (07x or in parens)
const RWANDA_PHONE_IN_LABEL = /\b(0?7\d{8})\b|\(\s*0?7\d{8}\s*\)|2507\d{8}/;

function extractNameFromLabel(label: string): string | null {
  if (!label || typeof label !== 'string') return null;
  // name in parens e.g. from John (078...)
  const paren = label.match(/\(([A-Za-z][^)]{1,40})\)/);
  if (paren) {
    const inner = paren[1].trim();
    if (inner && /[A-Za-z]/.test(inner)) return inner;
  }
  // after from/to e.g. from Aline Uwase 078...
  const fromTo = label.match(/(?:from|to)\s+([A-Za-z][A-Za-z\s]{1,40})/i);
  if (fromTo) {
    const name = fromTo[1].trim();
    if (name && /[A-Za-z]/.test(name)) return name;
  }
  return null;
}

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

/** Returns formatted phone from label when present (e.g. "from 078..."), else null. */
export function getDisplayPhoneFromLabel(label: string): string | null {
  const phone = extractPhoneFromLabel(label);
  return phone ? formatDisplayPhone(phone) : null;
}

// Key: phone if in label, else normalized label so income without phone still shows (e.g. SMS that only had name).
function customerKey(t: Transaction): string {
  const phone = extractPhoneFromLabel(t.label);
  if (phone) return phone;
  const trimmed = (t.label || '').trim();
  if (trimmed) return `label:${trimmed}`;
  return '';
}

// Group by phone or label, sort by total.
export function computeTopCustomers(
  transactions: Transaction[],
  limit = 10
): CustomerScore[] {
  const byKey: Record<
    string,
    { totalAmount: number; count: number; lastDate: Date | null; name: string | null; isPhone: boolean }
  > = {};

  for (const t of transactions) {
    if (t.type !== 'income' || t.amount <= 0) continue;
    const key = customerKey(t);
    if (!key) continue;

    const amt = Math.abs(t.amount);
    const date = getTransactionDate(t);
    const name = extractNameFromLabel(t.label);
    const isPhone = !key.startsWith('label:');
    const displayLabel = isPhone ? '' : key.slice(6);

    if (!byKey[key]) {
      byKey[key] = { totalAmount: 0, count: 0, lastDate: null, name: name ?? null, isPhone };
    }
    byKey[key].totalAmount += amt;
    byKey[key].count += 1;
    if (name && !byKey[key].name) {
      byKey[key].name = name;
    }
    if (displayLabel && !byKey[key].name) {
      byKey[key].name = displayLabel;
    }
    if (date && (!byKey[key].lastDate || date > byKey[key].lastDate!)) {
      byKey[key].lastDate = date;
    }
  }

  return Object.entries(byKey)
    .map(([key, data]) => {
      const isPhone = data.isPhone;
      const displayName = data.name ?? (key.startsWith('label:') ? key.slice(6) : undefined);
      const displayPhone = isPhone ? formatDisplayPhone(key) : (displayName || '—');
      return {
        phone: key,
        totalAmount: data.totalAmount,
        transactionCount: data.count,
        lastTransactionDate: data.lastDate,
        displayPhone,
        displayName: displayName ?? undefined,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}
