// Suggests category from past labels: corrections, rules, then word counts.
import type { Transaction } from '../types/transaction';
import {
  getCategoryCorrections,
  saveCategoryCorrection,
  getCategorizationRules,
  isGenericTransactionLabel,
} from './categorizationService';

export type CategoryModel = {
  wordFrequencies: Record<string, Record<string, number>>;
  categoryCounts: Record<string, number>;
  totalTransactions: number;
};

const MIN_CONFIDENCE = 0.3;

export function trainCategorizationModel(transactions: Transaction[]): CategoryModel {
  const wordFrequencies: Record<string, Record<string, number>> = {};
  const categoryCounts: Record<string, number> = {};
  let totalTransactions = 0;

  for (const tx of transactions) {
    const label = ((tx.displayLabel ?? tx.label) || '').toLowerCase().trim();
    const category = tx.category || 'Other';

    if (!label) continue;

    totalTransactions++;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    const words = label
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .filter((w) => w.length > 2);

    for (const word of words) {
      if (!wordFrequencies[word]) {
        wordFrequencies[word] = {};
      }
      wordFrequencies[word][category] = (wordFrequencies[word][category] || 0) + 1;
    }
  }

  return {
    wordFrequencies,
    categoryCounts,
    totalTransactions,
  };
}

export function predictCategory(
  label: string,
  model: CategoryModel,
  type: 'income' | 'expense'
): { category: string; confidence: number } | null {
  if (!label || model.totalTransactions === 0) return null;

  const normalized = label.toLowerCase().trim();
  const words = normalized
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 2);

  if (words.length === 0) return null;

  const categoryScores: Record<string, number> = {};

  for (const category in model.categoryCounts) {
    const categoryCount = model.categoryCounts[category];
    const categoryProbability = categoryCount / model.totalTransactions;

    let wordScore = 1;
    for (const word of words) {
      const wordFreq = model.wordFrequencies[word]?.[category] || 0;
      const wordProbability = wordFreq > 0 ? wordFreq / categoryCount : 0.01;
      wordScore *= wordProbability;
    }

    categoryScores[category] = categoryProbability * wordScore;
  }

  const sorted = (Object.entries(categoryScores) as [string, number][]).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0 || sorted[0][1] < MIN_CONFIDENCE) {
    return null;
  }

  const totalScore = sorted.reduce((sum: number, pair: [string, number]) => sum + pair[1], 0);
  const confidence = totalScore > 0 ? sorted[0][1] / totalScore : 0;

  return {
    category: sorted[0][0],
    confidence: Math.min(confidence, 1),
  };
}

export async function suggestCategory(
  userId: string,
  label: string,
  type: 'income' | 'expense',
  transactions: Transaction[]
): Promise<{ category: string; method: 'wordMatch' | 'rule' | 'correction' | 'pattern'; confidence?: number } | null> {
  const corrections = await getCategoryCorrections(userId);
  const normalized = label.toLowerCase().trim();
  const correction = isGenericTransactionLabel(normalized)
    ? null
    : corrections.find((c) => c.label === normalized);
  if (correction) {
    return { category: correction.category, method: 'correction' };
  }

  const rules = await getCategorizationRules(userId);
  for (const rule of rules) {
    if (normalized.includes(rule.keyword.toLowerCase())) {
      return { category: rule.category, method: 'rule' };
    }
  }

  if (transactions.length >= 5) {
    const model = trainCategorizationModel(transactions);
    const prediction = predictCategory(label, model, type);

    if (prediction && prediction.confidence >= MIN_CONFIDENCE) {
      return {
        category: prediction.category,
        method: 'wordMatch',
        confidence: prediction.confidence,
      };
    }
  }

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
  const sorted = (Object.entries(labelCounts) as [string, number][]).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    return { category: sorted[0][0], method: 'pattern' };
  }

  // No hardcoded income category (e.g. “Sales”); user picks category or learns from past corrections.

  return null;
}

export async function learnFromCorrection(
  userId: string,
  label: string,
  category: string
): Promise<void> {
  await saveCategoryCorrection(userId, label, category);
}
