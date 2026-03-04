import type { Transaction } from '../types/transaction';

export type FraudFeatures = {
  amount_scaled: number; // amount / 100000
  hour_of_day: number; // 0–23
  is_cash_out: number; // 1 or 0
  is_transfer: number; // 1 or 0
};

// From notebook training (synthetic dataset). Feature order: amount_scaled, hour_of_day, is_cash_out, is_transfer
const WEIGHTS = {
  amount_scaled: 0.25542063,
  hour_of_day: -0.10583755,
  is_cash_out: 1.93434754,
  is_transfer: -2.08017081,
};

// isKnownFraudOrig was 0 in training so left out
const BIAS = -8.603127593517005;

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// Build features from an in-app Transaction, mirroring the notebook logic.
export function buildFraudFeaturesFromTransaction(tx: Transaction): FraudFeatures {
  const absAmount = Math.abs(tx.amount);
  const amount_scaled = absAmount / 100000;

  // Convert Firestore timestamp (or Date) to JS Date
  let date: Date;
  const createdAt = tx.createdAt as any;
  if (createdAt && typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } else if (createdAt) {
    date = new Date(createdAt);
  } else {
    date = new Date();
  }
  const hour_of_day = date.getHours();

  const isExpense = tx.type === 'expense';
  const isCash = tx.paymentMethod === 'cash';
  const isMobileMoney = tx.paymentMethod === 'mobile_money';

  const is_cash_out = isExpense && isCash ? 1 : 0;
  const is_transfer = isExpense && isMobileMoney ? 1 : 0;

  return { amount_scaled, hour_of_day, is_cash_out, is_transfer };
}

export function computeFraudRiskForTransaction(tx: Transaction): number {
  if (!(tx.type === 'expense' && (tx.paymentMethod === 'cash' || tx.paymentMethod === 'mobile_money'))) {
    return 0;
  }

  const f = buildFraudFeaturesFromTransaction(tx);
  const z =
    WEIGHTS.amount_scaled * f.amount_scaled +
    WEIGHTS.hour_of_day * f.hour_of_day +
    WEIGHTS.is_cash_out * f.is_cash_out +
    WEIGHTS.is_transfer * f.is_transfer +
    BIAS;

  return sigmoid(z); // 0–1
}

// Only very high scores count as possible fraud
export function isHighFraudRisk(tx: Transaction, threshold = 0.98): boolean {
  return computeFraudRiskForTransaction(tx) >= threshold;
}

