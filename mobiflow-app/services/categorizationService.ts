// Category suggestions: keyword rules, corrections when category changed, pattern from past tx.
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction } from '../types/transaction';

const SETTINGS_COLLECTION = 'userSettings';
const MAX_CORRECTIONS = 200;

export type CategorizationRule = { keyword: string; category: string };
export type CategoryCorrection = { label: string; category: string };

export function isGenericTransactionLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return true;
  const genericPatterns = [
    'mtn sent',
    'mtn received',
    'airtel sent',
    'airtel received',
    'mobile money sent',
    'mobile money received',
    'money sent',
    'money received',
  ];
  return genericPatterns.includes(normalized);
}

// Default keyword rules (MTN, Airtel, rent, transport). Work with no history.
const DEFAULT_RULES: CategorizationRule[] = [
  // Utilities
  { keyword: 'MTN', category: 'Utilities' },
  { keyword: 'MOMO', category: 'Utilities' },
  { keyword: 'M-Money', category: 'Utilities' },
  { keyword: 'Airtel', category: 'Utilities' },
  { keyword: 'airtel', category: 'Utilities' },
  { keyword: 'Electricity', category: 'Utilities' },
  { keyword: 'EWSA', category: 'Utilities' },
  { keyword: 'Water', category: 'Utilities' },
  { keyword: 'water', category: 'Utilities' },
  { keyword: 'bill', category: 'Utilities' },
  // Supplies & Purchases
  { keyword: 'Market', category: 'Supplies' },
  { keyword: 'Supermarket', category: 'Supplies' },
  { keyword: 'Wholesale', category: 'Supplies' },
  { keyword: 'Shop', category: 'Supplies' },
  { keyword: 'Store', category: 'Supplies' },
  // Transport
  { keyword: 'Transport', category: 'Transport' },
  { keyword: 'Taxi', category: 'Transport' },
  { keyword: 'Bus', category: 'Transport' },
  { keyword: 'Motor', category: 'Transport' },
  // Rent & Fixed Costs
  { keyword: 'Rent', category: 'Rent' },
  { keyword: 'rent', category: 'Rent' },
];

async function getSettingsRef(userId: string) {
  return doc(db, SETTINGS_COLLECTION, userId);
}

// Built-in + custom from Firestore
export async function getCategorizationRules(userId: string): Promise<CategorizationRule[]> {
  if (!userId) return [...DEFAULT_RULES];
  try {
    const ref = await getSettingsRef(userId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const custom = (data?.categorizationRules ?? []) as CategorizationRule[];
    const all = [...DEFAULT_RULES];
    for (const r of custom) {
      if (r?.keyword?.trim() && r?.category?.trim() && !all.some((x) => x.keyword.toLowerCase() === r.keyword.toLowerCase())) {
        all.push({ keyword: r.keyword.trim(), category: r.category.trim() });
      }
    }
    return all;
  } catch (error: any) {
    // Offline: defaults only
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Offline: Using default categorization rules only');
      return [...DEFAULT_RULES];
    }
    throw error;
  }
}

/** Get the list of “when the user picked this category for this label” for suggestions. */
export async function getCategoryCorrections(userId: string): Promise<CategoryCorrection[]> {
  if (!userId) return [];
  try {
    const ref = await getSettingsRef(userId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const list = (data?.categorizationCorrections ?? []) as CategoryCorrection[];
    if (!Array.isArray(list)) return [];

    const cleaned = list.filter(
      (item) => item?.label?.trim() && !isGenericTransactionLabel(item.label)
    );

    // Self-heal old generic corrections so future suggestions stay clean.
    if (cleaned.length !== list.length) {
      await setDoc(ref, { categorizationCorrections: cleaned.slice(0, MAX_CORRECTIONS) }, { merge: true });
    }

    return cleaned;
  } catch (error: any) {
    // Offline: no corrections
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Offline: No cached corrections available');
      return [];
    }
    throw error;
  }
}

/** Save category for this label so the app can suggest it next time. */
export async function saveCategoryCorrection(
  userId: string,
  label: string,
  category: string
): Promise<void> {
  const trimmedLabel = label.trim().toLowerCase();
  const trimmedCat = category.trim();
  if (!trimmedLabel || !trimmedCat || isGenericTransactionLabel(trimmedLabel)) return;
  const ref = await getSettingsRef(userId);
  const snap = await getDoc(ref);
  const existing = ((snap.data()?.categorizationCorrections ?? []) as CategoryCorrection[]).filter(
    (c) => c.label?.toLowerCase() !== trimmedLabel
  );
  const updated = [{ label: trimmedLabel, category: trimmedCat }, ...existing].slice(0, MAX_CORRECTIONS);
  await setDoc(ref, { categorizationCorrections: updated }, { merge: true });
}

// Suggest: past choice for label, then rules, then past tx
export function suggestCategory(
  label: string,
  type: 'income' | 'expense',
  rules: CategorizationRule[],
  corrections: CategoryCorrection[],
  transactions: Transaction[]
): string | null {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return null;

  // 1. Saved correction for this label
  const correction = isGenericTransactionLabel(normalized)
    ? null
    : corrections.find((c) => c.label === normalized);
  if (correction) return correction.category;

  // 2. Keyword rule
  for (const r of rules) {
    if (normalized.includes(r.keyword.toLowerCase())) return r.category;
  }

  // 3. Past tx with same/similar label
  const sameType = transactions.filter((t) => t.type === type);
  const labelCounts: Record<string, number> = {};
  for (const t of sameType) {
    const tLabel = ((t.displayLabel ?? t.label) ?? '').trim().toLowerCase();
    if (!tLabel) continue;
    const tCat = t.category?.trim() || 'Other';
    if (tLabel === normalized || tLabel.includes(normalized) || normalized.includes(tLabel)) {
      labelCounts[tCat] = (labelCounts[tCat] ?? 0) + 1;
    }
  }
  const sorted = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}
