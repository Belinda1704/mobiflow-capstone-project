import type { FirestoreTimestamp } from '../types/transaction';

/**
 * Format a Firestore timestamp for display.
 * Returns: "Today 10:30", "Yesterday", or "Feb 3" for older dates.
 */
export function formatTransactionDate(
  createdAt: FirestoreTimestamp | Date | null | undefined
): string {
  if (!createdAt) return '';

  const date = toDate(createdAt);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today) {
    return `Today ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toDate(value: FirestoreTimestamp | Date): Date {
  if (value instanceof Date) return value;
  if (typeof (value as FirestoreTimestamp).toDate === 'function') {
    return (value as FirestoreTimestamp).toDate!();
  }
  const seconds = (value as FirestoreTimestamp).seconds;
  return seconds != null ? new Date(seconds * 1000) : new Date();
}
